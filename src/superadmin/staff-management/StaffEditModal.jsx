import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Ban,
  Save,
  Hash,
  Lock,
  Globe,
  Compass,
  UploadCloud,
} from 'lucide-react';
import staffManagementService from '../services/staffManagementService';
import clinicManagementService from '../services/clinicManagementService';
import { useToast } from '../../context/ToastContext';
import { getImageUrl } from '../../utils/imageUrl';

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

export default function StaffEditModal({ staff, isOpen, onClose, onSuccess }) {
  const toast = useToast();

  const [formData, setFormData] = useState({
    clinic_id: '',
    name: '',
    email: '',
    password: '',
    mobile: '',
    department: '',
    designation: '',
    employment_type: 'Full-Time',
    joining_date: '',
    address: '',
    status: 'active',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load active clinics on mount
  useEffect(() => {
    clinicManagementService
      .getClinicOptions()
      .then((res) => {
        setClinics(res.clinics || []);
      })
      .catch((err) => {
        console.error('Error fetching clinics:', err);
      })
      .finally(() => {
        setIsLoadingClinics(false);
      });
  }, []);

  // Sync staff prop into form state
  useEffect(() => {
    if (staff) {
      let initialStatus = 'active';
      if (staff.status) {
        initialStatus = staff.status;
      } else if (staff.is_active === false) {
        initialStatus = 'inactive';
      }

      const initialClinicId = staff.clinic_id
        ? String(staff.clinic_id)
        : staff.clinic?.id
        ? String(staff.clinic.id)
        : '';

      setFormData({
        clinic_id: initialClinicId,
        name: staff.name || '',
        email: staff.email || '',
        password: '',
        mobile: staff.mobile || '',
        department: staff.department || '',
        designation: staff.designation || '',
        employment_type: staff.employment_type || 'Full-Time',
        joining_date: staff.joining_date ? staff.joining_date.split('T')[0] : '',
        address: staff.address || '',
        status: initialStatus,
      });
      setPreviewPhoto(staff.image_url || staff.profile_photo || staff.image || null);
      setPhotoFile(null);
      setErrors({});
    }
  }, [staff]);

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

  if (!isOpen || !staff) return null;

  // Selected clinic object for showing location/address
  const selectedClinic = clinics.find(
    (c) => String(c.id) === String(formData.clinic_id)
  ) || staff.clinic || null;

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
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email format.';
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

    if (formData.password && formData.password.trim() && formData.password.trim().length < 8) {
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
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        clinic_id: parseInt(formData.clinic_id, 10),
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim() || null,
        department: formData.department.trim() || null,
        designation: formData.designation.trim() || null,
        employment_type: formData.employment_type || 'Full-Time',
        joining_date: formData.joining_date || null,
        address: formData.address.trim() || null,
        status: formData.status,
      };

      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      let response;
      if (photoFile) {
        const formPayload = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formPayload.append(key, value);
          }
        });
        formPayload.append('profile_photo', photoFile);
        response = await staffManagementService.updateStaff(staff.id, formPayload);
      } else {
        if (!previewPhoto && (staff.profile_photo || staff.image || staff.image_url)) {
          payload.remove_photo = 1;
        }
        response = await staffManagementService.updateStaff(staff.id, payload);
      }

      toast.success(`Staff member '${formData.name}' updated successfully.`);

      if (onSuccess) {
        onSuccess(response.staff || response.data || response);
      }
      onClose();
    } catch (err) {
      console.error('Error updating staff:', err);
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const backendErrors = {};
        for (const [key, messages] of Object.entries(err.response.data.errors)) {
          backendErrors[key] = messages[0];
        }
        setErrors(backendErrors);
      } else {
        setErrors({
          general:
            err.response?.data?.message ||
            'Failed to update staff record. Please review inputs and try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={!isSubmitting ? onClose : undefined}
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-5">
        <div
          className="relative bg-white w-full max-w-3xl rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-4 sm:my-6 animate-scale-up z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-600 text-white flex items-center justify-center font-bold shrink-0 icon-3d shadow-md">
                <Hash className="w-5 h-5 drop-shadow-sm" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    Edit Staff: {staff.name}
                  </h2>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200">
                    {staff.staff_code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  Modify assigned clinic branch, professional role, or contact credentials.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0 ml-2"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Form Scrollable Body */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
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
                        {c.name} ({c.clinic_code}) {c.branch_name ? `— ${c.branch_name}` : ''} [Location: {c.location}]
                      </option>
                    ))}
                  </select>
                  {errors.clinic_id && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.clinic_id}</p>
                  )}
                </div>

                {/* Auto-populated clinic details */}
                {selectedClinic && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    <div className="min-w-0">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        Clinic / Branch
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={`${selectedClinic.name} ${selectedClinic.branch_name ? `(${selectedClinic.branch_name})` : ''}`}
                        className="w-full px-2.5 py-1.5 text-xs bg-white/90 border border-blue-200/70 rounded-lg text-slate-800 font-semibold cursor-not-allowed"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <Compass className="w-3 h-3 text-blue-500" />
                        <span>Location / Area</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={selectedClinic.location || '—'}
                        className="w-full px-2.5 py-1.5 text-xs bg-white/90 border border-blue-200/70 rounded-lg text-slate-800 font-medium cursor-not-allowed"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-blue-500" />
                        <span>City / State</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={`${selectedClinic.city || '—'}, ${selectedClinic.state || '—'}`}
                        className="w-full px-2.5 py-1.5 text-xs bg-white/90 border border-blue-200/70 rounded-lg text-slate-800 font-medium cursor-not-allowed"
                      />
                    </div>

                    <div className="min-w-0 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span>Full Clinic Address</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={selectedClinic.address || '—'}
                        className="w-full px-2.5 py-1.5 text-xs bg-white/90 border border-blue-200/70 rounded-lg text-slate-800 font-medium cursor-not-allowed"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-blue-500" />
                        <span>Clinic Contact</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={selectedClinic.phone || '—'}
                        className="w-full px-2.5 py-1.5 text-xs bg-white/90 border border-blue-200/70 rounded-lg text-slate-800 font-mono cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: PERSONAL IDENTITY */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 font-mono text-[9px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Personal Identity &amp; Contact
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                        placeholder="e.g. Dr. Ramesh Kumar"
                        disabled={isSubmitting}
                        required
                        className={`w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                          errors.name
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                            : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/15'
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-[10px] text-rose-600 mt-1 font-medium">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
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
                        disabled={isSubmitting}
                        required
                        className={`w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                          errors.email
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                            : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/15'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[10px] text-rose-600 mt-1 font-medium">{errors.email}</p>
                    )}
                  </div>

                  {/* Mobile */}
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
                        placeholder="e.g. +91 98765 43210"
                        disabled={isSubmitting}
                        className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Password (Optional update) */}
                  <div className="min-w-0">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Reset Password <span className="text-slate-400 font-normal lowercase">(min. 8 characters, or leave blank to keep current)</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        placeholder="Enter new password (min. 8 characters)"
                        disabled={isSubmitting}
                        className={`w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                          errors.password
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                            : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/15'
                        }`}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.password}</p>
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
                            src={
                              typeof previewPhoto === 'string' &&
                              (previewPhoto.startsWith('data:') || previewPhoto.startsWith('blob:') || previewPhoto.startsWith('http'))
                                ? previewPhoto
                                : getImageUrl(previewPhoto)
                            }
                            alt="Preview"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            disabled={isSubmitting}
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
                          disabled={isSubmitting}
                          className="text-xs text-slate-600 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer min-w-0 w-full"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Accepts JPG, PNG, WEBP up to 5MB.
                        </p>
                      </div>
                    </div>
                    {errors.profile_photo && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.profile_photo}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: PROFESSIONAL ROLE */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 font-mono text-[9px] font-bold flex items-center justify-center">
                    3
                  </span>
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Role &amp; Department
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Department */}
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      placeholder="e.g. Dental, Aesthetics"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all duration-200"
                    />
                  </div>

                  {/* Designation */}
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => handleChange('designation', e.target.value)}
                      placeholder="e.g. Senior Therapist"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all duration-200"
                    />
                  </div>

                  {/* Employment Type */}
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Employment
                    </label>
                    <select
                      value={formData.employment_type}
                      onChange={(e) => handleChange('employment_type', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all duration-200 cursor-pointer"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) => handleChange('joining_date', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: RESIDENTIAL ADDRESS */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Staff Personal Residential Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Personal residential address, flat, street, city..."
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all duration-200 resize-none"
                />
              </div>

              {/* SECTION 5: ACCOUNT OPERATIONAL STATUS */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Operational Account Status
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Active */}
                  <label
                    className={`relative flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
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
                        name="staff_status"
                        value="active"
                        checked={formData.status === 'active'}
                        onChange={() => handleChange('status', 'active')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Active staff member currently in clinical duty.
                    </p>
                  </label>

                  {/* Inactive */}
                  <label
                    className={`relative flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
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
                        name="staff_status"
                        value="inactive"
                        checked={formData.status === 'inactive'}
                        onChange={() => handleChange('status', 'inactive')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Deactivated, prolonged leave, or suspended.
                    </p>
                  </label>

                  {/* Blocked */}
                  <label
                    className={`relative flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
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
                        name="staff_status"
                        value="blocked"
                        checked={formData.status === 'blocked'}
                        onChange={() => handleChange('status', 'blocked')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Strictly blocked from system access.
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Sticky Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

  return createPortal(modalContent, document.body);
}
