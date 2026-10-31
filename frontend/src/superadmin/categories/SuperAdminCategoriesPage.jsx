import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderTree,
  Tag,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  X,
  UserCheck,
  Users,
  ShieldAlert,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import superAdminCategoryService from '../services/superAdminCategoryService';
import { useToast } from '../../context/ToastContext';

function CategoryThumbnail({ category, size = 'sm' }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [category?.image_url, category?.id]);

  const sizeClass = size === 'lg' ? 'w-16 h-16 rounded-2xl text-xl' : 'w-10 h-10 rounded-xl text-xs';

  if (category?.image_url && !imgError) {
    return (
      <img
        src={category.image_url}
        alt={category.name}
        className={`${sizeClass} object-cover border border-slate-200/80 shadow-2xs shrink-0 bg-slate-50`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center font-medium text-white shadow-2xs shrink-0 bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 border border-white ring-1 ring-slate-200/80`}
    >
      <Tag className={size === 'lg' ? 'w-7 h-7' : 'w-4 h-4'} />
    </div>
  );
}

export default function SuperAdminCategoriesPage() {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, creators_count: 0 });
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Selected category for Quick View
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Delete state
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await superAdminCategoryService.getCategoryStats();
      setStats(res);
    } catch {
      // Non-blocking
    }
  };

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await superAdminCategoryService.getCategories(params);
      setCategories(res.data || []);
      setPagination({
        current_page: res.current_page,
        last_page: res.last_page,
        total: res.total,
        from: res.from,
        to: res.to,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load category records.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCategory) return;
    setIsDeleting(true);
    try {
      const res = await superAdminCategoryService.deleteCategory(deleteCategory.id);
      toast.success(res.message || 'Category deleted successfully by Super Admin.');
      setDeleteCategory(null);
      fetchStats();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Super Admin failed to delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Category Details',
      className: 'w-[32%]',
      render: (cat) => (
        <div className="flex items-center gap-3">
          <CategoryThumbnail category={cat} size="sm" />
          <div className="min-w-0">
            <span className="font-medium text-slate-800 text-xs sm:text-sm block truncate">
              {cat.name}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                /{cat.slug}
              </span>
              <span className="text-[10px] font-normal text-slate-400">
                • {new Date(cat.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Description',
      className: 'w-[25%] hidden md:table-cell',
      render: (cat) => (
        <p className="text-xs text-slate-600 line-clamp-2 font-normal leading-relaxed">
          {cat.description || <span className="text-slate-400 italic">No description provided</span>}
        </p>
      ),
    },
    {
      header: 'Creator Administrator',
      className: 'w-[23%]',
      render: (cat) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center text-xs font-medium shrink-0">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-800 block truncate">
              {cat.admin ? cat.admin.name : 'Unknown Admin'}
            </span>
            <span className="text-[10px] text-slate-400 truncate block font-normal">
              {cat.admin?.email || 'N/A'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      className: 'w-[10%] text-center',
      render: (cat) =>
        cat.is_active ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Inactive
          </span>
        ),
    },
    {
      header: 'Privileges',
      className: 'w-[10%] text-right',
      render: (cat) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setSelectedCategory(cat)}
            title="Inspect Details"
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* SuperAdmin Executive Delete Power */}
          <button
            onClick={() => setDeleteCategory(cat)}
            title="SuperAdmin Delete Category"
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/70 text-purple-700 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>SuperAdmin Executive Oversight</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Clinic Audit
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium tracking-normal text-slate-800 mt-1.5">
            Category Registry &amp; Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Executive hospital view of all categories created by clinic administrators, with full deletion powers.
          </p>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block uppercase tracking-wider">
              Total Categories
            </span>
            <span className="text-2xl font-medium text-slate-800 block mt-1">
              {stats.total}
            </span>
            <span className="text-[11px] text-slate-400 font-normal mt-0.5 block">
              Across all clinic admins
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
            <FolderTree className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block uppercase tracking-wider">
              Active Departments
            </span>
            <span className="text-2xl font-medium text-emerald-600 block mt-1">
              {stats.active}
            </span>
            <span className="text-[11px] text-slate-400 font-normal mt-0.5 block">
              In clinical operations
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block uppercase tracking-wider">
              Inactive Categories
            </span>
            <span className="text-2xl font-medium text-slate-500 block mt-1">
              {stats.inactive}
            </span>
            <span className="text-[11px] text-slate-400 font-normal mt-0.5 block">
              Archived or pending review
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center shadow-xs">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block uppercase tracking-wider">
              Admin Creators
            </span>
            <span className="text-2xl font-medium text-blue-600 block mt-1">
              {stats.creators_count}
            </span>
            <span className="text-[11px] text-slate-400 font-normal mt-0.5 block">
              Administrators registered
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by category, slug, or creator admin name/email..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all font-normal text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1 text-xs rounded-lg transition-all cursor-pointer font-medium ${
                statusFilter === 'all'
                  ? 'bg-white text-purple-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStatusFilter('active');
                setPage(1);
              }}
              className={`px-3 py-1 text-xs rounded-lg transition-all cursor-pointer font-medium ${
                statusFilter === 'active'
                  ? 'bg-emerald-50 text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => {
                setStatusFilter('inactive');
                setPage(1);
              }}
              className={`px-3 py-1 text-xs rounded-lg transition-all cursor-pointer font-medium ${
                statusFilter === 'inactive'
                  ? 'bg-slate-200 text-slate-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Inactive
            </button>
          </div>

          <button
            onClick={() => {
              fetchStats();
              fetchCategories();
            }}
            title="Refresh"
            className="p-2 text-slate-500 hover:text-purple-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        emptyTitle="No category records found"
        emptyDescription="No categories have been registered by clinic administrators yet."
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
      />

      {/* Quick View Category Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-medium text-slate-800">SuperAdmin Category Audit</h3>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div className="flex items-center gap-4">
                <CategoryThumbnail category={selectedCategory} size="lg" />
                <div>
                  <h4 className="text-base font-medium text-slate-900">{selectedCategory.name}</h4>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1">
                    /{selectedCategory.slug}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
                  Description
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {selectedCategory.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/70">
                  <span className="text-[10px] text-purple-700 block font-medium">Creator Administrator</span>
                  <span className="font-medium text-slate-800 block mt-0.5 truncate">
                    {selectedCategory.admin ? selectedCategory.admin.name : 'Unknown Admin'}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-normal truncate">
                    {selectedCategory.admin?.email}
                  </span>
                  {selectedCategory.admin?.mobile && (
                    <span className="text-[10px] text-slate-500 block font-normal">
                      Mob: {selectedCategory.admin.mobile}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block font-normal">Operational Status</span>
                  <div className="mt-1">
                    {selectedCategory.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active in System
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                        <XCircle className="w-3.5 h-3.5" />
                        Inactive
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block font-normal mt-2">
                    ID: #{selectedCategory.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  const toDelete = selectedCategory;
                  setSelectedCategory(null);
                  setDeleteCategory(toDelete);
                }}
                className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Category</span>
              </button>

              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SuperAdmin Executive Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCategory)}
        title="SuperAdmin Delete Category Confirmation"
        message={
          deleteCategory
            ? `Are you sure you want to delete '${deleteCategory.name}' created by admin '${deleteCategory.admin?.name || 'Administrator'}'? This executive action cannot be undone.`
            : ''
        }
        confirmText="Yes, Delete Category (SuperAdmin)"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteCategory(null)}
      />
    </div>
  );
}
