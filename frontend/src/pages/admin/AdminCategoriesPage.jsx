import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderTree,
  Plus,
  Tag,
  Edit,
  Trash2,
  Eye,
  Stethoscope,
  Activity,
  Layers,
  Search,
  RefreshCw,
  X,
  FileText,
  UserCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function AdminCategoriesPage() {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0 });
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Selected category for Quick View Modal
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(null);

  // Category deletion state
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await adminService.getCategoryStats();
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

      const res = await adminService.getCategories(params);
      setCategories(res.data || []);
      setPagination({
        current_page: res.current_page,
        last_page: res.last_page,
        total: res.total,
        from: res.from,
        to: res.to,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load clinic categories.');
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
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await adminService.deleteCategory(deleteId);
      toast.success(res.message || 'Category deleted successfully.');
      setDeleteId(null);
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
      header: 'Category Details',
      className: 'w-[36%]',
      render: (cat) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-medium text-white shadow-2xs shrink-0 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 border border-white ring-1 ring-slate-200/80">
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
            <span className="text-slate-400 italic">No description provided</span>
          )}
        </p>
      ),
    },
    {
      header: 'Created By',
      className: 'w-[18%]',
      render: (cat) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center font-medium text-xs shrink-0">
            {cat.admin?.name ? cat.admin.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-700 block truncate">
              {cat.admin?.name || 'Clinic Admin'}
            </span>
            <span className="text-[10px] font-normal text-slate-400 block truncate">
              {cat.admin?.email || 'admin@clinic.local'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'w-[12%] text-right',
      render: (cat, index) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedCategory(cat);
              setSelectedCategoryIndex((pagination?.from || 1) + index);
            }}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <Link
            to={`/admin/categories/${cat.id}/edit`}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Edit Category"
          >
            <Edit className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => setDeleteId(cat.id)}
            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
            title="Delete Category"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Top Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-medium">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Hospital Department Index</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-normal mt-1.5">
            Category &amp; Department Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Manage clinical departments, medical specialties, and outpatient healthcare classification units.
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
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/admin/categories/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium transition-all shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Clinical Classification</div>
            <div className="text-sm font-medium text-slate-700 mt-1">
              Active Medical Services
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">OPD &amp; In-Patient</div>
            <div className="text-sm font-medium text-slate-700 mt-1">
              Live Department Catalog
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
              placeholder="Search category name, slug, or scope..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-normal text-slate-900"
            />
          </div>

          <div className="text-xs text-slate-400 font-normal">
            Showing <span className="font-medium text-slate-700">{categories.length}</span> departments
          </div>
        </div>

        {/* Categories DataTable */}
        <DataTable
          columns={columns}
          data={categories}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={setPage}
          emptyMessage="No clinical categories found. Click 'Add Category' to create the first one."
        />
      </div>

      {/* Quick View Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-medium text-white shadow-2xs shrink-0 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium text-slate-800">
                      {selectedCategory.name}
                    </h3>
                    {selectedCategoryIndex && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 font-mono text-[10px] font-medium">
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

            {/* Modal Body */}
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Clinical Scope &amp; Overview
                </label>
                <p className="text-xs text-slate-700 font-normal leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {selectedCategory.description || (
                    <span className="text-slate-400 italic">No scope or procedure description documented for this category.</span>
                  )}
                </p>
              </div>

              {/* Creator Admin Details */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/60 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-blue-900">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Enrolled By Administrator</span>
                </div>
                <div className="text-xs text-slate-700 font-medium">
                  {selectedCategory.admin?.name || 'Authorized Clinic Admin'}
                </div>
                <div className="text-[11px] text-slate-500 font-normal">
                  {selectedCategory.admin?.email}
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Created: {new Date(selectedCategory.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Updated: {new Date(selectedCategory.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <Link
                to={`/admin/categories/${selectedCategory.id}/edit`}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                Edit Category
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Clinic Category?"
        message="Are you sure you want to delete this clinical department? This operation cannot be undone."
        confirmText={isDeleting ? 'Deleting...' : 'Yes, Delete Category'}
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
