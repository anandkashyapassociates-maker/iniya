import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Building2,
  Compass,
  Globe,
  MapPin,
  KeyRound,
  Copy,
} from 'lucide-react';
import adminManagementService from '../services/adminManagementService';
import clinicManagementService from '../services/clinicManagementService';
import { useToast } from '../../context/ToastContext';

export default function AdminEditModal({ admin, isOpen, onClose, onSuccess }) {
  const toast = useToast();

  const [formData, setFormData] = useState({
    clinic_id: '',
    name: '',
    email: '',
    mobile: '',
    status: 'active',
    password: '',
    password_confirmation: '',
  });

  const [clinics, setClinics] = useState([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate a random strong password for admin
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({
      ...prev,
      password: generated,
      password_confirmation: generated,
    }));
    setShowPassword(true);
    setShowConfirmPassword(true);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.password;
      delete copy.password_confirmation;
      return copy;
    });
    toast.info('Generated new strong password.');
  };

  // Copy password to clipboard
  const handleCopyPassword = () => {
    if (!formData.password) return;
    navigator.clipboard.writeText(formData.password);
    toast.success('Password copied to clipboard!');
  };

  // Load clinic options (only unassigned clinics + current admin's clinic)
  useEffect(() => {
    let isMounted = true;
    const loadClinics = async () => {
      setIsLoadingClinics(true);
      try {
        const res = await clinicManagementService.getClinicOptions({
          unassigned_admin_only: 1,
          except_admin_id: admin?.id,
        });
        const rawList = res?.clinics || (Array.isArray(res) ? res : []);
        const currentClinicId = admin?.clinic_id || admin?.clinic?.id;
        const list = rawList.filter(
          (c) =>
            !c.admins_count ||
            Number(c.admins_count) === 0 ||
            (currentClinicId && String(c.id) === String(currentClinicId))
        );

        if (admin?.clinic && !list.some((c) => String(c.id) === String(admin.clinic.id))) {
          list.unshift(admin.clinic);
        }

        if (isMounted) {
          setClinics(list);
        }
      } catch (err) {
        console.error('Failed to load clinic options in edit modal:', err);
      } finally {
        if (isMounted) setIsLoadingClinics(false);
      }
    };

    loadClinics();
    return () => {
      isMounted = false;
    };
  }, [admin]);

  // Initialize form when admin changes
  useEffect(() => {
    if (admin) {
      let initialStatus = 'active';
      if (admin.status) {
        initialStatus = admin.status;
      } else if (admin.is_active === false) {
        initialStatus = 'inactive';
      }

      const initialClinicId = admin.clinic_id
        ? String(admin.clinic_id)
        : admin.clinic?.id
        ? String(admin.clinic.id)
        : '';

      setFormData({
        clinic_id: initialClinicId,
        name: admin.name || '',
        email: admin.email || '',
        mobile: admin.mobile || '',
        status: initialStatus,
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

  // Selected clinic object for showing location/address
  const selectedClinic = clinics.find(
    (c) => String(c.id) === String(formData.clinic_id)
  ) || admin.clinic || null;

  const validate = () => {
    const errs = {};

    if (!formData.clinic_id) {
      errs.clinic_id = 'Please select a clinic branch for this administrator.';
    }

    if (!formData.name.trim()) {
      errs.name = 'Full name is required.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email format.';
    }

    if (!formData.mobile.trim()) {
      errs.mobile = 'Mobile number is required.';
    } else if (
      !/^(\+?\d{1,4}[-.\s]?)?(\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}$/.test(
        formData.mobile.trim()
      ) ||
      formData.mobile.replace(/\D/g, '').length < 7
    ) {
      errs.mobile = 'Please enter a valid mobile number (min 7 digits).';
    }

    // Password validation (only if Superadmin enters a new password)
    if (formData.password && formData.password.trim() !== '') {
      if (formData.password.length < 8) {
        errs.password = 'Password must be at least 8 characters.';
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
        clinic_id: parseInt(formData.clinic_id, 10),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        status: formData.status,
      };

      if (formData.password && formData.password.trim() !== '') {
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }

      const response = await adminManagementService.updateAdmin(admin.id, payload);
      toast.success(response.message || `Admin account '${formData.name}' updated successfully.`);

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

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={!isSubmitting ? onClose : undefined}
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div
          className="relative bg-white w-full max-w-xl sm:max-w-2xl rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] my-4 sm:my-8 animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shrink-0 icon-3d shadow-md">
                <Shield className="w-5 h-5 drop-shadow-sm" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 truncate">Edit Administrator</h2>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200/60 shrink-0">
                    #{admin.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  Update assigned clinic branch, account details, login status, or credentials.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors disabled:opacity-50 cursor-pointer shrink-0 ml-2"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* General Error Banner */}
              {errors.general && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shadow-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-medium">{errors.general}</span>
                </div>
              )}

              {/* 1. CLINIC BRANCH ASSIGNMENT */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Assigned Clinic Branch
                    </span>
                  </div>
                  {selectedClinic?.clinic_code && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-blue-700 border border-blue-200 shadow-2xs">
                      <Lock className="w-2.5 h-2.5" />
                      {selectedClinic.clinic_code}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Select Clinic Branch <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={formData.clinic_id}
                      onChange={(e) => setFormData({ ...formData, clinic_id: e.target.value })}
                      disabled={isSubmitting || isLoadingClinics}
                      className={`w-full pl-9 pr-4 py-2 text-xs bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 cursor-pointer font-medium ${
                        errors.clinic_id
                          ? 'border-rose-400 focus:ring-rose-500/15'
                          : 'border-blue-200 focus:ring-blue-500/15 focus:border-blue-500'
                      }`}
                    >
                      <option value="">
                        {isLoadingClinics ? 'Loading clinics...' : '-- Choose Clinic Branch --'}
                      </option>
                      {clinics.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.clinic_code}) {c.branch_name ? `— ${c.branch_name}` : ''} [Location: {c.location}]
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.clinic_id && (
                    <p className="text-[11px] text-rose-600 mt-0.5 font-medium">{errors.clinic_id}</p>
                  )}
                </div>

                {/* Selected Clinic Readonly Info Badges */}
                {selectedClinic && (
                  <div className="pt-2 border-t border-blue-200/50 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white/80 p-2 rounded-lg border border-blue-100 flex items-center gap-1.5 min-w-0">
                      <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="text-slate-500 shrink-0">Location:</span>
                      <span className="font-semibold text-slate-800 truncate">{selectedClinic.location || '—'}</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-blue-100 flex items-center gap-1.5 min-w-0">
                      <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="text-slate-500 shrink-0">Phone:</span>
                      <span className="font-mono text-slate-800 truncate">{selectedClinic.phone || '—'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div className="min-w-0">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Alexander Wright"
                    className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 text-slate-900 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                      errors.name
                        ? 'border-rose-400 focus:ring-rose-500/15'
                        : 'border-slate-200 focus:ring-blue-500/15 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name}</p>}
              </div>

              {/* Email Address & Mobile Number 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Email Address */}
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="admin@company.com"
                      className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 text-slate-900 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                        errors.email
                          ? 'border-rose-400 focus:ring-rose-500/15'
                          : 'border-slate-200 focus:ring-blue-500/15 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>}
                </div>

                {/* Mobile Number */}
                <div className="min-w-0">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="+91 98765 43210"
                      className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 text-slate-900 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                        errors.mobile
                          ? 'border-rose-400 focus:ring-rose-500/15'
                          : 'border-slate-200 focus:ring-blue-500/15 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {errors.mobile && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.mobile}</p>}
                </div>
              </div>

              {/* Password Change / Credentials Card (Directly Visible for Superadmin) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 border border-indigo-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                        Change Password (Optional)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Leave blank to keep existing password unchanged
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {formData.password && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                        title="Copy password to clipboard"
                      >
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Copy</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                      title="Generate random strong 10-character password"
                    >
                      <KeyRound className="w-3 h-3 text-indigo-600" />
                      <span>Generate Password</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* New Password */}
                  <div className="min-w-0">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      New Password {formData.password ? <span className="text-rose-500">*</span> : ''}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          if (errors.password) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.password;
                              return copy;
                            });
                          }
                        }}
                        placeholder="Enter min. 8 characters"
                        autoComplete="new-password"
                        className={`w-full pl-9 pr-9 py-2 text-xs bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 ${
                          errors.password
                            ? 'border-rose-400 focus:ring-rose-500/15'
                            : 'border-slate-200 focus:ring-indigo-500/15 focus:border-indigo-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div className="min-w-0">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm New Password {formData.password ? <span className="text-rose-500">*</span> : ''}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.password_confirmation}
                        onChange={(e) => {
                          setFormData({ ...formData, password_confirmation: e.target.value });
                          if (errors.password_confirmation) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.password_confirmation;
                              return copy;
                            });
                          }
                        }}
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                        className={`w-full pl-9 pr-9 py-2 text-xs bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 ${
                          errors.password_confirmation
                            ? 'border-rose-400 focus:ring-rose-500/15'
                            : 'border-slate-200 focus:ring-indigo-500/15 focus:border-indigo-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {errors.password_confirmation && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.password_confirmation}</p>
                    )}
                  </div>
                </div>

                {formData.password && (
                  <p className="text-[11px] text-indigo-700/80 flex items-center gap-1.5 pt-0.5">
                    <Shield className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                    <span>Saving will update credentials and invalidate previous sessions for this administrator.</span>
                  </p>
                )}
              </div>

              {/* Account Status Radio Group */}
              <div className="min-w-0">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Account Status &amp; Access Control
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Active */}
                  <label
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      formData.status === 'active'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
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
                      Full access to administrative dashboard.
                    </p>
                  </label>

                  {/* Inactive */}
                  <label
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      formData.status === 'inactive'
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-xs'
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
                      Temporarily disabled from logging in.
                    </p>
                  </label>

                  {/* Blocked */}
                  <label
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      formData.status === 'blocked'
                        ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20 shadow-xs'
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
                      Access denied &amp; sessions revoked.
                    </p>
                  </label>
                </div>
                {errors.status && <p className="text-[11px] text-rose-600 mt-1">{errors.status}</p>}
              </div>
            </div>

            {/* Modal Footer Buttons (Sticky, Responsive) */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-60 ${
                  formData.status === 'blocked'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20'
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
    </div>
  );

  return createPortal(modalContent, document.body);
}
