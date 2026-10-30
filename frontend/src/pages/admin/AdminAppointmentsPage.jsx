import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import adminAppointmentService from '../../services/adminAppointmentService';

export default function AdminAppointmentsPage() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [slotFilter, setSlotFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, isLoading: false });

  const fetchStats = async () => {
    try {
      const data = await adminAppointmentService.getStats();
      setStats(data);
    } catch {
      // ignore
    }
  };

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminAppointmentService.getAppointments({
        search,
        date: dateFilter !== 'all' ? dateFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        session_slot: slotFilter !== 'all' ? slotFilter : undefined,
        page,
      });
      setAppointments(res.data || []);
      setPagination({
        current_page: res.current_page,
        last_page: res.last_page,
        total: res.total,
        from: res.from,
        to: res.to,
      });
    } catch (err) {
      toastRef.current.error('Failed to load appointments.');
    } finally {
      setIsLoading(false);
    }
  }, [search, dateFilter, statusFilter, slotFilter, page]);

  useEffect(() => {
    fetchAppointments();
    fetchStats();
  }, [fetchAppointments]);

  const handleDelete = async () => {
    const { id } = deleteDialog;
    if (!id) return;
    setDeleteDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      await adminAppointmentService.delete(id);
      toastRef.current.success('Appointment deleted successfully');
      setDeleteDialog({ isOpen: false, id: null, isLoading: false });
      fetchAppointments();
      fetchStats();
    } catch (err) {
      toastRef.current.error(err.response?.data?.message || 'Delete failed');
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const formatDate = (dateStr, timeStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    const formatted = date.toLocaleDateString('en-IN', options);
    return timeStr ? `${formatted}, ${timeStr}` : formatted;
  };

  const statusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold capitalize border ${
          styles[status] || styles.pending
        }`}
      >
        {status}
      </span>
    );
  };

  const columns = [
    {
      header: 'S.NO.',
      accessor: 'id',
      render: (rec, index) => {
        const rowNumber = typeof index === 'number'
          ? (pagination?.from ? pagination.from + index : index + 1)
          : 1;
        return (
          <span className="font-mono text-xs font-bold text-slate-500">
            {rowNumber}
          </span>
        );
      },
    },
    {
      header: 'APPOINTMENT #',
      accessor: 'appointment_number',
      render: (rec) => (
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded">
          {rec.appointment_number}
        </span>
      ),
    },
    {
      header: 'CUSTOMER',
      accessor: 'customer',
      render: (rec) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{rec.customer?.name || '—'}</div>
          <div className="text-[10px] text-slate-400">{rec.customer?.mobile || ''}</div>
        </div>
      ),
    },
    {
      header: 'STAFF',
      accessor: 'staff',
      render: (rec) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{rec.staff?.name || 'Not Assigned'}</div>
          <div className="text-[10px] text-slate-400">{rec.staff?.department || ''}</div>
        </div>
      ),
    },
    {
      header: 'DATE & TIME',
      accessor: 'appointment_date',
      render: (rec) => (
        <div>
          <div className="text-xs font-semibold text-slate-800">
            {formatDate(rec.appointment_date, rec.appointment_time)}
          </div>
          <div className="text-[10px] text-slate-400">
            {rec.session_slot} • Session {rec.session_number}/{rec.total_sessions}
          </div>
        </div>
      ),
    },
    {
      header: 'TREATMENT',
      accessor: 'treatment_name',
      render: (rec) => (
        <span className="text-xs text-slate-700 font-medium">{rec.treatment_name || '—'}</span>
      ),
    },
    {
      header: 'STATUS',
      accessor: 'status',
      render: (rec) => statusBadge(rec.status),
    },
    {
      header: 'ACTIONS',
      accessor: 'actions',
      render: (rec) => (
        <div className="flex gap-2 items-center">
          <Link
            to={`/admin/appointments/${rec.id}/edit`}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Edit Appointment"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setDeleteDialog({ isOpen: true, id: rec.id, isLoading: false })}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Appointment"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-2">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Schedule & Session Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Appointments Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Manage patient bookings, session progress, staff assignments, and reschedule or update appointment status.
          </p>
        </div>

        <Link
          to="/admin/appointments/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer shrink-0"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>New Appointment</span>
        </Link>
      </div>

      {/* Metrics Summary Banner - Clickable Quick Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Bookings Card */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-4 ${
            statusFilter === 'all'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 hover:border-blue-300 hover:bg-slate-50/80'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Bookings
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</div>
          </div>
        </button>

        {/* Pending Card */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('pending');
            setPage(1);
          }}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-4 ${
            statusFilter === 'pending'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200/80 hover:border-amber-300 hover:bg-slate-50/80'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pending
            </div>
            <div className="text-xl font-black text-amber-600 mt-0.5">{stats.pending}</div>
          </div>
        </button>

        {/* Completed Card */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('completed');
            setPage(1);
          }}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-4 ${
            statusFilter === 'completed'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:bg-slate-50/80'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Completed
            </div>
            <div className="text-xl font-black text-emerald-600 mt-0.5">{stats.completed}</div>
          </div>
        </button>

        {/* Cancelled Card */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('cancelled');
            setPage(1);
          }}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-center gap-4 ${
            statusFilter === 'cancelled'
              ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200/80 hover:border-rose-300 hover:bg-slate-50/80'
          }`}
        >
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Cancelled
            </div>
            <div className="text-xl font-black text-rose-600 mt-0.5">{stats.cancelled}</div>
          </div>
        </button>
      </div>

      {/* Main DataTable with Search & Filters */}
      <DataTable
        columns={columns}
        data={appointments}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search by appointment #, patient, staff, or treatment..."
        emptyTitle="No appointments found"
        emptyDescription={
          search || statusFilter !== 'all' || slotFilter !== 'all'
            ? 'No entries match your search criteria. Try adjusting the filters.'
            : 'No appointments have been booked yet. Click "New Appointment" above to create the first booking.'
        }
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
        extraHeaderActions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Type Filter (Current / Preview) */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Dates</option>
              <option value="current">Current Appointment (Today)</option>
              <option value="preview">Preview Appointment (Other Days)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Session Slot Filter */}
            <select
              value={slotFilter}
              onChange={(e) => {
                setSlotFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Slots</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
            </select>
          </div>
        }
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Appointment"
        description="Are you sure you want to delete this appointment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, id: null, isLoading: false })}
        loading={deleteDialog.isLoading}
      />
    </div>
  );
}
