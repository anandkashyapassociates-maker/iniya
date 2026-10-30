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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import staffManagementService from '../services/staffManagementService';

const COMMON_DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Finance & Accounts',
  'Operations',
  'Sales & Marketing',
  'Customer Support',
  'Legal & Compliance',
  'Administration',
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
    name: '',
    email: '',
    mobile: '',
    department: 'Engineering',
    designation: '',
    employment_type: 'Full-Time',
    joining_date: new Date().toISOString().split('T')[0],
    address: '',
    status: 'active',
  });

  const [previewCode, setPreviewCode] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Fetch next staff code preview
    staffManagementService
      .getPreviewCode()
      .then((res) => {
        if (res.preview_code) {
          setPreviewCode(res.preview_code);
        }
      })
      .catch(() => {
        setPreviewCode('STF-XXXX');
      });
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
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim() || null,
        department: formData.department || null,
        designation: formData.designation.trim() || null,
        employment_type: formData.employment_type || 'Full-Time',
        joining_date: formData.joining_date || null,
        address: formData.address.trim() || null,
        status: formData.status,
      });

      // Reset form on success
      setFormData({
        name: '',
        email: '',
        mobile: '',
        department: 'Engineering',
        designation: '',
        employment_type: 'Full-Time',
        joining_date: new Date().toISOString().split('T')[0],
        address: '',
        status: 'active',
      });
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
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Alert */}
      {errors.general && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Staff Code Preview Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Staff Code Auto-Generation
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                <Sparkles className="w-3 h-3" />
                Next Available
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Assigned automatically by the backend upon record creation.
            </p>
          </div>
        </div>
        <div className="px-4 py-1.5 rounded-xl bg-white border border-blue-200 text-blue-700 font-mono text-sm font-medium tracking-wider shadow-2xs">
          {previewCode || 'STF-0001'}
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Sarah Jenkins"
              disabled={isLoading}
              required
              className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
              }`}
            />
          </div>
          {errors.name && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">
              {Array.isArray(errors.name) ? errors.name[0] : errors.name}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="sarah.jenkins@company.com"
              disabled={isLoading}
              required
              className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.email
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">
              {Array.isArray(errors.email) ? errors.email[0] : errors.email}
            </p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Mobile Number
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={formData.mobile}
              onChange={(e) => handleChange('mobile', e.target.value)}
              placeholder="e.g., +1 555 432 1098"
              disabled={isLoading}
              className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.mobile
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
              }`}
            />
          </div>
          {errors.mobile && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">
              {Array.isArray(errors.mobile) ? errors.mobile[0] : errors.mobile}
            </p>
          )}
        </div>

        {/* Department */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Department
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:border-blue-600 focus:ring-blue-600/20 transition-all cursor-pointer"
            >
              {COMMON_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Designation */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Designation / Role
          </label>
          <div className="relative">
            <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => handleChange('designation', e.target.value)}
              placeholder="e.g., Lead Systems Engineer"
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:border-blue-600 focus:ring-blue-600/20 transition-all"
            />
          </div>
        </div>

        {/* Employment Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Employment Type
          </label>
          <select
            value={formData.employment_type}
            onChange={(e) => handleChange('employment_type', e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:border-blue-600 focus:ring-blue-600/20 transition-all cursor-pointer"
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Joining Date */}
        <div>
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
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:border-blue-600 focus:ring-blue-600/20 transition-all"
            />
          </div>
        </div>

        {/* Account Status */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Account Status
          </label>
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="status"
                value="active"
                checked={formData.status === 'active'}
                onChange={() => handleChange('status', 'active')}
                disabled={isLoading}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800">
                Active <span className="text-slate-400 font-normal">(In Service)</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="status"
                value="inactive"
                checked={formData.status === 'inactive'}
                onChange={() => handleChange('status', 'inactive')}
                disabled={isLoading}
                className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800">
                Inactive <span className="text-slate-400 font-normal">(On Leave / Inactive)</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Address Textarea */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Work / Residential Address
        </label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <textarea
            rows={3}
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Floor, building, street, city, postal code..."
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:border-blue-600 focus:ring-blue-600/20 transition-all resize-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
        <Link
          to={cancelPath}
          className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/20 transition-all cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Provisioning Staff...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Provision Staff</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

