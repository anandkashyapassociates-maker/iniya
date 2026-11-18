import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Wallet,
  Search,
  RefreshCw,
  Calendar,
  Building2,
  FileText,
  CheckCircle2,
  Eye,
  X,
  CreditCard,
  Banknote,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Clock,
  Printer,
  Stethoscope,
  Activity,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAdminAuth } from '../../../features/auth/AdminAuthContext';
import staffPaymentService from '../../../services/staffPaymentService';
import { useToast } from '../../../context/ToastContext';

export default function StaffPaymentsReportPage() {
  const { user } = useAdminAuth();
  const toast = useToast();

  const isStaff =
    user?.role?.toLowerCase() === 'staff' ||
    user?.user_type?.toLowerCase() === 'staff' ||
    Boolean(user?.is_staff) ||
    user?.role === 'Staff Practitioner' ||
    Boolean(user?.staff_code);

  // Active Tab: 'payouts' | 'sessions'
  const [activeTab, setActiveTab] = useState('payouts');

  // Payouts State
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState({
    total_payout_amount: 0,
    total_paid_amount: 0,
    total_balance_amount: 0,
    total_cash_disbursed: 0,
    total_bank_disbursed: 0,
    total_vouchers_count: 0,
    total_session_commission: 0,
    completed_sessions_count: 0,
  });
  const [staffInfo, setStaffInfo] = useState(null);
  const [payoutsPagination, setPayoutsPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
  });
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(true);

  // Payouts Filters
  const [payoutSearch, setPayoutSearch] = useState('');
  const [payoutAccountType, setPayoutAccountType] = useState('');
  const [payoutStatus, setPayoutStatus] = useState('');
  const [datePreset, setDatePreset] = useState('all_time');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [payoutPage, setPayoutPage] = useState(1);

  // Sessions State
  const [sessions, setSessions] = useState([]);
  const [sessionsPagination, setSessionsPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
  });
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Sessions Filters
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionStatus, setSessionStatus] = useState('all');
  const [sessionDatePreset, setSessionDatePreset] = useState('all');
  const [sessionPage, setSessionPage] = useState(1);

  // Modal State
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Fetch Payouts and Summary
  const fetchPayouts = useCallback(async () => {
    setIsLoadingPayouts(true);
    try {
      const params = {
        page: payoutPage,
        per_page: 15,
        search: payoutSearch.trim() || undefined,
        account_type: payoutAccountType || undefined,
        status: payoutStatus || undefined,
        preset: datePreset,
        from_date: datePreset === 'custom' || (!['all_time', 'today', 'this_month', 'last_30_days'].includes(datePreset) && fromDate) ? fromDate : undefined,
        to_date: datePreset === 'custom' || (!['all_time', 'today', 'this_month', 'last_30_days'].includes(datePreset) && toDate) ? toDate : undefined,
      };

      const res = await staffPaymentService.getMyPayments(params);
      if (res && res.payouts) {
        setPayouts(res.payouts.data || []);
        setPayoutsPagination({
          current_page: res.payouts.current_page || 1,
          last_page: res.payouts.last_page || 1,
          total: res.payouts.total || 0,
          per_page: res.payouts.per_page || 15,
        });
      }
      if (res && res.summary) {
        setSummary(res.summary);
      }
      if (res && res.staff) {
        setStaffInfo(res.staff);
      }
    } catch (err) {
      console.error('Failed to load staff payments:', err);
      toast.error('Unable to fetch payments statement.');
    } finally {
      setIsLoadingPayouts(false);
    }
  }, [payoutPage, payoutSearch, payoutAccountType, payoutStatus, datePreset, fromDate, toDate, toast]);

  // Fetch Session Commissions
  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const params = {
        page: sessionPage,
        per_page: 15,
        search: sessionSearch.trim() || undefined,
        status: sessionStatus !== 'all' ? sessionStatus : undefined,
        date: sessionDatePreset !== 'all' ? sessionDatePreset : undefined,
      };

      const res = await staffPaymentService.getSessionCommissions(params);
      if (res && res.sessions) {
        setSessions(res.sessions.data || []);
        setSessionsPagination({
          current_page: res.sessions.current_page || 1,
          last_page: res.sessions.last_page || 1,
          total: res.sessions.total || 0,
          per_page: res.sessions.per_page || 15,
        });
      }
    } catch (err) {
      console.error('Failed to load session commissions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [sessionPage, sessionSearch, sessionStatus, sessionDatePreset]);

  // Initial load & Tab switch effect
  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab, fetchSessions]);

  // View Voucher Details
  const handleViewVoucher = async (payoutItem) => {
    setSelectedPayout(payoutItem);
    setIsVoucherModalOpen(true);
    try {
      const res = await staffPaymentService.getVoucherDetails(payoutItem.id);
      if (res && res.payout) {
        setSelectedPayout(res.payout);
      }
    } catch (err) {
      console.error('Failed to load complete voucher details:', err);
    }
  };

  // Reset Payout Filters
  const handleResetPayoutFilters = () => {
    setPayoutSearch('');
    setPayoutAccountType('');
    setPayoutStatus('');
    setDatePreset('all_time');
    setFromDate('');
    setToDate('');
    setPayoutPage(1);
  };

  // Reset Session Filters
  const handleResetSessionFilters = () => {
    setSessionSearch('');
    setSessionStatus('all');
    setSessionDatePreset('all');
    setSessionPage(1);
  };

  const hasPayoutFilters = Boolean(
    payoutSearch || payoutAccountType || payoutStatus || datePreset !== 'all_time' || fromDate || toDate
  );

  const hasSessionFilters = Boolean(
    sessionSearch || sessionStatus !== 'all' || sessionDatePreset !== 'all'
  );

  // If logged-in user is not staff, redirect
  if (user && !isStaff) {
    return <Navigate to="/admin/reports/payouts" replace />;
  }

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. HEADER CARD WITH CLINIC CONTEXT                      */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center space-x-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
              <Wallet className="w-3.5 h-3.5 text-amber-600" />
              <span>Staff Financials &amp; Disbursements</span>
            </div>
            {(user?.clinic || staffInfo?.clinic) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 text-xs font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                <Building2 className="w-3 h-3 text-teal-600" />
                <span>
                  {(user?.clinic?.name || staffInfo?.clinic?.name)}
                  {' '}({(user?.clinic?.branch_name || staffInfo?.clinic?.branch_name || user?.clinic?.clinic_code)})
                </span>
              </span>
            )}
            {user?.staff_code && (
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-full">
                {user.staff_code}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Payments Report &amp; Payout Vouchers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your disbursed payouts from Super Administration, official vouchers, and clinical session commissions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'payouts') fetchPayouts();
              else fetchSessions();
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Refresh payments data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(isLoadingPayouts || isLoadingSessions) ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. FINANCIAL KPI METRICS SUMMARY (4 CARDS)              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Payouts Received */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100/80 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/0 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Disbursed
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ₹{Number(summary.total_paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">Total Payouts Received</p>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Disbursed by Super Administration</span>
          </div>
        </div>

        {/* Pending Balance Payable */}
        <div className="bg-white p-5 rounded-2xl border border-amber-100/80 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-orange-500/0 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
              Balance
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
            ₹{Number(summary.total_balance_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">Pending Balance</p>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Outstanding from total ₹{Number(summary.total_payout_amount || 0).toLocaleString('en-IN')} approved
          </div>
        </div>

        {/* Clinical Session Earnings */}
        <div className="bg-white p-5 rounded-2xl border border-blue-100/80 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-indigo-500/0 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              Commissions
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
            ₹{Number(summary.total_session_commission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">Clinical Sessions Earnings</p>
          <div className="mt-2 text-[11px] text-blue-600 font-medium flex items-center gap-1.5">
            <Stethoscope className="w-3 h-3 text-blue-500" />
            <span>From {summary.completed_sessions_count || 0} completed OPD sessions</span>
          </div>
        </div>

        {/* Total Payout Vouchers */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100/80 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/0 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
              Vouchers
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {summary.total_vouchers_count || 0}
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">Official Payout Vouchers</p>
          <div className="mt-2 text-[11px] text-purple-700 font-medium">
            Cash: ₹{Number(summary.total_cash_disbursed || 0).toLocaleString('en-IN')} • Bank: ₹{Number(summary.total_bank_disbursed || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. TABBED VIEW NAVIGATION                                */}
      {/* ======================================================== */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('payouts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'payouts'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Payout Disbursements &amp; Vouchers</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'payouts' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {summary.total_vouchers_count || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'sessions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Clinical Session Earnings</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'sessions' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {summary.completed_sessions_count || 0}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 4. TAB 1: PAYOUT DISBURSEMENTS CONTENT                   */}
      {/* ======================================================== */}
      {activeTab === 'payouts' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={payoutSearch}
                onChange={(e) => {
                  setPayoutSearch(e.target.value);
                  setPayoutPage(1);
                }}
                placeholder="Search voucher #, reference #, note..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Presets */}
              <select
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value);
                  setPayoutPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-colors"
              >
                <option value="all_time">All Time</option>
                <option value="today">Today</option>
                <option value="this_month">This Month</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="custom">Custom Date Range</option>
              </select>

              {datePreset === 'custom' && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setPayoutPage(1);
                    }}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setPayoutPage(1);
                    }}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              )}

              {/* Account Type (Mode) */}
              <select
                value={payoutAccountType}
                onChange={(e) => {
                  setPayoutAccountType(e.target.value);
                  setPayoutPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-colors"
              >
                <option value="">All Payment Modes</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
              </select>

              {/* Status */}
              <select
                value={payoutStatus}
                onChange={(e) => {
                  setPayoutStatus(e.target.value);
                  setPayoutPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>

              {/* Reset button */}
              {hasPayoutFilters && (
                <button
                  type="button"
                  onClick={handleResetPayoutFilters}
                  className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/60 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Reset filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-3.5 w-12 text-center">Sr.</th>
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Disbursed Date</th>
                  <th className="py-3 px-4 text-right">Total Payout (₹)</th>
                  <th className="py-3 px-4 text-right">Paid Amount (₹)</th>
                  <th className="py-3 px-4 text-right">Balance (₹)</th>
                  <th className="py-3 px-4 text-center">Payment Mode</th>
                  <th className="py-3 px-4">Ref / Cheque #</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingPayouts ? (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                        <span className="text-xs font-medium">Loading payout disbursements...</span>
                      </div>
                    </td>
                  </tr>
                ) : payouts.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Wallet className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                        <span className="font-semibold text-slate-600">No payout records found</span>
                        <span className="text-xs text-slate-400">
                          {hasPayoutFilters
                            ? 'Try adjusting your search criteria or resetting filters.'
                            : 'No official payouts have been disbursed to your account yet.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  payouts.map((item, idx) => {
                    const rowNumber = (payoutsPagination.current_page - 1) * payoutsPagination.per_page + (idx + 1);
                    const totalVal = Number(item.total_amount > 0 ? item.total_amount : item.amount || 0);
                    const paidVal = Number(item.paid_amount > 0 ? item.paid_amount : item.amount || 0);
                    const balVal = Number(item.balance_amount || 0);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5 text-center font-mono text-slate-400">{rowNumber}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 text-[11px]">
                            <FileText className="w-3 h-3 text-amber-600" />
                            {item.payout_number}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                          {item.payout_date ? (
                            <span className="font-medium text-slate-800">
                              {new Date(item.payout_date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          ₹{paidVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          {balVal > 0 ? (
                            <span className="text-amber-600">
                              ₹{balVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-slate-400">₹0.00</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.account_type === 'Bank'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {item.account_type === 'Bank' ? (
                              <CreditCard className="w-3 h-3" />
                            ) : (
                              <Banknote className="w-3 h-3" />
                            )}
                            {item.account_type || 'Cash'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {item.reference_number || '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.status === 'completed'
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.status || 'Completed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleViewVoucher(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            title="View official voucher"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Voucher</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Payouts Pagination */}
          {payoutsPagination.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
              <div>
                Showing {(payoutsPagination.current_page - 1) * payoutsPagination.per_page + 1} to{' '}
                {Math.min(payoutsPagination.current_page * payoutsPagination.per_page, payoutsPagination.total)} of{' '}
                {payoutsPagination.total} disbursements
              </div>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  disabled={payoutsPagination.current_page <= 1}
                  onClick={() => setPayoutPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-semibold text-slate-700">
                  Page {payoutsPagination.current_page} of {payoutsPagination.last_page}
                </span>
                <button
                  type="button"
                  disabled={payoutsPagination.current_page >= payoutsPagination.last_page}
                  onClick={() => setPayoutPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TAB 2: CLINICAL SESSIONS BREAKDOWN                    */}
      {/* ======================================================== */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={sessionSearch}
                onChange={(e) => {
                  setSessionSearch(e.target.value);
                  setSessionPage(1);
                }}
                placeholder="Search patient, appointment #, service..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={sessionDatePreset}
                onChange={(e) => {
                  setSessionDatePreset(e.target.value);
                  setSessionPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
              >
                <option value="all">All Dates</option>
                <option value="today">Today's Sessions</option>
                <option value="this_month">This Month</option>
              </select>

              <select
                value={sessionStatus}
                onChange={(e) => {
                  setSessionStatus(e.target.value);
                  setSessionPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
              </select>

              {hasSessionFilters && (
                <button
                  type="button"
                  onClick={handleResetSessionFilters}
                  className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/60 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Reset filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Sessions Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-3.5 w-12 text-center">Sr.</th>
                  <th className="py-3 px-4">Session Date &amp; Time</th>
                  <th className="py-3 px-4">Master Appt #</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Service / Treatment</th>
                  <th className="py-3 px-4 text-right">Commission Fee (₹)</th>
                  <th className="py-3 px-4 text-center">Session Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingSessions ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="text-xs font-medium">Loading session commissions...</span>
                      </div>
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Stethoscope className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                        <span className="font-semibold text-slate-600">No clinical session earnings found</span>
                        <span className="text-xs text-slate-400">
                          {hasSessionFilters
                            ? 'Try clearing your filters.'
                            : 'Assigned sessions will appear here as you perform OPD consultations.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sessions.map((ses, idx) => {
                    const rowNum = (sessionsPagination.current_page - 1) * sessionsPagination.per_page + (idx + 1);
                    const commVal = Number(ses.consultation_fee || ses.staff_commission || 0);

                    return (
                      <tr key={ses.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5 text-center font-mono text-slate-400">{rowNum}</td>
                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">
                            {ses.session_date ? new Date(ses.session_date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }) : '—'}
                          </div>
                          {ses.session_time && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{ses.session_time}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          {ses.master_appointment?.appointment_number || `SESS-${ses.id}`}
                        </td>
                        <td className="py-3 px-4 text-slate-800">
                          <div className="font-semibold">{ses.master_appointment?.customer?.name || 'Walk-in Patient'}</div>
                          {ses.master_appointment?.customer?.mobile && (
                            <div className="text-[11px] text-slate-400 font-mono">
                              {ses.master_appointment?.customer?.mobile}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div className="font-medium text-slate-800">{ses.service?.name || ses.treatment_details || 'General Consultation'}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                          ₹{commVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              ses.status === 'completed'
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : ses.status === 'in_progress'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {ses.status === 'completed' ? 'Completed' : ses.status === 'in_progress' ? 'Active' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Sessions Pagination */}
          {sessionsPagination.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
              <div>
                Showing {(sessionsPagination.current_page - 1) * sessionsPagination.per_page + 1} to{' '}
                {Math.min(sessionsPagination.current_page * sessionsPagination.per_page, sessionsPagination.total)} of{' '}
                {sessionsPagination.total} clinical sessions
              </div>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  disabled={sessionsPagination.current_page <= 1}
                  onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-semibold text-slate-700">
                  Page {sessionsPagination.current_page} of {sessionsPagination.last_page}
                </span>
                <button
                  type="button"
                  disabled={sessionsPagination.current_page >= sessionsPagination.last_page}
                  onClick={() => setSessionPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. OFFICIAL PAYOUT VOUCHER MODAL                         */}
      {/* ======================================================== */}
      {isVoucherModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">Official Staff Payout Voucher</h3>
                  <p className="text-[10px] text-slate-400">Iniya Aesthetics &amp; Wellness Disbursement Statement</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Voucher Body (Printable area) */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Clinic Banner & Voucher Number */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Voucher Reference</span>
                  <div className="font-mono text-lg font-black text-amber-700 mt-0.5">
                    {selectedPayout.payout_number}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Disbursement Date:{' '}
                      <strong className="text-slate-800">
                        {selectedPayout.payout_date
                          ? new Date(selectedPayout.payout_date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })
                          : '—'}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-sm text-slate-900">
                    {selectedPayout.staff?.clinic?.name || user?.clinic?.name || 'Iniya Aesthetics & Wellness'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedPayout.staff?.clinic?.branch_name ? `(${selectedPayout.staff.clinic.branch_name})` : ''}
                    {selectedPayout.staff?.clinic?.location ? ` • ${selectedPayout.staff.clinic.location}` : ''}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {selectedPayout.staff?.clinic?.clinic_code || user?.clinic?.clinic_code || ''}
                  </div>
                </div>
              </div>

              {/* Beneficiary Details */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-2">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>Beneficiary Staff Member</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Staff Name &amp; Code</span>
                    <span className="font-bold text-slate-800">
                      {selectedPayout.staff?.name || user?.name || 'Staff Member'}{' '}
                      <span className="text-amber-700 font-mono text-[11px]">
                        ({selectedPayout.staff?.staff_code || user?.staff_code})
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Role &amp; Department</span>
                    <span className="font-semibold text-slate-800">
                      {selectedPayout.staff?.designation || user?.designation || 'Staff Practitioner'}{' '}
                      {selectedPayout.staff?.department ? `• ${selectedPayout.staff.department}` : ''}
                    </span>
                  </div>
                  {selectedPayout.staff?.mobile && (
                    <div>
                      <span className="text-slate-500 block text-[11px]">Contact Mobile</span>
                      <span className="font-mono text-slate-700">{selectedPayout.staff.mobile}</span>
                    </div>
                  )}
                  {selectedPayout.staff?.address && (
                    <div>
                      <span className="text-slate-500 block text-[11px]">Residential Address</span>
                      <span className="text-slate-700 truncate">{selectedPayout.staff.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Amount Breakdown Box */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-600">
                  Payment Statement Breakdown
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-slate-600">Total Approved Payout Amount:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{Number(selectedPayout.total_amount > 0 ? selectedPayout.total_amount : selectedPayout.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between bg-emerald-50/40">
                    <span className="font-semibold text-emerald-800">Paid Amount (Disbursed):</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">
                      ₹{Number(selectedPayout.paid_amount > 0 ? selectedPayout.paid_amount : selectedPayout.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-slate-600">Remaining Balance Payable:</span>
                    <span className="font-mono font-bold text-amber-700">
                      ₹{Number(selectedPayout.balance_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Mode & Reference Metadata */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Payment Mode</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    {selectedPayout.account_type === 'Bank' ? (
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>{selectedPayout.account_type || 'Cash'}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reference / UTR / Cheque #</span>
                  <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                    {selectedPayout.reference_number || 'N/A (Cash Handover)'}
                  </span>
                </div>
              </div>

              {/* Note / Remarks */}
              {selectedPayout.note && (
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block mb-0.5">
                    Disbursement Notes
                  </span>
                  <p className="text-slate-700 italic">{selectedPayout.note}</p>
                </div>
              )}

              {/* Official Seal / Signature block */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Authorized by Super Administration</span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-slate-700">
                    {selectedPayout.super_admin?.name ? `Issued by: ${selectedPayout.super_admin.name}` : 'Corporate Accounts Desk'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer shadow-xs"
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
