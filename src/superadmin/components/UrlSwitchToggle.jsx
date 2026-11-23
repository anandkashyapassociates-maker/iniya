import React, { useState, useEffect } from 'react';
import { Globe, Lock, AlertTriangle, ArrowRight, Loader2, X, ExternalLink } from 'lucide-react';
import urlSwitchService from '../services/urlSwitchService';
import { useToast } from '../../context/ToastContext';

export default function UrlSwitchToggle() {
  const toast = useToast();
  const [isActive, setIsActive] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load switch status from backend on mount
  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await urlSwitchService.getStatus();
        if (isMounted && res.success) {
          setIsActive(Boolean(res.is_active));
          setTargetUrl(res.url || 'https://apptesting.fun');
          setInputUrl(res.url || 'https://apptesting.fun');
        }
      } catch (err) {
        console.error('Failed to load URL switch status:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleClick = () => {
    if (isActive) {
      toast.warning('Switch cannot be turned off from the panel. It can only be disabled directly from the backend/database.');
      return;
    }
    // Open confirmation modal to confirm activation
    setInputUrl(targetUrl);
    setShowConfirmModal(true);
  };

  const handleConfirmActivate = async () => {
    if (!inputUrl || !inputUrl.trim()) {
      toast.error('Please enter a valid destination URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await urlSwitchService.activate(inputUrl.trim());
      setIsActive(true);
      setTargetUrl(res.url || inputUrl.trim());
      setShowConfirmModal(false);

      toast.success('URL Switch activated! Redirecting to destination server...');

      // Immediately redirect to the target URL
      setTimeout(() => {
        window.location.href = res.url || inputUrl.trim();
      }, 600);
    } catch (err) {
      console.error('Failed to activate URL switch:', err);
      toast.error(err.response?.data?.message || 'Failed to activate URL switch.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return null;
  }

  // When active (ON), hide completely so it is not visible on the panel
  if (isActive) {
    return null;
  }

  return (
    <>
      {/* Switch Toggle Container */}
      <div className="shrink-0 flex flex-col items-end justify-center select-none">
        <button
          type="button"
          onClick={handleToggleClick}
          disabled={isActive || isSubmitting}
          aria-label={isActive ? 'URL Switch Active (Locked)' : 'Turn ON URL Switch'}
          title={
            isActive
              ? 'URL Switch is ON & Locked. Can only be turned OFF from the backend database.'
              : 'Click to turn ON and switch to configured destination URL'
          }
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 ${
            isActive
              ? 'bg-emerald-500 cursor-not-allowed shadow-[0_0_12px_rgba(16,185,129,0.5)] focus:ring-emerald-400'
              : 'bg-slate-700 hover:bg-slate-600 cursor-pointer focus:ring-blue-500'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out flex items-center justify-center ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          >
            {isActive ? (
              <Lock className="w-2.5 h-2.5 text-emerald-600" />
            ) : (
              <Globe className="w-2.5 h-2.5 text-slate-500" />
            )}
          </span>
        </button>

        {/* Small Status Indicator Badge */}
        <div className="flex items-center gap-1 mt-1">
          {isActive ? (
            <span
              className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-0.5 cursor-not-allowed"
              title="Locked: Backend control only"
            >
              <Lock className="w-2 h-2 inline" /> ON
            </span>
          ) : (
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
              OFF
            </span>
          )}
        </div>
      </div>

      {/* Confirmation Modal when SuperAdmin clicks to Turn ON */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-white relative">
            {/* Close button */}
            <button
              onClick={() => !isSubmitting && setShowConfirmModal(false)}
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Icon & Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">Switch Server URL</h3>
                <p className="text-xs text-slate-400">Activate live server redirection</p>
              </div>
            </div>

            {/* Target Destination URL Input */}
            <div className="space-y-2 mb-4">
              <label className="block text-xs font-semibold text-slate-300">
                Destination Server URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
                />
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400">
                Current URL in database: <span className="font-mono text-emerald-400">{targetUrl || 'None'}</span>
              </p>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3.5 mb-5 space-y-1.5 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Permanent Frontend Lock Warning</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/90">
                Switch ON hote hi panel turant is URL par redirect ho jayega. Ek baar switch ON ho gaya to ye panel se <strong>disable nahi hoga</strong> aur sirf <strong>backend database</strong> se hi OFF kiya ja sakega.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmActivate}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Switching...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Switch ON</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
