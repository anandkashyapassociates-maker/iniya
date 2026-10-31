import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  ArrowLeft,
  Plus,
  Loader2,
  Package,
  RotateCw,
  Eye,
} from 'lucide-react';
import adminMasterAppointmentService from '../../services/adminMasterAppointmentService';
import SessionRescheduleModal from '../../components/admin/SessionRescheduleModal';
import SessionQuickDetailsModal from '../../components/admin/SessionQuickDetailsModal';
import { useToast } from '../../context/ToastContext';

export default function AdminAppointmentCalendarPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter options
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Selected session for reschedule or details modal
  const [rescheduleSession, setRescheduleSession] = useState(null);
  const [detailSession, setDetailSession] = useState(null);

  // Load staff list
  useEffect(() => {
    adminMasterAppointmentService.getOptions()
      .then((res) => {
        if (res.success && res.data) {
          setStaffList(res.data.staff || []);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Compute start and end date of currently viewed period
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewMode === 'month') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return {
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0],
      };
    } else if (viewMode === 'week') {
      const curr = new Date(currentDate);
      const first = curr.getDate() - curr.getDay();
      const last = first + 6;
      const firstDay = new Date(curr.setDate(first));
      const lastDay = new Date(curr.setDate(last));
      return {
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0],
      };
    } else {
      // Day view
      const dayStr = currentDate.toISOString().split('T')[0];
      return {
        start: dayStr,
        end: dayStr,
      };
    }
  }, [currentDate, viewMode]);

  // Fetch sessions for current range
  const fetchCalendarSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        start_date: dateRange.start,
        end_date: dateRange.end,
      };
      if (selectedStaffId) params.staff_id = selectedStaffId;
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;

      const res = await adminMasterAppointmentService.getCalendarSessions(params);
      if (res.success && res.data) {
        setSessions(res.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load calendar appointments.');
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedStaffId, selectedStatus, toast]);

  useEffect(() => {
    fetchCalendarSessions();
  }, [fetchCalendarSessions]);

  // Month navigation
  const handlePrev = () => {
    const copy = new Date(currentDate);
    if (viewMode === 'month') copy.setMonth(copy.getMonth() - 1);
    else if (viewMode === 'week') copy.setDate(copy.getDate() - 7);
    else copy.setDate(copy.getDate() - 1);
    setCurrentDate(copy);
  };

  const handleNext = () => {
    const copy = new Date(currentDate);
    if (viewMode === 'month') copy.setMonth(copy.getMonth() + 1);
    else if (viewMode === 'week') copy.setDate(copy.getDate() + 7);
    else copy.setDate(copy.getDate() + 1);
    setCurrentDate(copy);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Group sessions by date YYYY-MM-DD
  const sessionsByDate = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const d = s.session_date ? String(s.session_date).slice(0, 10) : '';
      if (!map[d]) map[d] = [];
      map[d].push(s);
    });
    return map;
  }, [sessions]);

  // Generate Month Grid Days
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 for Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Prev month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill 35 or 42 cells
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/admin/appointments')}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Appointments Directory</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Session Calendar</span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              Session Timeline View
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visual clinical schedule of independent treatment sessions by date, time, and assigned practitioner.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={() => navigate('/admin/appointments/create')}
            className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Master Appointment</span>
          </button>
        </div>
      </div>

      {/* Calendar Controls & Filters Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Date Navigation */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button
              onClick={handlePrev}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-slate-900">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              ...(viewMode === 'day' ? { day: 'numeric', weekday: 'short' } : {}),
            })}
          </h2>
        </div>

        {/* View Mode Switcher + Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Staff Filter */}
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Staff Members</option>
            {staffList.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} {st.department ? `(${st.department})` : ''}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'month' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'week' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'day' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* CALENDAR BODY */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading scheduled sessions...</p>
          </div>
        ) : viewMode === 'month' ? (
          /* MONTH VIEW */
          <div>
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 py-2.5">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 border-b border-slate-100">
              {monthGridDays.map((dayObj, i) => {
                const daySessions = sessionsByDate[dayObj.dateStr] || [];
                const isToday = dayObj.dateStr === todayStr;

                return (
                  <div
                    key={i}
                    className={`min-h-[120px] p-2 flex flex-col transition-colors ${
                      dayObj.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-400'
                    } ${isToday ? 'bg-blue-50/20' : ''}`}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : dayObj.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {dayObj.date.getDate()}
                      </span>
                      {daySessions.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-400">
                          {daySessions.length} {daySessions.length === 1 ? 'session' : 'sessions'}
                        </span>
                      )}
                    </div>

                    {/* Session Cards list */}
                    <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[100px]">
                      {daySessions.map((ses) => {
                        const statusColors =
                          ses.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : ses.status === 'in_progress'
                            ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                            : ses.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100';

                        return (
                          <div
                            key={ses.id}
                            onClick={() => setDetailSession(ses)}
                            className={`p-1.5 rounded-lg border text-[11px] cursor-pointer transition-all shadow-2xs ${statusColors}`}
                            title={`${ses.session_time} - ${ses.treatment_details} (${ses.staff?.name || 'Unassigned'})`}
                          >
                            <div className="flex items-center justify-between font-bold leading-tight">
                              <span>{ses.session_time}</span>
                              <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-80">
                                #{ses.session_number}
                              </span>
                            </div>
                            <div className="truncate font-semibold mt-0.5">
                              {ses.treatment_details}
                            </div>
                            <div className="text-[10px] opacity-75 truncate">
                              {ses.staff?.name || 'No Staff'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* WEEK / DAY VIEW */
          <div className="p-6">
            <div className="space-y-4">
              {Object.keys(sessionsByDate).length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold text-slate-700">No Sessions Found</p>
                  <p className="text-xs text-slate-500 mt-1">There are no clinical sessions booked in this date range.</p>
                </div>
              ) : (
                Object.keys(sessionsByDate).sort().map((dStr) => {
                  const sList = sessionsByDate[dStr] || [];
                  const dateObj = new Date(dStr);

                  return (
                    <div key={dStr} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 text-sm font-bold text-slate-800">
                        <span>
                          {dateObj.toLocaleDateString('en-US', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {sList.length} Sessions
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sList.map((ses) => (
                          <div
                            key={ses.id}
                            className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 hover:border-indigo-300 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                Session #{ses.session_number}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  ses.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700'
                                    : ses.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {ses.status}
                              </span>
                            </div>

                            <div className="font-semibold text-sm text-slate-900">{ses.treatment_details}</div>

                            <div className="text-xs text-slate-600 flex items-center justify-between">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{ses.session_time}</span>
                              </span>
                              <span className="flex items-center space-x-1 font-medium">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>{ses.staff?.name || 'Unassigned'}</span>
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                              <button
                                onClick={() => navigate(`/admin/appointments/${ses.master_appointment_id}`)}
                                className="text-blue-600 font-semibold hover:underline inline-flex items-center space-x-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Master</span>
                              </button>
                              {ses.status === 'pending' && (
                                <button
                                  onClick={() => setRescheduleSession(ses)}
                                  className="text-indigo-600 font-semibold hover:underline inline-flex items-center space-x-1"
                                >
                                  <RotateCw className="w-3.5 h-3.5" />
                                  <span>Reschedule</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Session Details Modal */}
      <SessionQuickDetailsModal
        isOpen={Boolean(detailSession)}
        onClose={() => setDetailSession(null)}
        session={detailSession}
        onReschedule={(ses) => {
          setDetailSession(null);
          setRescheduleSession(ses);
        }}
        onViewMaster={(masterId) => {
          setDetailSession(null);
          navigate(`/admin/appointments/${masterId}`);
        }}
      />

      {/* Reschedule Modal */}
      <SessionRescheduleModal
        isOpen={Boolean(rescheduleSession)}
        onClose={() => setRescheduleSession(null)}
        session={rescheduleSession}
        staffList={staffList}
        onSuccess={() => fetchCalendarSessions()}
      />
    </div>
  );
}

