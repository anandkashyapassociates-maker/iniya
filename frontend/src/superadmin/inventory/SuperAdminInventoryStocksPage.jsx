import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Package,
  Layers,
  Building2,
  DollarSign,
  TrendingDown,
  Lock,
  Eye,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import superAdminInventoryService from '../services/superAdminInventoryService';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminInventoryStocksPage() {
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [metrics, setMetrics] = useState({
    total_products: 0,
    in_stock_count: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    total_alerts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [stockStatus, setStockStatus] = useState('all');
  const [page, setPage] = useState(1);

  // View Modal State
  const [viewProduct, setViewProduct] = useState(null);

  const fetchFiltersData = useCallback(async () => {
    try {
      const [catsRes, brandsRes] = await Promise.all([
        superAdminInventoryService.getCategories({ per_page: 100 }),
        superAdminInventoryService.getBrands({ per_page: 100 }),
      ]);
      setCategories(catsRes.data || []);
      setBrands(brandsRes.data || []);
    } catch {
      // non-blocking
    }
  }, []);

  const fetchStocks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedBrand) params.brand_id = selectedBrand;
      if (stockStatus && stockStatus !== 'all') params.stock_status = stockStatus;

      const res = await superAdminInventoryService.getStocks(params);
      setProducts(res.data || []);
      setPagination(res.pagination || null);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load inventory stock ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedCategory, selectedBrand, stockStatus, toast]);

  useEffect(() => {
    fetchFiltersData();
  }, [fetchFiltersData]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const columns = [
    {
      header: 'SR. NO.',
      className: 'w-[70px] text-center',
      render: (_, index) => {
        const srNo = (pagination?.from || 1) + index;
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-medium">
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
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60 truncate max-w-[120px]">
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
      header: 'UNIT SPEC',
      className: 'w-[12%]',
      render: (p) => (
        <div className="text-xs text-slate-700 font-medium">
          <span>{p.business_unit || 'Piece'}</span>
          {p.product_unit > 1 && (
            <span className="text-[10px] text-slate-400 block font-normal">
              ({p.product_unit} units/pack)
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'AVAILABLE STOCK',
      className: 'w-[16%]',
      render: (p) => {
        const qty = p.quantity ?? 0;
        const threshold = p.low_stock_threshold ?? 10;
        const isOutOfStock = qty <= 0;
        const isLow = qty > 0 && qty <= threshold;

        return (
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-base font-bold font-mono ${
                  isOutOfStock
                    ? 'text-rose-600'
                    : isLow
                    ? 'text-amber-600'
                    : 'text-slate-800'
                }`}
              >
                {qty}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {p.business_unit || 'Units'}
              </span>
            </div>
            <div className="mt-1">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Out of Stock
                </span>
              ) : isLow ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Low Stock (&le;{threshold})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  In Stock
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
      header: 'VENDOR ALLOCATION',
      className: 'w-[14%]',
      render: (p) =>
        p.vendor ? (
          <div>
            <span className="text-xs font-bold text-slate-800 block truncate" title={p.vendor.vendor_name}>
              {p.vendor.vendor_name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block truncate">
              {p.vendor.vendor_code}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 italic text-[11px]">No Vendor Assigned</span>
        ),
    },
    {
      header: 'UPDATED BY',
      className: 'w-[13%]',
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
          <span className="text-slate-400 italic text-[11px]">Not yet stocked</span>
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
          title="View Product Stock Details"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
              <Boxes className="w-3.5 h-3.5 text-blue-600" />
              <span>SuperAdmin Stock Ledger Oversight</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <Lock className="w-3 h-3 text-slate-400" />
              Read-Only Oversight
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
            Inventory Stock &amp; Pricing Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Centralized monitoring of clinic supply stock levels, weighted average purchase costs, vendor allocations, and replenishment alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStocks}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Low Stock Alerts Link Button */}
          <Link
            to="/superadmin/inventory/low-stock"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            <span>Low Inventory Alerts</span>
            {metrics.total_alerts > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-700 text-[10px] font-extrabold">
                {metrics.total_alerts}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Products
            </span>
            <span className="text-2xl font-bold text-slate-900 font-mono mt-0.5 block">
              {metrics.total_products}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">In catalog system</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* In Stock */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
              Adequate Stock
            </span>
            <span className="text-2xl font-bold text-emerald-700 font-mono mt-0.5 block">
              {metrics.in_stock_count}
            </span>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">Above threshold</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
              Low Stock Alerts
            </span>
            <span className="text-2xl font-bold text-amber-700 font-mono mt-0.5 block">
              {metrics.low_stock_count}
            </span>
            <span className="text-[10px] text-amber-600 mt-0.5 block">&le; Threshold limit</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
              Depleted (0 Qty)
            </span>
            <span className="text-2xl font-bold text-rose-700 font-mono mt-0.5 block">
              {metrics.out_of_stock_count}
            </span>
            <span className="text-[10px] text-rose-600 mt-0.5 block">Zero units remaining</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Prominent Alert Banner if low stock items exist */}
      {metrics.total_alerts > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Low Inventory Alert Oversight</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                  {metrics.total_alerts} item{metrics.total_alerts > 1 ? 's' : ''} depleted
                </span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Hospital supplies require replenishment. Notify branch administrators to restock depleting medical items.
              </p>
            </div>
          </div>
          <Link
            to="/superadmin/inventory/low-stock"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <span>Review Low Stock List</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Main Table Card */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search box */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search product name, category, or vendor..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="all">All Stocks</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={products}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={setPage}
          emptyTitle="No Stock Records Found"
          emptyDescription="There are no inventory products matching your search or filters."
        />
      </div>

      {/* ======================================================== */}
      {/* MODAL: VIEW PRODUCT STOCK DETAILS (READ ONLY)            */}
      {/* ======================================================== */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Product Stock Ledger Details</h3>
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
                  <span className="text-base font-bold font-mono text-slate-900">
                    {viewProduct.quantity ?? 0} {viewProduct.business_unit || 'Units'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Low Stock Threshold</span>
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
                <span>SuperAdmin oversight: Read-only access enabled. Stock modification is restricted to branch Administrators.</span>
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
