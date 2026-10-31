import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderTree,
  Tag,
  Trash2,
  Eye,
  ShieldCheck,
  Search,
  RefreshCw,
  X,
  UserCheck,
  Users,
  ShieldAlert,
  Calendar,
  Sparkles,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import superAdminCategoryService from '../services/superAdminCategoryService';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminCategoriesPage() {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0, creators_count: 0 });
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Selected category for Quick View
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(null);

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
  }, [page, search, toast]);

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
      toast.error(err.response?.data?.message || 'Failed to delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Sr. No.',
      className: 'w-[75px] text-center',
      render: (cat, index) => {
        const srNo = (pagination?.from || 1) + index;
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-medium">
            {srNo}
          </span>
        );
      },
    },
    {
      header: 'Category & Department',
      className: 'w-[35%]',
      render: (cat) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-medium text-white shadow-2xs shrink-0 bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 border border-white ring-1 ring-slate-200/80">
            <Tag className="w-4 h-4" />
          </div>
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
      header: 'Clinical Scope / Description',
      className: 'w-[28%]',
      render: (cat) => (
        <p className="text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed">
          {cat.description || (
            <span className="text-slate-400 italic">No scope description</span>
          )}
        </p>
      ),
    },
    {
      header: 'Creator Administrator',
      className: 'w-[22%]',
      render: (cat) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-medium text-xs flex items-center justify-center shrink-0 border border-purple-200/60 shadow-2xs">
            {cat.admin?.name ? cat.admin.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-800 block truncate">
              {cat.admin?.name || 'Authorized Admin'}
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-normal">
              <span className="truncate">{cat.admin?.email}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'w-[10%] text-right',
      render: (cat, index) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedCategory(cat);
              setSelectedCategoryIndex((pagination?.from || 1) + index);
            }}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
            title="Inspect Record"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteCategory(cat)}
            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
            title="SuperAdmin Force Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/60 text-purple-700 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>SuperAdmin System Governance</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-normal mt-1.5">
            Category Oversight &amp; Audit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Monitor clinical departments enrolled by hospital administrators with centralized deletion and audit rights.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchStats();
              fetchCategories();
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all shadow-2xs cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Governance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/20">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Registered Categories</div>
            <div className="text-2xl font-medium text-slate-800 mt-0.5">
              {stats.total ?? 0}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Contributing Admins</div>
            <div className="text-2xl font-medium text-slate-800 mt-0.5">
              {stats.creators_count ?? 0}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">SuperAdmin Privilege</div>
            <div className="text-sm font-medium text-slate-700 mt-1">
              Active Executive Control
            </div>
          </div>
        </div>
      </div>

      {/* Main Full-Width Card (col-12) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search category, slug, scope, or creator admin..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all font-normal text-slate-900"
            />
          </div>

          <div className="text-xs text-slate-400 font-normal">
            Auditing <span className="font-medium text-slate-700">{categories.length}</span> departments
          </div>
        </div>

        {/* Categories DataTable */}
        <DataTable
          columns={columns}
          data={categories}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={setPage}
          emptyMessage="No category records registered by clinic administrators."
        />
      </div>

      {/* SuperAdmin Quick View Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-medium text-white shadow-2xs shrink-0 bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium text-slate-800">
                      {selectedCategory.name}
                    </h3>
                    {selectedCategoryIndex && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 font-mono text-[10px] font-medium">
                        Sr. No. #{selectedCategoryIndex}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-normal text-slate-400">
                    /{selectedCategory.slug}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Department Scope &amp; Procedures
                </label>
                <p className="text-xs text-slate-700 font-normal leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {selectedCategory.description || (
                    <span className="text-slate-400 italic">No scope or procedures documented for this category.</span>
                  )}
                </p>
              </div>

              {/* Enrolled Admin Identity Card */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/70 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-purple-900">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <span>Enrolled by Hospital Administrator</span>
                </div>
                <div className="text-xs text-slate-800 font-medium">
                  {selectedCategory.admin?.name || 'Administrator'}
                </div>
                <div className="text-[11px] text-slate-600 font-normal space-y-0.5">
                  <div>Email: {selectedCategory.admin?.email}</div>
                  {selectedCategory.admin?.mobile && (
                    <div>Phone: {selectedCategory.admin?.mobile}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Enrolled: {new Date(selectedCategory.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Updated: {new Date(selectedCategory.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const toDelete = selectedCategory;
                  setSelectedCategory(null);
                  setDeleteCategory(toDelete);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Category</span>
              </button>

              <button
                onClick={() => setSelectedCategory(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SuperAdmin Executive Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCategory)}
        title="SuperAdmin Force Delete Category?"
        message={`Are you sure you want to permanently delete '${deleteCategory?.name}' enrolled by admin '${deleteCategory?.admin?.name || 'Administrator'}'? This action is logged in audit records.`}
        confirmText={isDeleting ? 'Deleting...' : 'Yes, Delete Category'}
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteCategory(null)}
      />
    </div>
  );
}
