import React, { useState } from 'react';
import { User, Mail, Lock, ShieldCheck, KeyRound, Eye, EyeOff, Save, CheckCircle } from 'lucide-react';
import { useSuperAdminAuth } from '../../features/auth/SuperAdminAuthContext';
import superAdminAuthService from '../../services/superAdminAuthService';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminProfilePage() {
  const { user, updateUser } = useSuperAdminAuth();
  const toast = useToast();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileSaving(true);

    try {
      const res = await superAdminAuthService.updateProfile({ name, email });
      updateUser(res.user);
      toast.success('Super Admin profile updated successfully.');
    } catch (err) {
      if (err.response?.data?.errors) {
        setProfileErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to update profile.');
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordErrors({});

    if (newPassword !== confirmPassword) {
      setPasswordErrors({ password_confirmation: ['Passwords do not match.'] });
      return;
    }

    setPasswordSaving(true);
    try {
      await superAdminAuthService.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      toast.success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.response?.data?.errors) {
        setPasswordErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to change password.');
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Super Admin Profile & Security
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your executive credentials, security parameters, and account details.
        </p>
      </div>

      {/* Account Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 to-purple-950 p-6 rounded-2xl border border-purple-900/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center text-xl font-black shadow-inner">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{user?.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="text-xs text-slate-400 space-y-1 sm:text-right border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
          <div>
            Account Created:{' '}
            <span className="text-slate-200 font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div>
            Last Login:{' '}
            <span className="text-slate-200 font-medium">
              {user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Current Session'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information Form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
              <User className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
            </div>

            <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                {profileErrors.name && (
                  <p className="text-[11px] text-rose-500 mt-1">{profileErrors.name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Primary Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                {profileErrors.email && (
                  <p className="text-[11px] text-rose-500 mt-1">{profileErrors.email[0]}</p>
                )}
              </div>
            </form>
          </div>

          <div className="pt-5 mt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              form="profile-form"
              disabled={profileSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {profileSaving ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Update Profile</span>
            </button>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPasswords ? 'Hide' : 'Show'}</span>
              </button>
            </div>

            <form id="password-form" onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                {passwordErrors.current_password && (
                  <p className="text-[11px] text-rose-500 mt-1">{passwordErrors.current_password[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                {passwordErrors.password && (
                  <p className="text-[11px] text-rose-500 mt-1">{passwordErrors.password[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
                {passwordErrors.password_confirmation && (
                  <p className="text-[11px] text-rose-500 mt-1">
                    {passwordErrors.password_confirmation[0]}
                  </p>
                )}
              </div>
            </form>
          </div>

          <div className="pt-5 mt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              form="password-form"
              disabled={passwordSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {passwordSaving ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>Update Password</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

