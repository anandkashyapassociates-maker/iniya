import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FolderTree,
  Tag,
  AlertCircle,
  FileText,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import adminInventoryService from '../../../services/adminInventoryService';
import { useToast } from '../../../context/ToastContext';

export default function AdminCategoryCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const fromProductCreate = searchParams.get('from') === 'product_create';

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: !isCustomSlug ? slugify(value) : prev.slug,
      }));
    } else if (name === 'slug') {
      setIsCustomSlug(true);
      setFormData((prev) => ({
        ...prev,
        slug: slugify(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    if (!formData.name?.trim()) {
      setErrors({ name: 'Category name is required.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug?.trim() || undefined,
        description: formData.description?.trim() || null,
        status: 'active',
      };

      const res = await adminInventoryService.createCategory(payload);
      toast.success(res.message || `Category '${formData.name}' created successfully.`);

      if (fromProductCreate && res.category?.id) {
        navigate(`/admin/inventory/products/create?new_category_id=${res.category.id}`);
      } else {
        navigate('/admin/inventory/categories');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to create category.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-7 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <Link
            to={fromProductCreate ? '/admin/inventory/products/create' : '/admin/inventory/categories'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold font-display text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{fromProductCreate ? 'Return to Product Creation' : 'Back to Inventory Categories'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold font-display">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Inventory Management</span>
            </span>
            {fromProductCreate && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold font-display">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Product Workflow
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight mt-1.5">
            Add New Category
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Create clinical inventory classification groups, supply categories, and department stock tiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/inventory/categories"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold font-display shadow-md shadow-blue-500/20 hover:shadow-lg transition-all active:scale-98"
          >
            <FolderTree className="w-4 h-4" />
            <span>View Categories</span>
          </Link>
        </div>
      </div>

      {/* Main Full-Width Form Card (col-12) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 lg:p-9 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <form onSubmit={handleSubmit} className="relative z-10 space-y-7">
          {/* Section 1: Category Identification */}
          <div className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 icon-3d">
                <FolderTree className="w-4 h-4 drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase micro-label">
                  1. Category Identification
                </h2>
                <p className="text-[11px] text-slate-400 font-normal">
                  Unique clinical category title and clean URL slug identifier.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Surgical Equipment, Pharmaceuticals, PPE Kits, Diagnostic Reagents"
                    disabled={isSubmitting}
                    required
                    className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all font-normal text-slate-900 ${
                      errors.name
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20'
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

              {/* URL Slug Identifier (Auto-generated) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    URL Slug Identifier <span className="text-slate-400 font-normal">(Auto-generated)</span>
                  </label>
                  {isCustomSlug && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSlug(false);
                        setFormData((prev) => ({ ...prev, slug: slugify(prev.name) }));
                      }}
                      className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer font-display"
                    >
                      Reset Auto Slug
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 pointer-events-none">
                    /
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="e.g. surgical-equipment"
                    disabled={isSubmitting}
                    className="w-full pl-8 pr-4 py-2.5 text-xs font-mono bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800"
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
          <div className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 icon-3d">
                <FileText className="w-4 h-4 drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase micro-label">
                  2. Clinical Scope & Description
                </h2>
                <p className="text-[11px] text-slate-400 font-normal">
                  Overview of types of medical supplies or equipment under this category.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category Scope & Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe intended medical application, storage requirements, or classification scope..."
                disabled={isSubmitting}
                className="w-full p-4 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-normal text-slate-900 resize-y"
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
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (fromProductCreate) {
                  navigate('/admin/inventory/products/create');
                } else {
                  navigate('/admin/inventory/categories');
                }
              }}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold font-display text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-7 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold font-display shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Saving Category...'
                  : fromProductCreate
                  ? 'Save & Return to Product'
                  : 'Save Category'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
