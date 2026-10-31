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
import { useAdminAuth } from '../../../features/auth/AdminAuthContext';

export default function AdminProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAdminAuth();
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

        if (prod.created_by_admin_id && user?.id && Number(prod.created_by_admin_id) !== Number(user.id)) {
          toast.error('Unauthorized: You can only edit products created by you.');
          navigate('/admin/inventory/products');
          return;
        }
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length) {
      handleImageFile(files[0]);
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
    <div className="w-full space-y-7 animate-in fade-in duration-300">
      {/* Top Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <Link
            to="/admin/inventory/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold font-display text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products Directory</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold font-display">
              <Boxes className="w-3.5 h-3.5 text-blue-600" />
              <span>Inventory Registry</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight mt-1.5">
            Edit Inventory Product
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Update clinical specifications, unit packaging, and categorized stock identification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/inventory/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold font-display shadow-md shadow-blue-500/20 hover:shadow-lg transition-all active:scale-98"
          >
            <Package className="w-4 h-4" />
            <span>View Products</span>
          </Link>
        </div>
      </div>

      {/* Main Full-Width Form Card (col-12) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 lg:p-9 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <form onSubmit={handleSubmit} className="relative z-10 space-y-7">
          {/* Creator Attribution Info Card */}
          {creatorAdmin && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {creatorAdmin.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{creatorAdmin.name}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      Catalog Author
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block">{creatorAdmin.email}</span>
                </div>
              </div>
              {createdAt && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Enrolled:{' '}
                    {new Date(createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* SECTION 1: CLASSIFICATION (Category & Brand) */}
          <div className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 icon-3d">
                <Layers className="w-4 h-4 drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase micro-label">
                  1. Product Classification
                </h2>
                <p className="text-[11px] text-slate-400 font-normal">
                  Assign clinical category tiers and certified manufacturing brand.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* FIELD 1: Select Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Category <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                    className={`w-full px-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all font-normal text-slate-900 ${
                      errors.category_id
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20'
                    }`}
                  >
                    <option value="">Choose a product category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.category_id && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-normal flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{Array.isArray(errors.category_id) ? errors.category_id[0] : errors.category_id}</span>
                  </p>
                )}
              </div>

              {/* FIELD 2: Select Brand */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Brand <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <select
                    name="brand_id"
                    value={formData.brand_id}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all font-normal text-slate-900 ${
                      errors.brand_id
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20'
                    }`}
                  >
                    <option value="">Choose a brand (or Generic)...</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.brand_id && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-normal flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{Array.isArray(errors.brand_id) ? errors.brand_id[0] : errors.brand_id}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: PRODUCT IMAGE & MEDIA */}
          <div className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 icon-3d">
                <UploadCloud className="w-4 h-4 drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase micro-label">
                  2. Product Specimen Media
                </h2>
                <p className="text-[11px] text-slate-400 font-normal">
                  Update high resolution specimen image for packaging verification.
                </p>
              </div>
            </div>

            {/* FIELD 3: Product Image */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Product Photo / Specimen Image <span className="text-slate-400 font-normal">(Optional)</span>
              </label>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-7 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50 shadow-inner'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {imagePreview ? (
                  <div className="flex flex-col items-center gap-3.5">
                    <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-md">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold font-display border border-blue-200/80 cursor-pointer hover:bg-blue-100 transition-all shadow-2xs">
                      <UploadCloud className="w-4 h-4" />
                      <span>Replace Image</span>
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
                  <div className="space-y-2.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-200/70 text-blue-600 flex items-center justify-center mx-auto shadow-2xs icon-3d">
                      <UploadCloud className="w-7 h-7 drop-shadow-sm" />
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      Drag &amp; drop product photo here, or{' '}
                      <label className="text-blue-600 hover:underline cursor-pointer font-bold">
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
                    <p className="text-[11px] text-slate-400 font-normal">
                      Supports JPG, JPEG, PNG, WEBP. Maximum file size: 5MB.
                    </p>
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

          {/* SECTION 3: SPECIFICATIONS (Name, Unit, Type, Status) */}
          <div className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 icon-3d">
                <Package className="w-4 h-4 drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase micro-label">
                  3. Specifications &amp; Operational Details
                </h2>
                <p className="text-[11px] text-slate-400 font-normal">
                  Core packaging units, item classification, and inventory status.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* FIELD 4: Product Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                    className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all font-normal text-slate-900 ${
                      errors.product_name
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20'
                    }`}
                  />
                </div>
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
                  <label className="block text-xs font-semibold text-slate-700">
                    Business Unit &amp; Product Unit <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Packaging / Count</span>
                </div>

                <div
                  className={`flex items-center rounded-2xl border bg-slate-50/80 transition-all overflow-hidden focus-within:bg-white focus-within:ring-2 ${
                    errors.business_unit || errors.product_unit
                      ? 'border-rose-400 focus-within:ring-rose-500/20'
                      : 'border-slate-200 focus-within:border-blue-600 focus-within:ring-blue-500/20'
                  }`}
                >
                  {/* Select Dropdown for Business Unit */}
                  <div className="w-6/12 min-w-0 border-r border-slate-200/90">
                    <select
                      name="business_unit"
                      value={formData.business_unit}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      required
                      className="w-full px-3.5 py-2.5 text-xs bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-900 cursor-pointer font-medium truncate"
                    >
                      <option value="">Select Unit</option>
                      {commonBusinessUnits.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Integer Input for Product Unit */}
                  <div className="w-6/12 min-w-0 flex items-center bg-white/70 px-3">
                    <span className="text-[11px] text-slate-400 mr-2 shrink-0 select-none font-mono">Qty:</span>
                    <input
                      type="number"
                      name="product_unit"
                      min="1"
                      step="1"
                      value={formData.product_unit}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      required
                      className="w-full py-2.5 text-xs bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-900 font-mono font-bold tabular-numbers"
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

              {/* FIELD 6: Product Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Product Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="product_type"
                    value={formData.product_type}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                    className={`w-full px-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all font-medium text-slate-900 ${
                      errors.product_type
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20'
                    }`}
                  >
                    <option value="Consumable">Consumable</option>
                    <option value="Retail">Retail</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Service">Service</option>
                    <option value="Other">Other (Custom Type)</option>
                  </select>
                </div>
                {errors.product_type && (
                  <p className="text-[11px] text-rose-500 mt-1.5 font-normal flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{Array.isArray(errors.product_type) ? errors.product_type[0] : errors.product_type}</span>
                  </p>
                )}
              </div>

              {/* Custom Product Type (Shown only if Other selected) */}
              {formData.product_type === 'Other' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Specify Custom Product Type <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="custom_product_type"
                    value={formData.custom_product_type}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                    className={`w-full px-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all font-normal text-slate-900 ${
                      errors.custom_product_type
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20'
                    }`}
                  />
                  {errors.custom_product_type && (
                    <p className="text-[11px] text-rose-500 mt-1.5 font-normal flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{Array.isArray(errors.custom_product_type) ? errors.custom_product_type[0] : errors.custom_product_type}</span>
                    </p>
                  )}
                </div>
              )}

              {/* FIELD 7: Status */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Product Operational Status <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                      formData.status === 'active'
                        ? 'bg-blue-50/70 border-blue-500/80 text-blue-900 font-semibold'
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
                    <span className="text-xs">Active Stock</span>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all ${
                      formData.status === 'inactive'
                        ? 'bg-rose-50/70 border-rose-500/80 text-rose-900 font-semibold'
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

          {/* FORM BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/admin/inventory/products"
              className="w-full sm:w-auto text-center px-6 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold font-display text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-semibold font-display transition-all shadow-md shadow-blue-500/25 hover:shadow-lg disabled:opacity-50 cursor-pointer active:scale-98"
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
