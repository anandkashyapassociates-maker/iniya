import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Camera,
  UploadCloud,
  Trash2,
  Stethoscope,
  ShieldCheck,
  HeartPulse,
  Activity,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function AdminCustomerCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    gender: 'male',
    age: '',
    address: '',
    is_active: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleGenderSelect = (genderVal) => {
    setFormData((prev) => ({ ...prev, gender: genderVal }));
    if (errors.gender) {
      setErrors((prev) => ({ ...prev, gender: null }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, image: 'Please select a valid image file (JPG, PNG, WEBP).' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'Image size cannot exceed 5MB.' }));
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      if (errors.image) setErrors((prev) => ({ ...prev, image: null }));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    if (!formData.name?.trim()) {
      setErrors({ name: 'Full name is required.' });
      setIsLoading(false);
      return;
    }

    if (!formData.mobile?.trim()) {
      setErrors({ mobile: 'Mobile number is required.' });
      setIsLoading(false);
      return;
    }

    if (!formData.age) {
      setErrors({ age: 'Age is required.' });
      setIsLoading(false);
      return;
    }

    if (!formData.address || !formData.address.trim()) {
      setErrors({ address: 'Address is required.' });
      setIsLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('mobile', formData.mobile.trim());
      if (formData.email?.trim()) {
        data.append('email', formData.email.trim());
      }
      data.append('gender', formData.gender);
      data.append('age', formData.age);
      data.append('address', formData.address.trim());
      data.append('is_active', formData.is_active ? '1' : '0');
      if (imageFile) {
        data.append('image', imageFile);
      }

      await adminService.createCustomer(data);

      toast.success(`Patient / Customer profile '${formData.name}' created successfully.`);
      navigate('/admin/customers');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to create customer record.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Navigation & Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <Link
            to="/admin/customers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Patient & Customer Directory</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Clinic Registration Portal</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              OPD Patient Desk
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            New Patient / Customer Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Enroll patient demographics, upload medical profile photo, and save official clinic contact records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/customers"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all shadow-2xs"
          >
            View Directory
          </Link>
        </div>
      </div>

      {/* Main Full-Width Card (col-12) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 lg:p-9 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <form onSubmit={handleSubmit} className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column (col-12 lg:col-span-4): Patient Photo & Live Clinical Preview */}
            <div className="lg:col-span-4 space-y-6">
              {/* Photo Upload Box */}
              <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Patient Photo</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-full bg-slate-200/60">
                    Optional
                  </span>
                </div>

                <div className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-dashed border-slate-200">
                  {/* Photo Preview / Placeholder */}
                  <div className="relative group shrink-0 mb-3">
                    {imagePreview ? (
                      <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-md">
                        <img
                          src={imagePreview}
                          alt="Patient Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-slate-100 to-blue-50/50 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-8 h-8 mb-1 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">No Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="w-full space-y-2">
                    <input
                      type="file"
                      id="customer_image_input"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleImageChange}
                      disabled={isLoading}
                      className="sr-only"
                    />
                    <label
                      htmlFor="customer_image_input"
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-blue-600" />
                      <span>{imagePreview ? 'Change Photo' : 'Upload Patient Photo'}</span>
                    </label>

                    <p className="text-[10px] text-slate-400">
                      JPG, PNG, WEBP (Max 5MB)
                    </p>

                    {errors.image && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1">
                        {Array.isArray(errors.image) ? errors.image[0] : errors.image}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Patient Medical Card Preview */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span className="text-[11px] font-black tracking-wider uppercase text-slate-300">
                      Clinic OPD Card Preview
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    NEW RECORD
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-700/70 overflow-hidden flex items-center justify-center font-bold text-base text-white border border-slate-600 shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      formData.name?.charAt(0).toUpperCase() || 'P'
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white truncate">
                      {formData.name || 'Patient Full Name'}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 capitalize mt-0.5">
                      <span>{formData.gender}</span>
                      <span>•</span>
                      <span>{formData.age ? `${formData.age} Yrs` : 'Age pending'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/80 text-[11px]">
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Contact</div>
                    <div className="text-slate-200 font-mono font-medium truncate mt-0.5">
                      {formData.mobile || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Clearance</div>
                    <div className="mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                          formData.is_active
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-600/30 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            formData.is_active ? 'bg-emerald-400' : 'bg-slate-400'
                          }`}
                        />
                        {formData.is_active ? 'Active OPD' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Guidelines Notice */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 text-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Clinic OPD Protocol</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Patient name, mobile number, age, and complete residential address are required for electronic health records, prescriptions, and legal audit verification.
                </p>
              </div>
            </div>

            {/* Right Column (col-12 lg:col-span-8): Registration Fields */}
            <div className="lg:col-span-8 space-y-6">
              {/* Section 1: Demographics */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <User className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    1. Patient Personal Demographics
                  </h2>
                </div>

                {/* Patient Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Patient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Ramesh Kumar / Ananya Sharma"
                      disabled={isLoading}
                      required
                      className={`w-full pl-10 pr-4 py-3 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                        errors.name
                          ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                          : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[11px] text-rose-500 mt-1.5 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{Array.isArray(errors.name) ? errors.name[0] : errors.name}</span>
                    </p>
                  )}
                </div>

                {/* Grid: Gender & Age */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  {/* Gender Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'male', label: 'Male', emoji: '👨' },
                        { key: 'female', label: 'Female', emoji: '👩' },
                        { key: 'other', label: 'Other', emoji: '🧑' },
                      ].map((g) => (
                        <button
                          key={g.key}
                          type="button"
                          onClick={() => handleGenderSelect(g.key)}
                          disabled={isLoading}
                          className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                            formData.gender === g.key
                              ? g.key === 'female'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                : g.key === 'other'
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{g.emoji}</span>
                          <span>{g.label}</span>
                        </button>
                      ))}
                    </div>
                    {errors.gender && (
                      <p className="text-[11px] text-rose-500 mt-1.5 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{Array.isArray(errors.gender) ? errors.gender[0] : errors.gender}</span>
                      </p>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Patient Age (Years) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        name="age"
                        min="1"
                        max="130"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="e.g. 32"
                        disabled={isLoading}
                        required
                        className={`w-full pl-10 pr-4 py-3 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                          errors.age
                            ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                            : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                        }`}
                      />
                    </div>
                    {errors.age && (
                      <p className="text-[11px] text-rose-500 mt-1.5 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{Array.isArray(errors.age) ? errors.age[0] : errors.age}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Channels */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    2. Primary Contact &amp; Communication
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="e.g. 9876543210"
                        disabled={isLoading}
                        required
                        className={`w-full pl-10 pr-4 py-3 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                          errors.mobile
                            ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                            : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                        }`}
                      />
                    </div>
                    {errors.mobile && (
                      <p className="text-[11px] text-rose-500 mt-1.5 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{Array.isArray(errors.mobile) ? errors.mobile[0] : errors.mobile}</span>
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Email Address <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="patient@example.com"
                        disabled={isLoading}
                        className={`w-full pl-10 pr-4 py-3 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                          errors.email
                            ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                            : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] text-rose-500 mt-1.5 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{Array.isArray(errors.email) ? errors.email[0] : errors.email}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Residential Address */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    3. Residential Address
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Full Address &amp; Location <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <textarea
                      name="address"
                      rows="3"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="House/Plot No., Street/Colony, Landmark, City, District, PIN code..."
                      disabled={isLoading}
                      required
                      className={`w-full pl-10 pr-4 py-3 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all leading-relaxed ${
                        errors.address
                          ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                          : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                      }`}
                    />
                  </div>
                  {errors.address && (
                    <p className="text-[11px] text-rose-500 mt-1.5 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{Array.isArray(errors.address) ? errors.address[0] : errors.address}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Section 4: Clinical Status & OPD Clearance */}
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Record Clearance &amp; OPD Eligibility
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Enable to allow immediate doctor consultations, billing, and lab prescriptions.
                    </div>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Actions Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-5 border-t border-slate-100">
                <Link
                  to="/admin/customers"
                  className="w-full sm:w-auto text-center px-6 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Registering Patient...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Register Patient Record</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
