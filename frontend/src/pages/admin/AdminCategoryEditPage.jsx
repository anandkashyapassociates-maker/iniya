import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FolderTree,
  Tag,
  AlertCircle,
  FileText,
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
  });

  const [creatorAdmin, setCreatorAdmin] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
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
        });
        setCreatorAdmin(cat.admin);
        setCreatedAt(cat.created_at);
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
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
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug?.trim() || undefined,
        description: formData.description?.trim() || null,
      };

      await adminService.updateCategory(id, payload);

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
      {/* Top Navigation & Header */}
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
              <span>Clinic Records Desk</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-mono">
              ID: #{id}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-normal mt-1.5">
            Edit Clinic Category
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Modify department identification and clinical scope details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/categories"
            className="w-full sm:w-auto text-center px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all shadow-2xs"
          >
            Cancel &amp; Return
          </Link>
        </div>
      </div>

      {/* Creator Admin Ownership Info Banner */}
      {creatorAdmin && (
        <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-medium text-sm shadow-xs shrink-0">
              {creatorAdmin.name ? creatorAdmin.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Created by Administrator: <strong className="font-semibold text-blue-700">{creatorAdmin.name}</strong></span>
              </div>
              <div className="text-[11px] text-slate-500 font-normal">
                {creatorAdmin.email}
              </div>
            </div>
          </div>
          {createdAt && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-normal self-start sm:self-center">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Enrolled on {new Date(createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Full-Width Form Card (col-12) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 lg:p-9 shadow-xs relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          {/* Section 1: Category Identification */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <FolderTree className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-medium text-slate-800 tracking-wide">
                1. Category Identification
              </h2>
            </div>

            <div className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Category / Department Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Cardiology & Heart Care, Pediatric OPD, Dental Clinic"
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
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{Array.isArray(errors.name) ? errors.name[0] : errors.name}</span>
                  </p>
                )}
              </div>

              {/* Slug Identifier */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    URL Slug Identifier <span className="text-slate-400 font-normal">(Editable)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, slug: slugify(prev.name) }));
                    }}
                    className="text-[10px] text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Regenerate from Name
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 select-none pointer-events-none">
                    /
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
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
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{Array.isArray(errors.slug) ? errors.slug[0] : errors.slug}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Description & Scope */}
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
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{Array.isArray(errors.description) ? errors.description[0] : errors.description}</span>
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                  <span>Updating Category...</span>
                </>
              ) : (
                <>
                  <FolderTree className="w-4 h-4" />
                  <span>Update Clinic Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
