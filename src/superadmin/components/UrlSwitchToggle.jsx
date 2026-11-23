import React, { useState, useEffect } from 'react';
import { Globe, Database, User, AlertTriangle, ArrowRight, Loader2, X, ExternalLink } from 'lucide-react';
import urlSwitchService from '../services/urlSwitchService';
import { useToast } from '../../context/ToastContext';

export default function UrlSwitchToggle() {
  const toast = useToast();
  const [isActive, setIsActive] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [targetDb, setTargetDb] = useState('');
  const [targetDbUser, setTargetDbUser] = useState('');

  // Form input states for modal
  const [inputUrl, setInputUrl] = useState('');
  const [inputDb, setInputDb] = useState('');
  const [inputDbUser, setInputDbUser] = useState('');
  const [currentServer, setCurrentServer] = useState(null);

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
          setTargetUrl(res.url || 'https://funtesting.fun');
          setTargetDb(res.db_database || 'iniya');
          setTargetDbUser(res.db_username || 'root');

          setInputUrl(res.url || 'https://funtesting.fun');
          setInputDb(res.db_database || 'iniya');
          setInputDbUser(res.db_username || 'root');

          if (res.current_server) {
            setCurrentServer(res.current_server);
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
    // Open confirmation modal to confirm activation
    setInputUrl(targetUrl);
    setInputDb(targetDb);
    setInputDbUser(targetDbUser);
    setShowConfirmModal(true);
  };

  const handleConfirmActivate = async () => {
    if (!inputUrl || !inputUrl.trim()) {
      toast.error('Please enter a valid destination URL.');
      return;
    }
    if (!inputDb || !inputDb.trim()) {
      toast.error('Please enter a target DB_DATABASE name.');
      return;
    }
    if (!inputDbUser || !inputDbUser.trim()) {
      toast.error('Please enter a target DB_USERNAME.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        url: inputUrl.trim(),
        db_database: inputDb.trim(),
        db_username: inputDbUser.trim(),
      };

      const res = await urlSwitchService.activate(payload);
      setIsActive(true);
      setTargetUrl(res.url || inputUrl.trim());
      setTargetDb(res.db_database || inputDb.trim());
      setTargetDbUser(res.db_username || inputDbUser.trim());
      setShowConfirmModal(false);

      toast.success('Server switched successfully! Redirecting...');

      // Immediately redirect to the target URL
      setTimeout(() => {
        window.location.href = res.url || inputUrl.trim();
      }, 700);
    } catch (err) {
      console.error('Failed to activate server switch:', err);
      toast.error(err.response?.data?.message || 'Failed to activate server switch.');
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

        {/* Small Status Indicator Badge */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
            OFF
          </span>
        </div>
      </div>

      {/* Confirmation Modal when SuperAdmin clicks to Turn ON */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-white relative">
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
                <h3 className="text-base font-bold text-white font-display">Switch Server &amp; Database</h3>
                <p className="text-xs text-slate-400">Update destination URL and backend .env database parameters</p>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="space-y-3.5 mb-4">
              {/* Target Destination URL Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Destination Server URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://funtesting.fun"
                    disabled={isSubmitting}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
                  />
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Database & Username Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Target DB_DATABASE</span>
                  </label>
                  <input
                    type="text"
                    value={inputDb}
                    onChange={(e) => setInputDb(e.target.value)}
                    placeholder="e.g., u123456_iniya"
                    disabled={isSubmitting}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Current: <span className="text-emerald-400 font-mono">{currentServer?.db_database || 'iniya'}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Target DB_USERNAME</span>
                  </label>
                  <input
                    type="text"
                    value={inputDbUser}
                    onChange={(e) => setInputDbUser(e.target.value)}
                    placeholder="e.g., u123456_user"
                    disabled={isSubmitting}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Current: <span className="text-blue-400 font-mono">{currentServer?.db_username || 'root'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 mb-5 space-y-1 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Backend .env Auto-Assignment</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/90">
                Switch ON hote hi ye values <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-300">backend/.env</code> me assign ho jayengi, switch auto-hide ho jayega, aur panel destination URL par redirect ho jayega. Ise wapis band karne ke liye backend terminal par <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-300">php artisan url-switch off</code> ya direct MySQL se hi OFF kiya ja sakega.
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
                    <span>Assigning &amp; Switching...</span>
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
