import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Save,
  ShieldCheck,
  Stethoscope,
  Camera,
  UploadCloud,
  Trash2,
} from 'lucide-react';
import LoadingState from '../../components/LoadingState';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function AdminCustomerEditPage() {
  const { id } = useParams();
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
  const [removeImage, setRemoveImage] = useState(false);

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const data = await adminService.getCustomer(id);
        setFormData({
          name: data.name || '',
          mobile: data.mobile || '',
          email: data.email || '',
          gender: data.gender || 'male',
          age: data.age ? String(data.age) : '',
          address: data.address || '',
          is_active: Boolean(data.is_active),
        });

        if (data.image_url) {
          setImagePreview(data.image_url);
        }
      } catch (err) {
        toast.error('Failed to load customer profile.');
        navigate('/admin/customers');
      } finally {
        setIsFetching(false);
      }
    };

    fetchCustomer();
  }, [id, navigate, toast]);

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
      setRemoveImage(false);
      if (errors.image) setErrors((prev) => ({ ...prev, image: null }));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSaving(true);

    if (!formData.name?.trim()) {
      setErrors({ name: 'Full name is required.' });
      setIsSaving(false);
      return;
    }

    if (!formData.mobile?.trim()) {
      setErrors({ mobile: 'Mobile number is required.' });
      setIsSaving(false);
      return;
    }

    if (!formData.age) {
      setErrors({ age: 'Age is required.' });
      setIsSaving(false);
      return;
    }

    if (!formData.address || !formData.address.trim()) {
      setErrors({ address: 'Address is required.' });
      setIsSaving(false);
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
      } else if (removeImage) {
        data.append('remove_image', '1');
      }

      await adminService.updateCustomer(id, data);

      toast.success(`Customer profile '${formData.name}' updated successfully.`);
      navigate('/admin/customers');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to update customer.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return (
      <div className="py-16">
        <LoadingState message="Retrieving customer record..." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Navigation & Header */}
      <div>
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customer Directory</span>
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
            <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
            <span>Profile Modification</span>
          </span>
          <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            REC-{String(id).padStart(4, '0')}
          </span>
        </div>
        <h1 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight">
          Edit Customer Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Update verified demographic credentials, photo, contact info, and clearance status.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-9 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Section 1: Demographics & Photo */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold font-display text-slate-800 uppercase tracking-wider">
                1. Personal Demographics &amp; Photo
              </h2>
            </div>

            {/* Photo Upload (Optional) */}
            <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Customer Photo <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Photo Preview / Placeholder */}
                <div className="relative group shrink-0">
                  {imagePreview ? (
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-sm">
                      <img
                        src={imagePreview}
                        alt="Customer preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600/90 text-white hover:bg-rose-700 transition-colors shadow-xs"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-slate-200/80 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                      <Camera className="w-6 h-6 mb-1 text-slate-400" />
                      <span className="text-[9px] font-semibold">No Photo</span>
                    </div>
                  )}
                </div>

                {/* Upload Action */}
                <div className="flex-1 w-full space-y-1.5">
                  <div className="relative">
                    <input
                      type="file"
                      id="customer_image_edit"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleImageChange}
                      disabled={isSaving}
                      className="sr-only"
                    />
                    <label
                      htmlFor="customer_image_edit"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-blue-600" />
                      <span>{imagePreview ? 'Change Photo' : 'Upload Customer Photo'}</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Supported formats: JPG, PNG, WEBP. Maximum file size: 5MB.
                  </p>
                  {errors.image && (
                    <p className="text-[11px] text-rose-500 font-medium">
                      {Array.isArray(errors.image) ? errors.image[0] : errors.image}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Kumar"
                  disabled={isSaving}
                  required
                  className={`w-full pl-10 pr-4 py-3 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                      : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-rose-500 mt-1.5 font-medium">
                  {Array.isArray(errors.name) ? errors.name[0] : errors.name}
                </p>
              )}
            </div>

            {/* Grid: Gender & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              {/* Gender Interactive Selector */}
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
                      disabled={isSaving}
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
                  <p className="text-[11px] text-rose-500 mt-1.5 font-medium">
                    {Array.isArray(errors.gender) ? errors.gender[0] : errors.gender}
                  </p>
                )}
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Age (Years) <span className="text-rose-500">*</span>
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
                    placeholder="e.g. 28"
                    disabled={isSaving}
                    required
                    className={`w-full pl-10 pr-4 py-3 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                      errors.age
                        ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                        : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                    }`}
                  />
                </div>
                {errors.age && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-medium">
                    {Array.isArray(errors.age) ? errors.age[0] : errors.age}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Contact Details */}
          <div className="space-y-4 pt-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Phone className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold font-display text-slate-800 uppercase tracking-wider">
                2. Contact &amp; Communication Channels
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
                    disabled={isSaving}
                    required
                    className={`w-full pl-10 pr-4 py-3 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                      errors.mobile
                        ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                        : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                    }`}
                  />
                </div>
                {errors.mobile && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-medium">
                    {Array.isArray(errors.mobile) ? errors.mobile[0] : errors.mobile}
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
                    placeholder="customer@domain.com"
                    disabled={isSaving}
                    className={`w-full pl-10 pr-4 py-3 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
                      errors.email
                        ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                        : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-medium">
                    {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Address Details */}
          <div className="space-y-4 pt-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold font-display text-slate-800 uppercase tracking-wider">
                3. Residential &amp; Clinic Location
              </h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Postal / Residential Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <textarea
                  name="address"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Flat/House No., Street address, City, District, State, PIN code..."
                  disabled={isSaving}
                  required
                  className={`w-full pl-10 pr-4 py-3 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all leading-relaxed ${
                    errors.address
                      ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                      : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                  }`}
                />
              </div>
              {errors.address && (
                <p className="text-[11px] text-rose-500 mt-1.5 font-medium">
                  {Array.isArray(errors.address) ? errors.address[0] : errors.address}
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Status Clearance */}
          <div className="pt-3">
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Record Activation Status
                  </div>
                  <div className="text-[11px] text-slate-500">
                    When active, this profile is eligible for appointments, services, and reports.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <Link
              to="/admin/customers"
              className="px-5 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
