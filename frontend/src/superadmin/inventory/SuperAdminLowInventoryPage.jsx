import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Package,
  RefreshCw,
  Search,
  Lock,
  Eye,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  X,
  Clock,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import superAdminInventoryService from '../services/superAdminInventoryService';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminLowInventoryPage() {
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [metrics, setMetrics] = useState({
    total_low_stock_alerts: 0,
    out_of_stock_count: 0,
    low_stock_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // View modal state
  const [viewProduct, setViewProduct] = useState(null);

  const fetchLowStock = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();

      const res = await superAdminInventoryService.getLowStock(params);
      setProducts(res.data || []);
      setPagination(res.pagination || null);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load low inventory list.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  const columns = [
    {
      header: 'SR. NO.',
      className: 'w-[70px] text-center',
      render: (_, index) => {
        const srNo = (pagination?.from || 1) + index;
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-50 text-rose-700 font-mono text-[11px] font-semibold">
            {srNo}
          </span>
        );
      },
    },
    {
      header: 'PRODUCT DETAILS',
      className: 'w-[28%]',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
            {p.product_image ? (
              <img
                src={p.image_url || p.product_image}
                alt={p.product_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 block truncate" title={p.product_name}>
              {p.product_name}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60 truncate max-w-[120px]">
                {p.category?.name || 'General'}
              </span>
              {p.brand?.name && (
                <span className="text-[10px] text-slate-500 font-normal truncate max-w-[100px]">
                  • {p.brand.name}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'STOCK & ALERT STATUS',
      className: 'w-[20%]',
      render: (p) => {
        const qty = p.quantity ?? 0;
        const threshold = p.low_stock_threshold ?? 10;
        const isOutOfStock = qty <= 0;
        const deficit = Math.max(0, threshold - qty);

        return (
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-lg font-bold font-mono ${
                  isOutOfStock ? 'text-rose-600' : 'text-amber-600'
                }`}
              >
                {qty}
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                {p.business_unit || 'Units'}
              </span>
              <span className="text-[10px] text-slate-400">
                (Min: {threshold})
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                  Depleted (0 Stock)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Deficit: -{deficit}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'PRICING METRICS',
      className: 'w-[15%]',
      render: (p) => (
        <div className="space-y-0.5 text-xs font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-sans text-[10px]">Buy:</span>
            <span className="font-semibold text-slate-700">
              {p.buy_price ? `₹${parseFloat(p.buy_price).toFixed(2)}` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-sans text-[10px]">MRP:</span>
            <span className="font-semibold text-blue-600">
              {p.mrp ? `₹${parseFloat(p.mrp).toFixed(2)}` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] pt-0.5 border-t border-slate-100">
            <span className="text-slate-400 font-sans">Avg:</span>
            <span className="text-slate-500">
              {p.average_price ? `₹${parseFloat(p.average_price).toFixed(2)}` : '—'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'SUPPLIER / VENDOR',
      className: 'w-[15%]',
      render: (p) =>
        p.vendor ? (
          <div>
            <span className="text-xs font-bold text-slate-800 block truncate" title={p.vendor.vendor_name}>
              {p.vendor.vendor_name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block truncate">
              {p.vendor.mobile || p.vendor.vendor_code}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 italic text-[11px]">No Vendor Assigned</span>
        ),
    },
    {
      header: 'LAST UPDATER',
      className: 'w-[14%]',
      render: (p) => {
        const updater = p.inventory_updater;
        return updater ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
              {updater.name ? updater.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-slate-800 block truncate">
                {updater.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block truncate">
                {p.inventory_updated_at ? new Date(p.inventory_updated_at).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 italic text-[11px]">Not yet recorded</span>
        );
      },
    },
    {
      header: 'OVERSIGHT',
      className: 'w-[8%] text-center',
      render: (p) => (
        <button
          onClick={() => setViewProduct(p)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
          title="View Depletion Details"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              to="/superadmin/inventory/stocks"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Stock Ledger</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-700 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>Hospital Depletion Oversight</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <Lock className="w-3 h-3 text-slate-400" />
              Read-Only
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
            Low Inventory &amp; Stock Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Global monitoring of all medical supplies requiring urgent replenishment across hospital departments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLowStock}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer"
            title="Refresh Alert List"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/superadmin/inventory/stocks"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs"
          >
            <Boxes className="w-4 h-4" />
            <span>All Inventory Stocks</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Low Stock Alerts */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
              Total Low Stock Alerts
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-900 font-mono mt-1 block">
              {metrics.total_low_stock_alerts}
            </span>
            <span className="text-[11px] text-amber-600 mt-0.5 block">
              Depleted supplies requiring action
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Depleted (0 Stock) */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">
              Depleted / Out of Stock
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-900 font-mono mt-1 block">
              {metrics.out_of_stock_count}
            </span>
            <span className="text-[11px] text-rose-600 mt-0.5 block">
              Zero units remaining in inventory
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Approaching Zero */}
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">
              Under Threshold (&le; Min)
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-900 font-mono mt-1 block">
              {metrics.low_stock_count}
            </span>
            <span className="text-[11px] text-blue-600 mt-0.5 block">
              Approaching zero units
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        {/* Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search low stock products, brands, or vendors..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{products.length}</strong> critical items
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={products}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={setPage}
          emptyTitle="No Low Stock Products!"
          emptyDescription="All products in the inventory currently have stock above their minimum threshold."
        />
      </div>

      {/* ======================================================== */}
      {/* MODAL: VIEW PRODUCT STOCK DETAILS (READ ONLY)            */}
      {/* ======================================================== */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-gradient-to-r from-rose-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Depleted Product Oversight</h3>
                  <p className="text-xs text-slate-300 truncate max-w-xs">
                    {viewProduct.product_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Available Stock</span>
                  <span className="text-base font-bold font-mono text-rose-600">
                    {viewProduct.quantity ?? 0} {viewProduct.business_unit || 'Units'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Min Threshold</span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    {viewProduct.low_stock_threshold ?? 10} Units
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Buy Price</span>
                  <span className="text-sm font-bold font-mono text-slate-800">
                    {viewProduct.buy_price ? `₹${parseFloat(viewProduct.buy_price).toFixed(2)}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">MRP</span>
                  <span className="text-sm font-bold font-mono text-blue-600">
                    {viewProduct.mrp ? `₹${parseFloat(viewProduct.mrp).toFixed(2)}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Average Cost</span>
                  <span className="text-sm font-bold font-mono text-slate-700">
                    {viewProduct.average_price ? `₹${parseFloat(viewProduct.average_price).toFixed(2)}` : '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Allocated Vendor:</span>
                  <span className="font-semibold text-slate-800">
                    {viewProduct.vendor?.vendor_name || 'No Vendor Assigned'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last Stocked By:</span>
                  <span className="font-semibold text-slate-800">
                    {viewProduct.inventory_updater?.name || 'Not yet recorded'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last Updated At:</span>
                  <span className="font-semibold text-slate-800">
                    {viewProduct.inventory_updated_at ? new Date(viewProduct.inventory_updated_at).toLocaleString() : '—'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>SuperAdmin oversight: Read-only access. Restock actions must be performed by the designated branch Administrator.</span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

