<?php

use App\Http\Controllers\StorageFileController;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

// 1. One-click browser helper to create storage symlink without SSH/Terminal
Route::get('/fix-storage-link', function () {
    try {
        Artisan::call('storage:link');
        return response()->json([
            'status' => 'success',
            'message' => 'Storage link successfully created!',
            'exists' => file_exists(public_path('storage')),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
        ], 500);
    }
});

// 2. Storage diagnostic endpoint
Route::get('/debug-storage', [StorageFileController::class, 'debug']);

// 3. Robust storage file streamer (matches GET, HEAD, OPTIONS)
Route::match(['GET', 'HEAD', 'OPTIONS'], '/storage/{path?}', [StorageFileController::class, 'show'])
    ->where('path', '.*');

// 4. SPA Fallback (excludes api, sanctum, up, fix-storage-link, debug-storage, and storage)
Route::get('/{any?}', function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    return view('welcome');
})->where('any', '^(?!api|sanctum|up|fix-storage-link|debug-storage|storage).*$');
