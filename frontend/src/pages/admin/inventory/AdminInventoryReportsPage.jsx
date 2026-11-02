import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Boxes,
  Search,
  Filter,
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
} from 'lucide-react';
import adminInventoryService from '../../../services/adminInventoryService';

export default function AdminInventoryReportsPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    products: [],
    vendors: [],
    admins: [],
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState('all');

  // Pagination & Metrics
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pagination, setPagination] = useState(null);
  const [metrics, setMetrics] = useState({
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
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Fetch reports data
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedProduct) params.product_id = selectedProduct;
      if (selectedVendor) params.vendor_id = selectedVendor;
      if (selectedAdmin) params.admin_id = selectedAdmin;
      if (selectedType && selectedType !== 'all') params.type = selectedType;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await adminInventoryService.getReports(params);
      setLogs(res.data || []);
      setPagination(res.pagination || null);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch inventory reports:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, search, selectedProduct, selectedVendor, selectedAdmin, selectedType, startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedProduct('');
    setSelectedVendor('');
    setSelectedAdmin('');
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
    selectedType !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate);

  // Export CSV functionality
  const handleExportCSV = () => {
    if (!logs.length) return;

    const headers = [
      'SR. NO.',
      'Date',
      'Time',
      'Product Code',
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

    const rows = logs.map((log, index) => {
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
        `"${log.product?.product_code || ''}"`,
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
    link.setAttribute('download', `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            Detailed transaction audit trail and movement reports filtered by product, date, vendor, admin ownership, and issuance type.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={isLoading || !logs.length}
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

      {/* Real-time KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Filtered Records
            </span>
            <span className="text-2xl font-bold text-slate-900 font-mono mt-0.5 block">
              {metrics.total_records.toLocaleString()}
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
                +{metrics.total_credit_qty.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-600 font-medium">Units</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-semibold mt-0.5 block">
              Val: ₹{metrics.total_credit_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                -{metrics.total_debit_qty.toLocaleString()}
              </span>
              <span className="text-xs text-rose-600 font-medium">Units</span>
            </div>
            <span className="text-[10px] font-mono text-rose-600 font-semibold mt-0.5 block">
              Val: ₹{metrics.total_debit_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                {metrics.net_qty >= 0 ? `+${metrics.net_qty.toLocaleString()}` : metrics.net_qty.toLocaleString()}
              </span>
              <span className="text-xs text-blue-600 font-medium">Units</span>
            </div>
            <span className="text-[10px] font-mono text-blue-700 font-semibold mt-0.5 block">
              Net Val: ₹{metrics.net_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Advanced Filter Control Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Filter Criteria (Products, Dates, Vendors, Admins &amp; Type)</span>
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
                placeholder="Notes, product, bill no..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-800"
              />
            </div>
          </div>

          {/* 2. Product Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-800 truncate"
            >
              <option value="">All Products</option>
              {filterOptions.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Vendor Filter */}
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

          {/* 4. Admin / Performed By */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Performed By (Admin)
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

          {/* 5. Transaction Type */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Transaction Type
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

          {/* 6. Custom Start Date */}
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

          {/* 7. Custom End Date */}
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

      {/* Main Report Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-sm font-bold font-display text-slate-900 tracking-tight">
              Inventory Movement Statements &amp; Audit Trail
            </h2>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {metrics.total_records} record{metrics.total_records !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Per Page Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500">
            <span>Show:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold cursor-pointer"
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
              <p className="text-xs font-medium text-slate-500">Loading inventory transactions...</p>
            </div>
          ) : !logs.length ? (
            <div className="py-16 px-4 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No Inventory Reports Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No stock movement logs match your current filter criteria. Try clearing or expanding your date and vendor filters.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  <th className="py-3.5 px-3 w-14 text-center">SR. NO.</th>
                  <th className="py-3.5 px-4 w-[13%]">Date &amp; Time</th>
                  <th className="py-3.5 px-4 w-[22%]">Product Details</th>
                  <th className="py-3.5 px-4 w-[13%]">Movement Type</th>
                  <th className="py-3.5 px-4 w-[14%]">Performed By</th>
                  <th className="py-3.5 px-4 w-[12%]">Vendor</th>
                  <th className="py-3.5 px-4 w-[10%]">Rate (₹)</th>
                  <th className="py-3.5 px-4 w-[10%] text-right text-emerald-800 bg-emerald-50/60 border-l border-emerald-100">
                    Credit (+ In)
                  </th>
                  <th className="py-3.5 px-4 w-[10%] text-right text-rose-800 bg-rose-50/60 border-l border-rose-100">
                    Debit (- Out)
                  </th>
                  <th className="py-3.5 px-4 w-[12%] text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-normal">
                {logs.map((log, index) => {
                  const srNo = (pagination?.from || 1) + index;
                  const isIssue = log.type === 'issue' || log.type === 'issued';
                  const isAdjustment = log.type === 'adjustment';
                  const dateStr = log.created_at ? new Date(log.created_at).toLocaleDateString() : '—';
                  const timeStr = log.created_at
                    ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';
                  const qty = Math.abs(log.quantity || 0);
                  const rate = Number(log.buy_price || log.average_price || 0);
                  const totalRowVal = qty * rate;
                  const unit = log.business_unit || log.product?.business_unit || 'Units';
                  const vendorName = log.vendor?.vendor_name || log.vendor?.company_name || null;

                  return (
                    <tr
                      key={log.id}
                      className={`transition-colors hover:bg-slate-50/90 ${
                        isIssue ? 'bg-amber-50/15' : 'bg-emerald-50/15'
                      }`}
                    >
                      {/* 1. Sr. No. */}
                      <td className="py-3.5 px-3 text-center align-top">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-500 font-mono text-[11px] font-semibold tabular-nums">
                          {srNo < 10 ? `0${srNo}` : srNo}
                        </span>
                      </td>

                      {/* 2. Date & Time */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono text-slate-800 font-semibold">{dateStr}</div>
                        {timeStr && <div className="text-[11px] font-mono text-slate-400 mt-0.5">{timeStr}</div>}
                      </td>

                      {/* 3. Product Details */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-0.5">
                          <Link
                            to={`/admin/inventory/stocks/${log.product?.id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors block truncate max-w-xs"
                            title={log.product?.product_name}
                          >
                            {log.product?.product_name || '—'}
                          </Link>
                          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                            {log.product?.product_code && (
                              <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                                {log.product.product_code}
                              </span>
                            )}
                            {log.product?.category?.name && (
                              <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
                                {log.product.category.name}
                              </span>
                            )}
                          </div>
                          {log.notes && (
                            <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1" title={log.notes}>
                              Note: {log.notes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 4. Movement Type */}
                      <td className="py-3.5 px-4 align-top">
                        {isIssue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/90 shadow-2xs">
                            <MinusCircle className="w-3 h-3 text-amber-600" />
                            <span>Stock Issued</span>
                          </span>
                        ) : isAdjustment ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200/90 shadow-2xs">
                            <Boxes className="w-3 h-3 text-blue-600" />
                            <span>Adjustment</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
                            <PlusCircle className="w-3 h-3 text-emerald-600" />
                            <span>Stock Added</span>
                          </span>
                        )}
                      </td>

                      {/* 5. Performed By */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 block truncate text-[11px]">
                              {log.admin?.name || 'Admin'}
                            </span>
                            {log.admin?.email && (
                              <span className="text-[10px] text-slate-400 block truncate">
                                {log.admin.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 6. Vendor */}
                      <td className="py-3.5 px-4 align-top">
                        {vendorName ? (
                          <div className="flex items-center gap-1 text-[11px] text-slate-700 font-medium truncate max-w-[140px]" title={vendorName}>
                            <Truck className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{vendorName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* 7. Rate */}
                      <td className="py-3.5 px-4 align-top font-mono font-medium text-slate-700">
                        {rate > 0 ? `₹${rate.toFixed(2)}` : '—'}
                      </td>

                      {/* 8. Credit (+ In) */}
                      <td className="py-3.5 px-4 text-right align-top bg-emerald-50/25 border-l border-emerald-100 font-mono">
                        {!isIssue ? (
                          <span className="text-emerald-700 font-bold text-xs sm:text-sm">
                            +{qty} <span className="text-[10px] font-normal text-emerald-600">{unit}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* 9. Debit (- Out) */}
                      <td className="py-3.5 px-4 text-right align-top bg-rose-50/25 border-l border-rose-100 font-mono">
                        {isIssue ? (
                          <span className="text-rose-700 font-bold text-xs sm:text-sm">
                            -{qty} <span className="text-[10px] font-normal text-rose-600">{unit}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* 10. Total Value */}
                      <td className="py-3.5 px-4 text-right align-top font-mono font-bold text-slate-900">
                        {totalRowVal > 0 ? (
                          `₹${totalRowVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
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
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <span className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-700 font-mono">{pagination.from || 0}</strong> to{' '}
              <strong className="text-slate-700 font-mono">{pagination.to || 0}</strong> of{' '}
              <strong className="text-slate-700 font-mono">{pagination.total || 0}</strong> entries
            </span>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-lg bg-slate-100 text-slate-700">
                Page {page} of {pagination.last_page || 1}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(pagination.last_page || 1, p + 1))}
                disabled={page >= (pagination.last_page || 1) || isLoading}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
