import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Tag,
  AlertCircle,
  FileText,
  UserCheck,
  Calendar,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import adminInventoryService from '../../../services/adminInventoryService';
import LoadingState from '../../../components/LoadingState';
import { useToast } from '../../../context/ToastContext';
import { useAdminAuth } from '../../../features/auth/AdminAuthContext';

export default function AdminBrandEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAdminAuth();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [creatorAdmin, setCreatorAdmin] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    async function loadBrand() {
      setIsLoading(true);
      try {
        const brand = await adminInventoryService.getBrand(id);

        if (brand.created_by && user?.id && Number(brand.created_by) !== Number(user.id)) {
          toast.error('Unauthorized: You can only edit brands created by you.');
          navigate('/admin/inventory/brands');
          return;
        }

        setFormData({
          name: brand.name || '',
          slug: brand.slug || '',
          description: brand.description || '',
        });
        setCreatorAdmin(brand.creator);
        setCreatedAt(brand.created_at);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load brand.');
        navigate('/admin/inventory/brands');
      } finally {
        setIsLoading(false);
      }
    }
    loadBrand();
  }, [id, navigate, toast]);

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

      const res = await adminInventoryService.updateBrand(id, payload);
      toast.success(res.message || `Brand '${formData.name}' updated successfully.`);
      navigate('/admin/inventory/brands');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to update brand.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading brand details..." />;
  }

  return (
    <div className="w-full space-y-7 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <Link
            to="/admin/inventory/brands"
            className="inline-flex items-center gap-1.5 text-xs font-semibold font-display text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Inventory Brands</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold font-display">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Inventory Management</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight mt-1.5">
            Edit Brand
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Update manufacturer profile, certified distribution lines, and catalog slug.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/inventory/brands"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold font-display shadow-md shadow-blue-500/20 hover:shadow-lg transition-all active:scale-98"
          >
            <Award className="w-4 h-4" />
            <span>View Brands</span>
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
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {creatorAdmin.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{creatorAdmin.name}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      Brand Creator
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

          {/* Section 1: Brand Identification */}
          <div className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 icon-3d">
                <Award className="w-4 h-4 drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase micro-label">
                  1. Brand Identification
                </h2>
                <p className="text-[11px] text-slate-400 font-normal">
                  Unique manufacturer trademark name and system URL slug identifier.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Brand Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Brand / Manufacturer Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 icon-3d">
                <FileText className="w-4 h-4 drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase micro-label">
                  2. Brand Profile & Description
                </h2>
                <p className="text-[11px] text-slate-400 font-normal">
                  Overview of brand lines, regulatory certifications, or supplier details.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
            <Link
              to="/admin/inventory/brands"
              className="px-6 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold font-display text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-7 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold font-display shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Updating Brand...' : 'Update Brand'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
