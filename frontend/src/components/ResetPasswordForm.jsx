import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function ResetPasswordForm({
  role = 'admin',
  onSubmit,
  isLoading = false,
  loginPath = '/admin',
}) {
  const isSuperAdmin = role === 'superadmin';
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
    if (!email) newErrors.email = 'Email address is required.';
    if (!token) newErrors.token = 'Reset token is missing from URL.';
    if (!password) newErrors.password = 'Password is required.';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    if (password !== passwordConfirmation) newErrors.password_confirmation = 'Passwords do not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSubmitted(true);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ general: err.response?.data?.message || 'Password reset failed.' });
      }
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <h3 className="text-base font-semibold text-white font-display">Password Reset Complete</h3>
        <p className="text-xs text-slate-300 font-normal">
          Your credentials have been securely updated. You can now authenticate with your new password.
        </p>

        <div className="pt-3">
          <Link
            to={loginPath}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg transition-all font-display ${
              isSuperAdmin ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs font-medium leading-relaxed">
          {errors.general}
        </div>
      )}

      {/* Account email */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-display">
          Account Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2.5 text-xs bg-slate-950 text-white border border-slate-800 rounded-xl focus:outline-none font-mono"
        />
        {errors.email && (
          <p className="text-[11px] text-rose-400 mt-1 font-medium">{Array.isArray(errors.email) ? errors.email[0] : errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-display">
          Reset Token
        </label>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste security reset token"
          required
          className="w-full px-4 py-2.5 text-xs font-mono bg-slate-950 text-slate-300 border border-slate-800 rounded-xl focus:outline-none"
        />
        {errors.token && (
          <p className="text-[11px] text-rose-400 mt-1 font-medium">{Array.isArray(errors.token) ? errors.token[0] : errors.token}</p>
        )}
      </div>

      {/* New Password */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-display">
          New Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 chars, 1 uppercase, 1 symbol"
            required
            className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-950 text-white border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[11px] text-rose-400 mt-1 font-medium">{Array.isArray(errors.password) ? errors.password[0] : errors.password}</p>
        )}

        {/* Strength indicators */}
        {password && (
          <div className="mt-2">
            <div className="flex gap-1 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full transition-all ${strength >= 1 ? 'w-1/4 bg-rose-500' : 'w-0'}`} />
              <div className={`h-full transition-all ${strength >= 2 ? 'w-1/4 bg-amber-500' : 'w-0'}`} />
              <div className={`h-full transition-all ${strength >= 3 ? 'w-1/4 bg-blue-500' : 'w-0'}`} />
              <div className={`h-full transition-all ${strength >= 4 ? 'w-1/4 bg-emerald-500' : 'w-0'}`} />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block font-medium">
              {strength <= 1 ? 'Weak' : strength === 2 ? 'Moderate' : strength === 3 ? 'Strong' : 'Very Strong'}
            </span>
          </div>
        )}
      </div>

      {/* Confirm New Password */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-display">
          Confirm New Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="Confirm matching password"
            required
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-950 text-white border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        {errors.password_confirmation && (
          <p className="text-[11px] text-rose-400 mt-1 font-medium">
            {Array.isArray(errors.password_confirmation) ? errors.password_confirmation[0] : errors.password_confirmation}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-xl text-xs font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-display ${
          isSuperAdmin
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500'
        }`}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel &amp; Back to Login</span>
        </Link>
      </div>
    </form>
  );
}
