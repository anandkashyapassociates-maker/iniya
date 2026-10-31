import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderTree,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Tag,
  Package,
  Layers,
  X,
  AlertCircle,
  Calendar,
  UserCheck,
} from 'lucide-react';
import DataTable from '../../../components/DataTable';
import ConfirmDialog from '../../../components/ConfirmDialog';
import adminInventoryService from '../../../services/adminInventoryService';
import { useToast } from '../../../context/ToastContext';

export default function AdminCategoryListPage() {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // View modal state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Delete state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    category: null,
    isLoading: false,
  });

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();

      const res = await adminInventoryService.getCategories(params);
      setCategories(res.data || []);
      setPagination({
        current_page: res.current_page,
        last_page: res.last_page,
        total: res.total,
        from: res.from,
        to: res.to,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load inventory categories.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.category) return;
    setDeleteDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await adminInventoryService.deleteCategory(deleteDialog.category.id);
      toast.success(res.message || 'Category deleted successfully.');
      setDeleteDialog({ isOpen: false, category: null, isLoading: false });
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category.');
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const columns = [
    {
      header: 'SR. NO.',
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
      header: 'CATEGORY IDENTIFICATION',
      className: 'w-[32%]',
      render: (cat) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-medium shadow-2xs shrink-0">
            <Tag className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-800 block truncate">
              {cat.name}
            </span>
            <span className="font-mono text-[10px] text-slate-400">/{cat.slug}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'CLINICAL SCOPE / DESCRIPTION',
      className: 'w-[28%]',
      render: (cat) => (
        <p className="text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed">
          {cat.description || <span className="text-slate-400 italic">No description provided</span>}
        </p>
      ),
    },
    {
      header: 'TOTAL PRODUCTS',
      className: 'w-[14%] text-center',
      render: (cat) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
          <Package className="w-3.5 h-3.5 text-blue-500" />
          <span>{cat.products_count ?? 0}</span>
        </span>
      ),
    },
    {
      header: 'CREATED BY',
      className: 'w-[16%]',
      render: (cat) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center font-medium text-xs shrink-0">
            {cat.creator?.name ? cat.creator.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-700 block truncate">
              {cat.creator?.name || 'Clinic Admin'}
            </span>
            <span className="text-[10px] font-normal text-slate-400 block truncate">
              {cat.creator?.email || 'admin@clinic.local'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'ACTIONS',
      className: 'w-[10%] text-right',
      render: (cat, index) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedCategory(cat);
              setSelectedIndex((pagination?.from || 1) + index);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <Link
            to={`/admin/inventory/categories/${cat.id}/edit`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Edit Category"
          >
            <Edit className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => setDeleteDialog({ isOpen: true, category: cat, isLoading: false })}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
              <FolderTree className="w-3.5 h-3.5 text-blue-600" />
              <span>Inventory Classification</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-normal mt-1.5">
            Inventory Categories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Manage product classification tiers, hospital stock departments, and medical supply categories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchCategories()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all shadow-2xs cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/admin/inventory/categories/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium transition-all shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Category</span>
          </Link>
        </div>
      </div>

      {/* Main Table Card (col-12) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        {/* Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search category name, slug, or description..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-normal text-slate-900"
            />
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={categories}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={setPage}
          emptyMessage="No inventory categories found. Click 'Create Category' to add one."
        />
      </div>

      {/* Quick View Category Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-medium border border-blue-200 shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{selectedCategory.name}</h3>
                  <p className="font-mono text-xs text-slate-400">/{selectedCategory.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Category Details & Clinical Scope
                </label>
                <p className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed font-normal">
                  {selectedCategory.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Total Products
                  </span>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>{selectedCategory.products_count ?? 0} Items</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Serial Index
                  </span>
                  <p className="text-sm font-semibold text-slate-800 font-mono">
                    #{selectedIndex || selectedCategory.id}
                  </p>
                </div>
              </div>

              {selectedCategory.creator && (
                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-medium shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-blue-700 font-medium block">
                      Created by {selectedCategory.creator.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {selectedCategory.creator.email}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Close
              </button>
              <Link
                to={`/admin/inventory/categories/${selectedCategory.id}/edit`}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all"
              >
                Edit Category
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Inventory Category?"
        message={`Are you sure you want to delete '${deleteDialog.category?.name}'? Note: Categories with linked products cannot be deleted.`}
        confirmText="Delete Category"
        confirmVariant="danger"
        isLoading={deleteDialog.isLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ isOpen: false, category: null, isLoading: false })}
      />
    </div>
  );
}
