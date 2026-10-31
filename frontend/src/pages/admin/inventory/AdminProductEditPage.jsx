import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Boxes,
  Plus,
  Tag,
  Bookmark,
  UploadCloud,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  HelpCircle,
  UserCheck,
  Calendar,
} from 'lucide-react';
import adminInventoryService from '../../../services/adminInventoryService';
import LoadingState from '../../../components/LoadingState';
import { useToast } from '../../../context/ToastContext';

export default function AdminProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    category_id: '',
    brand_id: '',
    product_name: '',
    business_unit: 'Piece',
    product_unit: 1,
    product_type: 'Consumable',
    custom_product_type: '',
    status: 'active',
  });

  const [creatorAdmin, setCreatorAdmin] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commonBusinessUnits = [
    'Piece',
    'Box',
    'Packet',
    'Bottle',
    'Vial',
    'Ampoule',
    'Strip',
    'Roll',
    'Tube',
    'Kg',
    'Litre',
    'Set',
  ];

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [cats, brs, prod] = await Promise.all([
          adminInventoryService.getCategoryDropdown(),
          adminInventoryService.getBrandDropdown(),
          adminInventoryService.getProduct(id),
        ]);
        setCategories(cats || []);
        setBrands(brs || []);

        setFormData({
          category_id: String(prod.category_id || ''),
          brand_id: String(prod.brand_id || ''),
          product_name: prod.product_name || '',
          business_unit: prod.business_unit || 'Piece',
          product_unit: prod.product_unit || 1,
          product_type: prod.product_type || 'Consumable',
          custom_product_type: prod.custom_product_type || '',
          status: prod.status || 'active',
        });
        setCreatorAdmin(prod.creator);
        setCreatedAt(prod.created_at);

        if (prod.image_url) {
          setExistingImage(prod.image_url);
          setImagePreview(prod.image_url);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load product details.');
        navigate('/admin/inventory/products');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageFile = (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        product_image: 'Please select a valid image file (JPG, JPEG, PNG, or WEBP).',
      }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        product_image: 'Image file size cannot exceed 5MB.',
      }));
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
    if (errors.product_image) {
      setErrors((prev) => ({ ...prev, product_image: null }));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const errs = {};
    if (!formData.category_id) errs.category_id = 'Category is required.';
    if (!formData.product_name?.trim()) errs.product_name = 'Product name is required.';
    if (!formData.business_unit?.trim()) errs.business_unit = 'Please select a business unit.';
    if (formData.product_unit === '' || formData.product_unit === null || isNaN(formData.product_unit) || parseInt(formData.product_unit, 10) < 1) {
      errs.product_unit = 'Please enter a valid positive integer unit (e.g. 1, 10).';
    }
    if (!formData.product_type) errs.product_type = 'Product type is required.';
    if (formData.product_type === 'Other' && !formData.custom_product_type?.trim()) {
      errs.custom_product_type = 'Please specify the custom product type.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = new FormData();
      payload.append('category_id', formData.category_id);
      if (formData.brand_id) payload.append('brand_id', formData.brand_id);
      payload.append('product_name', formData.product_name.trim());
      payload.append('business_unit', formData.business_unit.trim());
      payload.append('product_unit', parseInt(formData.product_unit, 10) || 1);
      payload.append('product_type', formData.product_type);
      if (formData.product_type === 'Other' && formData.custom_product_type) {
        payload.append('custom_product_type', formData.custom_product_type.trim());
      }
      payload.append('status', formData.status);
      if (imageFile) {
        payload.append('product_image', imageFile);
      } else if (removeImage) {
        payload.append('remove_image', '1');
      }

      const res = await adminInventoryService.updateProduct(id, payload);
      toast.success(res.message || `Product '${formData.product_name}' updated successfully.`);
      navigate('/admin/inventory/products');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to update product.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading product record..." />;
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <Link
            to="/admin/inventory/products"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products Directory</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-medium">
              <Boxes className="w-3.5 h-3.5 text-blue-600" />
              <span>Inventory Registry</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-normal mt-1.5">
            Edit Inventory Product
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Update clinical specifications, unit packaging, and categorized stock identification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/inventory/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium transition-all shadow-sm shadow-blue-500/20"
          >
            <Package className="w-3.5 h-3.5" />
            <span>View Products</span>
          </Link>
        </div>
      </div>

      {/* Creator Attribution Banner */}
      {creatorAdmin && (
        <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-medium text-sm shadow-xs shrink-0">
              {creatorAdmin.name ? creatorAdmin.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Original Creator: <strong className="font-semibold text-blue-700">{creatorAdmin.name}</strong></span>
              </div>
              <div className="text-[11px] text-slate-500 font-normal">
                {creatorAdmin.email}
              </div>
            </div>
          </div>
          {createdAt && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-normal self-start sm:self-center">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Enrolled on {new Date(createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Form Card (col-12) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 lg:p-9 shadow-xs relative overflow-hidden">
        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          {/* SECTION 1: CLASSIFICATION */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Layers className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-medium text-slate-800 tracking-wide uppercase">
                1. Product Classification
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Select Category <span className="text-rose-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className={`w-full px-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all font-normal ${
                    errors.category_id
                      ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                      : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                  }`}
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-normal flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{Array.isArray(errors.category_id) ? errors.category_id[0] : errors.category_id}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Select Brand <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  name="brand_id"
                  value={formData.brand_id}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all font-normal ${
                    errors.brand_id
                      ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                      : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                  }`}
                >
                  <option value="">Choose a brand (or Generic)...</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {errors.brand_id && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-normal flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{Array.isArray(errors.brand_id) ? errors.brand_id[0] : errors.brand_id}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: PRODUCT IMAGE */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-medium text-slate-800 tracking-wide uppercase">
                2. Product Image
              </h2>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Product Photo / Specimen Image <span className="text-slate-400 font-normal">(Optional)</span>
              </label>

              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center text-center">
                {imagePreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-md">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <label className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Change Image</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={(e) => handleImageFile(e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-medium text-slate-700">
                      Upload product photo, or{' '}
                      <label className="text-blue-600 hover:underline cursor-pointer">
                        browse files
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          onChange={(e) => handleImageFile(e.target.files?.[0])}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
              {errors.product_image && (
                <p className="text-[11px] text-rose-500 mt-1.5 font-normal flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{Array.isArray(errors.product_image) ? errors.product_image[0] : errors.product_image}</span>
                </p>
              )}
            </div>
          </div>

          {/* SECTION 3: SPECIFICATIONS */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Package className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-medium text-slate-800 tracking-wide uppercase">
                3. Specifications &amp; Operational Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className={`w-full px-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all font-normal ${
                    errors.product_name
                      ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                      : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                  }`}
                />
                {errors.product_name && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-normal flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{Array.isArray(errors.product_name) ? errors.product_name[0] : errors.product_name}</span>
                  </p>
                )}
              </div>

              {/* FIELD 5: Business Unit & Product Unit (Group Input in col-6) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Business Unit &amp; Product Unit <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Packaging / Count</span>
                </div>

                <div
                  className={`flex items-center rounded-2xl border bg-slate-50/80 transition-all overflow-hidden focus-within:bg-white focus-within:ring-2 ${
                    errors.business_unit || errors.product_unit
                      ? 'border-rose-400 focus-within:ring-rose-500/20'
                      : 'border-slate-200 focus-within:border-blue-600 focus-within:ring-blue-500/20'
                  }`}
                >
                  {/* Select Dropdown for Business Unit */}
                  <div className="w-7/12 min-w-0 border-r border-slate-200/90">
                    <select
                      name="business_unit"
                      value={formData.business_unit}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      required
                      className="w-full px-3.5 py-2.5 text-xs bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-900 cursor-pointer font-normal truncate"
                    >
                      <option value="">Select Unit (Piece, Box...)</option>
                      {commonBusinessUnits.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Integer Input for Product Unit */}
                  <div className="w-5/12 min-w-0 flex items-center bg-white/70 px-3">
                    <span className="text-[11px] text-slate-400 mr-2 shrink-0 select-none">Qty:</span>
                    <input
                      type="number"
                      name="product_unit"
                      min="1"
                      step="1"
                      value={formData.product_unit}
                      onChange={handleChange}
                      placeholder="1"
                      disabled={isSubmitting}
                      required
                      className="w-full py-2.5 text-xs bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-900 font-medium"
                    />
                  </div>
                </div>

                {(errors.business_unit || errors.product_unit) && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-normal flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.business_unit || errors.product_unit}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Product Type <span className="text-rose-500">*</span>
                </label>
                <select
                  name="product_type"
                  value={formData.product_type}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className="w-full px-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 text-slate-900 font-normal"
                >
                  <option value="Consumable">Consumable</option>
                  <option value="Retail">Retail</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Service">Service</option>
                  <option value="Other">Other (Custom Type)</option>
                </select>
              </div>

              {formData.product_type === 'Other' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Specify Custom Product Type <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="custom_product_type"
                    value={formData.custom_product_type}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                    className="w-full px-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 text-slate-900 font-normal"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Status <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${
                      formData.status === 'active'
                        ? 'bg-blue-50/70 border-blue-500/80 text-blue-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        formData.status === 'active'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {formData.status === 'active' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-xs">Active</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${
                      formData.status === 'inactive'
                        ? 'bg-rose-50/70 border-rose-500/80 text-rose-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        formData.status === 'inactive'
                          ? 'border-rose-600 bg-rose-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {formData.status === 'inactive' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-xs">Inactive</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/admin/inventory/products"
              className="w-full sm:w-auto text-center px-6 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-medium transition-all shadow-md shadow-blue-500/25 hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating Product...</span>
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  <span>Update Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

