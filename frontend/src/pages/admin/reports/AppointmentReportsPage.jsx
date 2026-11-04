import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Download,
  RotateCcw,
  User,
  Users,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  XCircle,
  IndianRupee,
  FileText,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  CreditCard,
  Receipt,
  Wallet,
  Sparkles,
  Package,
  Layers,
  ZoomIn,
  TrendingUp,
} from 'lucide-react';
import appointmentReportService from '../../../services/appointmentReportService';
import { useToast } from '../../../context/ToastContext';

export default function AppointmentReportsPage({
  role = 'admin', // 'admin' | 'superadmin'
  defaultTab = 'appointments', // 'appointments' | 'sessions'
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const isSuperAdmin = role === 'superadmin';
  const basePath = isSuperAdmin ? '/superadmin/reports' : '/admin/reports';

  // Determine active tab based on route pathname or prop
  const currentTabFromPath = location.pathname.includes('/sessions') ? 'sessions' : 'appointments';
  const [activeTab, setActiveTab] = useState(currentTabFromPath || defaultTab);

  useEffect(() => {
    if (location.pathname.includes('/sessions')) {
      setActiveTab('sessions');
    } else if (location.pathname.includes('/appointments')) {
      setActiveTab('appointments');
    }
  }, [location.pathname]);

  // Tab change handler (updates URL)
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    navigate(`${basePath}/${newTab}`, { replace: true });
  };

  // Data states
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({
    total_appointments: 0,
    total_fees: 0,
    total_sessions: 0,
    completed_sessions: 0,
    in_progress_sessions: 0,
    pending_sessions: 0,
    cancelled_sessions: 0,
    total_patient_paid: 0,
    total_staff_commission: 0,
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown filter options
  const [filterOptions, setFilterOptions] = useState({
    staff: [],
    sales_team: [],
    services: [],
    customers: [],
    statuses: [],
    payment_statuses: [],
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState('all_time');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedSalesTeamId, setSelectedSalesTeamId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Detail Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Load Filter Options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const res = await appointmentReportService.getFilterOptions(role);
        if (res && res.success) {
          setFilterOptions({
            staff: res.staff || [],
            sales_team: res.sales_team || [],
            services: res.services || [],
            customers: res.customers || [],
            statuses: res.statuses || [],
            payment_statuses: res.payment_statuses || [],
          });
        }
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    loadOptions();
  }, [role]);

  // Fetch Report Data based on active tab
  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        search: search.trim() || undefined,
        preset: datePreset,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        staff_id: selectedStaffId || undefined,
        customer_id: selectedCustomerId || undefined,
        payment_status: selectedPaymentStatus !== 'all' ? selectedPaymentStatus : undefined,
      };

      if (activeTab === 'appointments') {
        params.sales_team_id = selectedSalesTeamId || undefined;
      } else {
        params.service_id = selectedServiceId || undefined;
      }

      const res =
        activeTab === 'appointments'
          ? await appointmentReportService.getAppointmentsReport(params, role)
          : await appointmentReportService.getSessionsReport(params, role);

      if (res && res.report) {
        setReportData(res.report.data || []);
        setPagination({
          current_page: res.report.current_page || 1,
          last_page: res.report.last_page || 1,
          total: res.report.total || 0,
          per_page: res.report.per_page || 20,
        });
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load report:', err);
      toast.error('Failed to load report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [
    activeTab,
    page,
    perPage,
    search,
    datePreset,
    fromDate,
    toDate,
    selectedStatus,
    selectedStaffId,
    selectedSalesTeamId,
    selectedServiceId,
    selectedCustomerId,
    selectedPaymentStatus,
    role,
    toast,
  ]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle Date Presets
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    setPage(1);

    const now = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const today = formatDate(now);
      setFromDate(today);
      setToDate(today);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(now.getDate() - 1);
      const yStr = formatDate(y);
      setFromDate(yStr);
      setToDate(yStr);
    } else if (preset === 'this_week') {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMonday));
      setFromDate(formatDate(monday));
      setToDate(formatDate(new Date()));
    } else if (preset === 'last_7_days') {
      const p = new Date();
      p.setDate(now.getDate() - 6);
      setFromDate(formatDate(p));
      setToDate(formatDate(now));
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(formatDate(firstDay));
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

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setDatePreset('all_time');
    setFromDate('');
    setToDate('');
    setSelectedStatus('all');
    setSelectedStaffId('');
    setSelectedSalesTeamId('');
    setSelectedServiceId('');
    setSelectedCustomerId('');
    setSelectedPaymentStatus('all');
    setPage(1);
  };

  // Currency Formatter (INR)
  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Time Slot Formatter
  const formatTimeSlot = (timeStr) => {
    if (!timeStr) return '-';
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
      return timeStr;
    }
    const [hh, mm] = timeStr.split(':');
    if (hh !== undefined && mm !== undefined) {
      const hour = parseInt(hh, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${mm} ${ampm}`;
    }
    return timeStr;
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      toast.error('No data available to export.');
      return;
    }

    try {
      let headers = [];
      let rows = [];

      if (activeTab === 'appointments') {
        headers = [
          'Appointment Number',
          'Booking Date',
          'Patient Name',
          'Patient Mobile',
          'Patient Gender',
          'Patient Age',
          'Referred By (Sales)',
          'Consultation Fees',
          'Total Sessions',
          'Completed Sessions',
          'In Progress Sessions',
          'Pending Sessions',
          'Total Patient Paid',
          'Total Staff Commission',
          'Overall Status',
        ];

        rows = reportData.map((item) => {
          const stats = item.session_stats || {};
          return [
            `"${item.appointment_number || ''}"`,
            `"${item.appointment_date || ''}"`,
            `"${item.customer?.name || 'Walk-in'}"`,
            `"${item.customer?.mobile || ''}"`,
            `"${item.customer?.gender || ''}"`,
            `"${item.customer?.age || ''}"`,
            `"${item.sales_team ? `${item.sales_team.name} (${item.sales_team.sales_code})` : 'Direct'}"`,
            item.appointment_fees || 0,
            stats.total || 0,
            stats.completed || 0,
            stats.in_progress || 0,
            stats.pending || 0,
            stats.total_paid || 0,
            stats.total_commission || 0,
            `"${stats.overall_status || 'pending'}"`,
          ];
        });
      } else {
        headers = [
          'Session Number',
          'Master Appointment',
          'Session Date',
          'Session Time',
          'Patient Name',
          'Patient Mobile',
          'Service Name',
          'Assigned Staff',
          'Staff Code',
          'Staff Department',
          'Staff Commission',
          'Session Status',
          'Patient Paid Amount',
          'Payment Date',
          'Payment Mode',
          'Payment Notes',
        ];

        rows = reportData.map((s) => [
          `"Session #${s.session_number}"`,
          `"${s.master_appointment?.appointment_number || ''}"`,
          `"${s.session_date || ''}"`,
          `"${s.session_time || ''}"`,
          `"${s.master_appointment?.customer?.name || 'Walk-in'}"`,
          `"${s.master_appointment?.customer?.mobile || ''}"`,
          `"${s.service?.name || s.treatment_details || ''}"`,
          `"${s.staff?.name || 'Unassigned'}"`,
          `"${s.staff?.staff_code || ''}"`,
          `"${s.staff?.department || ''}"`,
          s.staff_commission || 0,
          `"${s.status || 'pending'}"`,
          s.payment_amount || 0,
          `"${s.payment_date || ''}"`,
          `"${s.payment_mode || ''}"`,
          `"${(s.payment_notes || '').replace(/"/g, '""')}"`,
        ]);
      }

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `INIYA_${activeTab === 'appointments' ? 'Appointments_Report' : 'Sessions_Report'}_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report successfully exported as CSV!');
    } catch (err) {
      console.error('Failed to export CSV:', err);
      toast.error('Failed to export CSV.');
    }
  };

  // Open Details Modal
  const handleOpenDetailModal = (record) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* ======================================================== */}
      {/* TOP HEADER & TAB BAR                                     */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isSuperAdmin
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {isSuperAdmin ? 'Superadmin Executive Intelligence' : 'Clinical Desk Intelligence'}
            </span>
            <span className="text-xs text-slate-400 font-mono">• Clinical &amp; Treatment Auditing</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-purple-600" />
            <span>Appointments &amp; Session Reports</span>
          </h1>

          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Multi-dimensional audit trail of master bookings, clinician execution progress, staff commission accruals, and patient collections.
          </p>
        </div>

        {/* Action Buttons: Export & Refresh */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isLoading || reportData.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-2xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchReport}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-2xl transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PRIMARY TAB SWITCHER                                     */}
      {/* ======================================================== */}
      <div className="flex items-center gap-3 p-1.5 bg-slate-200/70 rounded-2xl w-fit border border-slate-300/60">
        <button
          type="button"
          onClick={() => handleTabChange('appointments')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-white text-purple-700 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-purple-600" />
          <span>Appointments-Wise Report</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Master
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('sessions')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sessions'
              ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>Session-Wise Report</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Sessions
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUMMARY KPI CARDS                                        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Primary Count */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {activeTab === 'appointments' ? 'Total Appointments' : 'Total Sessions'}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600">
              {activeTab === 'appointments' ? <Calendar className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-1">
            {activeTab === 'appointments' ? summary.total_appointments : summary.total_sessions}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {activeTab === 'appointments'
              ? `${summary.total_sessions} sessions across records`
              : `${summary.completed_sessions} successfully completed`}
          </p>
        </div>

        {/* KPI 2: Financial Fee / Revenue */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {activeTab === 'appointments' ? 'Consultation Fees' : 'Completed Sessions'}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
              {activeTab === 'appointments' ? <IndianRupee className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700 font-mono tracking-tight mt-1">
            {activeTab === 'appointments' ? formatCurrency(summary.total_fees) : summary.completed_sessions}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {activeTab === 'appointments' ? 'Total booked consultation value' : `${summary.in_progress_sessions} active, ${summary.pending_sessions} pending`}
          </p>
        </div>

        {/* KPI 3: Patient Collections Received */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Patient Collections Received
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 font-mono tracking-tight mt-1">
            {formatCurrency(summary.total_patient_paid)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Paid directly at desk / sessions
          </p>
        </div>

        {/* KPI 4: Staff Commission Accrued */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Staff Commissions Accrued
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 font-mono tracking-tight mt-1">
            {formatCurrency(summary.total_staff_commission)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Practitioner treatment payouts
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FILTER & SEARCH CONTROL CONSOLE                          */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        {/* Preset Date Range Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap pb-3 border-b border-slate-100 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Date Preset:
          </span>
          {[
            { id: 'all_time', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'this_week', label: 'This Week' },
            { id: 'last_7_days', label: 'Last 7 Days' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_30_days', label: 'Last 30 Days' },
            { id: 'custom', label: 'Custom Range' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetChange(preset.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                datePreset === preset.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={
                activeTab === 'appointments'
                  ? 'Search by Appt #, patient, mobile, sales code...'
                  : 'Search by session, Appt #, patient, doctor, service...'
              }
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all text-slate-800"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 text-slate-700 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed / Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* 3. Practitioner / Staff Filter */}
          <div>
            <select
              value={selectedStaffId}
              onChange={(e) => {
                setSelectedStaffId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 text-slate-700 font-medium"
            >
              <option value="">All Practitioners / Staff</option>
              {filterOptions.staff.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.staff_code})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Tab Specific Filter: Sales Referral OR Clinical Service */}
          {activeTab === 'appointments' ? (
            <div>
              <select
                value={selectedSalesTeamId}
                onChange={(e) => {
                  setSelectedSalesTeamId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 text-slate-700 font-medium"
              >
                <option value="">All Referral Sales Team</option>
                {filterOptions.sales_team.map((sm) => (
                  <option key={sm.id} value={sm.id}>
                    {sm.name} ({sm.sales_code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <select
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 text-slate-700 font-medium"
              >
                <option value="">All Clinical Services</option>
                {filterOptions.services.map((serv) => (
                  <option key={serv.id} value={serv.id}>
                    {serv.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 5. Payment Status Filter */}
          <div>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => {
                setSelectedPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 text-slate-700 font-medium"
            >
              <option value="all">All Payments</option>
              <option value="paid">Payment Received</option>
              <option value="unpaid">Payment Pending / None</option>
              <option value="cash">Cash Mode</option>
              <option value="upi">UPI / QR Mode</option>
              <option value="card">Card Mode</option>
              <option value="bank">Bank Mode</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Row (visible if preset is custom) */}
        {datePreset === 'custom' && (
          <div className="pt-2 flex items-center gap-3 flex-wrap bg-purple-50/50 p-3 rounded-2xl border border-purple-100">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">From Date:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">To Date:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-800"
              />
            </div>
          </div>
        )}

        {/* Active Filters Summary & Reset */}
        <div className="flex items-center justify-between text-xs pt-2">
          <p className="text-slate-500">
            Showing <strong>{reportData.length}</strong> of <strong>{pagination.total}</strong> records
          </p>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-rose-600 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DATA TABLES                                              */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-xs font-semibold text-slate-500">
              Loading {activeTab === 'appointments' ? 'Master Appointments' : 'Treatment Sessions'} Report...
            </p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="py-20 px-4 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching records found for the applied filter and date range. Try relaxing your filters.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : activeTab === 'appointments' ? (
          /* ======================================================== */
          /* 1. APPOINTMENTS-WISE TABLE                               */
          /* ======================================================== */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Appointment #</th>
                  <th className="py-3.5 px-4">Booking Date</th>
                  <th className="py-3.5 px-4">Patient Profile</th>
                  <th className="py-3.5 px-4">Referral Sales Member</th>
                  <th className="py-3.5 px-4 text-right">Consultation Fees</th>
                  <th className="py-3.5 px-4 text-center">Sessions Execution</th>
                  <th className="py-3.5 px-4 text-right">Patient Paid</th>
                  <th className="py-3.5 px-4 text-right">Staff Commission</th>
                  <th className="py-3.5 px-4 text-center">Overall Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((item) => {
                  const stats = item.session_stats || {};
                  const isCompleted = stats.overall_status === 'completed';
                  const isInProgress = stats.overall_status === 'in_progress';
                  const isCancelled = stats.overall_status === 'cancelled';

                  return (
                    <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                      {/* Appt Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(item)}
                          className="hover:text-purple-600 hover:underline cursor-pointer"
                        >
                          {item.appointment_number}
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {item.appointment_date || '-'}
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">{item.customer?.name || 'Walk-in Patient'}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {item.customer?.mobile || '-'}
                            {item.customer?.gender && ` • ${item.customer.gender}`}
                            {item.customer?.age && ` • ${item.customer.age}y`}
                          </p>
                        </div>
                      </td>

                      {/* Sales Team Referral */}
                      <td className="py-3.5 px-4">
                        {item.sales_team ? (
                          <div>
                            <p className="font-semibold text-slate-800">{item.sales_team.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {item.sales_team.sales_code} • {item.sales_team.department}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Direct / None</span>
                        )}
                      </td>

                      {/* Fees */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.appointment_fees)}
                      </td>

                      {/* Sessions Progress */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                            isCompleted
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : isInProgress
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {stats.completed} / {stats.total} Sessions
                        </span>
                      </td>

                      {/* Patient Paid */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(stats.total_paid)}
                      </td>

                      {/* Staff Commission */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {formatCurrency(stats.total_commission)}
                      </td>

                      {/* Overall Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : isInProgress
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isCancelled
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {stats.overall_status || 'Pending'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ======================================================== */
          /* 2. SESSIONS-WISE TABLE                                   */
          /* ======================================================== */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Session Info</th>
                  <th className="py-3.5 px-4">Schedule Date &amp; Time</th>
                  <th className="py-3.5 px-4">Patient Profile</th>
                  <th className="py-3.5 px-4">Clinical Service</th>
                  <th className="py-3.5 px-4">Assigned Practitioner</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Patient Payment</th>
                  <th className="py-3.5 px-4 text-right">Commission</th>
                  <th className="py-3.5 px-4 text-center">Photos</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((s) => {
                  const master = s.master_appointment || {};
                  const cust = master.customer || {};

                  return (
                    <tr key={s.id} className="hover:bg-emerald-50/30 transition-colors">
                      {/* Session Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 font-mono">
                            Session #{s.session_number}
                          </span>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {master.appointment_number}
                          </p>
                        </div>
                      </td>

                      {/* Schedule Date & Time */}
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        <p className="font-semibold">{s.session_date || '-'}</p>
                        <p className="text-[10px] text-slate-400">{formatTimeSlot(s.session_time)}</p>
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">{cust.name || 'Walk-in Patient'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {cust.mobile || '-'}
                            {cust.gender && ` • ${cust.gender}`}
                          </p>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">
                          {s.service?.name || s.treatment_details || 'Treatment Session'}
                        </p>
                        {s.service?.category?.name && (
                          <p className="text-[10px] text-slate-400">{s.service.category.name}</p>
                        )}
                      </td>

                      {/* Practitioner */}
                      <td className="py-3.5 px-4">
                        {s.staff ? (
                          <div>
                            <p className="font-semibold text-slate-800">{s.staff.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {s.staff.staff_code} • {s.staff.department}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            s.status === 'completed'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : s.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : s.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {s.status === 'completed' ? 'Closed' : s.status}
                        </span>
                      </td>

                      {/* Patient Payment */}
                      <td className="py-3.5 px-4 text-right">
                        {s.payment_amount && Number(s.payment_amount) > 0 ? (
                          <div>
                            <p className="font-mono font-bold text-emerald-700">
                              {formatCurrency(s.payment_amount)}
                            </p>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                              {s.payment_mode || 'Paid'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unpaid</span>
                        )}
                      </td>

                      {/* Staff Commission */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-800 font-semibold">
                        {formatCurrency(s.staff_commission)}
                      </td>

                      {/* Photos Indicator */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {s.image_url ? (
                            <span
                              className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                              title="Clinical photo attached"
                            />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" title="No clinical photo" />
                          )}
                          {master.image_url ? (
                            <span
                              className="w-2.5 h-2.5 rounded-full bg-purple-500"
                              title="Master prescription attached"
                            />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" title="No prescription" />
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailModal(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="View Session Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        {!isLoading && reportData.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-slate-400 ml-2">
                Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.current_page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-mono font-bold text-slate-800">
                {pagination.current_page}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                disabled={pagination.current_page >= pagination.last_page}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* DRILL-DOWN DETAIL VIEW MODAL                             */}
      {/* ======================================================== */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">
                    {activeTab === 'appointments'
                      ? `Appointment Details • ${selectedRecord.appointment_number}`
                      : `Session #${selectedRecord.session_number} • ${selectedRecord.master_appointment?.appointment_number || ''}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Clinical Audit &amp; Treatment Breakdown
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Patient Profile Card */}
              {(() => {
                const cust =
                  activeTab === 'appointments'
                    ? selectedRecord.customer || {}
                    : selectedRecord.master_appointment?.customer || {};

                return (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-purple-600" /> Patient Profile
                      </span>
                      {cust.gender && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200 capitalize">
                          {cust.gender} {cust.age && `(${cust.age}y)`}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      <p>
                        Name: <strong className="text-slate-900">{cust.name || 'Walk-in Patient'}</strong>
                      </p>
                      <p>
                        Mobile:{' '}
                        <a href={`tel:${cust.mobile}`} className="font-mono font-semibold text-purple-700">
                          {cust.mobile || '-'}
                        </a>
                      </p>
                      {cust.email && <p>Email: <span className="font-mono">{cust.email}</span></p>}
                      {cust.address && <p>Address: <span>{cust.address}</span></p>}
                    </div>
                  </div>
                );
              })()}

              {/* Sessions Breakdown if viewing an Appointment */}
              {activeTab === 'appointments' && selectedRecord.sessions && (
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Sessions Under this Master Appointment ({selectedRecord.sessions.length}):
                  </h4>
                  <div className="space-y-2">
                    {selectedRecord.sessions.map((ses) => (
                      <div
                        key={ses.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              Session #{ses.session_number}
                            </span>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase ${
                                ses.status === 'completed'
                                  ? 'bg-teal-100 text-teal-800'
                                  : ses.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ses.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {ses.service?.name || ses.treatment_details || 'Treatment'} • {ses.session_date} ({formatTimeSlot(ses.session_time)})
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Practitioner: <strong>{ses.staff?.name || 'Unassigned'}</strong> • Commission:{' '}
                            <strong className="font-mono">{formatCurrency(ses.staff_commission)}</strong>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          {ses.payment_amount && Number(ses.payment_amount) > 0 ? (
                            <div>
                              <p className="text-[10px] text-slate-500">Payment Received:</p>
                              <strong className="font-mono text-emerald-700 text-xs">
                                {formatCurrency(ses.payment_amount)}
                              </strong>
                              <span className="block text-[9px] text-slate-400 font-mono">
                                {ses.payment_mode || 'Cash'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Payment Pending</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Single Session Details if viewing a Session */}
              {activeTab === 'sessions' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Session #{selectedRecord.session_number} Execution Overview
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {selectedRecord.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <p>
                      Date: <strong className="font-mono">{selectedRecord.session_date}</strong>
                    </p>
                    <p>
                      Time: <strong className="font-mono">{formatTimeSlot(selectedRecord.session_time)}</strong>
                    </p>
                    <p>
                      Service:{' '}
                      <strong className="text-slate-900">
                        {selectedRecord.service?.name || selectedRecord.treatment_details || '-'}
                      </strong>
                    </p>
                    <p>
                      Practitioner: <strong>{selectedRecord.staff?.name || 'Unassigned'}</strong>
                    </p>
                    <p>
                      Commission:{' '}
                      <strong className="font-mono text-amber-700">
                        {formatCurrency(selectedRecord.staff_commission)}
                      </strong>
                    </p>
                    <p>
                      Master Appt Ref:{' '}
                      <strong className="font-mono">
                        {selectedRecord.master_appointment?.appointment_number}
                      </strong>
                    </p>
                  </div>

                  {selectedRecord.payment_amount && Number(selectedRecord.payment_amount) > 0 && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                        Patient Payment Collected:
                      </span>
                      <p className="text-xs text-emerald-900">
                        Amount: <strong className="font-mono text-sm">{formatCurrency(selectedRecord.payment_amount)}</strong>
                        {selectedRecord.payment_mode && ` via ${selectedRecord.payment_mode.toUpperCase()}`}
                        {selectedRecord.payment_date && ` on ${selectedRecord.payment_date}`}
                      </p>
                      {selectedRecord.payment_notes && (
                        <p className="text-[11px] text-slate-600 italic mt-1">
                          "{selectedRecord.payment_notes}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Photos Gallery (Clinical & Prescription) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Session Photo */}
                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Session Clinical Photo
                  </span>
                  {selectedRecord.image_url ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-36 flex items-center justify-center">
                      <img
                        src={selectedRecord.image_url}
                        alt="Clinical"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setLightboxImage(selectedRecord.image_url)}
                        className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-[11px] font-bold cursor-pointer"
                      >
                        <ZoomIn className="w-4 h-4" /> View Full
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic py-6 text-center">
                      No clinical photo attached
                    </p>
                  )}
                </div>

                {/* Master Photo */}
                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Master Prescription Photo
                  </span>
                  {(() => {
                    const mImg =
                      activeTab === 'appointments'
                        ? selectedRecord.image_url
                        : selectedRecord.master_appointment?.image_url;

                    return mImg ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-36 flex items-center justify-center">
                        <img src={mImg} alt="Prescription" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setLightboxImage(mImg)}
                          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-[11px] font-bold cursor-pointer"
                        >
                          <ZoomIn className="w-4 h-4" /> View Full
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic py-6 text-center">
                        No prescription attached
                      </p>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Zoomed"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

