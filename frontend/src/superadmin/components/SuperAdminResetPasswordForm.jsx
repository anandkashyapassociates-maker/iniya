import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function SuperAdminResetPasswordForm({
  onSubmit,
  isLoading = false,
  loginPath = '/superadmin',
}) {
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const calculateStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = calculateStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email address is required.';
    if (!token.trim()) newErrors.token = 'Reset token is missing.';
    if (!password) newErrors.password = 'New password is required.';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    if (password !== passwordConfirmation) newErrors.password_confirmation = 'Passwords do not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit({
        email: email.trim(),
        token: token.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      setSubmitted(true);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ general: err.response?.data?.message || 'Password reset failed. Token may be invalid or expired.' });
      }
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900">Password Reset Complete</h3>
        <p className="text-xs text-slate-600 max-w-sm mx-auto">
          Your Superadmin credentials have been securely updated. You can now authenticate with your new password.
        </p>

        <div className="pt-3">
          <Link
            to={loginPath}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errors.general && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errors.general}</div>
        </div>
      )}

      {/* Account Email */}
      <div>
        <label
          htmlFor="reset-email"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          Account Email Address <span className="text-rose-500">*</span>
        </label>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
        />
        {errors.email && (
          <p className="text-[11px] text-rose-600 mt-1 font-medium">{Array.isArray(errors.email) ? errors.email[0] : errors.email}</p>
        )}
      </div>

      {/* Reset Token */}
      <div>
        <label
          htmlFor="reset-token"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          Security Reset Token <span className="text-rose-500">*</span>
        </label>
        <input
          id="reset-token"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste security reset token"
          required
          className="w-full px-4 py-2.5 text-xs font-mono bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
        />
        {errors.token && (
          <p className="text-[11px] text-rose-600 mt-1 font-medium">{Array.isArray(errors.token) ? errors.token[0] : errors.token}</p>
        )}
      </div>

      {/* New Password */}
      <div>
        <label
          htmlFor="reset-new-password"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          New Password <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="reset-new-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 chars, 1 uppercase, 1 symbol"
            required
            className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[11px] text-rose-600 mt-1 font-medium">{Array.isArray(errors.password) ? errors.password[0] : errors.password}</p>
        )}

        {/* Strength indicators */}
        {password && (
          <div className="mt-2">
            <div className="flex gap-1 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full transition-all ${strength >= 1 ? 'w-1/4 bg-rose-500' : 'w-0'}`} />
              <div className={`h-full transition-all ${strength >= 2 ? 'w-1/4 bg-amber-500' : 'w-0'}`} />
              <div className={`h-full transition-all ${strength >= 3 ? 'w-1/4 bg-blue-500' : 'w-0'}`} />
              <div className={`h-full transition-all ${strength >= 4 ? 'w-1/4 bg-emerald-500' : 'w-0'}`} />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Strength: {strength <= 1 ? 'Weak' : strength === 2 ? 'Moderate' : strength === 3 ? 'Strong' : 'Very Strong'}
            </span>
          </div>
        )}
      </div>

      {/* Confirm New Password */}
      <div>
        <label
          htmlFor="reset-confirm-password"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          Confirm New Password <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="reset-confirm-password"
            type={showPassword ? 'text' : 'password'}
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="Confirm matching password"
            required
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
        </div>
        {errors.password_confirmation && (
          <p className="text-[11px] text-rose-600 mt-1 font-medium">
            {Array.isArray(errors.password_confirmation) ? errors.password_confirmation[0] : errors.password_confirmation}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30 shadow-md shadow-slate-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Updating Password...</span>
          </>
        ) : (
          <>
            <span>Reset Account Password</span>
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
          <span>Cancel &amp; Back to Login</span>
        </Link>
      </div>
    </form>
  );
}

