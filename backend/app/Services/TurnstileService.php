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
        if (empty($token)) {
            return [
                'success' => false,
                'message' => 'Security verification token is missing. Please complete the CAPTCHA.',
                'errors' => ['missing-input-response'],
            ];
        }

        $secret = config('services.turnstile.secret_key');

        if (empty($secret)) {
            Log::warning('Cloudflare Turnstile secret key is not configured.');
            // If secret is not configured in local environment, reject or fail securely
            return [
                'success' => false,
                'message' => 'CAPTCHA configuration error on server.',
                'errors' => ['missing-secret'],
            ];
        }

        // Test dummy key check: if using standard Cloudflare test key and testing offline/dummy
        if ($secret === '1x0000000000000000000000000000000AA' && ($token === 'XXXX.DUMMY.TOKEN.XXXX' || str_starts_with($token, 'dummy-'))) {
            return [
                'success' => true,
                'message' => 'Verification successful (Test Mode).',
                'errors' => [],
            ];
        }

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
                // If action is provided, validate it matches
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

            // If we are in local development and network call to Cloudflare times out or fails (e.g. firewall/offline)
            if (app()->isLocal() && $secret === '1x0000000000000000000000000000000AA') {
                return [
                    'success' => true,
                    'message' => 'Local fallback verification allowed with dummy key.',
                    'errors' => [],
                ];
            }

            return [
                'success' => false,
                'message' => 'Unable to verify security challenge due to a network error. Please try again.',
                'errors' => ['network-exception'],
            ];
        }
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

