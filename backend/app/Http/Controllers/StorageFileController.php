<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StorageFileController extends Controller
{
    /**
     * Stream public storage files with full CORS, correct MIME types, and aggressive caching.
     * Bypasses host symlink restrictions (such as LiteSpeed Symlink Protection on Hostinger).
     */
    public function show(Request $request, string $path = '')
    {
        // Support path passed via query parameter or route parameter
        if (empty($path)) {
            $path = (string) $request->query('path', '');
        }

        // Clean and normalize path, preventing directory traversal
        $normalized = str_replace('\\', '/', $path);
        $normalized = preg_replace('#/\.{1,2}/#', '/', $normalized);
        $cleanPath = ltrim($normalized, '/');

        if (str_starts_with($cleanPath, 'storage/')) {
            $cleanPath = substr($cleanPath, strlen('storage/'));
        }

        if (empty($cleanPath)) {
            abort(404, 'File not specified');
        }

        // Candidate search paths
        $candidates = [
            storage_path('app/public/' . $cleanPath),
            public_path('storage/' . $cleanPath),
            storage_path('app/' . $cleanPath),
            base_path('storage/app/public/' . $cleanPath),
            public_path($cleanPath),
        ];

        $targetFile = null;
        foreach ($candidates as $candidate) {
            if (!empty($candidate) && file_exists($candidate) && !is_dir($candidate)) {
                $targetFile = $candidate;
                break;
            }
        }

        if (!$targetFile) {
            abort(404, 'File not found on server');
        }

        // Handle preflight OPTIONS
        if ($request->isMethod('OPTIONS')) {
            return response('', 204, [
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers' => '*',
                'Access-Control-Max-Age' => '86400',
            ]);
        }

        // Detect MIME type reliably
        $extension = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));
        $mimeTypes = [
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png'  => 'image/png',
            'gif'  => 'image/gif',
            'webp' => 'image/webp',
            'svg'  => 'image/svg+xml',
            'bmp'  => 'image/bmp',
            'ico'  => 'image/x-icon',
            'pdf'  => 'application/pdf',
            'mp4'  => 'video/mp4',
            'mov'  => 'video/quicktime',
        ];

        $mimeType = $mimeTypes[$extension] ?? null;
        if (!$mimeType && function_exists('mime_content_type')) {
            $mimeType = @mime_content_type($targetFile);
        }
        if (!$mimeType) {
            $mimeType = 'application/octet-stream';
        }

        $fileSize = (int) @filesize($targetFile);

        $headers = [
            'Content-Type' => $mimeType,
            'Content-Length' => (string) $fileSize,
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers' => '*',
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'Content-Disposition' => 'inline; filename="' . basename($targetFile) . '"',
        ];

        // Stream binary output directly to avoid Symfony BinaryFileResponse permissions issues
        return new StreamedResponse(function () use ($targetFile) {
            $stream = fopen($targetFile, 'rb');
            if ($stream) {
                fpassthru($stream);
                fclose($stream);
            }
        }, 200, $headers);
    }

    /**
     * Diagnostic endpoint to inspect storage files and permissions on the server.
     */
    public function debug(Request $request)
    {
        $appPublic = storage_path('app/public');
        $publicStorage = public_path('storage');
        $appointmentsDir = storage_path('app/public/appointments');

        $sampleAppointments = [];
        if (is_dir($appointmentsDir)) {
            $files = scandir($appointmentsDir);
            foreach ($files as $f) {
                if ($f !== '.' && $f !== '..') {
                    $sampleAppointments[] = [
                        'file' => $f,
                        'size' => @filesize($appointmentsDir . '/' . $f),
                        'readable' => is_readable($appointmentsDir . '/' . $f),
                    ];
                }
            }
        }

        return response()->json([
            'status' => 'ok',
            'storage_app_public' => [
                'path' => $appPublic,
                'exists' => file_exists($appPublic),
                'is_dir' => is_dir($appPublic),
                'is_readable' => is_readable($appPublic),
            ],
            'public_storage' => [
                'path' => $publicStorage,
                'exists' => file_exists($publicStorage),
                'is_link' => is_link($publicStorage),
                'target' => is_link($publicStorage) ? @readlink($publicStorage) : null,
            ],
            'appointments_count' => count($sampleAppointments),
            'appointments_sample' => array_slice($sampleAppointments, 0, 10),
        ]);
    }
}
