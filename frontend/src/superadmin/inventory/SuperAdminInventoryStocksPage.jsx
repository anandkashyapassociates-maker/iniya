import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Tag,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  RotateCcw,
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

  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [stockStatus, setStockStatus] = useState(() => searchParams.get('status') || 'all');
  const [page, setPage] = useState(1);

  // Sync stockStatus if URL parameter changes
  useEffect(() => {
    const paramStatus = searchParams.get('status');
    if (paramStatus && paramStatus !== stockStatus) {
      setStockStatus(paramStatus);
      setPage(1);
    }
  }, [searchParams]);

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

  const handleStatusTabChange = (newStatus) => {
    setStockStatus(newStatus);
    setPage(1);
    setSearchParams(newStatus === 'all' ? {} : { status: newStatus });
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setStockStatus('all');
    setPage(1);
    setSearchParams({});
  };

  const isFiltered = Boolean(search || selectedCategory || selectedBrand || stockStatus !== 'all');

  const columns = [
    {
      header: '#',
      className: 'w-14 text-center',
      render: (_, index) => {
        const srNo = (pagination?.from || 1) + index;
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-500 font-mono text-[11px] font-semibold tabular-nums">
            {srNo < 10 ? `0${srNo}` : srNo}
          </span>
        );
      },
    },
    {
      header: 'PRODUCT',
      className: 'min-w-[260px]',
      render: (p) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
            {p.product_image || p.image_url ? (
              <img
                src={p.image_url || p.product_image}
                alt={p.product_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <Package className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setViewProduct(p)}
              className="text-left font-bold text-xs sm:text-[13px] text-slate-900 hover:text-blue-600 transition-colors block truncate w-full cursor-pointer leading-snug"
              title={p.product_name}
            >
              {p.product_name}
            </button>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 truncate max-w-[130px]">
                {p.category?.name || 'General'}
              </span>
              {p.brand?.name && (
                <span className="text-[10px] text-slate-500 font-normal truncate max-w-[110px]">
                  • {p.brand.name}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'AVAILABLE STOCK',
      className: 'min-w-[210px] w-[220px]',
      render: (p) => {
        const qty = p.quantity ?? 0;
        const threshold = p.low_stock_threshold ?? 10;
        const isOutOfStock = qty <= 0;
        const isLow = qty > 0 && qty <= threshold;

        return (
          <div className="flex items-center gap-2.5">
            {/* Styled Quantity Metric Chip */}
            <div
              className={`inline-flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg border font-mono min-w-[86px] shadow-2xs ${
                isOutOfStock
                  ? 'bg-rose-50/60 border-rose-200/90 text-rose-700'
                  : isLow
                  ? 'bg-amber-50/60 border-amber-200/90 text-amber-700'
                  : 'bg-slate-50 border-slate-200/90 text-slate-800'
              }`}
            >
              <span
                className={`text-[13px] font-black tabular-numbers tracking-tight ${
                  isOutOfStock
                    ? 'text-rose-600'
                    : isLow
                    ? 'text-amber-600'
                    : 'text-slate-900'
                }`}
              >
                {qty.toLocaleString()}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isOutOfStock
                    ? 'text-rose-400'
                    : isLow
                    ? 'text-amber-500'
                    : 'text-slate-400'
                }`}
              >
                {p.business_unit || 'Units'}
              </span>
            </div>

            {/* Semantic Status Badge */}
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/90 shadow-2xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Out of Stock</span>
              </span>
            ) : isLow ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/90 shadow-2xs shrink-0">
                <AlertTriangle className="w-3 h-3 text-amber-600 animate-pulse" />
                <span>Low Stock</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>In Stock</span>
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'AVG. PRICE',
      className: 'w-[130px]',
      render: (p) => {
        const avgPrice = p.calculated_average_price ?? p.average_price ?? p.buy_price;
        const hasPrice = avgPrice && Number(avgPrice) > 0;

        return hasPrice ? (
          <span className="text-xs sm:text-sm font-bold font-mono text-slate-800 tabular-numbers">
            ₹{parseFloat(avgPrice).toFixed(2)}
          </span>
        ) : (
          <span className="text-slate-400 font-mono text-xs">—</span>
        );
      },
    },
    {
      header: 'VENDOR',
      className: 'w-[160px]',
      render: (p) => (
        <span
          className={`text-xs truncate block max-w-[150px] ${
            p.vendor ? 'font-semibold text-slate-800' : 'text-slate-400 italic'
          }`}
          title={p.vendor?.vendor_name || 'No Vendor Assigned'}
        >
          {p.vendor ? p.vendor.vendor_name : '—'}
        </span>
      ),
    },
    {
      header: 'OVERSIGHT',
      className: 'w-[100px] text-center',
      render: (p) => (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setViewProduct(p)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 text-slate-700 text-xs font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer group/btn"
            title="Inspect Product Stock Ledger"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-blue-600 transition-colors" />
            <span>Inspect</span>
          </button>
        </div>
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

          {/* Low Stock Alerts Filter Toggle Button */}
          <button
            type="button"
            onClick={() => handleStatusTabChange(stockStatus === 'low_stock' ? 'all' : 'low_stock')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              stockStatus === 'low_stock'
                ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            <span>Low Inventory Alerts</span>
            {metrics.total_alerts > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-700 text-[10px] font-extrabold">
                {metrics.total_alerts}
              </span>
            )}
          </button>
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
          <button
            type="button"
            onClick={() => handleStatusTabChange('low_stock')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <span>Filter Low Stock List</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Unified Table Card */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Top Control Bar: Quick Segment Status Tabs */}
        <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-slate-200/80 bg-slate-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase micro-label">
                Stock Ledger Records
              </h3>
              {pagination?.total !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 text-blue-700">
                  {pagination.total} items
                </span>
              )}
            </div>

            {/* Quick Segment Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 overflow-x-auto">
              <button
                type="button"
                onClick={() => handleStatusTabChange('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  stockStatus === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>All Stocks</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  stockStatus === 'all' ? 'bg-slate-100 text-slate-800' : 'bg-white text-slate-500'
                }`}>
                  {metrics.total_products}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusTabChange('in_stock')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  stockStatus === 'in_stock'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>In Stock</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  stockStatus === 'in_stock' ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-500'
                }`}>
                  {metrics.in_stock_count}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusTabChange('low_stock')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  stockStatus === 'low_stock'
                    ? 'bg-white text-amber-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Low Stock</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  stockStatus === 'low_stock' ? 'bg-amber-100 text-amber-800' : 'bg-white text-slate-500'
                }`}>
                  {metrics.low_stock_count}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusTabChange('out_of_stock')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  stockStatus === 'out_of_stock'
                    ? 'bg-white text-rose-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Depleted</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  stockStatus === 'out_of_stock' ? 'bg-rose-100 text-rose-800' : 'bg-white text-slate-500'
                }`}>
                  {metrics.out_of_stock_count}
                </span>
              </button>
            </div>
          </div>

          {/* Search & Dropdown Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search product name, category, or vendor..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="lg:col-span-3">
              <div className="relative">
                <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs cursor-pointer font-medium"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brand Dropdown */}
            <div className="lg:col-span-3">
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs cursor-pointer font-medium"
                >
                  <option value="">All Brands</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset Filters Button */}
            <div className="lg:col-span-1 flex items-center justify-end">
              {isFiltered ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                  title="Clear all search & dropdown filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="lg:hidden">Reset</span>
                </button>
              ) : (
                <div className="w-full text-center text-[10px] text-slate-400 font-mono hidden lg:block">
                  Live
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seamless Data Table */}
        <DataTable
          containerClassName="w-full overflow-hidden"
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
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Product Stock Ledger Details</h3>
                  <p className="text-xs text-slate-300 truncate max-w-xs font-medium">
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
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Available Stock</span>
                  <span className="text-lg font-black font-mono text-slate-900 mt-0.5 block">
                    {viewProduct.quantity ?? 0}{' '}
                    <span className="text-xs font-medium text-slate-500">{viewProduct.business_unit || 'Units'}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Last Added Qty</span>
                  <span className="text-lg font-black font-mono text-emerald-700 mt-0.5 block">
                    {viewProduct.last_added_quantity ?? viewProduct.quantity ?? 0}{' '}
                    <span className="text-xs font-medium text-slate-500">{viewProduct.business_unit || 'Units'}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Low Threshold</span>
                  <span className="text-lg font-black font-mono text-amber-700 mt-0.5 block">
                    {viewProduct.low_stock_threshold ?? 10}{' '}
                    <span className="text-xs font-medium text-slate-500">Units</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Buy Price</span>
                  <span className="text-sm font-bold font-mono text-slate-800 mt-0.5 block">
                    {viewProduct.buy_price ? `₹${parseFloat(viewProduct.buy_price).toFixed(2)}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">MRP</span>
                  <span className="text-sm font-bold font-mono text-blue-600 mt-0.5 block">
                    {viewProduct.mrp ? `₹${parseFloat(viewProduct.mrp).toFixed(2)}` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Average Cost</span>
                  <span className="text-sm font-bold font-mono text-slate-800 mt-0.5 block">
                    {viewProduct.average_price ? `₹${parseFloat(viewProduct.average_price).toFixed(2)}` : '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Allocated Vendor:</span>
                  <span className="font-semibold text-slate-800">
                    {viewProduct.vendor?.vendor_name || 'No Vendor Assigned'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Last Stocked By:</span>
                  <span className="font-semibold text-slate-800">
                    {viewProduct.inventory_updater?.name || 'Not yet recorded'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Last Updated At:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {viewProduct.inventory_updated_at ? new Date(viewProduct.inventory_updated_at).toLocaleString() : '—'}
                  </span>
                </div>
                {viewProduct.last_issued_at && (
                  <>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium">Last Issued Quantity:</span>
                      <span className="font-bold text-amber-700 font-mono">
                        -{viewProduct.last_issued_quantity} {viewProduct.business_unit || 'Units'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Issued At / By:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {new Date(viewProduct.last_issued_at).toLocaleString()} {viewProduct.issue_issuer?.name ? `(${viewProduct.issue_issuer.name})` : ''}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-800 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  SuperAdmin oversight: Read-only access enabled. Stock modification is restricted to branch Administrators.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewProduct(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
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
