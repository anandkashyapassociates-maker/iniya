import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Boxes,
  Search,
  RefreshCw,
  AlertTriangle,
  Package,
  Layers,
  Building2,
  DollarSign,
  TrendingDown,
  Lock,
  CheckCircle2,
  FileText,
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

  const [searchParams] = useSearchParams();

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
      header: 'PRODUCT DETAILS',
      className: 'min-w-[240px] w-[26%]',
      render: (p) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs relative">
            <Package className="w-4 h-4 text-slate-400" />
            {(p.product_image || p.image_url) && (
              <img
                src={p.image_url || p.product_image}
                alt={p.product_name}
                className="absolute inset-0 w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
          <div className="min-w-0">
            <Link
              to={`/superadmin/inventory/stocks/${p.id}`}
              className="text-left font-bold text-xs sm:text-[13px] text-slate-900 hover:text-blue-600 transition-colors block truncate w-full cursor-pointer leading-snug"
              title={p.product_name}
            >
              {p.product_name}
            </Link>
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
      className: 'min-w-[210px] w-[20%]',
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
      className: 'w-[13%]',
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
      header: 'STOCK VALUE',
      className: 'w-[15%]',
      render: (p) => {
        const qty = Number(p.quantity) || 0;
        const avgPrice = Number(p.calculated_average_price ?? p.average_price ?? p.buy_price ?? 0);
        const stockValue = qty * avgPrice;

        return (
          <div>
            <span className="text-xs font-bold font-mono text-slate-900 block">
              ₹{stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {qty} × ₹{avgPrice.toFixed(2)}
            </span>
          </div>
        );
      },
    },
    {
      header: 'DETAILS',
      className: 'w-[12%] text-center',
      render: (p) => (
        <Link
          to={`/superadmin/inventory/stocks/${p.id}`}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200/80 text-xs font-semibold shadow-2xs transition-all"
          title="View Complete Stock History & Details"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Details</span>
        </Link>
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
        </div>
      </div>

      {/* Real-time KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKUs */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Registered SKUs
            </span>
            <span className="text-2xl font-bold text-slate-900 font-mono mt-0.5 block">
              {metrics.total_products}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Catalog items monitored</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Healthy In Stock */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
              Healthy Stock
            </span>
            <span className="text-2xl font-bold text-emerald-700 font-mono mt-0.5 block">
              {metrics.in_stock_count}
            </span>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">Above threshold limit</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Warning */}
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
    </div>
  );
}
