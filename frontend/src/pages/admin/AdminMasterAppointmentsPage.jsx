import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Eye,
  Edit3,
  Trash2,
  CalendarDays,
  Search,
  Filter,
  DollarSign,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react';
import adminMasterAppointmentService from '../../services/adminMasterAppointmentService';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';

export default function AdminMasterAppointmentsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // State
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  // Stats
  const [stats, setStats] = useState({
    total_master: 0,
    total_sessions: 0,
    pending_sessions: 0,
    in_progress_sessions: 0,
    completed_sessions: 0,
    cancelled_sessions: 0,
  });

  // Filter options
  const [options, setOptions] = useState({
    customers: [],
    sales_teams: [],
    staff: [],
    inventory_products: [],
  });

  // Filters
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // 'current', 'preview', or ''
  const [statusFilter, setStatusFilter] = useState(''); // 'pending', 'in_progress', 'completed', 'cancelled'
  const [customerIdFilter, setCustomerIdFilter] = useState('');
  const [salesTeamIdFilter, setSalesTeamIdFilter] = useState('');
  const [activeStatCard, setActiveStatCard] = useState('all');

  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load dropdown options once
  useEffect(() => {
    adminMasterAppointmentService.getOptions()
      .then((res) => {
        if (res.success && res.data) {
          setOptions(res.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch appointments list
  const fetchAppointments = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          per_page: 10,
        };
        if (search.trim()) params.search = search.trim();
        if (dateFilter) params.date = dateFilter;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (customerIdFilter) params.customer_id = customerIdFilter;
        if (salesTeamIdFilter) params.sales_team_id = salesTeamIdFilter;

        const res = await adminMasterAppointmentService.getMasterAppointments(params);
        if (res.success && res.data) {
          setAppointments(res.data.data || []);
          setPagination({
            current_page: res.data.current_page || 1,
            last_page: res.data.last_page || 1,
            per_page: res.data.per_page || 10,
            total: res.data.total || 0,
          });
        }
      } catch (err) {
        console.error(err);
        toastRef.current.error('Failed to load master appointments.');
      } finally {
        setLoading(false);
      }
    },
    [search, dateFilter, statusFilter, customerIdFilter, salesTeamIdFilter]
  );

  // Fetch aggregate stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminMasterAppointmentService.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchAppointments(1);
    fetchStats();
  }, [fetchAppointments, fetchStats]);

  // Click on a stat card to filter
  const handleStatCardClick = (cardKey) => {
    setActiveStatCard(cardKey);
    if (cardKey === 'all') {
      setStatusFilter('');
    } else {
      setStatusFilter(cardKey);
    }
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminMasterAppointmentService.delete(deleteId);
      toast.success('Master appointment and all associated sessions deleted successfully.');
      setDeleteId(null);
      fetchAppointments(pagination.current_page);
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete master appointment.');
    } finally {
      setDeleting(false);
    }
  };

  // DataTable column definitions
  const columns = [
    {
      header: 'S.NO.',
      className: 'w-16 text-center text-xs font-semibold text-slate-500',
      render: (row, rowIndex) => (
        <span className="text-slate-500 font-medium">
          {(pagination.current_page - 1) * pagination.per_page + (rowIndex + 1)}
        </span>
      ),
    },
    {
      header: 'APPOINTMENT #',
      className: 'font-semibold text-xs',
      render: (row) => (
        <button
          onClick={() => navigate(`/admin/appointments/${row.id}`)}
          className="text-left group"
        >
          <span className="inline-block px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 rounded-lg group-hover:bg-blue-100 group-hover:border-blue-300 transition-colors">
            {row.appointment_number}
          </span>
        </button>
      ),
    },
    {
      header: 'CUSTOMER',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 text-sm">{row.customer?.name || 'N/A'}</div>
          <div className="text-xs text-slate-500 font-mono">{row.customer?.mobile || ''}</div>
        </div>
      ),
    },
    {
      header: 'DATE',
      render: (row) => {
        const d = row.appointment_date ? new Date(row.appointment_date) : null;
        return (
          <div className="text-xs">
            <span className="font-semibold text-slate-800">
              {d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'SALES TEAM',
      render: (row) => (
        <div className="text-xs">
          <span className="font-medium text-slate-800">{row.sales_team?.name || 'N/A'}</span>
          {row.sales_team?.sales_code && (
            <span className="text-slate-400 block font-mono text-[11px]">{row.sales_team.sales_code}</span>
          )}
        </div>
      ),
    },
    {
      header: 'FEES (₹)',
      className: 'text-right',
      render: (row) => (
        <span className="font-bold text-slate-900 text-sm">
          ₹{Number(row.appointment_fees || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'SESSIONS BREAKDOWN',
      render: (row) => {
        const total = row.total_sessions_count || 0;
        const pending = row.pending_sessions_count || 0;
        const inProgress = row.in_progress_sessions_count || 0;
        const completed = row.completed_sessions_count || 0;
        const cancelled = row.cancelled_sessions_count || 0;

        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>{total} Total {total === 1 ? 'Session' : 'Sessions'}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {pending > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-200">
                  {pending} Pending
                </span>
              )}
              {inProgress > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-50 text-purple-700 border border-purple-200">
                  {inProgress} Active
                </span>
              )}
              {completed > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {completed} Done
                </span>
              )}
              {cancelled > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-50 text-rose-700 border border-rose-200">
                  {cancelled} Cancelled
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'ACTIONS',
      className: 'text-center w-28',
      render: (row) => (
        <div className="flex items-center justify-center space-x-1.5">
          <button
            onClick={() => navigate(`/admin/appointments/${row.id}`)}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details & Sessions"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/admin/appointments/${row.id}/edit`)}
            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit Master Appointment"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(row.id)}
            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Master Appointment"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule & Multiple Sessions Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage master appointments, dynamic session schedules, staff commissions, and reschedule history.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={() => navigate('/admin/appointments/calendar')}
            className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <CalendarDays className="w-4 h-4 text-slate-600" />
            <span>Calendar View</span>
          </button>
          <button
            onClick={() => navigate('/admin/appointments/create')}
            className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Master Appointment</span>
          </button>
        </div>
      </div>

      {/* 6 Clickable Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Master */}
        <div
          onClick={() => handleStatCardClick('all')}
          className={`cursor-pointer p-4 bg-white rounded-2xl border transition-all ${
            activeStatCard === 'all'
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
              : 'border-slate-100 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Master</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total_master}</div>
          <div className="text-xs font-semibold text-slate-600 mt-0.5">Total Bookings</div>
        </div>

        {/* Total Sessions */}
        <div
          onClick={() => handleStatCardClick('all')}
          className={`cursor-pointer p-4 bg-white rounded-2xl border transition-all ${
            activeStatCard === 'all_sessions'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
              : 'border-slate-100 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sessions</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total_sessions}</div>
          <div className="text-xs font-semibold text-slate-600 mt-0.5">Total Sessions</div>
        </div>

        {/* Pending Sessions */}
        <div
          onClick={() => handleStatCardClick('pending')}
          className={`cursor-pointer p-4 bg-white rounded-2xl border transition-all ${
            activeStatCard === 'pending'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
              : 'border-slate-100 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Pending</span>
          </div>
          <div className="text-2xl font-black text-amber-700">{stats.pending_sessions}</div>
          <div className="text-xs font-semibold text-slate-600 mt-0.5">Pending Sessions</div>
        </div>

        {/* In Progress Sessions */}
        <div
          onClick={() => handleStatCardClick('in_progress')}
          className={`cursor-pointer p-4 bg-white rounded-2xl border transition-all ${
            activeStatCard === 'in_progress'
              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-md'
              : 'border-slate-100 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Loader2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">Active</span>
          </div>
          <div className="text-2xl font-black text-purple-700">{stats.in_progress_sessions}</div>
          <div className="text-xs font-semibold text-slate-600 mt-0.5">In Progress</div>
        </div>

        {/* Completed Sessions */}
        <div
          onClick={() => handleStatCardClick('completed')}
          className={`cursor-pointer p-4 bg-white rounded-2xl border transition-all ${
            activeStatCard === 'completed'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
              : 'border-slate-100 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Done</span>
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.completed_sessions}</div>
          <div className="text-xs font-semibold text-slate-600 mt-0.5">Completed</div>
        </div>

        {/* Cancelled Sessions */}
        <div
          onClick={() => handleStatCardClick('cancelled')}
          className={`cursor-pointer p-4 bg-white rounded-2xl border transition-all ${
            activeStatCard === 'cancelled'
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md'
              : 'border-slate-100 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <XCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Cancel</span>
          </div>
          <div className="text-2xl font-black text-rose-700">{stats.cancelled_sessions}</div>
          <div className="text-xs font-semibold text-slate-600 mt-0.5">Cancelled</div>
        </div>
      </div>

      {/* Filter Bar & DataTable */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by appointment #, patient, sales team, treatment..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            >
              <option value="">All Dates</option>
              <option value="current">Current (Today)</option>
              <option value="preview">Preview (Other Days)</option>
            </select>

            {/* Customer filter */}
            <select
              value={customerIdFilter}
              onChange={(e) => setCustomerIdFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors max-w-[150px] truncate"
            >
              <option value="">All Patients</option>
              {options.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Sales Team filter */}
            <select
              value={salesTeamIdFilter}
              onChange={(e) => setSalesTeamIdFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors max-w-[150px] truncate"
            >
              <option value="">All Sales Teams</option>
              {options.sales_teams.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>

            {/* Session Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setActiveStatCard(e.target.value || 'all');
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={appointments}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => fetchAppointments(page)}
          emptyMessage="No master appointments found matching your search or filters."
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Master Appointment"
        message="Are you sure you want to delete this master appointment? All associated sessions, assigned slots, and reschedule records under this booking will also be removed."
        confirmText={deleting ? 'Deleting...' : 'Delete Appointment'}
        isDangerous={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
        isLoading={deleting}
      />
    </div>
  );
}

