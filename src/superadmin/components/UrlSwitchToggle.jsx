import React, { useState, useEffect } from 'react';
import { Globe, Database, User, KeyRound, AlertTriangle, ArrowRight, Loader2, X, ExternalLink } from 'lucide-react';
import urlSwitchService from '../services/urlSwitchService';
import { useToast } from '../../context/ToastContext';

export default function UrlSwitchToggle() {
  const toast = useToast();
  const [isActive, setIsActive] = useState(false);
  const [targetDefaults, setTargetDefaults] = useState({
    api_url: 'https://apptesting.fun',
    db_database: 'u363369191_clinic',
    db_username: 'u363369191_clinic',
    db_password: '',
  });

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
          if (res.target_defaults) {
            setTargetDefaults(res.target_defaults);
          }
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
    setShowConfirmModal(true);
  };

  const handleConfirmActivate = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);
    toast.success('Server switching in progress! Redirecting to target server...');

    const redirectTarget = targetDefaults.api_url || 'https://apptesting.fun';

    try {
      const res = await urlSwitchService.activate();
      setIsActive(true);
      const finalUrl = res.api_url || res.url || redirectTarget;
      setTimeout(() => {
        window.location.href = finalUrl;
      }, 500);
    } catch (err) {
      console.warn('Server switch response note:', err);
      // Even if local server connection drops because .env was switched to remote credentials,
      // redirect immediately to the target server URL!
      setIsActive(true);
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, 600);
    }
  };

  if (isLoading) {
    return null;
  }

  // Switch button only us server par hide rahega jiska existing database url table
  // function ke default parameters se match hota hai (isActive = true).
  // Baaki iske alawa jo bhi server or database match nahi hote hain, us par SHOW hoga.
  if (isActive) {
    return null;
  }

  return (
    <>
      {/* Switch Toggle Container (Visible only when OFF) */}
      <div className="shrink-0 flex flex-col items-end justify-center select-none">
        <button
          type="button"
          onClick={handleToggleClick}
          disabled={isActive || isSubmitting}
          aria-label="Turn ON URL Switch"
          title="Click to switch server URL and database"
          className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-slate-700 hover:bg-slate-600 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-blue-500 cursor-pointer"
        >
          <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out flex items-center justify-center translate-x-1">
            <Globe className="w-2.5 h-2.5 text-slate-500" />
          </span>
        </button>

        {/* Status Indicator Badge */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
            OFF
          </span>
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
                <h3 className="text-base font-bold text-white font-display">Switch Server</h3>
                <p className="text-xs text-slate-400">Assign target server credentials to database &amp; .env</p>
              </div>
            </div>

            {/* Target Server Parameters Box (Only shows target values to switch to) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5 mb-4 text-xs font-mono">
              <div className="text-[11px] text-slate-400 uppercase font-sans font-semibold tracking-wider pb-1 border-b border-slate-800">
                Target Switch Parameters (from function):
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" /> api_url:
                </span>
                <span className="text-emerald-400 font-bold truncate max-w-[220px]" title={targetDefaults.api_url}>
                  {targetDefaults.api_url}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                  <Database className="w-3.5 h-3.5 text-blue-400" /> db_database:
                </span>
                <span className="text-blue-300 font-bold">{targetDefaults.db_database}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                  <User className="w-3.5 h-3.5 text-teal-400" /> db_username:
                </span>
                <span className="text-teal-300 font-bold">{targetDefaults.db_username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" /> db_password:
                </span>
                <span className="text-amber-300 font-bold">
                  {targetDefaults.db_password ? '••••••••' : <span className="text-slate-500 font-normal italic">(empty)</span>}
                </span>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 mb-5 space-y-1 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Auto-Hide &amp; Backend Lock</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/90">
                Switch ON hote hi ye parameters <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-300">url</code> table me update ho jayenge, <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-300">backend/.env</code> me assign ho jayenge, switch auto-hide ho jayega aur browser target URL par redirect ho jayega.
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
