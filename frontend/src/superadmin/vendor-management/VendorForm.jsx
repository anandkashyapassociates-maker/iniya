import React, { useState, useEffect } from 'react';
import {
  Building,
  User,
  Mail,
  Phone,
  FileText,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Hash,
  Sparkles,
  CreditCard,
  Layers,
  Globe,
} from 'lucide-react';
import vendorManagementService from '../services/vendorManagementService';

const VENDOR_TYPES = [
  'Supplier',
  'Manufacturer',
  'Distributor',
  'Wholesaler',
  'Service Provider',
  'Contractor',
  'Other',
];

export default function VendorForm({
  onSubmit,
  isLoading = false,
  cancelPath = '/superadmin/vendors',
}) {
  const [formData, setFormData] = useState({
    vendor_name: '',
    company_name: '',
    vendor_type: 'Supplier',
    gst_number: '',
    pan_number: '',
    email: '',
    mobile: '',
    alternate_mobile: '',
    contact_person: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    notes: '',
    status: 'active',
  });

  const [previewCode, setPreviewCode] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Fetch next vendor code preview
    vendorManagementService
      .getPreviewCode()
      .then((res) => {
        if (res.preview_code) {
          setPreviewCode(res.preview_code);
        }
      })
      .catch(() => {
        setPreviewCode('VEN-0001');
      });
  }, []);

  const handleChange = (field, value) => {
    let finalValue = value;
    if (field === 'gst_number' || field === 'pan_number') {
      finalValue = value.toUpperCase();
    }
    setFormData((prev) => ({ ...prev, [field]: finalValue }));
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

    if (!formData.vendor_name.trim()) {
      errs.vendor_name = 'Vendor name is required.';
    } else if (formData.vendor_name.trim().length < 2) {
      errs.vendor_name = 'Vendor name must be at least 2 characters.';
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

    if (formData.gst_number && formData.gst_number.trim().length > 15) {
      errs.gst_number = 'GST Number must not exceed 15 characters.';
    }

    if (formData.pan_number && formData.pan_number.trim().length > 10) {
      errs.pan_number = 'PAN Number must not exceed 10 characters.';
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
        vendor_name: formData.vendor_name.trim(),
        company_name: formData.company_name.trim() || null,
        vendor_type: formData.vendor_type || null,
        gst_number: formData.gst_number.trim() || null,
        pan_number: formData.pan_number.trim() || null,
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        alternate_mobile: formData.alternate_mobile.trim() || null,
        contact_person: formData.contact_person.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        postal_code: formData.postal_code.trim() || null,
        country: formData.country.trim() || 'India',
        notes: formData.notes.trim() || null,
        status: formData.status || 'active',
      });

      // Reset form on success
      setFormData({
        vendor_name: '',
        company_name: '',
        vendor_type: 'Supplier',
        gst_number: '',
        pan_number: '',
        email: '',
        mobile: '',
        alternate_mobile: '',
        contact_person: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
        notes: '',
        status: 'active',
      });
      setErrors({});

      // Refresh code preview
      vendorManagementService.getPreviewCode().then((res) => {
        if (res.preview_code) setPreviewCode(res.preview_code);
      });
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({
          general:
            err.response?.data?.message ||
            'Failed to create vendor. Please check all details and try again.',
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

      {/* Vendor Code Preview Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Vendor Code Auto-Generation
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
          {previewCode || 'VEN-0001'}
        </div>
      </div>

      {/* SECTION 1: BASIC INFORMATION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Building className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            1. Basic Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vendor Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Vendor Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={formData.vendor_name}
                onChange={(e) => handleChange('vendor_name', e.target.value)}
                placeholder="e.g. Apex Industrial Supplies"
                disabled={isLoading}
                required
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.vendor_name
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
            </div>
            {errors.vendor_name && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                {Array.isArray(errors.vendor_name) ? errors.vendor_name[0] : errors.vendor_name}
              </p>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Company Name <span className="text-slate-400 text-[10px] lowercase font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                placeholder="e.g. Apex Global Corp Ltd."
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
              />
            </div>
            {errors.company_name && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                {Array.isArray(errors.company_name) ? errors.company_name[0] : errors.company_name}
              </p>
            )}
          </div>

          {/* Vendor Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Vendor Type
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={formData.vendor_type}
                onChange={(e) => handleChange('vendor_type', e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
              >
                {VENDOR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            {errors.vendor_type && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                {Array.isArray(errors.vendor_type) ? errors.vendor_type[0] : errors.vendor_type}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: TAX & LEGAL IDENTIFICATION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            2. Tax & Legal Details
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GST Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              GST Number <span className="text-slate-400 text-[10px] lowercase font-normal">(unique, max 15)</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={formData.gst_number}
                onChange={(e) => handleChange('gst_number', e.target.value)}
                placeholder="27ABCDE1234F1Z5"
                maxLength={15}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-slate-50/80 text-slate-900 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.gst_number
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
            </div>
            {errors.gst_number && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                {Array.isArray(errors.gst_number) ? errors.gst_number[0] : errors.gst_number}
              </p>
            )}
          </div>

          {/* PAN Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              PAN Number <span className="text-slate-400 text-[10px] lowercase font-normal">(max 10)</span>
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={formData.pan_number}
                onChange={(e) => handleChange('pan_number', e.target.value)}
                placeholder="ABCDE1234F"
                maxLength={10}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-slate-50/80 text-slate-900 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.pan_number
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                }`}
              />
            </div>
            {errors.pan_number && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                {Array.isArray(errors.pan_number) ? errors.pan_number[0] : errors.pan_number}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: CONTACT INFORMATION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Phone className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            3. Contact Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="orders@apexsupplies.com"
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

          {/* Contact Person */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Contact Person <span className="text-slate-400 text-[10px] lowercase font-normal">(optional)</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => handleChange('contact_person', e.target.value)}
                placeholder="e.g. Ramesh Patel"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
              />
            </div>
            {errors.contact_person && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                {Array.isArray(errors.contact_person) ? errors.contact_person[0] : errors.contact_person}
              </p>
            )}
          </div>

          {/* Primary Mobile */}
          <div>
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

          {/* Alternate Mobile */}
          <div>
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
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
              />
            </div>
            {errors.alternate_mobile && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                {Array.isArray(errors.alternate_mobile) ? errors.alternate_mobile[0] : errors.alternate_mobile}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: ADDRESS & LOCATION */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <MapPin className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            4. Address & Location
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Full Address */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Street / Premise Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Building No., Industrial Area, Sector 5..."
              disabled={isLoading}
              className="w-full px-3.5 py-2 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all resize-none"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="e.g. Mumbai"
              disabled={isLoading}
              className="w-full px-3.5 py-2 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              State
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="e.g. Maharashtra"
              disabled={isLoading}
              className="w-full px-3.5 py-2 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Postal Code
            </label>
            <input
              type="text"
              value={formData.postal_code}
              onChange={(e) => handleChange('postal_code', e.target.value)}
              placeholder="e.g. 400001"
              disabled={isLoading}
              className="w-full px-3.5 py-2 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Country
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="India"
                disabled={isLoading}
                className="w-full pl-8 pr-3.5 py-2 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: NOTES & STATUS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileText className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            5. Notes & Status
          </h3>
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
              placeholder="Enter special procurement terms, vendor credibility notes, etc..."
              disabled={isLoading}
              className="w-full px-3.5 py-2 text-xs bg-slate-50/80 text-slate-900 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Initial Account Status
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/70 transition-all">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-emerald-700 block">Active</span>
                  <span className="text-[10px] text-slate-500">Fully authorized for purchase orders and billing</span>
                </div>
              </label>

              <label className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/70 transition-all">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-amber-700 block">Inactive</span>
                  <span className="text-[10px] text-slate-500">Temporarily suspended from transactions</span>
                </div>
              </label>

              <label className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/70 transition-all">
                <input
                  type="radio"
                  name="status"
                  value="blocked"
                  checked={formData.status === 'blocked'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <span className="text-xs font-bold text-rose-700 block">Blocked</span>
                  <span className="text-[10px] text-slate-500">Blacklisted from all procurement activities</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* FORM ACTIONS */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <a
          href={cancelPath}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Registering Vendor...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Register Vendor</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

