import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Eye,
  Search,
  RefreshCw,
  X,
  UserCheck,
  Package,
  ShieldCheck,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
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

  const columns = [
    {
      header: 'SR. NO.',
      className: 'w-[75px] text-center',
      render: (brand, index) => {
        const srNo = (pagination?.from || 1) + index;
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-medium">
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-medium shadow-2xs shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-800 block truncate">
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
          <Package className="w-3.5 h-3.5 text-blue-500" />
          <span>{brand.products_count ?? 0}</span>
        </span>
      ),
    },
    {
      header: 'CREATED BY ADMIN',
      className: 'w-[16%]',
      render: (brand) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-xs shrink-0">
            {brand.creator?.name ? brand.creator.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-700 block truncate">
              {brand.creator?.name || 'Clinic Admin'}
            </span>
            <span className="text-[10px] font-normal text-slate-400 block truncate font-mono">
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
        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              setSelectedBrand(brand);
              setSelectedIndex((pagination?.from || 1) + index);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
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
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Superadmin Oversight</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-normal mt-1.5">
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all shadow-2xs cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
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
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-medium border border-blue-200 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{selectedBrand.name}</h3>
                  <p className="font-mono text-xs text-slate-400">/{selectedBrand.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBrand(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Brand Profile & Details
                </label>
                <p className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed font-normal">
                  {selectedBrand.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Total Products Linked
                  </span>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>{selectedBrand.products_count ?? 0} Items</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Serial Index
                  </span>
                  <p className="text-sm font-semibold text-slate-800 font-mono">
                    #{selectedIndex || selectedBrand.id}
                  </p>
                </div>
              </div>

              {selectedBrand.creator && (
                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-medium shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-blue-700 font-medium block">
                      Created by {selectedBrand.creator.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate font-mono">
                      {selectedBrand.creator.email}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedBrand(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
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

