import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Ban,
  Shield,
  Save,
} from 'lucide-react';
import adminManagementService from '../services/adminManagementService';
import { useToast } from '../../context/ToastContext';

export default function AdminEditModal({ admin, isOpen, onClose, onSuccess }) {
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    status: 'active',
    changePassword: false,
    password: '',
    password_confirmation: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when admin changes
  useEffect(() => {
    if (admin) {
      // Determine initial status
      let initialStatus = 'active';
      if (admin.status) {
        initialStatus = admin.status;
      } else if (admin.is_active === false) {
        initialStatus = 'inactive';
      }

      setFormData({
        name: admin.name || '',
        email: admin.email || '',
        mobile: admin.mobile || '',
        status: initialStatus,
        changePassword: false,
        password: '',
        password_confirmation: '',
      });
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [admin]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !admin) return null;

  const validate = () => {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = 'Full name is required.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email format.';
    }

    if (formData.mobile && formData.mobile.trim()) {
      if (!/^(\+?\d{1,4}[-.\s]?)?(\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}$/.test(formData.mobile.trim()) || formData.mobile.replace(/\D/g, '').length < 7) {
        errs.mobile = 'Please enter a valid mobile number (min 7 digits).';
      }
    }

    if (formData.changePassword) {
      if (!formData.password) {
        errs.password = 'New password is required.';
      } else if (formData.password.length < 8) {
        errs.password = 'Password must be at least 8 characters long.';
      }

      if (!formData.password_confirmation) {
        errs.password_confirmation = 'Please confirm the new password.';
      } else if (formData.password !== formData.password_confirmation) {
        errs.password_confirmation = 'Passwords do not match.';
      }
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim() || null,
        status: formData.status,
      };

      if (formData.changePassword && formData.password) {
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }

      const response = await adminManagementService.updateAdmin(admin.id, payload);

      toast.success(
        formData.status === 'blocked'
          ? `Admin '${formData.name}' has been updated and blocked from logging in.`
          : `Admin '${formData.name}' updated successfully.`
      );

      if (onSuccess) {
        onSuccess(response.admin || response.data || response);
      }
      onClose();
    } catch (err) {
      console.error('Error updating admin:', err);
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const backendErrors = {};
        for (const [key, messages] of Object.entries(err.response.data.errors)) {
          backendErrors[key] = messages[0];
        }
        setErrors(backendErrors);
      } else {
        const msg = err.response?.data?.message || 'Failed to update admin account. Please try again.';
        setErrors({ general: msg });
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Edit Administrator</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                  #{admin.id}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Update account details, change login status, or reset credentials.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* General Error Banner */}
          {errors.general && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Alexander Wright"
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 text-slate-900 border rounded-xl focus:bg-white focus:outline-none transition-all ${
                  errors.name
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'
                }`}
              />
            </div>
            {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@company.com"
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 text-slate-900 border rounded-xl focus:bg-white focus:outline-none transition-all ${
                  errors.email
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'
                }`}
              />
            </div>
            {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="+1 555 123 4567"
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 text-slate-900 border rounded-xl focus:bg-white focus:outline-none transition-all ${
                  errors.mobile
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'
                }`}
              />
            </div>
            {errors.mobile && <p className="text-[11px] text-rose-600 mt-1">{errors.mobile}</p>}
          </div>

          {/* Account Status Selection (Active, Inactive, Blocked) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Account Login Status <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Active */}
              <label
                className={`relative flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.status === 'active'
                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Active</span>
                  </div>
                  <input
                    type="radio"
                    name="admin_status"
                    value="active"
                    checked={formData.status === 'active'}
                    onChange={() => setFormData({ ...formData, status: 'active' })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Authorized. Admin can log into the system normally.
                </p>
              </label>

              {/* Option 2: Inactive */}
              <label
                className={`relative flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.status === 'inactive'
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Inactive</span>
                  </div>
                  <input
                    type="radio"
                    name="admin_status"
                    value="inactive"
                    checked={formData.status === 'inactive'}
                    onChange={() => setFormData({ ...formData, status: 'inactive' })}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Deactivated. Admin cannot log in until reactivated.
                </p>
              </label>

              {/* Option 3: Blocked */}
              <label
                className={`relative flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.status === 'blocked'
                    ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                    <Ban className="w-4 h-4 text-rose-600" />
                    <span>Blocked</span>
                  </div>
                  <input
                    type="radio"
                    name="admin_status"
                    value="blocked"
                    checked={formData.status === 'blocked'}
                    onChange={() => setFormData({ ...formData, status: 'blocked' })}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Access denied. Login rejected and active sessions revoked.
                </p>
              </label>
            </div>
            {errors.status && <p className="text-[11px] text-rose-600 mt-1">{errors.status}</p>}
          </div>

          {/* Change Password Checkbox Accordion */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.changePassword}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    changePassword: e.target.checked,
                    password: '',
                    password_confirmation: '',
                  })
                }
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-700">
                Change Administrator Password
              </span>
            </label>

            {formData.changePassword && (
              <div className="mt-3 space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    New Password (Min 8 Characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••••••"
                      className={`w-full pl-10 pr-10 py-2 text-xs bg-white text-slate-900 border rounded-lg focus:outline-none transition-all ${
                        errors.password
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] text-rose-600 mt-1">{errors.password}</p>}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.password_confirmation}
                      onChange={(e) =>
                        setFormData({ ...formData, password_confirmation: e.target.value })
                      }
                      placeholder="••••••••••••"
                      className={`w-full pl-10 pr-10 py-2 text-xs bg-white text-slate-900 border rounded-lg focus:outline-none transition-all ${
                        errors.password_confirmation
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {errors.password_confirmation && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.password_confirmation}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-60 ${
                formData.status === 'blocked'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{formData.status === 'blocked' ? 'Save & Block Admin' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

