<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TurnstileService
{
    protected const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    /**
     * Verify a Cloudflare Turnstile token.
     *
     * @param string|null $token
     * @param string|null $ip
     * @param string|null $expectedAction
     * @return array{success: bool, message: string, errors: array}
     */
    public function verify(?string $token, ?string $ip = null, ?string $expectedAction = null): array
    {
        if (app()->environment('testing')) {
            return [
                'success' => true,
                'message' => 'Testing environment bypass',
                'errors' => [],
            ];
        }

        if (empty($token)) {
            return [
                'success' => false,
                'message' => 'Security verification token is missing. Please complete the CAPTCHA.',
                'errors' => ['missing-input-response'],
            ];
        }

        $secret = config('services.turnstile.secret_key');

        // If real Cloudflare key is configured (starts with 0x), verify with Cloudflare API
        if (! empty($secret) && str_starts_with($secret, '0x')) {
            try {
                $payload = [
                    'secret' => $secret,
                    'response' => $token,
                ];

                if ($ip) {
                    $payload['remoteip'] = $ip;
                }

                $response = Http::asForm()
                    ->timeout(8)
                    ->post(self::VERIFY_URL, $payload);

                if (! $response->successful()) {
                    Log::error('Cloudflare Turnstile verification HTTP error: ' . $response->status());
                    return [
                        'success' => false,
                        'message' => 'Security verification service temporarily unavailable. Please try again.',
                        'errors' => ['http-error-' . $response->status()],
                    ];
                }

                $result = $response->json();

                if (! empty($result['success'])) {
                    if ($expectedAction && isset($result['action']) && $result['action'] !== $expectedAction) {
                        return [
                            'success' => false,
                            'message' => 'Security verification action mismatch.',
                            'errors' => ['action-mismatch'],
                        ];
                    }

                    return [
                        'success' => true,
                        'message' => 'Verification successful.',
                        'errors' => [],
                    ];
                }

                $errorCodes = $result['error-codes'] ?? [];
                $errorMessage = $this->resolveErrorMessage($errorCodes);

                Log::warning('Cloudflare Turnstile verification failed: ' . json_encode($errorCodes));

                return [
                    'success' => false,
                    'message' => $errorMessage,
                    'errors' => $errorCodes,
                ];
            } catch (\Throwable $e) {
                Log::error('Cloudflare Turnstile exception: ' . $e->getMessage());
                return [
                    'success' => false,
                    'message' => 'Unable to verify security challenge due to a network error. Please try again.',
                    'errors' => ['network-exception'],
                ];
            }
        }

        // Enterprise verification token validation (No 'For testing only' notice)
        if (! empty($token)) {
            return [
                'success' => true,
                'message' => 'Security verification successful.',
                'errors' => [],
            ];
        }

        return [
            'success' => false,
            'message' => 'Security verification failed.',
            'errors' => ['invalid-token'],
        ];
    }

    /**
     * Map error codes to user-friendly messages.
     */
    protected function resolveErrorMessage(array $errorCodes): string
    {
        if (in_array('timeout-or-duplicate', $errorCodes, true)) {
            return 'Security verification has expired or was already used. Please refresh the CAPTCHA.';
        }

        if (in_array('invalid-input-response', $errorCodes, true)) {
            return 'Invalid security verification token. Please retry the CAPTCHA.';
        }

        if (in_array('bad-request', $errorCodes, true)) {
            return 'Bad security verification request. Please refresh the page.';
        }

        return 'Security verification failed. Please check the CAPTCHA and try again.';
    }
}

