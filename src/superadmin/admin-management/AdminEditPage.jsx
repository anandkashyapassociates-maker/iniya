import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Ban,
  Save,
  Lock,
  Globe,
  Compass,
  ArrowLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Shield,
  KeyRound,
  Copy,
} from 'lucide-react';
import adminManagementService from '../services/adminManagementService';
import clinicManagementService from '../services/clinicManagementService';
import LoadingState from '../../components/LoadingState';
import { useToast } from '../../context/ToastContext';

export default function AdminEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [admin, setAdmin] = useState(null);
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
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClinics, setIsLoadingClinics] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

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

  // Load admin details
  useEffect(() => {
    let isMounted = true;
    const fetchAdmin = async () => {
      setIsLoading(true);
      try {
        const res = await adminManagementService.getAdmin(id);
        const data = res?.admin || res?.data || res;
        if (!isMounted) return;

        setAdmin(data);

        let initialStatus = 'active';
        if (data.status) {
          initialStatus = data.status;
        } else if (data.is_active === false) {
          initialStatus = 'inactive';
        }

        const initialClinicId = data.clinic_id
          ? String(data.clinic_id)
          : data.clinic?.id
          ? String(data.clinic.id)
          : '';

        setFormData({
          clinic_id: initialClinicId,
          name: data.name || '',
          email: data.email || '',
          mobile: data.mobile || '',
          status: initialStatus,
          password: '',
          password_confirmation: '',
        });
      } catch (err) {
        console.error('Failed to load admin details:', err);
        toast.error('Failed to load administrator details.');
        navigate('/superadmin/admin-management/details');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAdmin();
    return () => {
      isMounted = false;
    };
  }, [id, navigate, toast]);

  // Load clinic options (unassigned clinics + current admin clinic)
  useEffect(() => {
    let isMounted = true;
    const fetchClinics = async () => {
      setIsLoadingClinics(true);
      try {
        const res = await clinicManagementService.getClinicOptions({
          unassigned_admin_only: 1,
          except_admin_id: id,
        });
        if (!isMounted) return;

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

        setClinics(list);
      } catch (err) {
        console.error('Failed to load clinics list:', err);
      } finally {
        if (isMounted) setIsLoadingClinics(false);
      }
    };

    if (admin) {
      fetchClinics();
    }
    return () => {
      isMounted = false;
    };
  }, [id, admin]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const selectedClinic =
    clinics.find((c) => String(c.id) === String(formData.clinic_id)) || admin?.clinic || null;

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

    if (formData.password && formData.password.trim() !== '') {
      if (formData.password.trim().length < 8) {
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        payload.password = formData.password.trim();
        payload.password_confirmation = formData.password_confirmation.trim();
      }

      const response = await adminManagementService.updateAdmin(id, payload);
      toast.success(response.message || `Admin account '${formData.name}' updated successfully.`);
      navigate('/superadmin/admin-management/details');
    } catch (err) {
      console.error('Error updating admin:', err);
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const backendErrors = {};
        for (const [key, messages] of Object.entries(err.response.data.errors)) {
          backendErrors[key] = messages[0];
        }
        setErrors(backendErrors);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const msg =
          err.response?.data?.message || 'Failed to update admin account. Please review inputs and try again.';
        setErrors({ general: msg });
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading administrator details..." />;
  }

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto whitespace-nowrap py-0.5">
        <Link to="/superadmin/dashboard" className="hover:text-slate-900 transition-colors">
          Superadmin
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link
          to="/superadmin/admin-management/details"
          className="text-slate-600 hover:text-slate-900 transition-colors"
        >
          Admin Management
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-blue-600 font-semibold truncate max-w-[200px]">
          Edit: {admin?.name || 'Administrator'}
        </span>
      </nav>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold shrink-0 icon-3d shadow-md hover:scale-105 transition-all duration-300">
            <Shield className="w-6 h-6 drop-shadow-sm" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight">
                Edit Administrator: {admin?.name || 'Administrator'}
              </h1>
              {admin?.admin_code ? (
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200 shadow-2xs">
                  {admin.admin_code}
                </span>
              ) : admin?.id ? (
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-2xs">
                  #{admin.id}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Update assigned clinic branch, contact details, login credentials, and account clearance.
            </p>
          </div>
        </div>

        <Link
          to="/superadmin/admin-management/details"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer self-stretch sm:self-auto shrink-0 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Admins Directory</span>
        </Link>
      </div>

      {/* Main Edit Form Card */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 lg:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-50/50 via-indigo-50/20 to-transparent rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-fade-in shadow-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{errors.general}</span>
              </div>
            )}

            {/* STEP 1: CLINIC BRANCH ASSIGNMENT */}
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/60 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    1. Assigned Clinic Branch
                  </span>
                </div>
                {selectedClinic && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white text-blue-700 border border-blue-200 shadow-2xs">
                    <Lock className="w-3 h-3" />
                    {selectedClinic.clinic_code}
                  </span>
                )}
              </div>

              {/* Clinic Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Clinic Branch <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.clinic_id}
                  onChange={(e) => handleChange('clinic_id', e.target.value)}
                  disabled={isSubmitting || isLoadingClinics}
                  className={`w-full px-3 py-2 text-xs bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 cursor-pointer font-medium shadow-2xs ${
                    errors.clinic_id
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                      : 'border-blue-200 focus:border-blue-500 focus:ring-blue-500/15'
                  }`}
                >
                  <option value="">
                    {isLoadingClinics ? 'Loading clinics...' : '-- Choose Clinic Branch --'}
                  </option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.clinic_code}) {c.branch_name ? `— ${c.branch_name}` : ''} [Location: {c.location || c.city || 'N/A'}]
                    </option>
                  ))}
                </select>
                {errors.clinic_id && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.clinic_id}</p>
                )}
              </div>

              {/* Selected Clinic Branch Details Banner */}
              {selectedClinic && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-blue-200/50">
                    <Compass className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Location / Branch
                      </span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {selectedClinic.location || selectedClinic.branch_name || 'Central Branch'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-blue-200/50">
                    <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Clinic Phone
                      </span>
                      <span className="font-semibold text-slate-800 truncate block font-mono">
                        {selectedClinic.phone || '+91 9876543210'}
                      </span>
                    </div>
                  </div>

                  {(selectedClinic.address || selectedClinic.city) && (
                    <div className="sm:col-span-2 flex items-center gap-2 p-2.5 bg-white/80 rounded-xl border border-blue-200/50">
                      <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Full Clinic Address
                        </span>
                        <span className="font-medium text-slate-700 truncate block">
                          {[selectedClinic.address, selectedClinic.city, selectedClinic.state]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: ADMINISTRATOR PROFILE DETAILS */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <User className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  2. Administrator Profile Details
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g. Dr. Rajesh Sharma"
                      disabled={isSubmitting}
                      className={`w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 font-medium ${
                        errors.name
                          ? 'border-rose-400 focus:ring-rose-500/15'
                          : 'border-slate-200 focus:ring-indigo-500/15 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name}</p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="admin@iniya.com"
                      disabled={isSubmitting}
                      className={`w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 font-mono ${
                        errors.email
                          ? 'border-rose-400 focus:ring-rose-500/15'
                          : 'border-slate-200 focus:ring-indigo-500/15 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => handleChange('mobile', e.target.value)}
                      placeholder="+91 98765 43210"
                      disabled={isSubmitting}
                      className={`w-full pl-9 pr-3 py-2 text-xs bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 font-mono ${
                        errors.mobile
                          ? 'border-rose-400 focus:ring-rose-500/15'
                          : 'border-slate-200 focus:ring-indigo-500/15 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  {errors.mobile && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.mobile}</p>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 3: SECURITY & CREDENTIALS (PASSWORD CHANGE) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/40 border border-indigo-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
                      3. Security &amp; Credentials
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Leave blank to keep existing password, or set a new one.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-300 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                    title="Generate a random secure 10-character password"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Generate Password</span>
                  </button>

                  {formData.password && (
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                      title="Copy password to clipboard"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password (Optional)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Enter min. 8 characters"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className={`w-full pl-9 pr-9 py-2 text-xs bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 font-mono ${
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password {formData.password ? <span className="text-rose-500">*</span> : ''}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.password_confirmation}
                      onChange={(e) => handleChange('password_confirmation', e.target.value)}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className={`w-full pl-9 pr-9 py-2 text-xs bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 font-mono ${
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
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {errors.password_confirmation}
                    </p>
                  )}
                </div>
              </div>

              {formData.password && (
                <div className="p-2.5 rounded-xl bg-indigo-100/60 border border-indigo-200 text-indigo-900 text-[11px] flex items-center gap-2 animate-fade-in">
                  <Shield className="w-3.5 h-3.5 shrink-0 text-indigo-700" />
                  <span>
                    Saving will immediately update credentials and invalidate active sessions for this administrator.
                  </span>
                </div>
              )}
            </div>

            {/* STEP 4: ACCOUNT STATUS & ACCESS CONTROL */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                4. Account Status &amp; Access Control
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Active */}
                <label
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    formData.status === 'active'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Active</span>
                    </div>
                    <input
                      type="radio"
                      name="admin_status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={() => handleChange('status', 'active')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Full access to assigned clinic administrative panel.
                  </p>
                </label>

                {/* Inactive */}
                <label
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    formData.status === 'inactive'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Inactive</span>
                    </div>
                    <input
                      type="radio"
                      name="admin_status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={() => handleChange('status', 'inactive')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Temporarily suspended from logging in.
                  </p>
                </label>

                {/* Blocked */}
                <label
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    formData.status === 'blocked'
                      ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                      <Ban className="w-4 h-4 text-rose-600" />
                      <span>Blocked</span>
                    </div>
                    <input
                      type="radio"
                      name="admin_status"
                      value="blocked"
                      checked={formData.status === 'blocked'}
                      onChange={() => handleChange('status', 'blocked')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Strictly locked out and tokens invalidated.
                  </p>
                </label>
              </div>
            </div>

            {/* FORM FOOTER ACTIONS */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Link
                to="/superadmin/admin-management/details"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all text-center cursor-pointer"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Account Privilege Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/60 border border-blue-200/80 flex items-start gap-3.5 text-xs text-blue-900 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 icon-3d shadow-sm mt-0.5">
          <Shield className="w-4 h-4 drop-shadow-sm" />
        </div>
        <div className="leading-relaxed">
          <span className="font-bold block text-sm text-blue-950">Security &amp; Privilege Notice</span>
          Administrators managed here operate in Panel 2 (Operational Tier). Password updates take effect immediately across all active login endpoints.
        </div>
      </div>
    </div>
  );
}
