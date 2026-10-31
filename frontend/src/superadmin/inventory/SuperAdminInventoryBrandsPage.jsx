import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Trash2,
  Eye,
  Edit,
  Search,
  RefreshCw,
  X,
  UserCheck,
  Package,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import superAdminInventoryService from '../services/superAdminInventoryService';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminInventoryBrandsPage() {
  const toast = useToast();

  const [brands, setBrands] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // View modal state
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Edit modal state
  const [editBrand, setEditBrand] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    brand: null,
    isLoading: false,
  });

  const fetchBrands = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();

      const res = await superAdminInventoryService.getBrands(params);
      setBrands(res.data || []);
      setPagination({
        current_page: res.current_page,
        last_page: res.last_page,
        total: res.total,
        from: res.from,
        to: res.to,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load inventory brands.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const openEditModal = (brand) => {
    setEditBrand(brand);
    setEditFormData({
      name: brand.name || '',
      description: brand.description || '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editBrand) return;
    setIsUpdating(true);
    try {
      const payload = {
        name: editFormData.name.trim(),
        description: editFormData.description?.trim() || null,
      };
      await superAdminInventoryService.updateBrand(editBrand.id, payload);
      toast.success('Brand updated successfully.');
      setEditBrand(null);
      fetchBrands();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update brand.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.brand) return;
    setDeleteDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await superAdminInventoryService.deleteBrand(deleteDialog.brand.id);
      toast.success(res.message || 'Brand deleted successfully.');
      setDeleteDialog({ isOpen: false, brand: null, isLoading: false });
      fetchBrands();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete brand.');
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const columns = [
    {
      header: 'SR. NO.',
      className: 'w-[75px] text-center',
      render: (brand, index) => {
        const srNo = (pagination?.from || 1) + index;
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-semibold tabular-numbers">
            {srNo}
          </span>
        );
      },
    },
    {
      header: 'BRAND IDENTIFICATION',
      className: 'w-[32%]',
      render: (brand) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-2xs shrink-0 icon-3d">
            <Award className="w-5 h-5 drop-shadow-sm" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold font-display text-slate-900 block truncate">
              {brand.name}
            </span>
            <span className="font-mono text-[10px] text-slate-400">/{brand.slug}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'PROFILE / DESCRIPTION',
      className: 'w-[28%]',
      render: (brand) => (
        <p className="text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed">
          {brand.description || <span className="text-slate-400 italic">No description provided</span>}
        </p>
      ),
    },
    {
      header: 'TOTAL PRODUCTS',
      className: 'w-[14%] text-center',
      render: (brand) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tabular-numbers bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <Package className="w-3.5 h-3.5 text-emerald-600" />
          <span>{brand.products_count ?? 0}</span>
        </span>
      ),
    },
    {
      header: 'CREATED BY ADMIN',
      className: 'w-[16%]',
      render: (brand) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {brand.creator?.name ? brand.creator.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-800 block truncate">
              {brand.creator?.name || 'Clinic Admin'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block truncate">
              {brand.creator?.email || 'admin@clinic.local'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'ACTIONS',
      className: 'w-[10%] text-right',
      render: (brand, index) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedBrand(brand);
              setSelectedIndex((pagination?.from || 1) + index);
            }}
            className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => openEditModal(brand)}
            className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            title="Edit Brand"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteDialog({ isOpen: true, brand, isLoading: false })}
            className="p-1.5 rounded-xl border border-rose-200 bg-white text-rose-600 hover:text-white hover:bg-rose-600 hover:border-rose-600 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            title="Delete Brand"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold font-display">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Superadmin Oversight</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold font-display">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Manufacturer Oversight
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight mt-1.5">
            Inventory Brands & Vendors
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Monitor and govern all pharmaceutical manufacturers and medical supply brands created by clinic admins.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchBrands()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold font-display transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-98"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Table Card (col-12) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
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
              placeholder="Search brand name, slug, or profile description..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-normal text-slate-900"
            />
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={brands}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={setPage}
          emptyMessage="No inventory brands found."
        />
      </div>

      {/* Quick View Brand Modal */}
      {selectedBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden space-y-6">
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0 icon-3d">
                  <Award className="w-6 h-6 drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900">{selectedBrand.name}</h3>
                  <p className="font-mono text-xs text-slate-400">/{selectedBrand.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBrand(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 micro-label">
                  Brand Profile & Details
                </label>
                <p className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-slate-700 leading-relaxed font-normal">
                  {selectedBrand.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 micro-label">
                    Total Products Linked
                  </span>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-display">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>{selectedBrand.products_count ?? 0} Items</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 micro-label">
                    Serial Index
                  </span>
                  <p className="text-sm font-bold text-slate-900 font-mono">
                    #{selectedIndex || selectedBrand.id}
                  </p>
                </div>
              </div>

              {selectedBrand.creator && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-blue-900 block">
                      Created by {selectedBrand.creator.name}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate font-mono">
                      {selectedBrand.creator.email}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100">
              <button
                onClick={() => setSelectedBrand(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold font-display text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Brand Modal */}
      {editBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden space-y-5">
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold font-display text-slate-900">Edit Inventory Brand</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Editing BRD-{String(editBrand.id).padStart(4, '0')} • Creator Admin preserved
                </p>
              </div>
              <button
                onClick={() => setEditBrand(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Brand / Manufacturer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/80 border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-900 transition-all font-normal"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Brand Profile & Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows="4"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-900 transition-all resize-y font-normal"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditBrand(null)}
                  disabled={isUpdating}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold font-display text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold font-display shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  {isUpdating ? 'Saving Changes...' : 'Save Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Inventory Brand?"
        message={`Are you sure you want to delete '${deleteDialog.brand?.name}'? Note: Brands with linked products cannot be deleted.`}
        confirmText="Delete Brand"
        confirmVariant="danger"
        isLoading={deleteDialog.isLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ isOpen: false, brand: null, isLoading: false })}
      />
    </div>
  );
}
