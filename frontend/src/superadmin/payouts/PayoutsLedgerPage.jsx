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
import { payoutService } from '../services/payoutService';
import { useToast } from '../../context/ToastContext';

export default function PayoutsLedgerPage() {
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
          payoutService.getStaffOptions(),
          payoutService.getVendorOptions(),
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

      const res = await payoutService.getLedger(params);
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
      toast.error('Failed to load payouts ledger.');
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
      const t = formatDate(now);
      setFromDate(t);
      setToDate(t);
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
            <Wallet className="w-5 h-5 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Payouts Ledger</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Audit statement tracking Total Payouts, Paid Disbursements, and Remaining Balances across all accounts.
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
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Total Payouts, Paid Amount, Balance Due, Staff Breakdown, Vendor Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Payout */}
        <div className="bg-white rounded-2xl border border-blue-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              Total Payout
            </span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            {formatCurrency(summary.total_payout_amount || summary.total_disbursed)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{summary.records_count} total records</p>
        </div>

        {/* Paid Amount */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Paid Amount
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-700 mt-2">
            {formatCurrency(summary.total_paid_amount || summary.total_disbursed)}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Cleared disbursements</p>
        </div>

        {/* Balance Due */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
              Balance Due
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-700 mt-2">
            {formatCurrency(summary.total_balance_amount)}
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5">Total outstanding</p>
        </div>

        {/* Staff Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Staff Paid / Bal
            </span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-slate-800 mt-2">
            {formatCurrency(summary.total_staff_disbursed)}
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5">
            Bal: {formatCurrency(summary.total_staff_balance)}
          </p>
        </div>

        {/* Vendor Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Vendor Paid / Bal
            </span>
            <Truck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg font-bold text-slate-800 mt-2">
            {formatCurrency(summary.total_vendor_disbursed)}
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5">
            Bal: {formatCurrency(summary.total_vendor_balance)}
          </p>
        </div>
      </div>

      {/* Comprehensive Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Date Presets Row + Custom Date Pickers in ONE single row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Date Range:</span>
            </span>
            {[
              { id: 'all_time', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'last_7_days', label: 'Last 7 Days' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_30_days', label: 'Last 30 Days' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  datePreset === p.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date range pickers in the same row */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setDatePreset('custom');
                  setPage(1);
                }}
                className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-700"
              />
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setDatePreset('custom');
                  setPage(1);
                }}
                className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-700"
              />
            </div>

            {(search || payoutType !== 'all' || selectedStaffId || selectedVendorId || selectedAccountType || selectedStatus || datePreset !== 'all_time' || fromDate || toDate) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors cursor-pointer ml-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search voucher, note..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Beneficiary Type (All, Staff, Vendor) */}
          <div>
            <select
              value={payoutType}
              onChange={(e) => {
                setPayoutType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
            >
              <option value="all">Beneficiary: All Types</option>
              <option value="staff">Staff Payouts Only</option>
              <option value="vendor">Vendor Payouts Only</option>
            </select>
          </div>

          {/* Staff Wise Filter */}
          <div>
            <select
              value={selectedStaffId}
              disabled={payoutType === 'vendor'}
              onChange={(e) => {
                setSelectedStaffId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Staff: All Staff</option>
              {staffOptions.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.staff_code || `ID: ${st.id}`})
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Wise Filter */}
          <div>
            <select
              value={selectedVendorId}
              disabled={payoutType === 'staff'}
              onChange={(e) => {
                setSelectedVendorId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Vendor: All Vendors</option>
              {vendorOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vendor_name} ({v.vendor_code})
                </option>
              ))}
            </select>
          </div>

          {/* Clearance Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
            >
              <option value="">Status: All</option>
              <option value="paid">Fully Paid</option>
              <option value="partial">Partial Balance</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Account Type (Cash, Bank) */}
          <div>
            <select
              value={selectedAccountType}
              onChange={(e) => {
                setSelectedAccountType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium"
            >
              <option value="">Account Type: All</option>
              <option value="Cash">Cash Mode</option>
              <option value="Bank">Bank Mode</option>
            </select>
          </div>
        </div>
      </div>

      {/* Unified Ledger Table - All English Column Headers */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <h2 className="text-sm font-semibold text-slate-800">Unified Payouts Audit Register</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {pagination.total} records found
            </span>
          </div>

          <div className="text-xs text-slate-500">
            Page {pagination.current_page} of {pagination.last_page}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Sr.</th>
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Beneficiary</th>
                <th className="py-3 px-4 text-right">Total Payout (₹)</th>
                <th className="py-3 px-4 text-right">Paid Amount (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Mode</th>
                <th className="py-3 px-4">Note / Remarks</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <p className="text-xs font-medium">Filtering ledger records...</p>
                    </div>
                  </td>
                </tr>
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wallet className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-medium text-slate-700">No payout records found</p>
                      <p className="text-[11px] text-slate-400">
                        Adjust your date range, staff, vendor, status, or account type filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                ledger.map((item, idx) => {
                  const serialNo = (pagination.current_page - 1) * pagination.per_page + idx + 1;
                  const isStaff = item.payout_type === 'staff';
                  const totalAmt = Number(item.total_amount > 0 ? item.total_amount : item.amount) || 0;
                  const paidAmt = Number(item.paid_amount > 0 ? item.paid_amount : item.amount) || 0;
                  const balAmt = Number(item.balance_amount) || 0;
                  const isPaid = balAmt <= 0;
                  const isPartial = balAmt > 0 && paidAmt > 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">{serialNo}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {item.payout_number}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {item.payout_date ? new Date(item.payout_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {isStaff && item.staff ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-sm border border-emerald-200">Staff</span>
                              <p className="font-semibold text-slate-900">{item.staff.name}</p>
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {item.staff.staff_code} &bull; {item.staff.department || 'General'}
                            </p>
                          </div>
                        ) : !isStaff && item.vendor ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded-sm border border-amber-200">Vendor</span>
                              <p className="font-semibold text-slate-900">{item.vendor.vendor_name}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {item.vendor.company_name ? `${item.vendor.company_name} • ` : ''}
                              <span className="font-mono font-semibold">{item.vendor.vendor_code}</span>
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Beneficiary not found</span>
                        )}
                      </td>

                      {/* Total Payout */}
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        {formatCurrency(totalAmt)}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatCurrency(paidAmt)}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-4 text-right">
                        {balAmt > 0 ? (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {formatCurrency(balAmt)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">₹0.00</span>
                        )}
                      </td>

                      {/* Clearance Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Account Type */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
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

                      <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={item.note || ''}>
                        {item.note || <span className="text-slate-300 italic">-</span>}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedPayout(item);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.last_page > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing {ledger.length} of {pagination.total} records
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 py-1 font-semibold text-slate-800">
                {page} / {pagination.last_page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                disabled={page >= pagination.last_page}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
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
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm tracking-wide">Payout Voucher Details</h3>
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
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Payout Date</p>
                  <p className="font-semibold text-slate-800">
                    {selectedPayout.payout_date ? new Date(selectedPayout.payout_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    }) : '-'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                <p className="text-[10px] uppercase font-semibold text-slate-400">
                  {selectedPayout.payout_type === 'staff' ? 'Staff Beneficiary' : 'Vendor / Supplier'}
                </p>
                {selectedPayout.payout_type === 'staff' && selectedPayout.staff ? (
                  <>
                    <p className="text-sm font-bold text-slate-900">{selectedPayout.staff.name}</p>
                    <p className="text-slate-600">
                      Staff Code: <span className="font-mono font-semibold">{selectedPayout.staff.staff_code || '-'}</span> &bull; {selectedPayout.staff.department || 'General'}
                    </p>
                  </>
                ) : selectedPayout.payout_type === 'vendor' && selectedPayout.vendor ? (
                  <>
                    <p className="text-sm font-bold text-slate-900">{selectedPayout.vendor.vendor_name}</p>
                    <p className="text-slate-600">
                      {selectedPayout.vendor.company_name ? `${selectedPayout.vendor.company_name} • ` : ''}
                      Vendor Code: <span className="font-mono font-semibold">{selectedPayout.vendor.vendor_code || '-'}</span>
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400 italic">Beneficiary not found</p>
                )}
              </div>

              {/* Total Payout, Paid Amount, Balance Due */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                  <p className="text-[10px] uppercase font-bold text-blue-700">Total Payout</p>
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
