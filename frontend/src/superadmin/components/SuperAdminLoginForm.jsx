import React, { useState, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import TurnstileCaptcha from '../../components/TurnstileCaptcha';

export default function SuperAdminLoginForm({
  onSubmit,
  isLoading = false,
  forgotPasswordPath = '/superadmin/forgot-password',
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [errors, setErrors] = useState({});

  const captchaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please provide a valid email format (e.g., admin@company.com).';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!captchaToken) {
      newErrors.captcha = 'Please complete the security verification challenge.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit({
        email: email.trim(),
        password,
        turnstile_token: captchaToken,
        remember: rememberMe,
      });
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setErrors({ general: err.response.data.message });
      } else {
        setErrors({
          general: 'Unable to connect to the authentication server. Please check your network and try again.',
        });
      }

      // Reset verification challenge on failed attempt
      if (captchaRef.current) {
        captchaRef.current.reset();
        setCaptchaToken('');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* General Error Banner */}
      {errors.general && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errors.general}</div>
        </div>
      )}

      {/* Email Field */}
      <div>
        <label
          htmlFor="superadmin-email"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          Superadmin Email Address <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="superadmin-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
            }}
            placeholder="admin@enterprise.com"
            disabled={isLoading}
            autoComplete="email"
            aria-invalid={!!errors.email}
            className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
              errors.email
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
            }`}
          />
        </div>
        {errors.email && (
          <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{Array.isArray(errors.email) ? errors.email[0] : errors.email}</span>
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="superadmin-password"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
          >
            Password <span className="text-rose-500">*</span>
          </label>
          <Link
            to={forgotPasswordPath}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="superadmin-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
            }}
            placeholder="••••••••••••"
            disabled={isLoading}
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            className={`w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/80 text-slate-900 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
              errors.password
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{Array.isArray(errors.password) ? errors.password[0] : errors.password}</span>
          </p>
        )}
      </div>

      {/* Remember Me Option */}
      <div className="flex items-center">
        <input
          id="superadmin-remember-me"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={isLoading}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
        />
        <label
          htmlFor="superadmin-remember-me"
          className="ml-2 block text-xs text-slate-600 select-none cursor-pointer hover:text-slate-900"
        >
          Keep session active on this workstation
        </label>
      </div>

      {/* Security Challenge Verification */}
      <div>
        <TurnstileCaptcha
          ref={captchaRef}
          action="superadmin_login"
          theme="light"
          onVerify={(token) => {
            setCaptchaToken(token);
            if (errors.captcha) setErrors((prev) => ({ ...prev, captcha: null }));
          }}
          onExpire={() => setCaptchaToken('')}
          onError={() => setCaptchaToken('')}
        />
        {errors.captcha && (
          <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{Array.isArray(errors.captcha) ? errors.captcha[0] : errors.captcha}</span>
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-900/30 shadow-md shadow-slate-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Authenticating Credentials...</span>
          </>
        ) : (
          <>
            <span>Sign In to Superadmin</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
