import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Building2,
  DollarSign,
  FileText,
  UserCheck,
  CheckCircle2,
  Edit,
  Eye,
  X,
  CreditCard,
  Banknote,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  RotateCcw,
  Lock,
  Compass,
  Globe,
  MapPin,
  Phone,
  Mail,
  Sparkles,
} from 'lucide-react';
import { payoutService } from '../services/payoutService';
import clinicManagementService from '../services/clinicManagementService';
import { useToast } from '../../context/ToastContext';
import { getImageUrl } from '../../utils/imageUrl';

export default function StaffPayoutsPage() {
  const toast = useToast();

  // Data states
  const [payouts, setPayouts] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(false);
  const [summary, setSummary] = useState({
    total_payout_amount: 0,
    total_paid_amount: 0,
    total_balance_amount: 0,
    total_amount: 0,
    total_count: 0,
    cash_amount: 0,
    bank_amount: 0,
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // View Voucher Modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);

  // Robustly load clinics list on mount using getClinicOptions + fallback
  const loadClinics = useCallback(async () => {
    setIsLoadingClinics(true);
    try {
      let list = [];
      try {
        const res = await clinicManagementService.getClinicOptions();
        list = res?.clinics || res?.data || (Array.isArray(res) ? res : []);
      } catch (optErr) {
        console.warn('getClinicOptions failed, trying fallback to getClinics:', optErr);
      }

      if (!list || list.length === 0) {
        const fallbackRes = await clinicManagementService.getClinics({ per_page: 100 });
        list = fallbackRes?.data || fallbackRes?.clinics || (Array.isArray(fallbackRes) ? fallbackRes : []);
      }

      setClinics(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load clinic options:', err);
    } finally {
      setIsLoadingClinics(false);
    }
  }, []);

  // Load staff options for selection
  const loadStaffOptions = useCallback(async () => {
    try {
      const data = await payoutService.getStaffOptions();
      setStaffOptions(data || []);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    }
  }, []);

  // Fetch staff payouts list
  const fetchPayouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        search: search.trim() || undefined,
        clinic_id: selectedClinicId || undefined,
        staff_id: selectedStaffId || undefined,
        account_type: selectedAccountType || undefined,
        status: selectedStatus || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      };

      const res = await payoutService.getStaffPayouts(params);
      if (res && res.payouts) {
        setPayouts(res.payouts.data || []);
        setPagination({
          current_page: res.payouts.current_page || 1,
          last_page: res.payouts.last_page || 1,
          total: res.payouts.total || 0,
          per_page: res.payouts.per_page || 15,
        });
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      toast.error('Failed to load staff payouts. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, search, selectedClinicId, selectedStaffId, selectedAccountType, selectedStatus, fromDate, toDate, toast]);

  useEffect(() => {
    loadClinics();
  }, [loadClinics]);

  useEffect(() => {
    loadStaffOptions();
  }, [loadStaffOptions]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);



  const handleResetFilters = () => {
    setSearch('');
    setSelectedClinicId('');
    setSelectedStaffId('');
    setSelectedAccountType('');
    setSelectedStatus('');
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 via-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0 icon-3d shadow-md shadow-emerald-500/20">
            <UserCheck className="w-6 h-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Staff Payouts</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Disburse payouts, allowances, and track total payouts, paid disbursements, and remaining balances.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchPayouts()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/superadmin/payouts/staff/create"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Disburse Staff Payout</span>
          </Link>
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
              title={formatCurrency(summary.total_payout_amount || summary.total_amount)}
            >
              {formatCurrency(summary.total_payout_amount || summary.total_amount)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Total payable payouts & dues</p>
          </div>

          {/* Total Paid */}
          <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Paid Amount
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p
              className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-emerald-700 mt-2 truncate"
              title={formatCurrency(summary.total_paid_amount || summary.total_amount)}
            >
              {formatCurrency(summary.total_paid_amount || summary.total_amount)}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">{summary.total_count} vouchers paid</p>
          </div>
        </div>

        {/* Row 2: 3 Cards (Balance Due, Cash Paid, Bank Paid) */}
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
            <p className="text-xs text-amber-600 mt-0.5">Pending balance</p>
          </div>

          {/* Cash Paid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                Cash Paid
              </span>
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <p
              className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 mt-2 truncate"
              title={formatCurrency(summary.cash_amount)}
            >
              {formatCurrency(summary.cash_amount)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Physical cash drawer</p>
          </div>

          {/* Bank Paid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                Bank Paid
              </span>
              <CreditCard className="w-4 h-4 text-indigo-600" />
            </div>
            <p
              className="text-lg sm:text-xl font-bold tracking-tight text-indigo-700 mt-2 truncate"
              title={formatCurrency(summary.bank_amount)}
            >
              {formatCurrency(summary.bank_amount)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">NEFT / RTGS / UPI</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Search & Filter Staff Payouts</span>
          </div>
          {(search || selectedClinicId || selectedStaffId || selectedAccountType || selectedStatus || fromDate || toDate) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search voucher, staff, note..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Clinic Branch Filter */}
          <div>
            <select
              value={selectedClinicId}
              onChange={(e) => {
                setSelectedClinicId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 font-medium"
            >
              <option value="">All Clinic Branches</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.clinic_code || `ID: ${c.id}`})
                </option>
              ))}
            </select>
          </div>

          {/* Staff Dropdown */}
          <div>
            <select
              value={selectedStaffId}
              onChange={(e) => {
                setSelectedStaffId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700"
            >
              <option value="">All Staff Members</option>
              {staffOptions.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.staff_code || `ID: ${st.id}`})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 font-medium"
            >
              <option value="">Status: All</option>
              <option value="paid">Fully Paid</option>
              <option value="partial">Partial Balance</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Account Type Selection */}
          <div>
            <select
              value={selectedAccountType}
              onChange={(e) => {
                setSelectedAccountType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700"
            >
              <option value="">Account Type: All</option>
              <option value="Cash">Cash Mode</option>
              <option value="Bank">Bank Mode</option>
            </select>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-1/2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700"
              title="From Date"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-1/2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700"
              title="To Date"
            />
          </div>
        </div>
      </div>

      {/* Payouts Table - All English Column Headers */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h2 className="text-sm font-semibold text-slate-800">Staff Disbursement Register</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {pagination.total} records
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
                <th className="py-3 px-4">Staff Beneficiary</th>
                <th className="py-3 px-4">Clinic Branch</th>
                <th className="py-3 px-4 text-right">Total Payout (₹)</th>
                <th className="py-3 px-4 text-right">Paid Amount (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Account Type</th>
                <th className="py-3 px-4">Note / Remarks</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <p className="text-xs font-medium">Loading staff payouts...</p>
                    </div>
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserCheck className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-medium text-slate-700">No staff payouts found</p>
                      <p className="text-[11px] text-slate-400">
                        Try modifying filters or click &ldquo;Disburse Staff Payout&rdquo; to record a new transaction.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                payouts.map((item, idx) => {
                  const serialNo = (pagination.current_page - 1) * pagination.per_page + idx + 1;
                  const totalAmt = Number(item.total_amount > 0 ? item.total_amount : item.amount) || 0;
                  const paidAmt = Number(item.paid_amount > 0 ? item.paid_amount : item.amount) || 0;
                  const balAmt = Number(item.balance_amount) || 0;
                  const isPaid = balAmt <= 0;
                  const isPartial = balAmt > 0 && paidAmt > 0;
                  const clinic = item.staff?.clinic || item.clinic;

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
                        {item.staff ? (
                          <div className="flex items-center gap-2.5">
                            {item.staff.image_url || item.staff.profile_photo || item.staff.image ? (
                              <img
                                src={getImageUrl(item.staff.image_url || item.staff.profile_photo || item.staff.image)}
                                alt={item.staff.name}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextElementSibling) {
                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0"
                              style={{ display: item.staff.image_url || item.staff.profile_photo || item.staff.image ? 'none' : 'flex' }}
                            >
                              {item.staff.name ? item.staff.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{item.staff.name}</p>
                              <p className="text-[11px] text-slate-500 font-mono truncate">
                                {item.staff.staff_code} &bull; {item.staff.department || 'General'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unknown Staff Member</span>
                        )}
                      </td>

                      {/* Clinic Branch (Separated Column) */}
                      <td className="py-3 px-4">
                        {clinic ? (
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate max-w-[170px]" title={clinic.name}>
                                {clinic.name}
                              </span>
                            </div>
                            {(clinic.location || clinic.branch_name) && (
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[170px]">
                                {clinic.location || clinic.branch_name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Total Payout */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(totalAmt)}
                        </span>
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-emerald-700">
                          {formatCurrency(paidAmt)}
                        </span>
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

                      {/* Status */}
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
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedPayout(item);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Voucher"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            to={`/superadmin/payouts/staff/edit/${item.id}`}
                            state={{ payout: item }}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Voucher"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        </div>
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
              Showing {payouts.length} of {pagination.total} records
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
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm tracking-wide">Staff Payout Voucher Details</h3>
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
                <p className="text-[10px] uppercase font-semibold text-slate-400">Staff Beneficiary</p>
                <div className="flex items-center gap-3">
                  {selectedPayout.staff?.image_url || selectedPayout.staff?.profile_photo || selectedPayout.staff?.image ? (
                    <img
                      src={getImageUrl(selectedPayout.staff.image_url || selectedPayout.staff.profile_photo || selectedPayout.staff.image)}
                      alt={selectedPayout.staff.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0"
                    style={{
                      display: selectedPayout.staff?.image_url || selectedPayout.staff?.profile_photo || selectedPayout.staff?.image ? 'none' : 'flex'
                    }}
                  >
                    {selectedPayout.staff?.name ? selectedPayout.staff.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{selectedPayout.staff?.name || 'Staff Member'}</p>
                    <p className="text-slate-600 text-xs">
                      Staff Code: <span className="font-mono font-semibold">{selectedPayout.staff?.staff_code || '-'}</span> &bull; {selectedPayout.staff?.department || 'General'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assigned Clinic Details */}
              {selectedPayout.staff?.clinic && (
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-xs">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Assigned Clinic Branch</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-blue-700 border border-blue-200">
                      {selectedPayout.staff.clinic.clinic_code || 'CLINIC'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {selectedPayout.staff.clinic.name}
                    {selectedPayout.staff.clinic.branch_name ? ` (${selectedPayout.staff.clinic.branch_name})` : ''}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600 pt-0.5">
                    {(selectedPayout.staff.clinic.location || selectedPayout.staff.clinic.city || selectedPayout.staff.clinic.address) && (
                      <p className="flex items-center gap-1 truncate" title={selectedPayout.staff.clinic.address || selectedPayout.staff.clinic.location}>
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{[selectedPayout.staff.clinic.location, selectedPayout.staff.clinic.city, selectedPayout.staff.clinic.state].filter(Boolean).join(', ') || selectedPayout.staff.clinic.address}</span>
                      </p>
                    )}
                    {(selectedPayout.staff.clinic.phone || selectedPayout.staff.clinic.email) && (
                      <p className="flex items-center gap-1 truncate font-mono text-[10px]">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{selectedPayout.staff.clinic.phone || selectedPayout.staff.clinic.email}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Total Payout, Paid Amount, Balance Breakdown */}
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
                <span>Audit Verified</span>
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
