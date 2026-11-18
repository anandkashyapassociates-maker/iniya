import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  PlusCircle,
  Search,
  RefreshCw,
  Building2,
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
  Sparkles,
  Printer,
} from 'lucide-react';
import { payoutService } from '../services/payoutService';
import clinicManagementService from '../services/clinicManagementService';
import { useToast } from '../../context/ToastContext';

export default function SalesPayoutsPage() {
  const toast = useToast();

  // Data states
  const [payouts, setPayouts] = useState([]);
  const [salesOptions, setSalesOptions] = useState([]);
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
  const [selectedSalesMemberId, setSelectedSalesMemberId] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPayout, setEditingPayout] = useState(null);

  // Form State
  const [modalClinicId, setModalClinicId] = useState('');
  const [formData, setFormData] = useState({
    sales_member_id: '',
    amount: '',
    payout_date: new Date().toISOString().split('T')[0],
    account_type: 'Bank',
    reference_number: '',
    note: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Load clinics list for filter and modal
  const loadClinics = useCallback(async () => {
    setIsLoadingClinics(true);
    try {
      let list = [];
      try {
        const res = await clinicManagementService.getClinicOptions();
        list = res?.clinics || res?.data || (Array.isArray(res) ? res : []);
      } catch (optErr) {
        console.warn('getClinicOptions fallback:', optErr);
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

  // Load sales members options for selection
  const loadSalesOptions = useCallback(async (clinicId = '') => {
    try {
      const data = await payoutService.getSalesOptions({
        clinic_id: clinicId || undefined,
      });
      setSalesOptions(data || []);
    } catch (err) {
      console.error('Failed to load sales options:', err);
    }
  }, []);

  // Fetch sales payouts list
  const fetchPayouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        search: search.trim() || undefined,
        clinic_id: selectedClinicId || undefined,
        sales_member_id: selectedSalesMemberId || undefined,
        account_type: selectedAccountType || undefined,
        status: selectedStatus || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      };

      const res = await payoutService.getSalesPayouts(params);
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
      toast.error('Failed to load sales payouts. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, search, selectedClinicId, selectedSalesMemberId, selectedAccountType, selectedStatus, fromDate, toDate, toast]);

  useEffect(() => {
    loadClinics();
  }, [loadClinics]);

  useEffect(() => {
    loadSalesOptions(selectedClinicId);
  }, [loadSalesOptions, selectedClinicId]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // Open creation modal
  const handleOpenModal = () => {
    setEditingPayout(null);
    setModalClinicId(selectedClinicId || '');
    const defaultMember = salesOptions.length > 0 ? salesOptions[0] : null;
    setFormData({
      sales_member_id: defaultMember ? defaultMember.id : '',
      amount: defaultMember && defaultMember.pending_balance > 0 ? String(defaultMember.pending_balance) : '',
      payout_date: new Date().toISOString().split('T')[0],
      account_type: 'Bank',
      reference_number: '',
      note: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSalesMemberSelect = (memberId) => {
    const found = salesOptions.find((m) => String(m.id) === String(memberId));
    setFormData((prev) => ({
      ...prev,
      sales_member_id: memberId,
      amount: found && found.pending_balance > 0 ? String(found.pending_balance) : prev.amount,
    }));
    if (formErrors.sales_member_id) {
      setFormErrors((prev) => ({ ...prev, sales_member_id: null }));
    }
  };

  // Open edit modal
  const handleOpenEditModal = (item) => {
    setEditingPayout(item);
    setModalClinicId(item.sales_member?.clinic_id ? String(item.sales_member.clinic_id) : '');
    setFormData({
      sales_member_id: item.sales_member_id || '',
      amount: String(item.paid_amount || item.amount || ''),
      payout_date: item.payout_date ? item.payout_date.split('T')[0] : new Date().toISOString().split('T')[0],
      account_type: item.account_type || 'Bank',
      reference_number: item.reference_number || '',
      note: item.note || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Submit sales payout (Create or Edit)
  const handleSubmitPayout = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (!formData.sales_member_id) errors.sales_member_id = 'Please select a sales team member';
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
        await payoutService.updateSalesPayout(editingPayout.id, formData);
        toast.success(`Sales payout voucher '${editingPayout.payout_number}' updated successfully!`);
      } else {
        await payoutService.recordSalesPayout(formData);
        toast.success('Sales member payout recorded successfully!');
      }
      setIsModalOpen(false);
      setEditingPayout(null);
      fetchPayouts();
      loadSalesOptions(selectedClinicId);
    } catch (err) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || (editingPayout ? 'Failed to update sales payout.' : 'Failed to record sales payout.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedClinicId('');
    setSelectedSalesMemberId('');
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

  // Print voucher receipt
  const handlePrintVoucher = (payout) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      toast.error('Please allow popups to print receipt.');
      return;
    }

    const memberName = payout.sales_member?.name || 'Sales Representative';
    const memberCode = payout.sales_member?.sales_code || 'SAL-XXXX';
    const clinicName = payout.sales_member?.clinic?.name || 'Iniya Aesthetics & Wellness';
    const branchName = payout.sales_member?.clinic?.branch_name || payout.sales_member?.clinic?.location || '';
    const dateStr = payout.payout_date
      ? new Date(payout.payout_date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : '-';

    const totalAmt = Number(payout.total_amount > 0 ? payout.total_amount : payout.amount) || 0;
    const paidAmt = Number(payout.paid_amount > 0 ? payout.paid_amount : payout.amount) || 0;
    const balAmt = Number(payout.balance_amount) || 0;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Payout Voucher - ${payout.payout_number}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .badge { display: inline-block; padding: 4px 10px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; font-family: monospace; font-size: 13px; font-weight: bold; }
          .section { margin-top: 24px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
          .section-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 8px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .amount-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .amount-table th, .amount-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .amount-table th { background: #f1f5f9; font-weight: 700; color: #475569; }
          .amount-table td.right, .amount-table th.right { text-align: right; }
          .total-row { font-weight: 800; font-size: 15px; color: #0f172a; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          .sig-box { margin-top: 40px; border-top: 1px dashed #94a3b8; width: 180px; text-align: center; padding-top: 6px; font-size: 11px; color: #475569; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">INIYA AESTHETICS & WELLNESS</h1>
            <p class="subtitle">Official Sales Team Payout Voucher</p>
          </div>
          <div style="text-align: right;">
            <div class="badge">${payout.payout_number}</div>
            <p class="subtitle" style="margin-top: 6px;">Date: ${dateStr}</p>
          </div>
        </div>

        <div class="section">
          <div class="grid">
            <div>
              <div class="section-title">Sales Beneficiary Details</div>
              <strong style="font-size: 14px; color: #0f172a;">${memberName}</strong>
              <div style="font-size: 12px; color: #475569; margin-top: 2px;">
                Code: <strong>${memberCode}</strong> &bull; ${payout.sales_member?.designation || 'Sales Team'}
              </div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                ${payout.sales_member?.email || ''} ${payout.sales_member?.mobile ? '• ' + payout.sales_member.mobile : ''}
              </div>
            </div>
            <div>
              <div class="section-title">Branch / Clinic Details</div>
              <strong style="font-size: 13px; color: #0f172a;">${clinicName}</strong>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${branchName}</div>
              <div style="font-size: 12px; color: #475569; margin-top: 6px;">
                Payment Mode: <strong>${payout.account_type || 'Bank'}</strong>
                ${payout.reference_number ? ` &bull; Ref: <strong>${payout.reference_number}</strong>` : ''}
              </div>
            </div>
          </div>
        </div>

        <table class="amount-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="right">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Sales Commission Earned</td>
              <td class="right">${formatCurrency(totalAmt)}</td>
            </tr>
            <tr style="background: #f0fdf4;">
              <td><strong>Disbursed in this Voucher</strong></td>
              <td class="right" style="color: #15803d; font-weight: bold;">${formatCurrency(paidAmt)}</td>
            </tr>
            <tr style="background: #fffbeb;">
              <td>Remaining Balance Due</td>
              <td class="right" style="color: #b45309; font-weight: bold;">${formatCurrency(balAmt)}</td>
            </tr>
          </tbody>
        </table>

        ${payout.note ? `
          <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px;">
            <strong>Note / Remarks:</strong> ${payout.note}
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
          <div class="sig-box">Sales Member Signature</div>
          <div class="sig-box">Authorized Super Admin</div>
        </div>

        <div class="footer">
          <span>This is an official computer-generated financial receipt from Iniya ERP.</span>
          <span>Printed on: ${new Date().toLocaleString('en-IN')}</span>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const selectedMemberInModal = salesOptions.find((m) => String(m.id) === String(formData.sales_member_id));

  // Filter sales options in modal by modalClinicId if selected
  const modalFilteredSalesOptions = modalClinicId
    ? salesOptions.filter((m) => String(m.clinic_id) === String(modalClinicId))
    : salesOptions;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-600 to-indigo-800 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <Users className="w-6 h-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Sales Team Payouts</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Disburse sales commissions & incentives, manage vouchers, and track paid disbursements and balance dues.
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
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Disburse Sales Payout</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Disbursed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              Total Disbursed
            </span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <p
            className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-2 truncate"
            title={formatCurrency(summary.total_amount)}
          >
            {formatCurrency(summary.total_amount)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{summary.total_count} payouts disbursed</p>
        </div>

        {/* Total Sales Payable */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              Total Sales Payable
            </span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p
            className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-2 truncate"
            title={formatCurrency(summary.total_payout_amount)}
          >
            {formatCurrency(summary.total_payout_amount)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Calculated commissions</p>
        </div>

        {/* Outstanding Balance */}
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
          <p className="text-xs text-amber-600 mt-0.5">Pending disbursement</p>
        </div>

        {/* Cash vs Bank */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Payment Modes
            </span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Bank:</span>{' '}
              <strong className="text-slate-800">{formatCurrency(summary.bank_amount)}</strong>
            </div>
            <div>
              <span className="text-slate-400">Cash:</span>{' '}
              <strong className="text-slate-800">{formatCurrency(summary.cash_amount)}</strong>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Disbursement modes breakdown</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search voucher, name, code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Clinic Branch Filter */}
          <div>
            <select
              value={selectedClinicId}
              disabled={isLoadingClinics}
              onChange={(e) => {
                setSelectedClinicId(e.target.value);
                setSelectedSalesMemberId('');
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-medium disabled:opacity-50"
            >
              <option value="">All Clinic Branches</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.clinic_code || `ID: ${c.id}`})
                </option>
              ))}
            </select>
          </div>

          {/* Sales Member Filter */}
          <div>
            <select
              value={selectedSalesMemberId}
              onChange={(e) => {
                setSelectedSalesMemberId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
            >
              <option value="">All Sales Members</option>
              {salesOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.sales_code})
                </option>
              ))}
            </select>
          </div>

          {/* Account Type Filter */}
          <div>
            <select
              value={selectedAccountType}
              onChange={(e) => {
                setSelectedAccountType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
            >
              <option value="">Payment Mode: All</option>
              <option value="Cash">Cash Mode</option>
              <option value="Bank">Bank Mode</option>
            </select>
          </div>

          {/* Date Range (From & To) */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-1/2 px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              title="From date"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-1/2 px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              title="To date"
            />
          </div>

          {/* Reset Filters */}
          <div className="flex items-center justify-end">
            {(search || selectedClinicId || selectedSalesMemberId || selectedAccountType || selectedStatus || fromDate || toDate) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-medium transition-colors cursor-pointer w-full justify-center border border-rose-200"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <h2 className="text-sm font-semibold text-slate-800">Sales Payout Vouchers</h2>
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
                <th className="py-3 px-4">Sales Representative</th>
                <th className="py-3 px-4">Clinic Branch</th>
                <th className="py-3 px-4 text-right">Commission (₹)</th>
                <th className="py-3 px-4 text-right">Paid Amount (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Mode</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                      <p className="text-xs font-medium">Loading sales payouts...</p>
                    </div>
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan="12" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-medium text-slate-700">No sales payouts found</p>
                      <p className="text-[11px] text-slate-400">
                        Try adjusting your filters or click "Disburse Sales Payout" to create a new one.
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
                  const clinic = item.sales_member?.clinic;

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
                        {item.sales_member ? (
                          <div>
                            <p className="font-semibold text-slate-900">{item.sales_member.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {item.sales_member.sales_code} &bull; {item.sales_member.designation || 'Sales'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sales member not found</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {clinic ? (
                          <div>
                            <div className="flex items-center gap-1 font-semibold text-slate-800">
                              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="truncate max-w-[150px]" title={clinic.name}>{clinic.name}</span>
                            </div>
                            {(clinic.location || clinic.branch_name) && (
                              <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                                {clinic.location || clinic.branch_name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        {formatCurrency(totalAmt)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {formatCurrency(paidAmt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {balAmt > 0 ? (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {formatCurrency(balAmt)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">₹0.00</span>
                        )}
                      </td>
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
                        {item.note || <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedPayout(item);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="View Voucher"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Voucher"
                          >
                            <Edit className="w-4 h-4" />
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

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} records
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.current_page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-medium text-slate-700">
                {pagination.current_page} / {pagination.last_page}
              </span>
              <button
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => setPage((p) => Math.min(p + 1, pagination.last_page))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* RECORD / EDIT SALES PAYOUT MODAL                         */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm tracking-wide">
                  {editingPayout ? `Edit Sales Voucher: ${editingPayout.payout_number}` : 'Record Sales Team Payout'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayout} className="p-6 space-y-4">
              {/* Optional Clinic Branch filter in modal */}
              {!editingPayout && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Filter by Clinic Branch (Optional)
                  </label>
                  <select
                    value={modalClinicId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      setModalClinicId(cId);
                      loadSalesOptions(cId);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  >
                    <option value="">All Branches</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.clinic_code || `ID: ${c.id}`})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sales Member Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sales Representative <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.sales_member_id}
                  onChange={(e) => handleSalesMemberSelect(e.target.value)}
                  disabled={editingPayout !== null}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">-- Choose Sales Member --</option>
                  {modalFilteredSalesOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.sales_code}) - Pending Bal: {formatCurrency(m.pending_balance || 0)}
                    </option>
                  ))}
                </select>
                {formErrors.sales_member_id && (
                  <p className="text-rose-500 text-[11px] mt-1">{formErrors.sales_member_id}</p>
                )}
              </div>

              {/* Commission Preview Card */}
              {selectedMemberInModal && (
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Earned Commission</span>
                    <strong className="text-indigo-900 font-mono text-sm">
                      {formatCurrency(selectedMemberInModal.total_commission || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Already Disbursed</span>
                    <strong className="text-emerald-700 font-mono text-sm">
                      {formatCurrency(selectedMemberInModal.total_paid || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Pending Due</span>
                    <strong className="text-amber-700 font-mono text-sm">
                      {formatCurrency(selectedMemberInModal.pending_balance || 0)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Disbursement Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                  />
                  {formErrors.amount && <p className="text-rose-500 text-[11px] mt-1">{formErrors.amount}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payout Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.payout_date}
                    onChange={(e) => setFormData({ ...formData, payout_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                  {formErrors.payout_date && (
                    <p className="text-rose-500 text-[11px] mt-1">{formErrors.payout_date}</p>
                  )}
                </div>
              </div>

              {/* Payment Mode (Cash / Bank) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Mode <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, account_type: 'Bank' })}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      formData.account_type === 'Bank'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Bank Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, account_type: 'Cash' })}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      formData.account_type === 'Cash'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash Mode</span>
                  </button>
                </div>
              </div>

              {/* Reference / Txn No */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / Cheque / UTR No (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR1982736452 or Cheque #98210"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>

              {/* Note / Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note / Remarks (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Commission disbursement for October high-ticket clients..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 resize-none"
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
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
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
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm tracking-wide">Sales Payout Voucher Details</h3>
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

              {/* Beneficiary Info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Sales Representative</p>
                <p className="text-sm font-bold text-slate-900">{selectedPayout.sales_member?.name || 'Sales Member'}</p>
                <p className="text-slate-600">
                  Code: <span className="font-mono font-semibold">{selectedPayout.sales_member?.sales_code || '-'}</span> &bull;{' '}
                  {selectedPayout.sales_member?.designation || 'Sales Team'}
                </p>
                {selectedPayout.sales_member?.clinic && (
                  <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{selectedPayout.sales_member.clinic.name}</span>
                    {selectedPayout.sales_member.clinic.location && (
                      <span>({selectedPayout.sales_member.clinic.location})</span>
                    )}
                  </p>
                )}
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
                  <p className="text-[10px] uppercase font-bold text-blue-700">Total Commission</p>
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

              {/* Mode & Status */}
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
                <span>Disbursed by: {selectedPayout.super_admin?.name || 'Super Admin'}</span>
                <span>Audit Verified</span>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handlePrintVoucher(selectedPayout)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>

              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
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
