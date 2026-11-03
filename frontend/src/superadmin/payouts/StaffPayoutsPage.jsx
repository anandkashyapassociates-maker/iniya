import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { payoutService } from '../services/payoutService';
import { useToast } from '../../context/ToastContext';

export default function StaffPayoutsPage() {
  const toast = useToast();

  // Data states
  const [payouts, setPayouts] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
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
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPayout, setEditingPayout] = useState(null);

  // Standard Form State (Unchanged single Amount input per user requirement)
  const [formData, setFormData] = useState({
    staff_id: '',
    amount: '',
    payout_date: new Date().toISOString().split('T')[0],
    account_type: 'Bank',
    reference_number: '',
    note: '',
  });
  const [formErrors, setFormErrors] = useState({});

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
  }, [page, perPage, search, selectedStaffId, selectedAccountType, selectedStatus, fromDate, toDate, toast]);

  useEffect(() => {
    loadStaffOptions();
  }, [loadStaffOptions]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // Open creation modal
  const handleOpenModal = () => {
    setEditingPayout(null);
    const defaultStaff = staffOptions.length > 0 ? staffOptions[0] : null;
    setFormData({
      staff_id: defaultStaff ? defaultStaff.id : '',
      amount: defaultStaff && defaultStaff.pending_balance > 0 ? String(defaultStaff.pending_balance) : '',
      payout_date: new Date().toISOString().split('T')[0],
      account_type: 'Bank',
      reference_number: '',
      note: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (item) => {
    setEditingPayout(item);
    setFormData({
      staff_id: item.staff_id || '',
      amount: String(item.paid_amount || item.amount || ''),
      payout_date: item.payout_date ? item.payout_date.split('T')[0] : new Date().toISOString().split('T')[0],
      account_type: item.account_type || 'Bank',
      reference_number: item.reference_number || '',
      note: item.note || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleStaffSelect = (staffId) => {
    const found = staffOptions.find((s) => String(s.id) === String(staffId));
    setFormData((prev) => ({
      ...prev,
      staff_id: staffId,
      amount: found && found.pending_balance > 0 ? String(found.pending_balance) : prev.amount,
    }));
    if (formErrors.staff_id) {
      setFormErrors((prev) => ({ ...prev, staff_id: null }));
    }
  };

  // Submit standard payout (Create or Edit)
  const handleSubmitPayout = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!formData.staff_id) errors.staff_id = 'Please select a staff member';
    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.amount = 'Valid amount is required';
    }
    if (!formData.payout_date) errors.payout_date = 'Payout date is required';
    if (!formData.account_type) errors.account_type = 'Please select Cash or Bank';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPayout) {
        await payoutService.updateStaffPayout(editingPayout.id, formData);
        toast.success(`Staff payout voucher '${editingPayout.payout_number}' updated successfully!`);
      } else {
        await payoutService.recordStaffPayout(formData);
        toast.success('Staff payout recorded successfully!');
      }
      setIsModalOpen(false);
      setEditingPayout(null);
      fetchPayouts();
      loadStaffOptions();
    } catch (err) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || (editingPayout ? 'Failed to update staff payout.' : 'Failed to record staff payout.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md">
            <UserCheck className="w-5 h-5 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Staff Payouts</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Disburse salaries, allowances, and track total payouts, paid disbursements, and remaining balances.
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

          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Disburse Staff Payout</span>
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
              title={formatCurrency(summary.total_payout_amount || summary.total_amount)}
            >
              {formatCurrency(summary.total_payout_amount || summary.total_amount)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Total payable salary & dues</p>
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
          {(search || selectedStaffId || selectedAccountType || selectedStatus || fromDate || toDate) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search voucher #, staff name, note..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
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
                  <td colSpan="11" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <p className="text-xs font-medium">Loading staff payouts...</p>
                    </div>
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-500">
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
                          <div>
                            <p className="font-semibold text-slate-900">{item.staff.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {item.staff.staff_code} &bull; {item.staff.department || 'General'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unknown Staff Member</span>
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
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Voucher"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
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
      {/* RECORD STAFF PAYOUT MODAL (Clean Standard Form)          */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingPayout ? `Edit Staff Payout (${editingPayout.payout_number})` : 'Record Staff Payout'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingPayout
                      ? 'Modify disbursement details, payment mode, or remarks'
                      : 'Disburse salary, allowance, advance or expense reimbursement'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitPayout} className="p-6 space-y-4">
              {/* Staff Member Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingPayout ? 'Staff Member (Read Only)' : 'Select Staff Member'} <span className="text-rose-500">*</span>
                </label>
                {editingPayout ? (
                  <div className="w-full px-3 py-2.5 text-xs bg-slate-100 border border-slate-300 rounded-xl text-slate-800 font-medium flex items-center justify-between cursor-not-allowed select-none">
                    <span className="font-semibold text-slate-900">
                      {editingPayout.staff?.name || staffOptions.find((s) => String(s.id) === String(formData.staff_id))?.name || 'Staff Member'}
                      <span className="text-slate-500 font-mono text-[11px] ml-1.5">
                        ({editingPayout.staff?.staff_code || staffOptions.find((s) => String(s.id) === String(formData.staff_id))?.staff_code || `ID: ${formData.staff_id}`})
                      </span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 border border-slate-300">
                      Read Only
                    </span>
                  </div>
                ) : (
                  <select
                    value={formData.staff_id}
                    onChange={(e) => handleStaffSelect(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                  >
                    <option value="">-- Choose Staff Member --</option>
                    {staffOptions.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.staff_code || `ID: ${st.id}`}) &mdash; Commission: ₹{Number(st.total_commission || 0).toLocaleString('en-IN')} {st.pending_balance > 0 ? `(Pending: ₹${Number(st.pending_balance || 0).toLocaleString('en-IN')})` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {formErrors.staff_id && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.staff_id}</p>
                )}

                {staffOptions.find((s) => String(s.id) === String(formData.staff_id)) && (
                  <div className="mt-2 p-2.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Commission</span>
                      <span className="font-bold text-emerald-900 font-mono text-sm">
                        {formatCurrency(staffOptions.find((s) => String(s.id) === String(formData.staff_id)).total_commission)}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-600 block">Paid So Far</span>
                      <span className="font-bold text-slate-800 font-mono text-sm">
                        {formatCurrency(staffOptions.find((s) => String(s.id) === String(formData.staff_id)).total_paid)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-amber-700 block">Pending Balance</span>
                      <span className="font-bold text-amber-900 font-mono text-sm">
                        {formatCurrency(staffOptions.find((s) => String(s.id) === String(formData.staff_id)).pending_balance)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount and Payout Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payout Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-8 pr-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold text-slate-900"
                    />
                  </div>
                  {formErrors.amount && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.amount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payout Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.payout_date}
                    onChange={(e) => setFormData({ ...formData, payout_date: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                  />
                  {formErrors.payout_date && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.payout_date}</p>
                  )}
                </div>
              </div>

              {/* Account Type (Cash vs Bank Selection) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Account Type (Payment Mode) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, account_type: 'Cash' })}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      formData.account_type === 'Cash'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, account_type: 'Bank' })}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      formData.account_type === 'Bank'
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>Bank (Transfer / UPI)</span>
                  </button>
                </div>
                {formErrors.account_type && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.account_type}</p>
                )}
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / Transaction No. (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-98234823, Cheque #01924, Receipt #321"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-800"
                />
              </div>

              {/* Note / Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note / Remarks (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Salary disbursement for current month, travel allowance..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{editingPayout ? 'Updating...' : 'Recording...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{editingPayout ? 'Update Payout' : 'Save Payout'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <p className="text-sm font-bold text-slate-900">{selectedPayout.staff?.name || 'Staff Member'}</p>
                <p className="text-slate-600">
                  Staff Code: <span className="font-mono font-semibold">{selectedPayout.staff?.staff_code || '-'}</span> &bull; {selectedPayout.staff?.department || 'General'}
                </p>
              </div>

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
