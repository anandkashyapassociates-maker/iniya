import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
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
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CalendarCheck,
  Stethoscope,
  Image as ImageIcon,
  FileText,
  Package,
  IndianRupee,
  ZoomIn,
  Shield,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useAdminAuth } from '../../../features/auth/AdminAuthContext';
import staffAppointmentService from '../../../services/staffAppointmentService';
import { useToast } from '../../../context/ToastContext';

export default function StaffMyAppointmentsPage() {
  const { user } = useAdminAuth();
  const toast = useToast();

  // If logged-in user is not staff (e.g. Administrator), redirect to master appointments
  if (user && user.role !== 'staff') {
    return <Navigate to="/admin/appointments" replace />;
  }

  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState({
    total_appointments: 0,
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

  // Modal State
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Fetch appointments assigned to this staff
  const fetchAppointments = useCallback(async () => {
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
      if (res && res.appointments) {
        setAppointments(res.appointments.data || []);
        setPagination({
          current_page: res.appointments.current_page || 1,
          last_page: res.appointments.last_page || 1,
          total: res.appointments.total || 0,
          per_page: res.appointments.per_page || 15,
        });
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load my appointments:', err);
      toast.error('Failed to load your assigned appointments.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, dateFilter, customDate, statusFilter, toast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Open Appointment Details Modal
  const handleOpenDetails = async (appointmentId) => {
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const res = await staffAppointmentService.getAppointmentDetails(appointmentId);
      if (res && res.appointment) {
        setSelectedAppointment(res.appointment);
      }
    } catch (err) {
      console.error('Failed to load appointment details:', err);
      toast.error('Failed to load appointment details.');
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
            <CalendarCheck className="w-5 h-5 drop-shadow-sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">My Appointments</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Staff Portal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Personal clinical schedule &amp; patient appointments assigned to you.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAppointments()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Schedule</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Row 1: 2 Cards, Row 2: 3 Cards) */}
      <div className="space-y-3.5">
        {/* Row 1: 2 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="bg-white rounded-2xl border border-blue-200/80 p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                My Total Appointments
              </span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
              {summary.total_appointments}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{summary.total_sessions} total assigned treatment sessions</p>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Today's Sessions
              </span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700 mt-2">
              {summary.today_sessions}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">Sessions scheduled for today</p>
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
            <p className="text-xs text-slate-500 mt-0.5">From assigned sessions</p>
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
            <Calendar className="w-3 h-3 text-slate-400" /> Date:
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
              placeholder="Search by patient name, mobile, appointment number, treatment..."
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

      {/* Appointments Register List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900">Assigned Patient Appointments</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {pagination.total} appointments
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
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Appointment #</th>
                <th className="py-3 px-4">Patient Details</th>
                <th className="py-3 px-4">Assigned Sessions &amp; Services</th>
                <th className="py-3 px-3 text-center">Photo</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Commission</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <p className="text-xs font-medium">Loading your appointments schedule...</p>
                    </div>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Stethoscope className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-700">No appointments found</p>
                      <p className="text-xs text-slate-400">There are no appointments assigned to you for the selected filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((apt, idx) => {
                  const staffSessions = (apt.sessions || []).filter(
                    (s) => String(s.staff_id) === String(user?.id)
                  );
                  const displaySessions = staffSessions.length > 0 ? staffSessions : (apt.sessions || []);
                  const totalCommission = displaySessions.reduce((acc, s) => acc + Number(s.staff_commission || 0), 0);
                  const hasMasterImage = Boolean(apt.image_url || apt.image);
                  const hasSessionImage = displaySessions.some((s) => Boolean(s.image_url || s.image));

                  return (
                    <tr
                      key={apt.id}
                      onClick={() => handleOpenDetails(apt.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Sr */}
                      <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {(pagination.current_page - 1) * pagination.per_page + idx + 1}
                      </td>

                      {/* Appointment Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }) : '-'}
                          </span>
                        </div>
                      </td>

                      {/* Appointment Number */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-semibold text-slate-900 bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors px-2 py-0.5 rounded-md border border-slate-200">
                          {apt.appointment_number}
                        </span>
                      </td>

                      {/* Patient Details */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{apt.customer?.name || 'Walk-in Patient'}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {apt.customer?.opd_number ? `OPD: ${apt.customer.opd_number} • ` : ''}
                            {apt.customer?.mobile || '-'}
                            {apt.customer?.gender ? ` (${apt.customer.gender})` : ''}
                          </p>
                        </div>
                      </td>

                      {/* Sessions & Services */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {displaySessions.map((s) => (
                            <div key={s.id} className="flex items-center gap-2 text-xs">
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold border border-slate-200">
                                S{s.session_number}
                              </span>
                              <span className="font-semibold text-slate-800">
                                {s.service?.name || s.treatment_details || 'General Clinical Treatment'}
                              </span>
                              {s.session_time && (
                                <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {s.session_time}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Photo Badge */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {hasMasterImage || hasSessionImage ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <ImageIcon className="w-3 h-3 text-purple-600" />
                            Photo
                          </span>
                        ) : (
                          <span className="text-slate-300 text-[11px] italic">No image</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {displaySessions.every((s) => s.status === 'completed') ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        ) : displaySessions.some((s) => s.status === 'in_progress') ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3" />
                            In Progress
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
                        {totalCommission > 0 ? (
                          <span className="text-emerald-700 font-bold">{formatCurrency(totalCommission)}</span>
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
                            handleOpenDetails(apt.id);
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
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
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
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* DETAILED APPOINTMENT & SESSION MODAL WITH IMAGES        */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">
                    Appointment Details &amp; Clinical Information
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedAppointment?.appointment_number || 'Loading details...'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedAppointment(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {modalLoading || !selectedAppointment ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                  <p className="text-xs font-semibold">Loading clinical information &amp; appointment images...</p>
                </div>
              ) : (
                <>
                  {/* Top Patient & Schedule Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Patient Card */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Details</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {selectedAppointment.customer?.gender || 'Patient'}
                        </span>
                      </div>
                      <p className="text-base font-bold text-slate-900">{selectedAppointment.customer?.name || 'Walk-in Patient'}</p>
                      <div className="space-y-1 text-slate-600 text-[11px]">
                        {selectedAppointment.customer?.opd_number && (
                          <p className="font-mono">OPD Number: <span className="font-bold text-slate-800">{selectedAppointment.customer.opd_number}</span></p>
                        )}
                        <p className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{selectedAppointment.customer?.mobile || 'No contact provided'}</span>
                        </p>
                        {selectedAppointment.customer?.email && (
                          <p className="text-slate-500">{selectedAppointment.customer.email}</p>
                        )}
                        {selectedAppointment.customer?.age && (
                          <p>Age: <span className="font-semibold text-slate-800">{selectedAppointment.customer.age} Years</span></p>
                        )}
                      </div>
                    </div>

                    {/* Appointment Info Card */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Appointment Overview</span>
                        <span className="font-mono font-bold text-slate-900">{selectedAppointment.appointment_number}</span>
                      </div>
                      <div className="space-y-1.5 text-slate-600 text-[11px] pt-1">
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Appointment Date: <strong className="text-slate-900">{selectedAppointment.appointment_date}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                          <span>Consultation Fees: <strong className="text-slate-900">{formatCurrency(selectedAppointment.appointment_fees)}</strong></span>
                        </p>
                        {selectedAppointment.sales_team && (
                          <p className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Referred by: <strong>{selectedAppointment.sales_team.name} ({selectedAppointment.sales_team.sales_code})</strong></span>
                          </p>
                        )}
                        {selectedAppointment.notes && (
                          <p className="text-slate-600 italic mt-1 bg-white p-2 rounded-xl border border-slate-200">
                            "{selectedAppointment.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* MASTER APPOINTMENT IMAGE (from master_appointments table) */}
                  {/* ======================================================== */}
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Appointment Primary Photo / Prescription
                        </h4>
                      </div>
                      {selectedAppointment.image_url || selectedAppointment.image ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                          Uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 italic">
                          (image pe abhi kaam chal rha h)
                        </span>
                      )}
                    </div>

                    {selectedAppointment.image_url || selectedAppointment.image ? (
                      <div className="relative group max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                        <img
                          src={selectedAppointment.image_url || selectedAppointment.image}
                          alt="Appointment Record"
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => setLightboxImage(selectedAppointment.image_url || selectedAppointment.image)}
                          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-semibold text-xs cursor-pointer"
                        >
                          <ZoomIn className="w-5 h-5" />
                          <span>View Full Image</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <p className="text-[11px] font-medium text-slate-500">No primary appointment image uploaded yet.</p>
                        <p className="text-[10px] text-slate-400">Master appointment image column will render automatically once saved.</p>
                      </div>
                    )}
                  </div>

                  {/* ======================================================== */}
                  {/* SESSIONS BREAKDOWN & SESSION IMAGES                      */}
                  {/* ======================================================== */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Treatment Sessions ({selectedAppointment.sessions?.length || 0})
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(selectedAppointment.sessions || []).map((ses) => {
                        const isMySession = String(ses.staff_id) === String(user?.id);
                        const hasSessionImg = Boolean(ses.image_url || ses.image);

                        return (
                          <div
                            key={ses.id}
                            className={`rounded-2xl border p-4 space-y-3 transition-all ${
                              isMySession
                                ? 'bg-white border-emerald-300 ring-2 ring-emerald-500/10 shadow-xs'
                                : 'bg-slate-50/60 border-slate-200'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${
                                  isMySession ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  Session #{ses.session_number}
                                </span>
                                <h5 className="font-bold text-slate-900 text-sm">
                                  {ses.service?.name || ses.treatment_details || 'Clinical Session'}
                                </h5>
                                {isMySession && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Assigned To You
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-600 text-xs flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {ses.session_date} {ses.session_time ? `• ${ses.session_time}` : ''}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  ses.status === 'completed'
                                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                    : ses.status === 'in_progress'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {ses.status}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600">
                              {ses.treatment_details && (
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Treatment Details</span>
                                  <p className="font-medium text-slate-800">{ses.treatment_details}</p>
                                </div>
                              )}

                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Attending Practitioner</span>
                                <p className="font-medium text-slate-800">
                                  {ses.staff?.name || 'Unassigned'} {ses.staff?.staff_code ? `(${ses.staff.staff_code})` : ''}
                                </p>
                              </div>

                              {ses.staff_commission > 0 && (
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Staff Commission</span>
                                  <p className="font-bold text-emerald-700 font-mono">{formatCurrency(ses.staff_commission)}</p>
                                </div>
                              )}

                              {ses.selected_products && ses.selected_products.length > 0 && (
                                <div className="sm:col-span-2">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                    Inventory Products Allocated:
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {ses.selected_products.map((prod) => (
                                      <span key={prod.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px]">
                                        <Package className="w-3 h-3 text-slate-400" />
                                        {prod.product_name} ({prod.business_unit || 'Unit'})
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* SESSION IMAGE (from appointment_sessions table) */}
                            <div className="pt-2 border-t border-slate-100">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                                Session Treatment Photo (appointment_sessions.image)
                              </span>
                              {hasSessionImg ? (
                                <div className="relative group w-44 h-28 rounded-xl overflow-hidden border border-slate-200 bg-white">
                                  <img
                                    src={ses.image_url || ses.image}
                                    alt={`Session ${ses.session_number} Photo`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setLightboxImage(ses.image_url || ses.image)}
                                    className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold gap-1.5 cursor-pointer"
                                  >
                                    <ZoomIn className="w-4 h-4" />
                                    <span>Zoom</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="p-2.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center gap-2 text-slate-400">
                                  <ImageIcon className="w-4 h-4 text-slate-300" />
                                  <span className="text-[11px]">No clinical photo attached for Session #{ses.session_number} yet.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Staff: {user?.name} ({user?.staff_code || 'Staff'})
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedAppointment(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Full Image Zoom */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Zoomed Record"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
