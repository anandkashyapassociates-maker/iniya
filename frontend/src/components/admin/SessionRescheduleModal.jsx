import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, AlertCircle, X, Check, Loader2 } from 'lucide-react';
import adminMasterAppointmentService from '../../services/adminMasterAppointmentService';
import { useToast } from '../../context/ToastContext';

export default function SessionRescheduleModal({
  isOpen,
  onClose,
  session,
  staffList = [],
  onSuccess,
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [staffId, setStaffId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (session) {
      setSessionDate(session.session_date ? String(session.session_date).slice(0, 10) : todayStr);
      setSessionTime(session.session_time || '10:00');
      setStaffId(session.staff_id || (staffList[0]?.id ?? ''));
      setReason('');
      setError('');
    }
  }, [session, staffList, todayStr]);

  if (!isOpen || !session) return null;

  // STRICT BUSINESS RULE: Only pending sessions can be rescheduled
  const isPending = session.status === 'pending';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPending) {
      setError("Only 'Pending' sessions can be rescheduled. This session cannot be changed.");
      return;
    }

    if (!sessionDate) {
      setError('Please select a new session date.');
      return;
    }

    if (!sessionTime) {
      setError('Please select a new session time.');
      return;
    }

    if (!staffId) {
      setError('Please assign a staff member.');
      return;
    }

    // Past time check for today
    if (sessionDate === todayStr) {
      const now = new Date();
      const [h, m] = sessionTime.split(':').map(Number);
      const selected = new Date();
      selected.setHours(h, m, 0, 0);
      if (selected < now) {
        setError('New session time cannot be in the past for today.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const res = await adminMasterAppointmentService.rescheduleSession(session.id, {
        session_date: sessionDate,
        session_time: sessionTime,
        staff_id: staffId,
        reschedule_reason: reason || undefined,
      });

      toast.success(res.message || 'Session rescheduled successfully!');
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.status?.[0] || 'Failed to reschedule session.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">
                Reschedule Session #{session.session_number}
              </h3>
              <p className="text-xs text-blue-100">
                Update date, time, and assigned staff member
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prohibited Alert if not pending */}
        {!isPending ? (
          <div className="p-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-amber-800">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Rescheduling Prohibited</p>
                <p className="text-xs mt-1 text-amber-700">
                  Only sessions with <strong>Pending</strong> status can be rescheduled. This session is currently{' '}
                  <span className="capitalize font-bold text-amber-900">
                    {session.status.replace('_', ' ')}
                  </span>
                  .
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Current Session Summary */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <div>
                <span className="font-medium text-slate-500">Current Slot:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {session.session_date ? String(session.session_date).slice(0, 10) : ''} at {session.session_time}
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-500">Staff:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {session.staff?.name || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* New Session Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Session Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={todayStr}
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            {/* New Session Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Session Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            {/* New Assigned Staff */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Assigned Staff <span className="text-rose-500">*</span>
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
              >
                <option value="">Select Staff Member</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} {st.department ? `(${st.department})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Reschedule Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Reschedule Reason (Optional)
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this session being rescheduled?"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors resize-none placeholder:text-slate-400"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center space-x-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rescheduling...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Reschedule</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

