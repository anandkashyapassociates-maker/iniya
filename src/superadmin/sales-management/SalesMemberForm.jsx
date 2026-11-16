import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Hash,
  Sparkles,
  FileText,
  Globe,
  UploadCloud,
  Layers,
  Compass,
  Lock,
} from 'lucide-react';
import salesMemberManagementService from '../services/salesMemberManagementService';
import clinicManagementService from '../services/clinicManagementService';
import { INDIAN_STATES } from '../../utils/indiaStates';

const DEPARTMENTS = [
  'Enterprise Sales',
  'Direct Sales',
  'Retail Sales',
  'Channel Partners',
  'Inside Sales',
  'B2B Sales',
  'International Sales',
];

const EMPLOYMENT_TYPES = [
  'Full-Time',
  'Part-Time',
  'Contract',
  'Commission-Based',
  'Probationary',
];

const TERRITORIES = [
  'North Zone',
  'South Zone',
  'East Zone',
  'West Zone',
  'Central Zone',
  'National',
  'International',
];

const GENDERS = ['Male', 'Female', 'Non-Binary', 'Prefer not to say'];

export default function SalesMemberForm({
  onSubmit,
  isLoading = false,
  cancelPath = '/superadmin/sales-members',
}) {
  const [formData, setFormData] = useState({
    clinic_id: '',
    name: '',
    email: '',
    mobile: '',
    alternate_mobile: '',
    gender: 'Male',
    city: '',
    state: '',
    country: 'India',
    address: '',
    notes: '',
    status: 'active',
  });

  const [clinics, setClinics] = useState([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(true);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [previewCode, setPreviewCode] = useState('');
  const [errors, setErrors] = useState({});

  // Active selected clinic object for previewing branch info
  const selectedClinic = clinics.find((c) => String(c.id) === String(formData.clinic_id)) || null;

  useEffect(() => {
    let isMounted = true;

    // Load active clinics
    clinicManagementService
      .getClinicOptions()
      .then((res) => {
        if (!isMounted) return;
        const list = res.clinics || [];
        setClinics(list);
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

    // Fetch next sales code preview
    salesMemberManagementService
      .getPreviewCode()
      .then((res) => {
        if (!isMounted) return;
        if (res.preview_code) {
          setPreviewCode(res.preview_code);
        }
      })
      .catch(() => {
        if (isMounted) setPreviewCode('SAL-0001');
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          profile_photo: 'Photo size must not exceed 2MB.',
        }));
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const errs = {};

    if (!formData.clinic_id) {
      errs.clinic_id = 'Please select a clinic branch for this sales member.';
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

    try {
      const data = {
        clinic_id: formData.clinic_id,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        alternate_mobile: formData.alternate_mobile.trim() || null,
        gender: formData.gender,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        country: formData.country.trim() || 'India',
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        status: formData.status || 'active',
      };

      if (photoFile) {
        const formPayload = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formPayload.append(key, value);
          }
        });
        formPayload.append('profile_photo', photoFile);
        await onSubmit(formPayload);
      } else {
        await onSubmit(data);
      }

      // Reset form on success
      setFormData({
        clinic_id: clinics.length === 1 ? String(clinics[0].id) : '',
        name: '',
        email: '',
        mobile: '',
        alternate_mobile: '',
        gender: 'Male',
        city: '',
        state: '',
        country: 'India',
        address: '',
        notes: '',
        status: 'active',
      });
      setPhotoFile(null);
      setPreviewPhoto(null);
      setErrors({});

      // Refresh code preview
      salesMemberManagementService.getPreviewCode().then((res) => {
        if (res.preview_code) setPreviewCode(res.preview_code);
      });
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({
          general:
            err.response?.data?.message ||
            'Failed to create sales team member. Please verify inputs and try again.',
        });
      }
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
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-purple-500/30 shadow-md hover:border-purple-500/50 transition-all duration-300 space-y-4 animate-slide-up group">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-105 transition-transform duration-300">
              <Building2 className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-mono text-[10px] font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Clinic Branch Assignment
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 uppercase">
                  Step 1 (Mandatory)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                First select which clinic branch this sales representative is appointed to. Clinic details will load automatically.
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
                  : 'border-slate-200 focus:border-purple-500 focus:ring-purple-500/15'
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
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-slate-50 border border-purple-200/80 space-y-3.5 animate-scale-up">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-purple-200/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-purple-900">
                  Assigned Clinic Profile Loaded
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white text-purple-700 border border-purple-200 shadow-2xs">
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
                  className="w-full px-3 py-2 text-xs bg-white/90 border border-purple-200/80 rounded-xl text-slate-800 font-semibold cursor-not-allowed shadow-2xs"
                />
              </div>

              {/* Location / Area */}
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-purple-500" />
                  <span>Location / Area</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedClinic.location || '—'}
                  className="w-full px-3 py-2 text-xs bg-white/90 border border-purple-200/80 rounded-xl text-slate-800 font-medium cursor-not-allowed shadow-2xs"
                />
              </div>

              {/* City / State */}
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-purple-500" />
                  <span>City / State</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${selectedClinic.city || '—'}, ${selectedClinic.state || '—'} ${selectedClinic.postal_code ? `(${selectedClinic.postal_code})` : ''}`}
                  className="w-full px-3 py-2 text-xs bg-white/90 border border-purple-200/80 rounded-xl text-slate-800 font-medium cursor-not-allowed shadow-2xs"
                />
              </div>

              {/* Full Physical Address */}
              <div className="min-w-0 sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-purple-500" />
                  <span>Full Clinic Address</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedClinic.address || '—'}
                  className="w-full px-3 py-2 text-xs bg-white/90 border border-purple-200/80 rounded-xl text-slate-800 font-medium cursor-not-allowed shadow-2xs"
                />
              </div>

              {/* Clinic Phone */}
              <div className="min-w-0">
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-purple-500" />
                  <span>Clinic Contact Phone</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedClinic.phone || '—'}
                  className="w-full px-3 py-2 text-xs bg-white/90 border border-purple-200/80 rounded-xl text-slate-800 font-mono cursor-not-allowed shadow-2xs"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
            Please choose a clinic branch above to view its physical location and address details before creating sales member.
          </div>
        )}
      </div>

      {/* Sales Code Auto-Generation Preview Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50/90 via-indigo-50/60 to-blue-50/40 border border-purple-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-slide-up">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center font-bold shrink-0 icon-3d shadow-md">
            <Hash className="w-5 h-5 drop-shadow-sm" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Sales Code Auto-Generation
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200/60">
                <Sparkles className="w-3 h-3 animate-pulse-glow" />
                Next Available
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
              Assigned automatically by the backend upon record creation.
            </p>
          </div>
        </div>
        <div className="self-stretch sm:self-auto text-center px-4 py-2 rounded-xl bg-white border border-purple-200 text-purple-700 font-mono text-sm font-bold tracking-wider shadow-2xs shrink-0">
          {previewCode || 'SAL-0001'}
        </div>
      </div>

      {/* SECTION 2: BASIC INFORMATION */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-purple-200/80 transition-all duration-300 space-y-4 animate-slide-up stagger-1 group">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center shrink-0 icon-3d shadow-sm group-hover:scale-105 transition-transform duration-300">
            <User className="w-4 h-4 drop-shadow-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-mono text-[10px] font-bold flex items-center justify-center">
              2
            </span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Basic Identification &amp; Photo
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                placeholder="e.g. Vikram Malhotra"
                disabled={isLoading}
                required
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-2xs ${
                  errors.name
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-200 focus:border-purple-500 focus:ring-purple-500/15'
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
                placeholder="vikram.malhotra@company.com"
                disabled={isLoading}
                required
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-2xs ${
                  errors.email
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-200 focus:border-purple-500 focus:ring-purple-500/15'
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

          {/* Gender */}
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 transition-all duration-200 shadow-2xs cursor-pointer"
            >
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Primary Mobile */}
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Primary Mobile <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => handleChange('mobile', e.target.value)}
                placeholder="+91 98765 43210"
                disabled={isLoading}
                required
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 shadow-2xs ${
                  errors.mobile
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                    : 'border-slate-200 focus:border-purple-500 focus:ring-purple-500/15'
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

          {/* Alternate Mobile */}
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Alternate Mobile <span className="text-slate-400 text-[10px] lowercase font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={formData.alternate_mobile}
                onChange={(e) => handleChange('alternate_mobile', e.target.value)}
                placeholder="+91 98765 00000"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 transition-all duration-200 shadow-2xs"
              />
            </div>
          </div>

          {/* Profile Photo Upload */}
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Profile Photo <span className="text-slate-400 text-[10px] lowercase font-normal">(max 2MB)</span>
            </label>
            <div className="flex items-center gap-3">
              {previewPhoto ? (
                <img
                  src={previewPhoto}
                  alt="Preview"
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                disabled={isLoading}
                className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer min-w-0 flex-1"
              />
            </div>
            {errors.profile_photo && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.profile_photo}</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: LOCATION INFORMATION */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-200/80 transition-all duration-300 space-y-4 animate-slide-up stagger-2 group">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 text-white flex items-center justify-center shrink-0 icon-3d shadow-sm group-hover:scale-105 transition-transform duration-300">
            <MapPin className="w-4 h-4 drop-shadow-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-mono text-[10px] font-bold flex items-center justify-center">
              3
            </span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Location Details
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* City */}
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="e.g. New Delhi"
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 transition-all duration-200 shadow-2xs"
            />
          </div>

          {/* State */}
          <div className="min-w-0">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              State
            </label>
            <select
              value={formData.state || ''}
              onChange={(e) => handleChange('state', e.target.value)}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-xs bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 transition-all duration-200 shadow-2xs cursor-pointer font-medium"
            >
              <option value="">Select State</option>
              {formData.state && !INDIAN_STATES.includes(formData.state) && (
                <option value={formData.state}>{formData.state}</option>
              )}
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Country (Read-Only) */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Country
              </label>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Fixed / Readonly</span>
            </div>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                readOnly
                value={formData.country || 'India'}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-100/80 text-slate-600 font-semibold border border-slate-200 rounded-xl outline-none cursor-not-allowed select-none transition-all duration-200 shadow-2xs"
                title="Country is set to India by default (read-only)"
              />
            </div>
          </div>

          {/* Complete Address */}
          <div className="sm:col-span-3 min-w-0">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Complete Residential / Office Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Street Address, Block/Floor, Pin Code..."
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 transition-all duration-200 shadow-2xs resize-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: NOTES & STATUS */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all duration-300 space-y-4 animate-slide-up stagger-3 group">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 via-slate-800 to-slate-900 text-white flex items-center justify-center shrink-0 icon-3d shadow-sm group-hover:scale-105 transition-transform duration-300">
            <FileText className="w-4 h-4 drop-shadow-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center">
              4
            </span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Notes &amp; Account Status
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Internal Administrative Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Enter special notes, performance targets or credentials..."
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all duration-200 shadow-2xs resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Initial Account Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  formData.status === 'active'
                    ? 'border-emerald-500/50 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <input
                  type="radio"
                  name="sales_status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-emerald-800 block">Active</span>
                  <span className="text-[11px] text-slate-500 block truncate">Authorized for field operations</span>
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
                  name="sales_status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-amber-800 block">Inactive</span>
                  <span className="text-[11px] text-slate-500 block truncate">Temporarily on leave</span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  formData.status === 'blocked'
                    ? 'border-rose-500/50 bg-rose-50/60 ring-2 ring-rose-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <input
                  type="radio"
                  name="sales_status"
                  value="blocked"
                  checked={formData.status === 'blocked'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-rose-800 block">Blocked</span>
                  <span className="text-[11px] text-slate-500 block truncate">Suspended from sales duties</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* FORM ACTIONS */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-5 border-t border-slate-200/80">
        <a
          href={cancelPath}
          className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-2xs"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Registering Member...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Register Sales Member</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
