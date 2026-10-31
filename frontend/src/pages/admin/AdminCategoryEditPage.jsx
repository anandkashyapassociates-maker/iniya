import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FolderTree,
  Tag,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Stethoscope,
  Clock,
  UserCheck,
} from 'lucide-react';
import adminService from '../../services/adminService';
import LoadingState from '../../components/LoadingState';
import { useToast } from '../../context/ToastContext';

export default function AdminCategoryEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    is_active: true,
  });

  const [creatorAdmin, setCreatorAdmin] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [errors, setErrors] = useState({});
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  };

  useEffect(() => {
    async function loadCategory() {
      setIsFetching(true);
      try {
        const cat = await adminService.getCategory(id);
        setFormData({
          name: cat.name || '',
          slug: cat.slug || '',
          description: cat.description || '',
          is_active: Boolean(cat.is_active),
        });
        setCreatorAdmin(cat.admin);
        if (cat.image_url) {
          setExistingImage(cat.image_url);
          setImagePreview(cat.image_url);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load category record.');
        navigate('/admin/categories');
      } finally {
        setIsFetching(false);
      }
    }
    loadCategory();
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, image: 'Please select a valid image file (JPG, PNG, WEBP, SVG).' }));
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
      setErrors({ name: 'Category name is required.' });
      setIsSaving(false);
      return;
    }

    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      if (formData.slug?.trim()) {
        data.append('slug', formData.slug.trim());
      }
      if (formData.description?.trim()) {
        data.append('description', formData.description.trim());
      }
      data.append('is_active', formData.is_active ? '1' : '0');

      if (imageFile) {
        data.append('image', imageFile);
      } else if (removeImage) {
        data.append('remove_image', '1');
      }

      await adminService.updateCategory(id, data);

      toast.success(`Category '${formData.name}' updated successfully.`);
      navigate('/admin/categories');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to update category.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return <LoadingState message="Loading category details..." />;
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Navigation & Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <Link
            to="/admin/categories"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Category Directory</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-medium">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Clinic Catalog Management</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-mono font-medium">
              CAT-#{id}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-normal mt-1.5">
            Edit Category Profile: {formData.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Update category parameters, clinical procedures scope, or active OPD status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/categories"
            className="w-full sm:w-auto text-center px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all shadow-2xs"
          >
            Back to Directory
          </Link>
        </div>
      </div>

      {/* Main Full-Width Card (col-12) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 lg:p-9 shadow-xs relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <form onSubmit={handleSubmit} className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column (col-12 lg:col-span-4): Category Icon / Photo Upload */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <span>Category Thumbnail / Icon</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-200/60">
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
                          alt="Category Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100/70 border border-blue-200/70 flex flex-col items-center justify-center text-blue-600 shadow-inner">
                        <Tag className="w-10 h-10 stroke-[1.5]" />
                        <span className="text-[10px] font-medium text-blue-500 mt-1">Default Icon</span>
                      </div>
                    )}
                  </div>

                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors cursor-pointer border border-blue-200/80">
                    <UploadCloud className="w-4 h-4" />
                    <span>{imagePreview ? 'Change Photo' : 'Upload Icon / Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isSaving}
                    />
                  </label>

                  <p className="text-[10px] text-slate-400 font-normal mt-2 leading-tight">
                    JPG, PNG, WEBP, or SVG. Maximum file size: 5MB.
                  </p>

                  {errors.image && (
                    <p className="text-[11px] text-rose-500 mt-2 font-normal flex items-center gap-1 text-left">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{Array.isArray(errors.image) ? errors.image[0] : errors.image}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Creator Metadata Card */}
              {creatorAdmin && (
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Created By Administrator</span>
                  </div>
                  <div className="text-xs text-slate-800 font-medium">{creatorAdmin.name}</div>
                  <div className="text-[11px] text-slate-500 font-normal truncate">{creatorAdmin.email}</div>
                </div>
              )}
            </div>

            {/* Right Column (col-12 lg:col-span-8): Form Fields */}
            <div className="lg:col-span-8 space-y-6">
              {/* Category Name & Slug */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <FolderTree className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-medium text-slate-800 tracking-wide">
                    1. Category Identification
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Category / Department Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Cardiology & Heart Care, Pediatric OPD"
                        disabled={isSaving}
                        required
                        className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all font-normal ${
                          errors.name
                            ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                            : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-[11px] text-rose-500 mt-1.5 font-normal flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{Array.isArray(errors.name) ? errors.name[0] : errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Slug */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      URL Slug Identifier
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 select-none">
                        /
                      </span>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                        placeholder="e.g. cardiology-heart-care"
                        disabled={isSaving}
                        className={`w-full pl-7 pr-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all font-mono font-normal ${
                          errors.slug
                            ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
                            : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
                        }`}
                      />
                    </div>
                    {errors.slug && (
                      <p className="text-[11px] text-rose-500 mt-1.5 font-normal flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{Array.isArray(errors.slug) ? errors.slug[0] : errors.slug}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h2 className="text-xs font-medium text-slate-800 tracking-wide">
                    2. Description &amp; Scope
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Category Details &amp; Clinical Scope <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    name="description"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Provide overview of treatments, specialized equipment, or clinical procedures covered under this category..."
                    disabled={isSaving}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-normal leading-relaxed text-slate-900"
                  />
                  {errors.description && (
                    <p className="text-[11px] text-rose-500 mt-1.5 font-normal flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{Array.isArray(errors.description) ? errors.description[0] : errors.description}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Status Switch */}
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-800">
                      Category Operational Status
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5 leading-relaxed">
                      Active categories are immediately available across the clinic and doctor desks.
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
                    disabled={isSaving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-5 border-t border-slate-100">
                <Link
                  to="/admin/categories"
                  className="w-full sm:w-auto text-center px-6 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-medium transition-all shadow-md shadow-blue-500/25 hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Update Category Profile</span>
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
