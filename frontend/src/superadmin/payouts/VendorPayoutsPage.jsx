import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Building2,
  DollarSign,
  FileText,
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

export default function VendorPayoutsPage() {
  const toast = useToast();

  // Data states
  const [payouts, setPayouts] = useState([]);
  const [vendorOptions, setVendorOptions] = useState([]);
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
  const [selectedVendorId, setSelectedVendorId] = useState('');
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
    vendor_id: '',
    amount: '',
    payout_date: new Date().toISOString().split('T')[0],
    account_type: 'Bank',
    reference_number: '',
    note: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Load vendor options for selection
  const loadVendorOptions = useCallback(async () => {
    try {
      const data = await payoutService.getVendorOptions();
      setVendorOptions(data || []);
    } catch (err) {
      console.error('Failed to load vendors list:', err);
    }
  }, []);

  // Fetch vendor payouts list
  const fetchPayouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        search: search.trim() || undefined,
        vendor_id: selectedVendorId || undefined,
        account_type: selectedAccountType || undefined,
        status: selectedStatus || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      };

      const res = await payoutService.getVendorPayouts(params);
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
      toast.error('Failed to load vendor payouts. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, search, selectedVendorId, selectedAccountType, selectedStatus, fromDate, toDate, toast]);

  useEffect(() => {
    loadVendorOptions();
  }, [loadVendorOptions]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // Open creation modal
  const handleOpenModal = () => {
    setEditingPayout(null);
    const defaultVendor = vendorOptions.length > 0 ? vendorOptions[0] : null;
    setFormData({
      vendor_id: defaultVendor ? defaultVendor.id : '',
      amount: defaultVendor && defaultVendor.pending_balance > 0 ? String(defaultVendor.pending_balance) : '',
      payout_date: new Date().toISOString().split('T')[0],
      account_type: 'Bank',
      reference_number: '',
      note: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleVendorSelect = (vendorId) => {
    const found = vendorOptions.find((v) => String(v.id) === String(vendorId));
    setFormData((prev) => ({
      ...prev,
      vendor_id: vendorId,
      amount: found && found.pending_balance > 0 ? String(found.pending_balance) : prev.amount,
    }));
    if (formErrors.vendor_id) {
      setFormErrors((prev) => ({ ...prev, vendor_id: null }));
    }
  };

  // Open edit modal
  const handleOpenEditModal = (item) => {
    setEditingPayout(item);
    setFormData({
      vendor_id: item.vendor_id || '',
      amount: String(item.paid_amount || item.amount || ''),
      payout_date: item.payout_date ? item.payout_date.split('T')[0] : new Date().toISOString().split('T')[0],
      account_type: item.account_type || 'Bank',
      reference_number: item.reference_number || '',
      note: item.note || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Submit vendor payout (Create or Edit)
  const handleSubmitPayout = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!formData.vendor_id) errors.vendor_id = 'Please select a vendor / supplier';
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
        await payoutService.updateVendorPayout(editingPayout.id, formData);
        toast.success(`Vendor payout voucher '${editingPayout.payout_number}' updated successfully!`);
      } else {
        await payoutService.recordVendorPayout(formData);
        toast.success('Vendor payout recorded successfully!');
      }
      setIsModalOpen(false);
      setEditingPayout(null);
      fetchPayouts();
    } catch (err) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || (editingPayout ? 'Failed to update vendor payout.' : 'Failed to record vendor payout.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedVendorId('');
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md">
            <Truck className="w-5 h-5 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Vendor Payouts</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Disburse supplier dues, equipment invoices, and track total payouts, paid disbursements, and remaining balances.
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
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Disburse Vendor Payout</span>
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
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <p
              className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 mt-2 truncate"
              title={formatCurrency(summary.total_payout_amount || summary.total_amount)}
            >
              {formatCurrency(summary.total_payout_amount || summary.total_amount)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {summary.total_purchased_qty ? `${Number(summary.total_purchased_qty).toLocaleString('en-IN')} units purchased` : 'Total supplier purchases'}
            </p>
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
            <p className="text-xs text-amber-600 mt-0.5">Pending supplier balance</p>
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
            <p className="text-xs text-slate-500 mt-0.5">Physical cash handovers</p>
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
            <p className="text-xs text-slate-500 mt-0.5">NEFT / RTGS / Cheque</p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Search & Filter Vendor Payouts</span>
          </div>
          {(search || selectedVendorId || selectedAccountType || selectedStatus || fromDate || toDate) && (
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
              placeholder="Search by voucher #, vendor name, note..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Vendor Dropdown */}
          <div>
            <select
              value={selectedVendorId}
              onChange={(e) => {
                setSelectedVendorId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
            >
              <option value="">All Vendors / Suppliers</option>
              {vendorOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vendor_name} {v.company_name ? `(${v.company_name})` : ''} &bull; {v.vendor_code}
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
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700 font-medium"
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
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
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
              className="w-1/2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
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
              className="w-1/2 px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
              title="To Date"
            />
          </div>
        </div>
      </div>

      {/* Payouts Table - All English Column Headers */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <h2 className="text-sm font-semibold text-slate-800">Vendor Disbursement Register</h2>
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
                <th className="py-3 px-3 w-10 text-center">Sr.</th>
                <th className="py-3 px-3">Voucher #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4">Vendor / Supplier</th>
                <th className="py-3 px-3 text-right">Purchase Qty</th>
                <th className="py-3 px-3 text-right">Avg Rate (₹)</th>
                <th className="py-3 px-4 text-right">Total Bill (₹)</th>
                <th className="py-3 px-4 text-right">Paid Amount (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Payment Mode</th>
                <th className="py-3 px-3">Note / Remarks</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="13" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                      <p className="text-xs font-medium">Loading vendor payouts...</p>
                    </div>
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan="13" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Truck className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-medium text-slate-700">No vendor payouts found</p>
                      <p className="text-[11px] text-slate-400">
                        Try modifying filters or click &ldquo;Disburse Vendor Payout&rdquo; to record a new transaction.
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
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">{serialNo}</td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {item.payout_number}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {item.payout_date ? new Date(item.payout_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {item.vendor ? (
                          <div>
                            <p className="font-semibold text-slate-900">{item.vendor.vendor_name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {item.vendor.vendor_code} {item.vendor.company_name ? `• ${item.vendor.company_name}` : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unknown Vendor</span>
                        )}
                      </td>

                      {/* Purchase Qty */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="font-mono font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          {Number(item.total_purchased_qty || 0).toLocaleString('en-IN')} Units
                        </span>
                      </td>

                      {/* Purchase Rate */}
                      <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        {item.avg_buy_price && Number(item.avg_buy_price) > 0 ? (
                          <span>₹{Number(item.avg_buy_price).toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Total Payout */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(totalAmt)}
                        </span>
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-emerald-700">
                          {formatCurrency(paidAmt)}
                        </span>
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {balAmt > 0 ? (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {formatCurrency(balAmt)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">₹0.00</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
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

                      <td className="py-3 px-3 max-w-[150px] truncate text-slate-600" title={item.note || ''}>
                        {item.note || <span className="text-slate-300 italic">-</span>}
                      </td>

                      <td className="py-3 px-3 text-center">
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
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
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
      {/* RECORD VENDOR PAYOUT MODAL (Clean Standard Form)         */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingPayout ? `Edit Vendor Payout (${editingPayout.payout_number})` : 'Record Vendor Payout'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingPayout
                      ? 'Modify disbursement details, payment mode, or remarks'
                      : 'Disburse supplier dues, equipment invoices or material advance'}
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
              {/* Vendor Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingPayout ? 'Vendor / Supplier (Read Only)' : 'Select Vendor / Supplier'} <span className="text-rose-500">*</span>
                </label>
                {editingPayout ? (
                  <div className="w-full px-3 py-2.5 text-xs bg-slate-100 border border-slate-300 rounded-xl text-slate-800 font-medium flex items-center justify-between cursor-not-allowed select-none">
                    <span className="font-semibold text-slate-900">
                      {editingPayout.vendor?.vendor_name || vendorOptions.find((v) => String(v.id) === String(formData.vendor_id))?.vendor_name || 'Vendor'}
                      <span className="text-slate-500 font-mono text-[11px] ml-1.5">
                        ({editingPayout.vendor?.vendor_code || vendorOptions.find((v) => String(v.id) === String(formData.vendor_id))?.vendor_code || `ID: ${formData.vendor_id}`})
                      </span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 border border-slate-300">
                      Read Only
                    </span>
                  </div>
                ) : (
                  <select
                    value={formData.vendor_id}
                    onChange={(e) => handleVendorSelect(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
                  >
                    <option value="">-- Choose Vendor / Supplier --</option>
                    {vendorOptions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vendor_name} ({v.company_name || v.vendor_code}) &mdash; Purchases: ₹{Number(v.total_purchased_amount || 0).toLocaleString('en-IN')} {v.pending_balance > 0 ? `(Pending: ₹${Number(v.pending_balance || 0).toLocaleString('en-IN')})` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {formErrors.vendor_id && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.vendor_id}</p>
                )}

                {vendorOptions.find((v) => String(v.id) === String(formData.vendor_id)) && (() => {
                  const selVendor = vendorOptions.find((v) => String(v.id) === String(formData.vendor_id));
                  return (
                    <div className="mt-2.5 p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-600 block">Purchase Qty</span>
                        <span className="font-bold text-slate-900 font-mono text-xs">
                          {Number(selVendor.total_purchased_qty || 0).toLocaleString('en-IN')} Units
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-600 block">Avg Rate</span>
                        <span className="font-bold text-slate-900 font-mono text-xs">
                          ₹{Number(selVendor.avg_rate || 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-700 block">Total Bill</span>
                        <span className="font-bold text-amber-900 font-mono text-xs">
                          {formatCurrency(selVendor.total_purchased_amount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-rose-700 block">Pending Balance</span>
                        <span className="font-bold text-rose-900 font-mono text-xs">
                          {formatCurrency(selVendor.pending_balance)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
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
                      className="w-full pl-8 pr-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-slate-900"
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
                    className="w-full px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800"
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
                    <span>Bank (Transfer / RTGS / Cheque)</span>
                  </button>
                </div>
                {formErrors.account_type && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.account_type}</p>
                )}
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / Transaction No. (Bill No, UTR, Cheque #)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-49102847, Invoice #INV-1092, Cheque #88123"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-slate-800"
                />
              </div>

              {/* Note / Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note / Remarks (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Settlement for September dental supplies purchase order..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 resize-none"
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
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
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
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm tracking-wide">Vendor Payout Voucher Details</h3>
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
                <p className="text-[10px] uppercase font-semibold text-slate-400">Supplier Beneficiary</p>
                <p className="text-sm font-bold text-slate-900">{selectedPayout.vendor?.vendor_name || 'Vendor'}</p>
                <p className="text-slate-600">
                  {selectedPayout.vendor?.company_name ? `${selectedPayout.vendor.company_name} • ` : ''}
                  Vendor Code: <span className="font-mono font-semibold">{selectedPayout.vendor?.vendor_code || '-'}</span>
                </p>
              </div>

              {/* Total Payout, Paid Amount, Balance Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Purchase Qty</p>
                  <p className="text-sm font-bold text-slate-900 mt-1 font-mono">
                    {Number(selectedPayout.total_purchased_qty || 0).toLocaleString('en-IN')} Units
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Avg Purchase Rate</p>
                  <p className="text-sm font-bold text-slate-900 mt-1 font-mono">
                    ₹{Number(selectedPayout.avg_buy_price || 0).toFixed(2)}
                  </p>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                  <p className="text-[10px] uppercase font-bold text-blue-700">Total Bill (Payout)</p>
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

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-center sm:col-span-2">
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
