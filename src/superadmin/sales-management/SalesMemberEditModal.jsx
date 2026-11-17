import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  MapPin,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  Globe,
  UploadCloud,
  Layers,
  Compass,
} from 'lucide-react';
import salesMemberManagementService from '../services/salesMemberManagementService';
import clinicManagementService from '../services/clinicManagementService';
import { useToast } from '../../context/ToastContext';
import { getImageUrl } from '../../utils/imageUrl';
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

export default function SalesMemberEditModal({ member, isOpen, onClose, onSuccess }) {
  const toast = useToast();

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
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load clinic options
  useEffect(() => {
    clinicManagementService
      .getClinicOptions()
      .then((res) => {
        setClinics(res.clinics || []);
      })
      .catch((err) => {
        console.error('Failed to load clinic options:', err);
      })
      .finally(() => {
        setIsLoadingClinics(false);
      });
  }, []);

  useEffect(() => {
    if (member) {
      setFormData({
        clinic_id: member.clinic_id || member.clinic?.id ? String(member.clinic_id || member.clinic?.id) : '',
        name: member.name || '',
        email: member.email || '',
        mobile: member.mobile || '',
        alternate_mobile: member.alternate_mobile || '',
        gender: member.gender || 'Male',
        city: member.city || '',
        state: member.state || '',
        country: member.country || 'India',
        address: member.address || '',
        notes: member.notes || '',
        status: member.status || 'active',
      });
      setPreviewPhoto(member.profile_photo_url || null);
      setPhotoFile(null);
      setErrors({});
    }
  }, [member]);

  // Selected clinic object for previewing branch info
  const selectedClinic = clinics.find((c) => String(c.id) === String(formData.clinic_id)) || member?.clinic || null;

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !member) return null;

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
        clinic_id: formData.clinic_id ? Number(formData.clinic_id) : null,
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
        status: formData.status,
      };

      let response;
      if (photoFile) {
        const formPayload = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formPayload.append(key, value);
          }
        });
        formPayload.append('profile_photo', photoFile);
        response = await salesMemberManagementService.updateSalesMember(member.id, formPayload);
      } else {
        response = await salesMemberManagementService.updateSalesMember(member.id, payload);
      }

      toast.success(`Sales Member '${formData.name}' updated successfully.`);

      if (onSuccess) {
        onSuccess(response.sales_member || response.data || response);
      }
      onClose();
    } catch (err) {
      console.error('Error updating sales member:', err);
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const backendErrors = {};
        for (const [key, messages] of Object.entries(err.response.data.errors)) {
          backendErrors[key] = messages[0];
        }
        setErrors(backendErrors);
      } else {
        const msg =
          err.response?.data?.message || 'Failed to update sales member. Please try again.';
        setErrors({ general: msg });
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={!isSubmitting ? onClose : undefined}
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-4 sm:my-8 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center shrink-0 icon-3d shadow-md">
                <User className="w-5 h-5 drop-shadow-sm" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 truncate">
                    Edit Sales Member Profile
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-100 text-purple-700 border border-purple-200/60">
                    <Lock className="w-3 h-3" />
                    {member.sales_code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  Sales code is immutable for auditing and transaction attribution.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors disabled:opacity-50 cursor-pointer shrink-0 ml-2"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
              {errors.general && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shadow-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-medium">{errors.general}</span>
                </div>
              )}

              {/* 1. Clinic Branch Assignment */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 font-mono text-[9px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Clinic Branch Assignment <span className="text-rose-500">*</span>
                    </h4>
                  </div>
                  {selectedClinic && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-purple-700 border border-purple-200 shadow-2xs">
                      <Lock className="w-2.5 h-2.5" />
                      {selectedClinic.clinic_code}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={formData.clinic_id}
                    onChange={(e) => handleChange('clinic_id', e.target.value)}
                    required
                    disabled={isSubmitting || isLoadingClinics}
                    className={`w-full pl-9 pr-3 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 ${
                      errors.clinic_id
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-purple-600 focus:ring-purple-100'
                    }`}
                  >
                    <option value="">
                      {isLoadingClinics ? 'Loading clinic branches...' : '-- Select Clinic Branch --'}
                    </option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.clinic_code}) {c.branch_name ? `— ${c.branch_name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.clinic_id && (
                  <p className="text-[10px] text-rose-600 mt-1">{errors.clinic_id}</p>
                )}

                {/* Read-only Clinic Details Card */}
                {selectedClinic && (
                  <div className="p-3 bg-white/90 rounded-xl border border-purple-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-medium block">Branch Name:</span>
                      <span className="font-semibold text-slate-800">{selectedClinic.branch_name || 'Main Flagship Clinic'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Location / City:</span>
                      <span className="font-semibold text-slate-800">{[selectedClinic.location, selectedClinic.city].filter(Boolean).join(', ') || '—'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 font-medium block">Address:</span>
                      <span className="font-medium text-slate-700">{selectedClinic.address || '—'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Basic Info */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 font-mono text-[9px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Basic Info &amp; Photo
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                      disabled={isSubmitting}
                      className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                        errors.name
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-purple-600 focus:ring-purple-100'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                      disabled={isSubmitting}
                      className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                        errors.email
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-purple-600 focus:ring-purple-100'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-[10px] text-rose-600 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all duration-200 cursor-pointer"
                    >
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Primary Mobile <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.mobile}
                      onChange={(e) => handleChange('mobile', e.target.value)}
                      required
                      disabled={isSubmitting}
                      className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                        errors.mobile
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-purple-600 focus:ring-purple-100'
                      }`}
                    />
                    {errors.mobile && (
                      <p className="text-[10px] text-rose-600 mt-1">{errors.mobile}</p>
                    )}
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alternate Mobile
                    </label>
                    <input
                      type="text"
                      value={formData.alternate_mobile}
                      onChange={(e) => handleChange('alternate_mobile', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                    />
                  </div>

                  {/* Photo Change */}
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Update Photo
                    </label>
                    <div className="flex items-center gap-2">
                      {previewPhoto ? (
                        <img
                          src={getImageUrl(previewPhoto)}
                          alt="Preview"
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                          <UploadCloud className="w-4 h-4" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoChange}
                        disabled={isSubmitting}
                        className="text-[11px] text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer min-w-0 flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Location */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 font-mono text-[9px] font-bold flex items-center justify-center">
                    3
                  </span>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Location &amp; Address
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-100 transition-all duration-200"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      State
                    </label>
                    <select
                      value={formData.state || ''}
                      onChange={(e) => handleChange('state', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-100 transition-all duration-200 cursor-pointer text-slate-800 font-medium"
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Country
                      </label>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Fixed / Readonly</span>
                    </div>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        readOnly
                        value={formData.country || 'India'}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 text-slate-600 font-medium rounded-xl cursor-not-allowed select-none outline-none"
                        title="Country is set to India by default (read-only)"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3 min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Complete Address
                    </label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-100 transition-all duration-200 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Notes & Status */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 font-mono text-[9px] font-bold flex items-center justify-center">
                    4
                  </span>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Notes &amp; Status
                  </h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Internal Notes
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Account Status
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                          formData.status === 'active'
                            ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="edit_sales_status"
                          value="active"
                          checked={formData.status === 'active'}
                          onChange={(e) => handleChange('status', e.target.value)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                        />
                        <div className="text-xs min-w-0">
                          <span className="font-bold block">Active</span>
                          <span className="text-[10px] text-slate-500 block truncate">Field Authorized</span>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                          formData.status === 'inactive'
                            ? 'border-amber-500 bg-amber-50/60 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="edit_sales_status"
                          value="inactive"
                          checked={formData.status === 'inactive'}
                          onChange={(e) => handleChange('status', e.target.value)}
                          className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                        />
                        <div className="text-xs min-w-0">
                          <span className="font-bold block">Inactive</span>
                          <span className="text-[10px] text-slate-500 block truncate">Leave / Inactive</span>
                        </div>
                      </label>

                      <label
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                          formData.status === 'blocked'
                            ? 'border-rose-500 bg-rose-50/60 text-rose-900 ring-2 ring-rose-500/20 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="edit_sales_status"
                          value="blocked"
                          checked={formData.status === 'blocked'}
                          onChange={(e) => handleChange('status', e.target.value)}
                          className="w-4 h-4 text-rose-600 focus:ring-rose-500 cursor-pointer shrink-0"
                        />
                        <div className="text-xs min-w-0">
                          <span className="font-bold block">Blocked</span>
                          <span className="text-[10px] text-slate-500 block truncate">Suspended</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions (sticky footer) */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors disabled:opacity-50 cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
