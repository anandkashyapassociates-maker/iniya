import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SuperAdminForgotPasswordForm({
  onSubmit,
  isLoading = false,
  loginPath = '/superadmin',
}) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please provide your registered Superadmin email address.');
      return;
    }

    try {
      const response = await onSubmit({ email: email.trim() });
      setSubmitted(true);
      if (response?.dev_reset_token) {
        setDevToken(response.dev_reset_token);
      }
    } catch (err) {
      if (err.response?.data?.errors?.email) {
        setError(err.response.data.errors.email[0]);
      } else {
        setError(err.response?.data?.message || 'Unable to process recovery request. Please try again.');
      }
    }
  };

  if (submitted) {
    const resetUrl = `/superadmin/reset-password?token=${devToken}&email=${encodeURIComponent(email)}`;

    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900">Recovery Instructions Dispatched</h3>

        <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
          If an account exists with <span className="font-semibold text-slate-900">{email}</span>, you will receive password reset instructions.
        </p>

        {/* Development test token fast-track banner */}
        {devToken && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-left">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
              Local Development Reset Token:
            </span>
            <Link
              to={resetUrl}
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold break-all underline block"
            >
              Click here to proceed directly to Reset Password &rarr;
            </Link>
          </div>
        )}

        <div className="pt-2">
          <Link
            to={loginPath}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Superadmin Login</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{error}</div>
        </div>
      )}

      <p className="text-xs text-slate-600 leading-relaxed">
        Enter your administrative email address below. We will generate an expiring, single-use security token to recover your account.
      </p>

      <div>
        <label
          htmlFor="forgot-email"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          Registered Email Address <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="superadmin@example.com"
            disabled={isLoading}
            required
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30 shadow-md shadow-slate-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Processing Request...</span>
          </>
        ) : (
          <>
            <span>Send Reset Instructions</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="text-center pt-2">
        <Link
          to={loginPath}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </Link>
      </div>
    </form>
  );
}

