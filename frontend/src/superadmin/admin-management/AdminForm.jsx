import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminForm({
  onSubmit,
  isLoading = false,
  cancelPath = '/superadmin/admin-management/details',
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    password_confirmation: '',
    is_active: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const calculateStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = calculateStrength(formData.password);

  const validateFrontend = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email format (e.g., admin@company.com).';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required.';
    } else if (!/^(\+?\d{1,4}[-.\s]?)?(\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}$/.test(formData.mobile.trim()) || formData.mobile.replace(/\D/g, '').length < 7) {
      newErrors.mobile = 'Please enter a valid mobile number (min 7 digits).';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Please confirm the password.';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const clientErrors = validateFrontend();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        is_active: formData.is_active,
      });

      // Reset form on success
      setFormData({
        name: '',
        email: '',
        mobile: '',
        password: '',
        password_confirmation: '',
        is_active: true,
      });
      setErrors({});
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setErrors({ general: err.response.data.message });
      } else {
        setErrors({ general: 'Failed to create admin account. Please check your network and try again.' });
      }
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* General Server Error Banner */}
      {errors.general && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Full Name */}
        <div className="md:col-span-2">
          <label htmlFor="admin-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="admin-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Rajesh Kumar"
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
          <label htmlFor="admin-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="admin-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="admin@company.com"
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
          <label htmlFor="admin-mobile" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Mobile Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="admin-mobile"
              type="tel"
              value={formData.mobile}
              onChange={(e) => handleChange('mobile', e.target.value)}
              placeholder="+91 98765 43210"
              disabled={isLoading}
              required
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

        {/* Password */}
        <div>
          <label htmlFor="admin-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Initial Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Minimum 8 characters"
              disabled={isLoading}
              required
              className={`w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/80 text-slate-900 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.password
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">
              {Array.isArray(errors.password) ? errors.password[0] : errors.password}
            </p>
          )}

          {/* Strength Meter */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex gap-1 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full transition-all ${strength >= 1 ? 'w-1/4 bg-rose-500' : 'w-0'}`} />
                <div className={`h-full transition-all ${strength >= 2 ? 'w-1/4 bg-amber-500' : 'w-0'}`} />
                <div className={`h-full transition-all ${strength >= 3 ? 'w-1/4 bg-blue-500' : 'w-0'}`} />
                <div className={`h-full transition-all ${strength >= 4 ? 'w-1/4 bg-emerald-500' : 'w-0'}`} />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Strength: {strength <= 1 ? 'Weak' : strength === 2 ? 'Moderate' : strength === 3 ? 'Strong' : 'Very Strong'}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="admin-password-confirmation" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Confirm Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="admin-password-confirmation"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.password_confirmation}
              onChange={(e) => handleChange('password_confirmation', e.target.value)}
              placeholder="Re-enter matching password"
              disabled={isLoading}
              required
              className={`w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/80 text-slate-900 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.password_confirmation
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password_confirmation && (
            <p className="text-[11px] text-rose-600 mt-1 font-medium">
              {Array.isArray(errors.password_confirmation) ? errors.password_confirmation[0] : errors.password_confirmation}
            </p>
          )}
        </div>
      </div>

      {/* Account Status Radio / Switch */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Account Status
        </label>
        <div className="flex flex-wrap items-center gap-6 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="is_active"
              checked={formData.is_active === true}
              onChange={() => handleChange('is_active', true)}
              disabled={isLoading}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-800">
              Active <span className="text-slate-400 font-normal">(Authorized to log into Panel 2)</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="is_active"
              checked={formData.is_active === false}
              onChange={() => handleChange('is_active', false)}
              disabled={isLoading}
              className="w-4 h-4 text-slate-600 focus:ring-slate-500 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-800">
              Inactive <span className="text-slate-400 font-normal">(Account suspended upon creation)</span>
            </span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
        <Link
          to={cancelPath}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-center cursor-pointer"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 shadow-md shadow-slate-900/20 focus:outline-none focus:ring-2 focus:ring-slate-900/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving Administrator Account...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Save Admin Account</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

