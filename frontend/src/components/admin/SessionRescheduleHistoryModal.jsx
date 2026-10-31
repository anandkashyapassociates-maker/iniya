import React, { useState, useEffect } from 'react';
import { History, X, Calendar, Clock, User, ArrowRight, Loader2, FileText } from 'lucide-react';
import adminMasterAppointmentService from '../../services/adminMasterAppointmentService';

export default function SessionRescheduleHistoryModal({
  isOpen,
  onClose,
  session,
}) {
  const [loading, setLoading] = useState(false);
  const [histories, setHistories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && session) {
      setLoading(true);
      setError('');
      adminMasterAppointmentService.getRescheduleHistory(session.id)
        .then((res) => {
          setHistories(res.data?.histories || []);
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to load reschedule audit history.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <History className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">
                Reschedule Audit History
              </h3>
              <p className="text-xs text-slate-300">
                Session #{session.session_number} &bull; Complete chronological modification trail
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-sm">Loading audit records...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-200">
              {error}
            </div>
          ) : histories.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-medium text-slate-800 text-sm">No Reschedule Records</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                This session has not been rescheduled yet. It is running on its original scheduled slot.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-indigo-200 ml-4 pl-6 space-y-6">
              {histories.map((h, idx) => (
                <div key={h.id || idx} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-200" />

                  <div className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors">
                    {/* Header: Date of change + Admin */}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5 pb-2 border-b border-slate-200/60">
                      <span className="font-semibold text-slate-700">
                        {h.created_at ? new Date(h.created_at).toLocaleString() : 'N/A'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        By: {h.rescheduled_by || 'Admin'}
                      </span>
                    </div>

                    {/* Change comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Old Slot */}
                      <div className="p-2.5 bg-rose-50/60 rounded-lg border border-rose-100 text-rose-900">
                        <span className="block font-semibold uppercase text-[10px] tracking-wider text-rose-700 mb-1">
                          Previous Schedule
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-rose-500" />
                            <span>{h.old_date ? String(h.old_date).slice(0, 10) : ''}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-rose-500" />
                            <span>{h.old_time}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-slate-700">
                            <User className="w-3.5 h-3.5 text-rose-500" />
                            <span>{h.old_staff?.name || `Staff #${h.old_staff_id}`}</span>
                          </div>
                        </div>
                      </div>

                      {/* New Slot */}
                      <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100 text-emerald-900">
                        <span className="block font-semibold uppercase text-[10px] tracking-wider text-emerald-700 mb-1">
                          New Rescheduled Slot
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-medium">{h.new_date ? String(h.new_date).slice(0, 10) : ''}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-medium">{h.new_time}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-slate-700">
                            <User className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-medium">{h.new_staff?.name || `Staff #${h.new_staff_id}`}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    {h.reschedule_reason && (
                      <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Reason: </span>
                        <span>{h.reschedule_reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

