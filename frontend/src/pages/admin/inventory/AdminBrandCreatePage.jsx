import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Tag,
  AlertCircle,
  FileText,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import adminInventoryService from '../../../services/adminInventoryService';
import { useToast } from '../../../context/ToastContext';

export default function AdminBrandCreatePage() {
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
      setErrors({ name: 'Brand name is required.' });
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

      const res = await adminInventoryService.createBrand(payload);
      toast.success(res.message || `Brand '${formData.name}' created successfully.`);

      if (fromProductCreate && res.brand?.id) {
        navigate(`/admin/inventory/products/create?new_brand_id=${res.brand.id}`);
      } else {
        navigate('/admin/inventory/brands');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to create brand.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <Link
            to={fromProductCreate ? '/admin/inventory/products/create' : '/admin/inventory/brands'}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{fromProductCreate ? 'Return to Product Creation' : 'Back to Inventory Brands'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-medium">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Inventory Management</span>
            </span>
            {fromProductCreate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Product Workflow
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-normal mt-1.5">
            Add New Brand
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Register medical manufacturers, pharmaceutical suppliers, and hospital equipment brands.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/inventory/brands"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium transition-all shadow-sm shadow-blue-500/20"
          >
            <Award className="w-3.5 h-3.5" />
            <span>View Brands</span>
          </Link>
        </div>
      </div>

      {/* Main Full-Width Form Card (col-12) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 lg:p-9 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          {/* Section 1: Brand Identification */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Award className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-medium text-slate-800 tracking-wide">
                1. Brand Identification
              </h2>
            </div>

            <div className="space-y-4">
              {/* Brand Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Brand / Manufacturer Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. 3M Healthcare, Johnson & Johnson, Pfizer, BD Medical"
                    disabled={isSubmitting}
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

              {/* URL Slug Identifier (Auto-generated) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    URL Slug Identifier <span className="text-slate-400 font-normal">(Auto-generated)</span>
                  </label>
                  {isCustomSlug && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSlug(false);
                        setFormData((prev) => ({ ...prev, slug: slugify(prev.name) }));
                      }}
                      className="text-[10px] text-blue-600 hover:underline font-medium cursor-pointer"
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
                    placeholder="e.g. 3m-healthcare"
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
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-medium text-slate-800 tracking-wide">
                2. Brand Profile & Description
              </h2>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Brand Description & Origin <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide manufacturer details, certified clinical lines, or distribution background..."
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
                  navigate('/admin/inventory/brands');
                }
              }}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Saving Brand...'
                  : fromProductCreate
                  ? 'Save & Return to Product'
                  : 'Save Brand'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

