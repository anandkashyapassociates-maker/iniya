import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Mail, User, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import superAdminService from '../../services/superAdminService';
import LoadingState from '../../components/LoadingState';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminEditAdminPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadAdmin() {
      try {
        const res = await superAdminService.getAdmin(id);
        const admin = res.admin;
        setName(admin.name);
        setEmail(admin.email);
        setIsActive(Boolean(admin.is_active));
      } catch (err) {
        toast.error('Failed to load administrator details.');
        navigate('/superadmin/admins');
      } finally {
        setIsLoading(false);
      }
    }
    loadAdmin();
  }, [id, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSaving(true);

    const payload = {
      name,
      email,
      is_active: isActive,
    };

    if (password) {
      payload.password = password;
    }

    try {
      await superAdminService.updateAdmin(id, payload);
      toast.success(`Admin account '${name}' updated successfully.`);
      navigate('/superadmin/admins');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to update admin account.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading administrator details..." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          to="/superadmin/admins"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Admins Directory</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
          Edit Administrator Account
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Modify administrator information, credentials, and access permissions.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                  errors.name ? 'border-rose-400' : 'border-slate-200 focus:border-purple-500'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.name[0]}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Administrative Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                  errors.email ? 'border-rose-400' : 'border-slate-200 focus:border-purple-500'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.email[0]}</p>
            )}
          </div>

          {/* Optional Password Update */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Update Password (Optional)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep existing password unchanged"
                className={`w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                  errors.password ? 'border-rose-400' : 'border-slate-200 focus:border-purple-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-[11px] text-rose-500 mt-1">{errors.password[0]}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Changing password will invalidate all existing sessions for this administrator.
              </p>
            )}
          </div>

          {/* Status Checkbox */}
          <div className="pt-1">
            <div className="flex items-center">
              <input
                id="edit-is-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500/20"
              />
              <label
                htmlFor="edit-is-active"
                className="ml-2 text-xs font-semibold text-slate-700 select-none cursor-pointer"
              >
                Account Active & Authorized
              </label>
            </div>
            <p className="text-[11px] text-slate-400 ml-6 mt-0.5">
              Uncheck to suspend access immediately.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to="/superadmin/admins"
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-900/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

