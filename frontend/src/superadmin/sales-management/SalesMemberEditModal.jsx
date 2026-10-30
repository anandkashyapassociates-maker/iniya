import React, { useState, useEffect } from 'react';
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
  FileText,
  Globe,
  UploadCloud,
  Layers,
  Compass,
} from 'lucide-react';
import salesMemberManagementService from '../services/salesMemberManagementService';
import { useToast } from '../../context/ToastContext';

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
    name: '',
    email: '',
    mobile: '',
    alternate_mobile: '',
    gender: 'Male',
    designation: '',
    department: 'Enterprise Sales',
    employment_type: 'Full-Time',
    joining_date: '',
    territory: 'North Zone',
    city: '',
    state: '',
    country: 'India',
    address: '',
    notes: '',
    status: 'active',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        email: member.email || '',
        mobile: member.mobile || '',
        alternate_mobile: member.alternate_mobile || '',
        gender: member.gender || 'Male',
        designation: member.designation || '',
        department: member.department || 'Enterprise Sales',
        employment_type: member.employment_type || 'Full-Time',
        joining_date: member.joining_date ? member.joining_date.split('T')[0] : '',
        territory: member.territory || 'North Zone',
        city: member.city || '',
        state: member.state || '',
        country: member.country || 'India',
        address: member.address || '',
        notes: member.notes || '',
        status: member.status || 'active',
      });
      setPreviewPhoto(member.profile_photo || null);
      setPhotoFile(null);
      setErrors({});
    }
  }, [member]);

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
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, profile_photo: 'Please select a valid image file.' }));
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, profile_photo: 'File size must not exceed 2MB.' }));
        return;
      }
      setPhotoFile(file);
      setPreviewPhoto(URL.createObjectURL(file));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.profile_photo;
        return next;
      });
    }
  };

  const validate = () => {
    const errs = {};

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
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        alternate_mobile: formData.alternate_mobile.trim() || null,
        gender: formData.gender || null,
        designation: formData.designation.trim() || null,
        department: formData.department || null,
        employment_type: formData.employment_type || null,
        joining_date: formData.joining_date || null,
        territory: formData.territory || null,
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={!isSubmitting ? onClose : undefined}
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Edit Sales Member Profile
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 text-blue-700">
                    <Lock className="w-3 h-3" />
                    {member.sales_code}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Sales code is immutable for auditing and transaction attribution.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errors.general && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* 1. Basic Info */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                1. Basic Info
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.name
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-[10px] text-rose-600 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.email
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-[10px] text-rose-600 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Mobile <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => handleChange('mobile', e.target.value)}
                    required
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.mobile
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'
                    }`}
                  />
                  {errors.mobile && (
                    <p className="text-[10px] text-rose-600 mt-1">{errors.mobile}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alternate Mobile
                  </label>
                  <input
                    type="text"
                    value={formData.alternate_mobile}
                    onChange={(e) => handleChange('alternate_mobile', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Update Profile Photo
                  </label>
                  <div className="flex items-center gap-2">
                    {previewPhoto && (
                      <img
                        src={previewPhoto.startsWith('blob:') || previewPhoto.startsWith('http') ? previewPhoto : `/storage/${previewPhoto}`}
                        alt="Photo"
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={isSubmitting}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:bg-slate-100 file:font-semibold hover:file:bg-slate-200 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Employment Info */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                2. Employment Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => handleChange('designation', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => handleChange('employment_type', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Territory
                  </label>
                  <select
                    value={formData.territory}
                    onChange={(e) => handleChange('territory', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                  >
                    {TERRITORIES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => handleChange('joining_date', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 3. Location Details */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                3. Location Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. Notes & Account Status */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                4. Notes & Account Status
              </h4>
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Account Status
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.status === 'active'
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="edit_sales_status"
                        value="active"
                        checked={formData.status === 'active'}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold block">Active</span>
                        <span className="text-[10px] text-slate-500">Authorized for operations</span>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.status === 'inactive'
                          ? 'border-amber-500 bg-amber-50/50 text-amber-900 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="edit_sales_status"
                        value="inactive"
                        checked={formData.status === 'inactive'}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold block">Inactive</span>
                        <span className="text-[10px] text-slate-500">Temporarily on leave</span>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.status === 'blocked'
                          ? 'border-rose-500 bg-rose-50/50 text-rose-900 ring-2 ring-rose-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="edit_sales_status"
                        value="blocked"
                        checked={formData.status === 'blocked'}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="w-4 h-4 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold block">Blocked</span>
                        <span className="text-[10px] text-slate-500">Suspended</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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
    </div>
  );
}

