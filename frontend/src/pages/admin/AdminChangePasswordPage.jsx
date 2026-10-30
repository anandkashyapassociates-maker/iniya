import React, { useState } from 'react';
import { Lock, Eye, EyeOff, KeyRound, Save } from 'lucide-react';
import adminAuthService from '../../services/adminAuthService';
import { useToast } from '../../context/ToastContext';

export default function AdminChangePasswordPage() {
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (newPassword !== confirmPassword) {
      setErrors({ password_confirmation: ['Passwords do not match.'] });
      return;
    }

    setIsSaving(true);
    try {
      await adminAuthService.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      toast.success('Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to change password.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight">
          Change Account Password
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-normal">
          Regularly update your password to protect your administrator privileges.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-display">
                Current Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer font-medium"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  errors.current_password ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
            </div>
            {errors.current_password && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.current_password[0]}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  errors.password ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.password[0]}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 font-display">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                  errors.password_confirmation ? 'border-rose-400' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
            </div>
            {errors.password_confirmation && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.password_confirmation[0]}</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer disabled:opacity-50 font-display"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
