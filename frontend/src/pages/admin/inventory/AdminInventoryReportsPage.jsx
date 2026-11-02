import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Boxes,
  Search,
  RefreshCw,
  Download,
  Calendar,
  User,
  Truck,
  PlusCircle,
  MinusCircle,
  Package,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  FolderTree,
  Tag,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import adminInventoryService from '../../../services/adminInventoryService';
import SearchableProductSelect from '../../../components/SearchableProductSelect';

export default function AdminInventoryReportsPage() {
  // Tab View: 'products' (inventory_products table) | 'transactions' (inventory_stock_logs table)
  const [activeTab, setActiveTab] = useState('products');

  const [dataItems, setDataItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    products: [],
    categories: [],
    vendors: [],
    admins: [],
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all'); // for products
  const [selectedType, setSelectedType] = useState('all'); // for transactions
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pagination, setPagination] = useState(null);

  // Metrics (supports both product and transaction structures)
  const [metrics, setMetrics] = useState({
    total_products: 0,
    total_stock_units: 0,
    total_valuation: 0,
    total_retail_value: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    total_records: 0,
    total_credit_qty: 0,
    total_credit_value: 0,
    total_debit_qty: 0,
    total_debit_value: 0,
    net_qty: 0,
    net_value: 0,
  });

  // Load filter options once on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const res = await adminInventoryService.getReportFilterOptions();
        setFilterOptions({
          products: res.products || [],
          categories: res.categories || [],
          vendors: res.vendors || [],
          admins: res.admins || [],
        });
      } catch (err) {
        console.error('Failed to load report filter options:', err);
      }
    };
    loadFilterOptions();
  }, []);

  // Handle date presets
  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);
    setPage(1);

    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const todayStr = formatDate(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'last_7_days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
    } else if (preset === 'last_30_days') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // Fetch report data from API
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        report_type: activeTab,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedProduct) params.product_id = selectedProduct;
      if (selectedVendor) params.vendor_id = selectedVendor;
      if (selectedAdmin) params.admin_id = selectedAdmin;
      if (selectedCategory) params.category_id = selectedCategory;

      if (activeTab === 'products') {
        if (selectedStockStatus && selectedStockStatus !== 'all') {
          params.stock_status = selectedStockStatus;
        }
      } else {
        if (selectedType && selectedType !== 'all') {
          params.type = selectedType;
        }
      }

      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await adminInventoryService.getReports(params);
      setDataItems(res.data || []);
      setPagination(res.pagination || null);
      if (res.metrics) {
        setMetrics((prev) => ({ ...prev, ...res.metrics }));
      }
    } catch (err) {
      console.error('Failed to load inventory reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    perPage,
    activeTab,
    search,
    selectedProduct,
    selectedVendor,
    selectedAdmin,
    selectedCategory,
    selectedStockStatus,
    selectedType,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedProduct('');
    setSelectedVendor('');
    setSelectedAdmin('');
    setSelectedCategory('');
    setSelectedStockStatus('all');
    setSelectedType('all');
    setStartDate('');
    setEndDate('');
    setDatePreset('all');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(selectedProduct) ||
    Boolean(selectedVendor) ||
    Boolean(selectedAdmin) ||
    Boolean(selectedCategory) ||
    selectedStockStatus !== 'all' ||
    selectedType !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    datePreset !== 'all';

  // Export current table view to CSV
  const handleExportCSV = () => {
    if (!dataItems.length) return;

    if (activeTab === 'products') {
      const headers = [
        'SR. NO.',
        'Product Name',
        'Category',
        'Brand',
        'Vendor',
        'Product Type',
        'Unit',
        'Current Stock Qty',
        'Buy Price (INR)',
        'Total Valuation (INR)',
        'MRP (INR)',
        'Total Retail Value (INR)',
        'Low Stock Threshold',
        'Stock Status',
        'Managed By Admin',
        'Last Updated',
      ];

      const rows = dataItems.map((prod, index) => {
        const srNo = (pagination?.from || 1) + index;
        const buyPrice = Number(prod.buy_price || 0);
        const mrp = Number(prod.mrp || 0);
        const qty = Number(prod.quantity || 0);
        const totalVal = qty * buyPrice;
        const totalRetail = qty * mrp;
        const status =
          qty <= 0
            ? 'Out of Stock'
            : qty <= Number(prod.low_stock_threshold || 10)
            ? 'Low Stock Alert'
            : 'In Stock (Optimal)';
        const adminName =
          prod.inventory_updater?.name || prod.creator?.name || 'Admin';
        const dateStr = prod.inventory_updated_at || prod.updated_at || prod.created_at;

        return [
          srNo,
          `"${(prod.product_name || '').replace(/"/g, '""')}"`,
          `"${(prod.category?.name || 'N/A').replace(/"/g, '""')}"`,
          `"${(prod.brand?.name || 'N/A').replace(/"/g, '""')}"`,
          `"${(prod.vendor?.vendor_name || prod.vendor?.company_name || 'N/A').replace(/"/g, '""')}"`,
          `"${prod.product_type || 'Standard'}"`,
          `"${prod.business_unit || 'Units'}"`,
          qty,
          buyPrice.toFixed(2),
          totalVal.toFixed(2),
          mrp.toFixed(2),
          totalRetail.toFixed(2),
          prod.low_stock_threshold || 10,
          `"${status}"`,
          `"${adminName.replace(/"/g, '""')}"`,
          `"${dateStr ? new Date(dateStr).toLocaleString() : ''}"`,
        ];
      });

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `inventory_products_report_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = [
        'SR. NO.',
        'Date',
        'Time',
        'Product Name',
        'Category',
        'Transaction Type',
        'Performed By',
        'Admin Email',
        'Vendor Name',
        'Rate (INR)',
        'Credit (+ In)',
        'Debit (- Out)',
        'Unit',
        'Total Value (INR)',
        'Notes',
      ];

      const rows = dataItems.map((log, index) => {
        const srNo = (pagination?.from || 1) + index;
        const date = log.created_at ? new Date(log.created_at).toLocaleDateString() : '';
        const time = log.created_at ? new Date(log.created_at).toLocaleTimeString() : '';
        const isIssue = log.type === 'issue' || log.type === 'issued';
        const isAdj = log.type === 'adjustment';
        const qty = Math.abs(log.quantity || 0);
        const rate = Number(log.buy_price || log.average_price || 0);
        const totalVal = qty * rate;

        return [
          srNo,
          `"${date}"`,
          `"${time}"`,
          `"${(log.product?.product_name || '').replace(/"/g, '""')}"`,
          `"${(log.product?.category?.name || '').replace(/"/g, '""')}"`,
          `"${isIssue ? 'Stock Issued' : isAdj ? 'Stock Adjustment' : 'Stock Added'}"`,
          `"${(log.admin?.name || '').replace(/"/g, '""')}"`,
          `"${log.admin?.email || ''}"`,
          `"${(log.vendor?.vendor_name || log.vendor?.company_name || 'N/A').replace(/"/g, '""')}"`,
          rate.toFixed(2),
          !isIssue ? qty : 0,
          isIssue ? qty : 0,
          `"${log.business_unit || log.product?.business_unit || 'Units'}"`,
          totalVal.toFixed(2),
          `"${(log.notes || '').replace(/"/g, '""')}"`,
        ];
      });

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `inventory_transactions_report_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <Boxes className="w-3.5 h-3.5" />
            <span>Pharmacy &amp; Clinic Supply Logistics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight mt-1.5 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Inventory Reports &amp; Stock Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Official inventory valuation and live stock reports with product catalog metrics, suppliers, reorder alerts, and transaction audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={isLoading || !dataItems.length}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-200 transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchReports}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Tab View Switcher (Official Products Report vs Transaction Ledger) */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl w-fit border border-slate-200/80">
        <button
          type="button"
          onClick={() => {
            if (activeTab !== 'products') {
              setActiveTab('products');
              setPage(1);
            }
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Package className={`w-4 h-4 ${activeTab === 'products' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Product Stock &amp; Valuation Report</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (activeTab !== 'transactions') {
              setActiveTab('transactions');
              setPage(1);
            }
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60 font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <RotateCcw className={`w-4 h-4 ${activeTab === 'transactions' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>Stock Transactions &amp; Audit Ledger</span>
        </button>
      </div>

      {/* Real-time KPI Ribbon */}
      {activeTab === 'products' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Products */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Products
              </span>
              <span className="text-2xl font-bold text-slate-900 font-mono mt-0.5 block">
                {(metrics.total_products || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Active catalog items</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Package className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Total Units In Stock */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
                Total In-Hand Stock
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-emerald-700 font-mono">
                  {(metrics.total_stock_units || 0).toLocaleString()}
                </span>
                <span className="text-xs text-emerald-600 font-medium">Units</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Available clinic inventory</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Inventory Valuation */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block">
                Stock Valuation (Cost)
              </span>
              <span className="text-xl font-bold text-indigo-700 font-mono mt-0.5 block">
                ₹{(metrics.total_valuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-indigo-500 mt-0.5 block">Asset value at Buy Price</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Potential Retail Value */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider block">
                Total Retail Value (MRP)
              </span>
              <span className="text-xl font-bold text-purple-700 font-mono mt-0.5 block">
                ₹{(metrics.total_retail_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-purple-500 mt-0.5 block">Max retail realization</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* Card 5: Reorder Alerts */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
                Reorder Alerts
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-amber-700 font-mono">
                  {(metrics.low_stock_count || 0)}
                </span>
                <span className="text-xs font-semibold text-amber-600">Low</span>
                {(metrics.out_of_stock_count || 0) > 0 && (
                  <span className="text-xs font-semibold text-rose-600 font-mono">
                    / {metrics.out_of_stock_count} Out
                  </span>
                )}
              </div>
              <span className="text-[10px] text-amber-600 mt-0.5 block">Items below minimum threshold</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Transactions */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Filtered Records
              </span>
              <span className="text-2xl font-bold text-slate-900 font-mono mt-0.5 block">
                {(metrics.total_records || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Total logged stock events</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200/80">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Total Added (Credit) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
                Stock In (+ Credit)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-emerald-700 font-mono">
                  +{(metrics.total_credit_qty || 0).toLocaleString()}
                </span>
                <span className="text-xs text-emerald-600 font-medium">Units</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold mt-0.5 block">
                Val: ₹{(metrics.total_credit_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Total Issued (Debit) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
                Stock Out (- Debit)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-rose-700 font-mono">
                  -{(metrics.total_debit_qty || 0).toLocaleString()}
                </span>
                <span className="text-xs text-rose-600 font-medium">Units</span>
              </div>
              <span className="text-[10px] font-mono text-rose-600 font-semibold mt-0.5 block">
                Val: ₹{(metrics.total_debit_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Net Movement */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
                Net Stock Movement
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-blue-800 font-mono">
                  {(metrics.net_qty || 0) >= 0 ? '+' : ''}{(metrics.net_qty || 0).toLocaleString()}
                </span>
                <span className="text-xs text-blue-600 font-medium">Units</span>
              </div>
              <span className="text-[10px] font-mono text-blue-600 font-semibold mt-0.5 block">
                Net Val: ₹{(metrics.net_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filter Control Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Filter Criteria (Products, Dates, Vendors, Admins &amp; Status)</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>

        {/* Date Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Date Range:</span>
          </span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'last_7_days', label: 'Last 7 Days' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_30_days', label: 'Last 30 Days' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleDatePresetChange(preset.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                datePreset === preset.id && !startDate && !endDate && preset.id === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : datePreset === preset.id && (startDate || endDate)
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Filter Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {/* 1. Keyword Search */}
          <div className="lg:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Search Keywords
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeTab === 'products' ? 'Product name, unit, category...' : 'Notes, product, bill no...'}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-800"
              />
            </div>
          </div>

          {/* 2. Product Filter (Searchable) */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Product (Searchable)
            </label>
            <SearchableProductSelect
              products={filterOptions.products}
              selectedProductId={selectedProduct}
              onSelectProduct={(id) => {
                setSelectedProduct(id);
                setPage(1);
              }}
              placeholder="Search or select product..."
            />
          </div>

          {/* 3. Category Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-800 truncate"
            >
              <option value="">All Categories</option>
              {filterOptions.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Vendor Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Vendor / Supplier
            </label>
            <select
              value={selectedVendor}
              onChange={(e) => {
                setSelectedVendor(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-800 truncate"
            >
              <option value="">All Vendors</option>
              {filterOptions.vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vendor_name || v.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Admin Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Managed By (Admin)
            </label>
            <select
              value={selectedAdmin}
              onChange={(e) => {
                setSelectedAdmin(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-800 truncate"
            >
              <option value="">All Admins</option>
              {filterOptions.admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Context-Specific Filter (Stock Status vs Transaction Type) */}
          {activeTab === 'products' ? (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Stock Health Status
              </label>
              <select
                value={selectedStockStatus}
                onChange={(e) => {
                  setSelectedStockStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-800"
              >
                <option value="all">All Products</option>
                <option value="in_stock">In Stock (Optimal)</option>
                <option value="low_stock">Low Stock (Reorder Needed)</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Movement Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-800"
              >
                <option value="all">All Movements</option>
                <option value="added">Stock Added (+ Credit)</option>
                <option value="issued">Stock Issued (- Debit)</option>
                <option value="adjustment">Stock Adjustment</option>
              </select>
            </div>
          )}

          {/* 7. Custom Start Date */}
          <div className="sm:col-span-1 lg:col-span-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('custom');
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-800 font-mono"
            />
          </div>

          {/* 8. Custom End Date */}
          <div className="sm:col-span-1 lg:col-span-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-800 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Main Report Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-sm font-bold font-display text-slate-900 tracking-tight">
              {activeTab === 'products'
                ? 'Product Inventory & Valuation Statement'
                : 'Stock Transactions & Movement Audit Trail'}
            </h2>
            {pagination && (
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                {pagination.total} Records
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Rows per page:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 font-semibold focus:outline-hidden"
            >
              <option value="15">15 rows</option>
              <option value="25">25 rows</option>
              <option value="50">50 rows</option>
              <option value="100">100 rows</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-medium text-slate-500">
                {activeTab === 'products'
                  ? 'Loading official inventory products report...'
                  : 'Loading inventory transactions...'}
              </p>
            </div>
          ) : dataItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No inventory records found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No matching records for the selected filters. Try clearing some criteria or expanding your date range.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          ) : activeTab === 'products' ? (
            /* ============================================================== */
            /* 1. OFFICIAL PRODUCTS INVENTORY REPORT (inventory_products)      */
            /* ============================================================== */
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  <th className="py-3.5 px-3 w-14 text-center">SR. NO.</th>
                  <th className="py-3.5 px-4 w-[24%]">Product Name &amp; Classification</th>
                  <th className="py-3.5 px-4 w-[14%]">Category &amp; Brand</th>
                  <th className="py-3.5 px-4 w-[14%]">Vendor / Supplier</th>
                  <th className="py-3.5 px-3 text-center w-20">Unit</th>
                  <th className="py-3.5 px-4 text-right w-24">Buy Price</th>
                  <th className="py-3.5 px-4 text-center w-28">Current Stock</th>
                  <th className="py-3.5 px-4 text-right w-32">Total Valuation</th>
                  <th className="py-3.5 px-3 text-right w-24">MRP (₹)</th>
                  <th className="py-3.5 px-3 text-center w-28">Stock Status</th>
                  <th className="py-3.5 px-4 w-[12%]">Admin</th>
                  <th className="py-3.5 px-3 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {dataItems.map((prod, index) => {
                  const srNo = (pagination?.from || 1) + index;
                  const buyPrice = Number(prod.buy_price || 0);
                  const mrp = Number(prod.mrp || 0);
                  const qty = Number(prod.quantity || 0);
                  const totalVal = qty * buyPrice;
                  const threshold = Number(prod.low_stock_threshold || 10);
                  const isOutOfStock = qty <= 0;
                  const isLowStock = !isOutOfStock && qty <= threshold;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-blue-50/20 transition-colors group"
                    >
                      {/* 1. SR. NO. */}
                      <td className="py-3.5 px-3 text-center font-mono font-semibold text-slate-500 bg-slate-50/40">
                        {srNo}
                      </td>

                      {/* 2. Product Name & Classification */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <Link
                            to={`/admin/inventory/stocks/${prod.id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors block text-xs leading-snug"
                          >
                            {prod.product_name}
                          </Link>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {prod.product_type || 'Standard'}
                            </span>
                            {prod.is_used && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                                In Use
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Category & Brand */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <FolderTree className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{prod.category?.name || '—'}</span>
                          </div>
                          {prod.brand?.name && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Tag className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span className="truncate">{prod.brand.name}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Vendor / Supplier */}
                      <td className="py-3.5 px-4">
                        {prod.vendor ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-slate-800 font-semibold truncate">
                              <Truck className="w-3 h-3 text-blue-500 shrink-0" />
                              <span className="truncate">{prod.vendor.vendor_name || prod.vendor.company_name}</span>
                            </div>
                            {prod.vendor.vendor_code && (
                              <span className="text-[10px] font-mono text-slate-400 block">
                                {prod.vendor.vendor_code}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No Vendor</span>
                        )}
                      </td>

                      {/* 5. Unit */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {prod.business_unit || 'Unit'}
                        </span>
                      </td>

                      {/* 6. Buy Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                        ₹{buyPrice.toFixed(2)}
                      </td>

                      {/* 7. Current Stock */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 font-mono font-bold text-sm text-slate-900 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                          <span>{qty}</span>
                          <span className="text-[10px] font-normal text-slate-500 font-sans">
                            {prod.business_unit}
                          </span>
                        </div>
                      </td>

                      {/* 8. Total Valuation */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/60 inline-block">
                          ₹{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* 9. MRP */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                        ₹{mrp.toFixed(2)}
                      </td>

                      {/* 10. Stock Status */}
                      <td className="py-3.5 px-3 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Low Stock (≤{threshold})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* 11. Admin & Date */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-700 block truncate">
                            {prod.inventory_updater?.name || prod.creator?.name || 'Admin'}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {prod.inventory_updated_at || prod.updated_at
                              ? new Date(prod.inventory_updated_at || prod.updated_at).toLocaleDateString()
                              : '—'}
                          </span>
                        </div>
                      </td>

                      {/* 12. Action */}
                      <td className="py-3.5 px-3 text-center">
                        <Link
                          to={`/admin/inventory/stocks/${prod.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 transition-colors border border-blue-200 hover:border-blue-600 shadow-2xs"
                          title="Open product stock ledger"
                        >
                          <Boxes className="w-3 h-3" />
                          <span>Ledger</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* ============================================================== */
            /* 2. TRANSACTIONS AUDIT LEDGER (inventory_stock_logs)              */
            /* ============================================================== */
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  <th className="py-3.5 px-3 w-14 text-center">SR. NO.</th>
                  <th className="py-3.5 px-4 w-[13%]">Date &amp; Time</th>
                  <th className="py-3.5 px-4 w-[22%]">Product Details</th>
                  <th className="py-3.5 px-4 w-[13%]">Movement Type</th>
                  <th className="py-3.5 px-4 text-right w-[11%]">Rate (₹)</th>
                  <th className="py-3.5 px-4 text-right w-[13%] bg-emerald-50/40 text-emerald-800">
                    Credit (+ In)
                  </th>
                  <th className="py-3.5 px-4 text-right w-[13%] bg-rose-50/40 text-rose-800">
                    Debit (- Out)
                  </th>
                  <th className="py-3.5 px-4 text-right w-[11%] bg-blue-50/40 text-blue-900 font-mono">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {dataItems.map((log, index) => {
                  const srNo = (pagination?.from || 1) + index;
                  const isIssue = log.type === 'issue' || log.type === 'issued';
                  const isAdj = log.type === 'adjustment';
                  const qty = Math.abs(log.quantity || 0);
                  const rate = Number(log.buy_price || log.average_price || 0);
                  const unit = log.business_unit || log.product?.business_unit || 'Unit';
                  const date = log.created_at ? new Date(log.created_at).toLocaleDateString() : '—';
                  const time = log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                  return (
                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* SR. NO. */}
                      <td className="py-3 px-3 text-center font-mono font-semibold text-slate-500 bg-slate-50/40">
                        {srNo}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{date}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{time}</span>
                      </td>

                      {/* Product Details */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {log.product ? (
                            <Link
                              to={`/admin/inventory/stocks/${log.product.id}`}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors block text-xs"
                            >
                              {log.product.product_name}
                            </Link>
                          ) : (
                            <span className="font-bold text-slate-900">Product #{log.product_id}</span>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {log.product?.category?.name && <span>{log.product.category.name}</span>}
                            {log.vendor?.vendor_name && (
                              <span className="text-slate-500">• Sup: {log.vendor.vendor_name}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Movement Type */}
                      <td className="py-3 px-4">
                        {isIssue ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <MinusCircle className="w-3 h-3" />
                            Stock Issued
                          </span>
                        ) : isAdj ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Adjustment
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <PlusCircle className="w-3 h-3" />
                            Stock Added
                          </span>
                        )}
                        {log.admin?.name && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                            by {log.admin.name}
                          </span>
                        )}
                      </td>

                      {/* Rate */}
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {rate > 0 ? `₹${rate.toFixed(2)}` : '—'}
                      </td>

                      {/* Credit (+ In) */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 bg-emerald-50/20">
                        {!isIssue ? `+${qty} ${unit}` : '—'}
                      </td>

                      {/* Debit (- Out) */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 bg-rose-50/20">
                        {isIssue ? `-${qty} ${unit}` : '—'}
                      </td>

                      {/* Running Balance */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-900 bg-blue-50/20">
                        {log.running_balance !== null && log.running_balance !== undefined
                          ? `${log.running_balance} ${unit}`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.total > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white text-xs">
            <span className="text-slate-500">
              Showing <span className="font-semibold text-slate-900">{pagination.from || 1}</span> to{' '}
              <span className="font-semibold text-slate-900">{pagination.to || pagination.total}</span> of{' '}
              <span className="font-semibold text-slate-900">{pagination.total}</span> records
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={pagination.current_page <= 1 || isLoading}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="px-3 py-1 font-mono font-semibold text-slate-700">
                Page {pagination.current_page} of {pagination.last_page}
              </span>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.last_page))}
                disabled={pagination.current_page >= pagination.last_page || isLoading}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
