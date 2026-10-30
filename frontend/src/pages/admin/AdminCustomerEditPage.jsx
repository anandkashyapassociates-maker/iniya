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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSaving(true);

    try {
      await adminService.updateCustomer(id, {
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email || null,
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age, 10) : null,
        address: formData.address || null,
        is_active: formData.is_active,
      });

      toast.success(`Customer '${formData.name}' updated successfully.`);
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
      <div className="py-12">
        <LoadingState message="Loading customer details..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header & Back Link */}
      <div>
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customer Directory</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Edit Customer Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Update personal information, contact credentials, or status for this customer.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-rose-500">*</span>
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
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">
                {Array.isArray(errors.name) ? errors.name[0] : errors.name}
              </p>
            )}
          </div>

          {/* Grid: Mobile & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                  className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.mobile
                      ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900'
                  }`}
                />
              </div>
              {errors.mobile && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">
                  {Array.isArray(errors.mobile) ? errors.mobile[0] : errors.mobile}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="customer@example.com"
                  disabled={isSaving}
                  className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">
                  {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Grid: Gender & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-medium"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">
                  {Array.isArray(errors.gender) ? errors.gender[0] : errors.gender}
                </p>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Age (Years) <span className="text-slate-400 font-normal">(Optional)</span>
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
                  className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.age
                      ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900'
                  }`}
                />
              </div>
              {errors.age && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">
                  {Array.isArray(errors.age) ? errors.age[0] : errors.age}
                </p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Address <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                placeholder="House/Plot no., Street, City, State, PIN code..."
                disabled={isSaving}
                className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.address
                    ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900'
                }`}
              />
            </div>
            {errors.address && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">
                {Array.isArray(errors.address) ? errors.address[0] : errors.address}
              </p>
            )}
          </div>

          {/* Active Status Checkbox */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              disabled={isSaving}
              className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
              Account Active Status
            </label>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/admin/customers"
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Customer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
