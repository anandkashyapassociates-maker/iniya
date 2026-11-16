import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Hash,
  Sparkles,
  Lock,
  Globe,
  Compass,
  UploadCloud,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import staffManagementService from '../services/staffManagementService';
import clinicManagementService from '../services/clinicManagementService';

const COMMON_DEPARTMENTS = [
  'Dental',
  'Cosmetology',
  'Dermatology',
  'Aesthetics & Wellness',
  'Physiotherapy',
  'Trichology (Hair Care)',
  'General Medicine / OPD',
  'Plastic & Cosmetic Surgery',
  'Nutrition & Dietetics',
  'Ayurveda & Wellness',
  'Orthopedics',
  'Gynecology & Obstetrics',
  'Pediatrics',
  'Cardiology',
  'ENT (Ear, Nose, Throat)',
  'Ophthalmology',
  'Psychiatry & Psychology',
  'Radiology & Diagnostics',
  'Pathology & Laboratory',
  'Nursing & Patient Care',
  'Pharmacy',
  'Clinical Administration',
  'Operations',
  'Human Resources',
  'Finance & Accounts',
  'Sales & Marketing',
  'Customer Support',
];

const EMPLOYMENT_TYPES = [
  'Full-Time',
  'Part-Time',
  'Contract',
  'Intern',
];

export default function StaffForm({
  onSubmit,
  isLoading = false,
  cancelPath = '/superadmin/staff-management/details',
}) {
  const [formData, setFormData] = useState({
    clinic_id: '',
    name: '',
    email: '',
    password: '',
    mobile: '',
    department: '',
    designation: '',
    employment_type: 'Full-Time',
    joining_date: new Date().toISOString().split('T')[0],
    address: '',
    status: 'active',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(true);
  const [previewCode, setPreviewCode] = useState('');
  const [errors, setErrors] = useState({});

  // Fetch clinics list and preview code on mount
  useEffect(() => {
    let isMounted = true;

    // Load active clinics
    clinicManagementService
      .getClinicOptions()
      .then((res) => {
        if (!isMounted) return;
        const list = res.clinics || [];
        setClinics(list);
        // If there's only 1 clinic available, auto-select it for convenience
        if (list.length === 1) {
          setFormData((prev) => ({ ...prev, clinic_id: String(list[0].id) }));
        }
      })
      .catch((err) => {
        console.error('Failed to load clinic options:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingClinics(false);
      });

    // Fetch next staff code preview
    staffManagementService
      .getPreviewCode()
      .then((res) => {
        if (!isMounted) return;
        if (res.preview_code) {
          setPreviewCode(res.preview_code);
        }
      })
      .catch(() => {
        if (isMounted) setPreviewCode('STF-XXXX');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Selected clinic object for showing location/address
  const selectedClinic = clinics.find(
    (c) => String(c.id) === String(formData.clinic_id)
  ) || null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          profile_photo: 'Photo size must not exceed 5MB.',
        }));
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhoto(reader.result);
      };
      reader.readAsDataURL(file);
      if (errors.profile_photo) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.profile_photo;
          return next;
        });
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPreviewPhoto(null);
  };

  const validate = () => {
    const errs = {};

    if (!formData.clinic_id) {
      errs.clinic_id = 'Please select a clinic branch for this staff member.';
    }

    if (!formData.name.trim()) {
      errs.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address.';
    }

    if (formData.mobile && formData.mobile.trim()) {
      if (
        !/^(\+?\d{1,4}[-.\s]?)?(\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}$/.test(
          formData.mobile.trim()
        ) ||
        formData.mobile.replace(/\D/g, '').length < 7
      ) {
        errs.mobile = 'Please enter a valid mobile number (min 7 digits).';
      }
    }

    if (formData.password && formData.password.length > 0 && formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const payloadData = {
        clinic_id: parseInt(formData.clinic_id, 10),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password ? formData.password : undefined,
        mobile: formData.mobile.trim() || null,
        department: formData.department.trim() || null,
        designation: formData.designation.trim() || null,
        employment_type: formData.employment_type,
        joining_date: formData.joining_date,
        address: formData.address.trim() || null,
        status: formData.status,
      };

      if (photoFile) {
        const formPayload = new FormData();
        Object.entries(payloadData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formPayload.append(key, value);
          }
        });
        formPayload.append('profile_photo', photoFile);
        await onSubmit(formPayload);
      } else {
        await onSubmit(payloadData);
      }

      // Reset form on success (keep selected clinic if only 1 exists)
      setFormData({
        clinic_id: clinics.length === 1 ? String(clinics[0].id) : '',
        name: '',
        email: '',
        password: '',
        mobile: '',
        department: '',
        designation: '',
        employment_type: 'Full-Time',
        joining_date: new Date().toISOString().split('T')[0],
        address: '',
        status: 'active',
      });
      setPhotoFile(null);
      setPreviewPhoto(null);
      setErrors({});

      // Refresh code preview
      staffManagementService.getPreviewCode().then((res) => {
        if (res.preview_code) setPreviewCode(res.preview_code);
      });
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({
          general:
            err.response?.data?.message ||
            'Failed to create staff member. Please check details and try again.',
        });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* General Alert */}
      {errors.general && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-slide-up shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-medium">{errors.general}</span>
        </div>
      )}

      {/* STEP 1: PRIMARY REQUIREMENT - SELECT CLINIC BRANCH */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-blue-500/30 shadow-md hover:border-blue-500/50 transition-all duration-300 space-y-4 animate-slide-up group">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-105 transition-transform duration-300">
              <Building2 className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-mono text-[10px] font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Clinic Branch Assignment
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 uppercase">
                  Step 1 (Mandatory)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                First select which clinic branch this staff member is appointed to. Clinic details will load automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Clinic Dropdown Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Clinic Branch <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={formData.clinic_id}
              onChange={(e) => handleChange('clinic_id', e.target.value)}
              disabled={isLoading || isLoadingClinics}
              required
              className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-2xs cursor-pointer font-medium ${
                errors.clinic_id
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15'
              }`}
            >
              <option value="">
                {isLoadingClinics ? 'Loading available clinics...' : '-- Choose Clinic Branch --'}
              </option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.clinic_code}) {c.branch_name ? `— ${c.branch_name}` : ''} [Location: {c.location}]
                </option>
              ))}
            </select>
          </div>
          {errors.clinic_id && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{Array.isArray(errors.clinic_id) ? errors.clinic_id[0] : errors.clinic_id}</span>
            </p>
          )}
        </div>

        {/* Selected Clinic Details Auto-Preview Card */}
        {selectedClinic ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 space-y-3.5 animate-scale-up">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-blue-200/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-blue-900">
                  Assigned Clinic Profile Loaded
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white text-blue-700 border border-blue-200 shadow-2xs">
                <Lock className="w-3 h-3" />
                {selectedClinic.clinic_code}
              </span>
            </div>

            {/* Read-only populated info inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Clinic Name & Branch */}
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Clinic / Branch Name
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${selectedClinic.name} ${selectedClinic.branch_name ? `(${selectedClinic.branch_name})` : ''}`}
                  className="w-full px-3 py-2 text-xs bg-white/90 border border-blue-200/80 rounded-xl text-slate-800 font-semibold cursor-not-allowed shadow-2xs"
                />
              </div>

              {/* Location / Area */}
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-blue-500" />
                  <span>Location / Area</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedClinic.location || '—'}
                  className="w-full px-3 py-2 text-xs bg-white/90 border border-blue-200/80 rounded-xl text-slate-800 font-medium cursor-not-allowed shadow-2xs"
                />
              </div>

              {/* City / State */}
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-500" />
                  <span>City / State</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${selectedClinic.city || '—'}, ${selectedClinic.state || '—'} ${selectedClinic.postal_code ? `(${selectedClinic.postal_code})` : ''}`}
                  className="w-full px-3 py-2 text-xs bg-white/90 border border-blue-200/80 rounded-xl text-slate-800 font-medium cursor-not-allowed shadow-2xs"
                />
              </div>

              {/* Full Physical Address */}
              <div className="min-w-0 sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-500" />
                  <span>Full Clinic Address</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedClinic.address || '—'}
                  className="w-full px-3 py-2 text-xs bg-white/90 border border-blue-200/80 rounded-xl text-slate-800 font-medium cursor-not-allowed shadow-2xs"
                />
              </div>

              {/* Clinic Phone */}
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-blue-500" />
                  <span>Clinic Contact Phone</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedClinic.phone || '—'}
                  className="w-full px-3 py-2 text-xs bg-white/90 border border-blue-200/80 rounded-xl text-slate-800 font-mono cursor-not-allowed shadow-2xs"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Placeholder guidance */
          <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
            Please choose a clinic branch above to view its physical location and address details before creating staff.
          </div>
        )}
      </div>

      {/* Staff Code Preview Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-cyan-50/40 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-slide-up">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-600 text-white flex items-center justify-center font-bold shrink-0 icon-3d shadow-md">
            <Hash className="w-5 h-5 drop-shadow-sm" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Staff Code Auto-Generation
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200/60">
                <Sparkles className="w-3 h-3 animate-pulse-glow" />
                Next Available
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
              Assigned automatically by the backend upon record creation.
            </p>
          </div>
        </div>
        <div className="self-stretch sm:self-auto text-center px-4 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 font-mono text-sm font-bold tracking-wider shadow-2xs shrink-0">
          {previewCode || 'STF-0001'}
        </div>
      </div>

      {/* SECTION 2: PERSONAL & CONTACT IDENTITY */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-200/80 transition-all duration-300 space-y-4 animate-slide-up stagger-1 group">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 via-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0 icon-3d shadow-sm group-hover:scale-105 transition-transform duration-300">
            <User className="w-4 h-4 drop-shadow-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-mono text-[10px] font-bold flex items-center justify-center">
              2
            </span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Staff Personal &amp; Contact Details
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Dr. Ramesh Kumar"
                disabled={isLoading}
                required
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-2xs ${
                  errors.name
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/15'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{Array.isArray(errors.name) ? errors.name[0] : errors.name}</span>
              </p>
            )}
          </div>

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
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="doctor@iniya.com"
                disabled={isLoading}
                required
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-2xs ${
                  errors.email
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/15'
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

          {/* Mobile Number */}
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => handleChange('mobile', e.target.value)}
                placeholder="e.g., +91 98765 43210"
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-2xs ${
                  errors.mobile
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/15'
                }`}
              />
            </div>
            {errors.mobile && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{Array.isArray(errors.mobile) ? errors.mobile[0] : errors.mobile}</span>
              </p>
            )}
          </div>

          {/* Login Password */}
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Login Password <span className="text-slate-400 font-normal lowercase">(default: 12345678, min. 8 chars)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Leave blank for default (12345678) or enter min. 8 characters"
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-2xs ${
                  errors.password
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/15'
                }`}
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{Array.isArray(errors.password) ? errors.password[0] : errors.password}</span>
              </p>
            )}
          </div>

          {/* Profile Photo Upload */}
          <div className="min-w-0 sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Staff Profile Photo <span className="text-slate-400 text-[10px] lowercase font-normal">(optional, max 5MB)</span>
            </label>
            <div className="flex items-center gap-3">
              {previewPhoto ? (
                <div className="relative group shrink-0">
                  <img
                    src={previewPhoto}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isLoading}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                    title="Remove Photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handlePhotoChange}
                  disabled={isLoading}
                  className="text-xs text-slate-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer min-w-0 w-full"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Accepts JPG, PNG, WEBP up to 5MB. Photo will appear on staff appointments and lists.
                </p>
              </div>
            </div>
            {errors.profile_photo && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.profile_photo}</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: PROFESSIONAL & DEPARTMENTAL ASSIGNMENT */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-teal-200/80 transition-all duration-300 space-y-4 animate-slide-up stagger-2 group">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 via-cyan-600 to-blue-600 text-white flex items-center justify-center shrink-0 icon-3d shadow-sm group-hover:scale-105 transition-transform duration-300">
            <Briefcase className="w-4 h-4 drop-shadow-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 font-mono text-[10px] font-bold flex items-center justify-center">
              3
            </span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Professional &amp; Role Details
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Department */}
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Department
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="e.g., Dental, Aesthetics, Dermatology"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all duration-200 shadow-2xs"
              />
            </div>
          </div>

          {/* Designation */}
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Designation / Role
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                placeholder="e.g., Senior Therapist, Consultant"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all duration-200 shadow-2xs"
              />
            </div>
          </div>

          {/* Employment Type */}
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Employment Type
            </label>
            <select
              value={formData.employment_type}
              onChange={(e) => handleChange('employment_type', e.target.value)}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all duration-200 shadow-2xs cursor-pointer"
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Joining Date */}
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Joining Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={formData.joining_date}
                onChange={(e) => handleChange('joining_date', e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all duration-200 shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: RESIDENCE & ACCOUNT STATUS */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all duration-300 space-y-4 animate-slide-up stagger-3 group">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 via-slate-800 to-slate-900 text-white flex items-center justify-center shrink-0 icon-3d shadow-sm group-hover:scale-105 transition-transform duration-300">
            <MapPin className="w-4 h-4 drop-shadow-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center">
              4
            </span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Staff Residential Address &amp; Status
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Staff Residential Address (Personal)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Floor, building, street, city, postal code..."
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all duration-200 shadow-2xs resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Account Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  formData.status === 'active'
                    ? 'border-emerald-500/50 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={() => handleChange('status', 'active')}
                  disabled={isLoading}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 shrink-0"
                />
                <div>
                  <span className="text-xs font-bold text-emerald-800 block">Active</span>
                  <span className="text-[11px] text-slate-500">In Active Duty / Available for clinic duties</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  formData.status === 'inactive'
                    ? 'border-amber-500/50 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={() => handleChange('status', 'inactive')}
                  disabled={isLoading}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500 shrink-0"
                />
                <div>
                  <span className="text-xs font-bold text-amber-800 block">Inactive</span>
                  <span className="text-[11px] text-slate-500">On Leave / Temporarily Relieved</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-5 border-t border-slate-200/80">
        <Link
          to={cancelPath}
          className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-2xs"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Provisioning Staff...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Save &amp; Provision Staff</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
