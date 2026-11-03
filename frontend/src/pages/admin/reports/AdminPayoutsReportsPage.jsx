import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Building2,
  DollarSign,
  FileText,
  UserCheck,
  Truck,
  CheckCircle2,
  Eye,
  X,
  CreditCard,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Download,
  SlidersHorizontal,
  RotateCcw,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { adminPayoutsReportService } from '../../../services/adminPayoutsReportService';
import { useToast } from '../../../context/ToastContext';

export default function AdminPayoutsReportsPage() {
  const toast = useToast();

  // Data states
  const [ledger, setLedger] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [vendorOptions, setVendorOptions] = useState([]);
  const [summary, setSummary] = useState({
    total_payout_amount: 0,
    total_paid_amount: 0,
    total_balance_amount: 0,
    total_disbursed: 0,
    total_staff_payout: 0,
    total_staff_disbursed: 0,
    total_staff_balance: 0,
    total_vendor_payout: 0,
    total_vendor_disbursed: 0,
    total_vendor_balance: 0,
    total_cash_disbursed: 0,
    total_bank_disbursed: 0,
    records_count: 0,
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [payoutType, setPayoutType] = useState('all'); // all | staff | vendor
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [datePreset, setDatePreset] = useState('all_time');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);

  // Load dropdown options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [staffRes, vendorRes] = await Promise.all([
          adminPayoutsReportService.getStaffOptions(),
          adminPayoutsReportService.getVendorOptions(),
        ]);
        setStaffOptions(staffRes || []);
        setVendorOptions(vendorRes || []);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    loadOptions();
  }, []);

  // Fetch unified ledger
  const fetchLedger = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        search: search.trim() || undefined,
        payout_type: payoutType !== 'all' ? payoutType : undefined,
        staff_id: selectedStaffId || undefined,
        vendor_id: selectedVendorId || undefined,
        account_type: selectedAccountType || undefined,
        status: selectedStatus || undefined,
        preset: datePreset,
        from_date: datePreset === 'custom' || (!['all_time', 'today', 'last_7_days', 'this_month', 'last_30_days'].includes(datePreset) && fromDate) ? fromDate : undefined,
        to_date: datePreset === 'custom' || (!['all_time', 'today', 'last_7_days', 'this_month', 'last_30_days'].includes(datePreset) && toDate) ? toDate : undefined,
      };

      const res = await adminPayoutsReportService.getLedger(params);
      if (res && res.ledger) {
        setLedger(res.ledger.data || []);
        setPagination({
          current_page: res.ledger.current_page || 1,
          last_page: res.ledger.last_page || 1,
          total: res.ledger.total || 0,
          per_page: res.ledger.per_page || 20,
        });
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      toast.error('Failed to load payouts reports.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, search, payoutType, selectedStaffId, selectedVendorId, selectedAccountType, selectedStatus, datePreset, fromDate, toDate, toast]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  // Date Preset Handler
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    setPage(1);

    const now = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const today = formatDate(now);
      setFromDate(today);
      setToDate(today);
    } else if (preset === 'last_7_days') {
      const p = new Date();
      p.setDate(now.getDate() - 6);
      setFromDate(formatDate(p));
      setToDate(formatDate(now));
    } else if (preset === 'this_month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(formatDate(first));
      setToDate(formatDate(now));
    } else if (preset === 'last_30_days') {
      const p = new Date();
      p.setDate(now.getDate() - 29);
      setFromDate(formatDate(p));
      setToDate(formatDate(now));
    } else if (preset === 'all_time') {
      setFromDate('');
      setToDate('');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setPayoutType('all');
    setSelectedStaffId('');
    setSelectedVendorId('');
    setSelectedAccountType('');
    setSelectedStatus('');
    setDatePreset('all_time');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(val) || 0);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!ledger || ledger.length === 0) {
      toast.warning('No records to export');
      return;
    }

    const headers = [
      'Voucher No',
      'Date',
      'Type',
      'Beneficiary Name',
      'Code',
      'Total Amount',
      'Paid Amount',
      'Balance Amount',
      'Payment Mode',
      'Reference No',
      'Status',
      'Note',
    ];

    const rows = ledger.map((item) => {
      const isStaff = item.payout_type === 'staff';
      const beneficiaryName = isStaff
        ? item.staff?.name || 'Staff'
        : item.vendor?.vendor_name || 'Vendor';
      const code = isStaff
        ? item.staff?.staff_code || '-'
        : item.vendor?.vendor_code || '-';

      const totalAmt = item.total_amount > 0 ? item.total_amount : item.amount;
      const paidAmt = item.paid_amount > 0 ? item.paid_amount : item.amount;
      const balAmt = item.balance_amount !== null && item.balance_amount !== undefined ? item.balance_amount : Math.max(0, totalAmt - paidAmt);

      return [
        `"${item.payout_number || ''}"`,
        `"${item.payout_date || ''}"`,
        `"${item.payout_type || ''}"`,
        `"${beneficiaryName.replace(/"/g, '""')}"`,
        `"${code}"`,
        totalAmt,
        paidAmt,
        balAmt,
        `"${item.account_type || ''}"`,
        `"${item.reference_number || ''}"`,
        `"${(balAmt <= 0) ? 'Completed' : 'Partial'}"`,
        `"${(item.note || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payouts_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Payouts report exported to CSV successfully');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md">
            <Wallet className="w-5 h-5 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Payouts Reports</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Audit statement tracking Total Payouts, Paid Disbursements, and Remaining Balances across staff and vendors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchLedger()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Row 1 (2 cards) and Row 2 (3 cards) to avoid amount overflow */}
      <div className="space-y-3.5">
        {/* Row 1: 2 Cards (Total Payout & Paid Amount) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Total Payout */}
          <div className="bg-white rounded-2xl border border-blue-200/80 p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                Total Payout
              </span>
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
            <p
              className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 mt-2 truncate"
              title={formatCurrency(summary.total_payout_amount || summary.total_disbursed)}
            >
              {formatCurrency(summary.total_payout_amount || summary.total_disbursed)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{summary.records_count} total records</p>
          </div>

          {/* Paid Amount */}
          <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Paid Amount
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p
              className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-emerald-700 mt-2 truncate"
              title={formatCurrency(summary.total_paid_amount || summary.total_disbursed)}
            >
              {formatCurrency(summary.total_paid_amount || summary.total_disbursed)}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">Cleared disbursements</p>
          </div>
        </div>

        {/* Row 2: 3 Cards (Balance Due, Staff Paid / Bal, Vendor Paid / Bal) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Balance Due */}
          <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                Balance Due
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p
              className="text-xl sm:text-2xl font-bold tracking-tight text-amber-700 mt-2 truncate"
              title={formatCurrency(summary.total_balance_amount)}
            >
              {formatCurrency(summary.total_balance_amount)}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Total outstanding</p>
          </div>

          {/* Staff Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Staff Paid / Bal
              </span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p
              className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 mt-2 truncate"
              title={formatCurrency(summary.total_staff_disbursed)}
            >
              {formatCurrency(summary.total_staff_disbursed)}
            </p>
            <p className="text-xs text-amber-600 mt-0.5 truncate">
              Bal: {formatCurrency(summary.total_staff_balance)}
            </p>
          </div>

          {/* Vendor Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                Vendor Paid / Bal
              </span>
              <Truck className="w-4 h-4 text-amber-600" />
            </div>
            <p
              className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 mt-2 truncate"
              title={formatCurrency(summary.total_vendor_disbursed)}
            >
              {formatCurrency(summary.total_vendor_disbursed)}
            </p>
            <p className="text-xs text-amber-600 mt-0.5 truncate">
              Bal: {formatCurrency(summary.total_vendor_balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Comprehensive Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-purple-600" />
            <span>Search & Filter Payouts Report</span>
          </div>
          {(search || payoutType !== 'all' || selectedStaffId || selectedVendorId || selectedAccountType || selectedStatus || fromDate || toDate) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium hover:underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Date Presets Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" /> Period:
          </span>
          {[
            { id: 'all_time', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'last_7_days', label: 'Last 7 Days' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_30_days', label: 'Last 30 Days' },
            { id: 'custom', label: 'Custom Range' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetChange(p.id)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                datePreset === p.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search voucher, beneficiary, note..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          {/* Beneficiary Type */}
          <div>
            <select
              value={payoutType}
              onChange={(e) => {
                setPayoutType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-700 font-medium"
            >
              <option value="all">All Beneficiaries (Staff & Vendor)</option>
              <option value="staff">Staff Only</option>
              <option value="vendor">Vendor / Supplier Only</option>
            </select>
          </div>

          {/* Conditional Dropdown for specific Staff / Vendor */}
          {payoutType === 'staff' ? (
            <div>
              <select
                value={selectedStaffId}
                onChange={(e) => {
                  setSelectedStaffId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-700"
              >
                <option value="">All Staff Members</option>
                {staffOptions.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.staff_code})
                  </option>
                ))}
              </select>
            </div>
          ) : payoutType === 'vendor' ? (
            <div>
              <select
                value={selectedVendorId}
                onChange={(e) => {
                  setSelectedVendorId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-700"
              >
                <option value="">All Vendors</option>
                {vendorOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendor_name} ({v.vendor_code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <select
                value={selectedAccountType}
                onChange={(e) => {
                  setSelectedAccountType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-700"
              >
                <option value="">All Payment Modes</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank (Transfer / UPI)</option>
              </select>
            </div>
          )}

          {/* Date range if custom or secondary */}
          <div className="sm:col-span-2 grid grid-cols-2 gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setDatePreset('custom');
                setPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-700"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setDatePreset('custom');
                setPage(1);
              }}
              className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Payouts Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900">Payouts Audit Register</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {pagination.total} records
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Page {pagination.current_page} of {pagination.last_page || 1}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-3 w-10 text-center">Sr.</th>
                <th className="py-3 px-3">Voucher #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4">Beneficiary</th>
                <th className="py-3 px-3 text-center">Type</th>
                <th className="py-3 px-4 text-right">Total Bill (₹)</th>
                <th className="py-3 px-4 text-right">Paid Amount (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Payment Mode</th>
                <th className="py-3 px-3">Reference / Txn</th>
                <th className="py-3 px-3">Note / Remarks</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="13" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                      <p className="text-xs font-medium">Loading payouts reports...</p>
                    </div>
                  </td>
                </tr>
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan="13" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wallet className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-medium text-slate-600">No payout records found matching your filters.</p>
                      <button
                        onClick={handleResetFilters}
                        className="text-xs text-purple-600 hover:underline font-semibold"
                      >
                        Reset filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                ledger.map((item, idx) => {
                  const isStaff = item.payout_type === 'staff';
                  const totalAmt = item.total_amount > 0 ? Number(item.total_amount) : Number(item.amount);
                  const paidAmt = item.paid_amount > 0 ? Number(item.paid_amount) : Number(item.amount);
                  const balAmt = item.balance_amount !== null && item.balance_amount !== undefined
                    ? Number(item.balance_amount)
                    : Math.max(0, totalAmt - paidAmt);
                  const isPaid = balAmt <= 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Sr */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {(pagination.current_page - 1) * perPage + idx + 1}
                      </td>

                      {/* Voucher No */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {item.payout_number}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {item.payout_date ? new Date(item.payout_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }) : '-'}
                      </td>

                      {/* Beneficiary Name & Subtitle */}
                      <td className="py-3 px-4">
                        {isStaff ? (
                          <div>
                            <p className="font-semibold text-slate-900">{item.staff?.name || 'Staff'}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {item.staff?.staff_code || '-'} {item.staff?.department ? `• ${item.staff.department}` : ''}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-slate-900">{item.vendor?.vendor_name || 'Vendor'}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {item.vendor?.vendor_code || '-'} {item.vendor?.company_name ? `• ${item.vendor.company_name}` : ''}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isStaff ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <UserCheck className="w-2.5 h-2.5" />
                            Staff
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Truck className="w-2.5 h-2.5" />
                            Vendor
                          </span>
                        )}
                      </td>

                      {/* Total Bill */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-medium text-slate-900">
                        {formatCurrency(totalAmt)}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-emerald-700">
                        {formatCurrency(paidAmt)}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-semibold">
                        {balAmt > 0 ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {formatCurrency(balAmt)}
                          </span>
                        ) : (
                          <span className="text-slate-400">₹0.00</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Partial
                          </span>
                        )}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {item.account_type === 'Cash' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Banknote className="w-3 h-3" />
                            Cash
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <CreditCard className="w-3 h-3" />
                            Bank
                          </span>
                        )}
                      </td>

                      {/* Ref / Txn */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">
                        {item.reference_number || <span className="text-slate-300">-</span>}
                      </td>

                      {/* Note */}
                      <td className="py-3 px-3 max-w-[150px] truncate text-slate-600" title={item.note || ''}>
                        {item.note || <span className="text-slate-300 italic">-</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedPayout(item);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title="View Voucher Breakdown"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.last_page > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {(pagination.current_page - 1) * perPage + 1} to{' '}
              {Math.min(pagination.current_page * perPage, pagination.total)} of {pagination.total} records
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="text-xs font-semibold text-slate-700 px-2">
                {pagination.current_page} / {pagination.last_page}
              </span>

              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* VIEW VOUCHER MODAL                                       */}
      {/* ======================================================== */}
      {isViewModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm tracking-wide">Payout Voucher Breakdown</h3>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Voucher Number</p>
                  <p className="font-mono text-base font-bold text-slate-900">{selectedPayout.payout_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Disbursement Date</p>
                  <p className="font-semibold text-slate-800">
                    {selectedPayout.payout_date ? new Date(selectedPayout.payout_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    }) : '-'}
                  </p>
                </div>
              </div>

              {/* Beneficiary Card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Beneficiary Details</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">
                    {selectedPayout.payout_type === 'staff'
                      ? selectedPayout.staff?.name || 'Staff'
                      : selectedPayout.vendor?.vendor_name || 'Vendor'}
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                    {selectedPayout.payout_type}
                  </span>
                </div>
                <p className="text-slate-600 font-mono text-[11px]">
                  {selectedPayout.payout_type === 'staff'
                    ? `${selectedPayout.staff?.staff_code || '-'} • ${selectedPayout.staff?.department || 'Staff'}`
                    : `${selectedPayout.vendor?.vendor_code || '-'} ${selectedPayout.vendor?.company_name ? `• ${selectedPayout.vendor.company_name}` : ''}`}
                </p>
              </div>

              {/* Financial Breakdown */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                  <p className="text-[10px] uppercase font-bold text-blue-700">Total Bill</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {formatCurrency(selectedPayout.total_amount > 0 ? selectedPayout.total_amount : selectedPayout.amount)}
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
                  <p className="text-[10px] uppercase font-bold text-emerald-700">Paid Amount</p>
                  <p className="text-sm font-bold text-emerald-700 mt-1">
                    {formatCurrency(selectedPayout.paid_amount > 0 ? selectedPayout.paid_amount : selectedPayout.amount)}
                  </p>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-center">
                  <p className="text-[10px] uppercase font-bold text-amber-700">Balance Due</p>
                  <p className="text-sm font-bold text-amber-700 mt-1">
                    {formatCurrency(selectedPayout.balance_amount || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Payment Mode</p>
                  <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    {selectedPayout.account_type === 'Cash' ? (
                      <Banknote className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                    )}
                    {selectedPayout.account_type}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Clearance Status</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {(Number(selectedPayout.balance_amount) || 0) <= 0 ? (
                      <span className="text-emerald-700 font-semibold">Fully Paid</span>
                    ) : (
                      <span className="text-amber-700 font-semibold">Partial (Balance Due)</span>
                    )}
                  </p>
                </div>
              </div>

              {selectedPayout.reference_number && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Reference / Txn ID</p>
                  <p className="font-mono font-semibold text-slate-800 mt-0.5">{selectedPayout.reference_number}</p>
                </div>
              )}

              {selectedPayout.note && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Note / Remarks</p>
                  <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">{selectedPayout.note}</p>
                </div>
              )}

              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Authorized by: {selectedPayout.super_admin?.name || 'Super Admin'}</span>
                <span>Status: Completed</span>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
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
