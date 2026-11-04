import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  ChevronRight,
  ChevronLeft,
  CalendarCheck,
  Stethoscope,
  Image as ImageIcon,
  IndianRupee,
  Activity,
} from 'lucide-react';
import { useAdminAuth } from '../../../features/auth/AdminAuthContext';
import staffAppointmentService from '../../../services/staffAppointmentService';
import { useToast } from '../../../context/ToastContext';

export default function StaffMyAppointmentsPage() {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const toast = useToast();

  // If logged-in user is not staff (e.g. Administrator), redirect to master appointments
  if (user && user.role !== 'staff') {
    return <Navigate to="/admin/appointments" replace />;
  }

  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState({
    total_sessions: 0,
    today_sessions: 0,
    pending_sessions: 0,
    completed_sessions: 0,
    in_progress_sessions: 0,
    total_commission_earned: 0,
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
  const [dateFilter, setDateFilter] = useState('all'); // all | today | upcoming | past | custom
  const [customDate, setCustomDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | in_progress | completed | cancelled
  const [page, setPage] = useState(1);

  // Fetch appointment sessions assigned to this staff member
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: 15,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };

      if (dateFilter === 'custom' && customDate) {
        params.date = customDate;
      } else if (['today', 'upcoming', 'past'].includes(dateFilter)) {
        params.date = dateFilter;
      }

      const res = await staffAppointmentService.getMyAppointments(params);
      const dataSet = res.sessions || res.appointments;
      if (dataSet) {
        setSessions(dataSet.data || []);
        setPagination({
          current_page: dataSet.current_page || 1,
          last_page: dataSet.last_page || 1,
          total: dataSet.total || 0,
          per_page: dataSet.per_page || 15,
        });
      }
      if (res && res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load assigned sessions:', err);
      toast.error('Failed to load your assigned appointments.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, dateFilter, customDate, statusFilter, toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const formatCurrency = (amount) => {
    const val = Number(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Page Title & Staff Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                My Appointments
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Staff Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personal session-wise clinical appointments &amp; schedules assigned to you.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSessions}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
          <span>Refresh Schedule</span>
        </button>
      </div>

      {/* KPI Summary Cards: 2 Rows (Row 1: 2 Cards, Row 2: 3 Cards) */}
      <div className="space-y-3.5">
        {/* Row 1: 2 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="bg-white rounded-2xl border border-blue-200/80 p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                Total Assigned Sessions
              </span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
              {summary.total_sessions}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Clinical treatment sessions assigned to your name</p>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Today's Sessions
              </span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 mt-2">
              {summary.today_sessions}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">Treatment sessions scheduled for today</p>
          </div>
        </div>

        {/* Row 2: 3 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                Pending Sessions
              </span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-amber-700 mt-2">
              {summary.pending_sessions}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Awaiting treatment execution</p>
          </div>

          <div className="bg-white rounded-2xl border border-teal-200/80 p-4 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                Completed Sessions
              </span>
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-teal-700 mt-2">
              {summary.completed_sessions}
            </p>
            <p className="text-xs text-teal-600 mt-0.5">Successfully served</p>
          </div>

          <div className="bg-white rounded-2xl border border-purple-200/80 p-4 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                Earned Commission
              </span>
              <IndianRupee className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-purple-700 mt-2">
              {formatCurrency(summary.total_commission_earned)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">From your assigned sessions</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filter Schedule</span>
          </div>

          {(search || dateFilter !== 'all' || statusFilter !== 'all' || customDate) && (
            <button
              onClick={() => {
                setSearch('');
                setDateFilter('all');
                setCustomDate('');
                setStatusFilter('all');
                setPage(1);
              }}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-medium hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Date Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" /> Session Date:
          </span>
          {[
            { id: 'all', label: 'All Dates' },
            { id: 'today', label: 'Today' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'past', label: 'Past' },
            { id: 'custom', label: 'Custom Date' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setDateFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                dateFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {dateFilter === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
          )}
        </div>

        {/* Search & Status Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, mobile, service, appointment number, treatment..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 font-medium"
            >
              <option value="all">All Session Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Register List (Session-Wise Display) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900">Assigned Appointment Sessions</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {pagination.total} sessions
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Page {pagination.current_page} of {pagination.last_page || 1}
          </div>
        </div>

        {/* Table / List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-3 w-10 text-center">Sr.</th>
                <th className="py-3 px-3">Session Date &amp; Time</th>
                <th className="py-3 px-4">Session # &amp; Service</th>
                <th className="py-3 px-3">Appointment #</th>
                <th className="py-3 px-4">Patient Details</th>
                <th className="py-3 px-4">Treatment Details</th>
                <th className="py-3 px-3 text-center">Photo</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Commission</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <p className="text-xs font-medium">Loading your assigned sessions...</p>
                    </div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Stethoscope className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-700">No appointment sessions found</p>
                      <p className="text-xs text-slate-400">There are no sessions assigned to you for the selected filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sessions.map((ses, idx) => {
                  const master = ses.master_appointment || {};
                  const customer = master.customer || {};
                  const hasSessionImage = Boolean(ses.image_url || ses.image);
                  const hasMasterImage = Boolean(master.image_url || master.image);

                  return (
                    <tr
                      key={ses.id}
                      onClick={() => navigate(`/admin/my-appointments/${ses.id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Sr */}
                      <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {(pagination.current_page - 1) * pagination.per_page + idx + 1}
                      </td>

                      {/* Session Date & Slot */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5 text-slate-900 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {ses.session_date ? new Date(ses.session_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }) : '-'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatTimeSlot(ses.session_time)}
                          </span>
                        </div>
                      </td>

                      {/* Session # & Service */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2">
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200 shrink-0 mt-0.5">
                            S{ses.session_number}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">
                              {ses.service?.name || ses.treatment_details || 'Clinical Session'}
                            </p>
                            {ses.service?.category?.name && (
                              <p className="text-[10px] text-slate-400 font-medium">
                                {ses.service.category.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Appointment # */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-semibold text-slate-800 bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors px-2 py-0.5 rounded-md border border-slate-200">
                          {master.appointment_number || '-'}
                        </span>
                      </td>

                      {/* Patient Details */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{customer.name || 'Walk-in Patient'}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {customer.mobile || '-'}
                            {customer.gender ? ` (${customer.gender})` : ''}
                            {customer.age ? `, ${customer.age}y` : ''}
                          </p>
                        </div>
                      </td>

                      {/* Treatment Details */}
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-700 font-medium">
                        {ses.treatment_details || '—'}
                      </td>

                      {/* Photo Badge */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {hasSessionImage ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <ImageIcon className="w-3 h-3 text-purple-600" />
                            Session
                          </span>
                        ) : hasMasterImage ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <ImageIcon className="w-3 h-3 text-slate-400" />
                            Master
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[11px] italic">No image</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {ses.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        ) : ses.status === 'in_progress' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3" />
                            In Progress
                          </span>
                        ) : ses.status === 'cancelled' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <X className="w-3 h-3" />
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Commission */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono font-semibold text-slate-800">
                        {Number(ses.staff_commission) > 0 ? (
                          <span className="text-emerald-700 font-bold">{formatCurrency(ses.staff_commission)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/my-appointments/${ses.id}`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
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
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} records
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
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
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
