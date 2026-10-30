import React, { useState, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import TurnstileCaptcha from './TurnstileCaptcha';

export default function LoginForm({
  role = 'admin', // 'superadmin' | 'admin'
  onSubmit,
  isLoading = false,
  forgotPasswordPath = '/admin/forgot-password',
}) {
  const isSuperAdmin = role === 'superadmin';
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
    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    if (!captchaToken) {
      newErrors.captcha = 'Please complete the Cloudflare security verification.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit({
        email,
        password,
        turnstile_token: captchaToken,
        remember: rememberMe,
      });
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setErrors({ general: err.response.data.message });
      } else if (!err.response) {
        setErrors({ general: 'Cannot connect to backend server. Please make sure the Laravel server is running on http://127.0.0.1:8000' });
      } else {
        setErrors({ general: 'Login failed. Please check your credentials and try again.' });
      }
      // Reset captcha widget on failed attempt
      if (captchaRef.current) {
        captchaRef.current.reset();
      }
      setCaptchaToken('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Demo Credentials Quick Fill Banner */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block micro-label">
            Demo Credentials
          </span>
          <span className="font-mono text-[11px] text-slate-200">
            {isSuperAdmin ? 'superadmin@gmail.com' : 'admin@gmail.com'} / 123456
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setEmail(isSuperAdmin ? 'superadmin@gmail.com' : 'admin@gmail.com');
            setPassword('123456');
            setErrors({});
          }}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg text-white transition-all cursor-pointer font-display ${
            isSuperAdmin
              ? 'bg-purple-600 hover:bg-purple-500'
              : 'bg-blue-600 hover:bg-blue-500'
          }`}
        >
          Auto-fill
        </button>
      </div>

      {/* General error message banner */}
      {errors.general && (
        <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs font-medium leading-relaxed animate-in fade-in">
          {errors.general}
        </div>
      )}

      {/* Email input */}
      <div>
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-display mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
            }}
            placeholder={isSuperAdmin ? 'superadmin@example.com' : 'admin@example.com'}
            disabled={isLoading}
            autoComplete="email"
            className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-950 text-white border rounded-xl focus:outline-none focus:ring-2 transition-all font-mono ${
              errors.email
                ? 'border-rose-500 focus:ring-rose-500/20'
                : isSuperAdmin
                ? 'border-slate-800 focus:border-purple-500 focus:ring-purple-500/20'
                : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
        </div>
        {errors.email && (
          <p className="text-[11px] text-rose-400 mt-1 font-medium">{Array.isArray(errors.email) ? errors.email[0] : errors.email}</p>
        )}
      </div>

      {/* Password input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-display">
            Password
          </label>
          <Link
            to={forgotPasswordPath}
            className="text-[11px] text-slate-400 hover:text-white transition-colors font-medium"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
            }}
            placeholder="••••••••••••"
            disabled={isLoading}
            autoComplete="current-password"
            className={`w-full pl-10 pr-10 py-2.5 text-xs bg-slate-950 text-white border rounded-xl focus:outline-none focus:ring-2 transition-all ${
              errors.password
                ? 'border-rose-500 focus:ring-rose-500/20'
                : isSuperAdmin
                ? 'border-slate-800 focus:border-purple-500 focus:ring-purple-500/20'
                : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[11px] text-rose-400 mt-1 font-medium">
            {Array.isArray(errors.password) ? errors.password[0] : errors.password}
          </p>
        )}
      </div>

      {/* Remember me checkbox */}
      <div className="flex items-center">
        <input
          id={`remember-me-${role}`}
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="w-4 h-4 rounded-md border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
        />
        <label
          htmlFor={`remember-me-${role}`}
          className="ml-2 block text-xs text-slate-400 select-none cursor-pointer hover:text-slate-300 font-medium"
        >
          Remember my session on this device
        </label>
      </div>

      {/* Cloudflare Turnstile CAPTCHA */}
      <div>
        <TurnstileCaptcha
          ref={captchaRef}
          action={isSuperAdmin ? 'superadmin_login' : 'admin_login'}
          theme="dark"
          onVerify={(token) => {
            setCaptchaToken(token);
            if (errors.captcha) setErrors((prev) => ({ ...prev, captcha: null }));
          }}
          onExpire={() => setCaptchaToken('')}
          onError={() => setCaptchaToken('')}
        />
        {errors.captcha && (
          <p className="text-[11px] text-rose-400 font-medium">
            {Array.isArray(errors.captcha) ? errors.captcha[0] : errors.captcha}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed font-display ${
          isSuperAdmin
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-purple-900/40 disabled:opacity-50'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/40 disabled:opacity-50'
        }`}
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Authenticating...</span>
          </>
        ) : (
          <>
            <span>Authenticate Securely</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
