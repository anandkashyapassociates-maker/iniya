import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderTree,
  Tag,
  Eye,
  Search,
  RefreshCw,
  X,
  UserCheck,
  Package,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import superAdminInventoryService from '../services/superAdminInventoryService';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminInventoryCategoriesPage() {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // View modal state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();

      const res = await superAdminInventoryService.getCategories(params);
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

  const columns = [
    {
      header: 'SR. NO.',
      className: 'w-[75px] text-center',
      render: (cat, index) => {
        const srNo = (pagination?.from || 1) + index;
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-semibold tabular-numbers">
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-2xs shrink-0 icon-3d">
            <Tag className="w-5 h-5 drop-shadow-sm" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold font-display text-slate-900 block truncate">
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tabular-numbers bg-blue-50 text-blue-700 border border-blue-200/60">
          <Package className="w-3.5 h-3.5 text-blue-600" />
          <span>{cat.products_count ?? 0}</span>
        </span>
      ),
    },
    {
      header: 'CREATED BY ADMIN',
      className: 'w-[16%]',
      render: (cat) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {cat.creator?.name ? cat.creator.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-800 block truncate">
              {cat.creator?.name || 'Clinic Admin'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block truncate">
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
        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              setSelectedCategory(cat);
              setSelectedIndex((pagination?.from || 1) + index);
            }}
            className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
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
              Department Classification
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight mt-1.5">
            Inventory Categories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Monitor and govern all inventory categories and hospital departments created across clinic accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchCategories()}
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
          emptyMessage="No inventory categories found."
        />
      </div>

      {/* Quick View Category Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden space-y-6">
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 icon-3d">
                  <Tag className="w-6 h-6 drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900">{selectedCategory.name}</h3>
                  <p className="font-mono text-xs text-slate-400">/{selectedCategory.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 micro-label">
                  Category Details & Clinical Scope
                </label>
                <p className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-slate-700 leading-relaxed font-normal">
                  {selectedCategory.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 micro-label">
                    Total Products
                  </span>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-display">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>{selectedCategory.products_count ?? 0} Items</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 micro-label">
                    Serial Index
                  </span>
                  <p className="text-sm font-bold text-slate-900 font-mono">
                    #{selectedIndex || selectedCategory.id}
                  </p>
                </div>
              </div>

              {selectedCategory.creator && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-blue-900 block">
                      Enrolled by {selectedCategory.creator.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 block truncate">
                      {selectedCategory.creator.email}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold font-display text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
