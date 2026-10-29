import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

const TurnstileCaptcha = forwardRef(function TurnstileCaptcha(
  {
    onVerify,
    onError,
    onExpire,
    action = 'login',
    theme = 'auto',
    className = '',
  },
  ref
) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'ready' | 'error' | 'fallback'
  const [errorMessage, setErrorMessage] = useState('');

  const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

  const reset = () => {
    if (widgetIdRef.current !== null && window.turnstile?.reset) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch (err) {
        console.warn('Turnstile reset error:', err);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    reset,
  }));

  useEffect(() => {
    let checkInterval = null;
    let attempts = 0;
    const maxAttempts = 25; // 5 seconds wait

    const renderWidget = () => {
      if (!containerRef.current) return;
      if (!window.turnstile) return;

      try {
        if (widgetIdRef.current !== null) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action: action,
          theme: theme,
          callback: (token) => {
            setLoadState('ready');
            setErrorMessage('');
            if (onVerify) onVerify(token);
          },
          'error-callback': (errorCode) => {
            console.error('Turnstile widget error code:', errorCode);
            setLoadState('error');
            setErrorMessage('Security challenge failed. Click reload to retry.');
            if (onError) onError(errorCode);
          },
          'expired-callback': () => {
            setErrorMessage('Security challenge expired. Please verify again.');
            if (onExpire) onExpire();
          },
        });

        widgetIdRef.current = id;
        setLoadState('ready');
      } catch (err) {
        console.error('Error rendering Cloudflare Turnstile widget:', err);
        setLoadState('error');
        setErrorMessage('Failed to initialize verification widget.');
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      checkInterval = setInterval(() => {
        attempts++;
        if (window.turnstile) {
          clearInterval(checkInterval);
          renderWidget();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          // If turnstile script did not load (e.g. adblocker, local firewall), offer dev fallback
          setLoadState('fallback');
          setErrorMessage('Could not load Cloudflare Turnstile script.');
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (widgetIdRef.current !== null && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [siteKey, action, theme]);

  // Dev bypass helper when testing offline or blocked by adblock
  const handleDevBypass = () => {
    if (onVerify) {
      onVerify('XXXX.DUMMY.TOKEN.XXXX');
      setErrorMessage('');
    }
  };

  return (
    <div className={`turnstile-wrapper my-3 ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          Security Verification
        </label>
        {widgetIdRef.current !== null && (
          <button
            type="button"
            onClick={reset}
            className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
            title="Reset verification"
          >
            <RefreshCw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <div className="min-h-[65px] flex flex-col items-center justify-center bg-slate-50 border border-slate-200/80 rounded-xl p-2 transition-all">
        {loadState === 'loading' && (
          <div className="flex items-center gap-2 text-xs text-slate-600 py-3">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading security challenge...</span>
          </div>
        )}

        <div ref={containerRef} className={loadState === 'ready' ? 'block' : 'hidden'} />

        {loadState === 'error' && (
          <div className="flex flex-col items-center gap-1 text-center py-2 px-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-800" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-1 text-xs text-blue-600 hover:underline font-medium"
            >
              Retry challenge
            </button>
          </div>
        )}

        {loadState === 'fallback' && (
          <div className="flex flex-col items-center gap-1.5 text-center py-2 px-3">
            <span className="text-xs text-amber-800">{errorMessage}</span>
            <button
              type="button"
              onClick={handleDevBypass}
              className="text-xs bg-slate-900 text-white px-3 py-1 rounded-lg hover:bg-slate-800 font-medium"
            >
              Use Development Test Token
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default TurnstileCaptcha;

