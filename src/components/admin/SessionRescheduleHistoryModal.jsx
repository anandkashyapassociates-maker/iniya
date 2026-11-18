import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Loader2,
  FileText,
  Package,
  UserCheck,
  RotateCw,
  Sparkles,
} from 'lucide-react';
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
          setError('Failed to load modification history.');
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
                Reschedule &amp; Reassign History
              </h3>
              <p className="text-xs text-slate-300">
                Session #{session.session_number} &bull; Complete chronological modification trail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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
              <h4 className="font-medium text-slate-800 text-sm">No Modification Records</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                This session has not been rescheduled or reassigned yet. It is running on its original scheduled slot and staff.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-indigo-200 ml-4 pl-6 space-y-6">
              {histories.map((h, idx) => {
                const staffChanged = Boolean(
                  h.old_staff_id && h.new_staff_id && Number(h.old_staff_id) !== Number(h.new_staff_id)
                );
                const dateChanged = Boolean(
                  h.old_date && h.new_date && String(h.old_date).slice(0, 10) !== String(h.new_date).slice(0, 10)
                );
                const timeChanged = Boolean(
                  h.old_time && h.new_time && String(h.old_time).trim() !== String(h.new_time).trim()
                );
                const dateTimeChanged = dateChanged || timeChanged;

                let historyType = 'reschedule';
                if (staffChanged && !dateTimeChanged) {
                  historyType = 'reassign';
                } else if (!staffChanged && dateTimeChanged) {
                  historyType = 'reschedule';
                } else if (staffChanged && dateTimeChanged) {
                  historyType = 'both';
                }

                return (
                  <div key={h.id || idx} className="relative group">
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                        historyType === 'reassign'
                          ? 'bg-teal-600 ring-teal-200'
                          : historyType === 'both'
                          ? 'bg-purple-600 ring-purple-200'
                          : 'bg-indigo-600 ring-indigo-200'
                      }`}
                    />

                    <div className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors">
                      {/* Header: Date of change + Modification Type Badge + Admin */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-2.5 pb-2 border-b border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">
                            {h.created_at ? new Date(h.created_at).toLocaleString() : 'N/A'}
                          </span>
                          {historyType === 'reassign' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
                              <UserCheck className="w-3 h-3 text-teal-600" />
                              <span>Staff Reassigned</span>
                            </span>
                          )}
                          {historyType === 'reschedule' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                              <RotateCw className="w-3 h-3 text-indigo-600" />
                              <span>Session Rescheduled</span>
                            </span>
                          )}
                          {historyType === 'both' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              <span>Rescheduled &amp; Reassigned</span>
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          By: {h.rescheduled_by || 'Admin'}
                        </span>
                      </div>

                      {/* Change comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Old Slot */}
                        <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200/80 text-rose-950 space-y-2">
                          <span className="block font-bold uppercase text-[10px] tracking-wider text-rose-700">
                            {historyType === 'reassign' ? 'Previous Staff & Details' : 'Previous Schedule'}
                          </span>
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-1.5 text-slate-800">
                              <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className={`font-medium ${dateChanged ? 'line-through text-slate-500' : ''}`}>
                                {h.old_date ? String(h.old_date).slice(0, 10) : '—'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-slate-800">
                              <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className={`font-medium ${timeChanged ? 'line-through text-slate-500' : ''}`}>
                                {h.old_time || '—'}
                              </span>
                            </div>
                            <div className={`flex items-center space-x-1.5 ${staffChanged ? 'p-1 rounded-md bg-rose-100/70 border border-rose-200 text-rose-900 font-semibold' : 'text-slate-800'}`}>
                              <User className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{h.old_staff?.name || `Staff #${h.old_staff_id}`}</span>
                              {staffChanged && <span className="text-[10px] text-rose-600 font-normal">(Previous)</span>}
                            </div>
                            {h.old_commission !== null && h.old_commission !== undefined && (
                              <div className="flex items-center space-x-1.5 text-slate-800 text-[11px]">
                                <span className="font-bold text-rose-500 shrink-0">₹</span>
                                <span className="font-mono">Commission: ₹{Number(h.old_commission).toFixed(2)}</span>
                              </div>
                            )}

                            {/* Old Products / Supplies */}
                            <div className="pt-2 border-t border-rose-200/60">
                              <span className="block text-[10px] uppercase font-bold text-rose-700 tracking-wider mb-1 flex items-center gap-1">
                                <Package className="w-3 h-3 text-rose-500 shrink-0" />
                                <span>Supplies Used</span>
                              </span>
                              {h.old_products && h.old_products.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {h.old_products.map((p) => (
                                    <span
                                      key={p.id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-rose-900 border border-rose-200 text-[11px] font-medium shadow-2xs"
                                    >
                                      <span>{p.product_name}</span>
                                      {p.business_unit && (
                                        <span className="text-[10px] text-rose-500 font-mono">({p.business_unit})</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">No supplies allocated</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* New Slot */}
                        <div className={`p-3 rounded-xl border space-y-2 ${
                          historyType === 'reassign'
                            ? 'bg-teal-50/70 border-teal-200/80 text-teal-950'
                            : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                        }`}>
                          <span className={`block font-bold uppercase text-[10px] tracking-wider ${
                            historyType === 'reassign' ? 'text-teal-700' : 'text-emerald-700'
                          }`}>
                            {historyType === 'reassign'
                              ? 'New Reassigned Staff'
                              : historyType === 'both'
                              ? 'New Rescheduled & Reassigned Slot'
                              : 'New Rescheduled Slot'}
                          </span>
                          <div className="space-y-1.5">
                            <div className="flex items-center space-x-1.5 text-slate-800">
                              <Calendar className={`w-3.5 h-3.5 shrink-0 ${historyType === 'reassign' ? 'text-teal-500' : 'text-emerald-500'}`} />
                              <span className={`font-medium ${dateChanged ? 'font-bold text-indigo-700' : ''}`}>
                                {h.new_date ? String(h.new_date).slice(0, 10) : '—'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-slate-800">
                              <Clock className={`w-3.5 h-3.5 shrink-0 ${historyType === 'reassign' ? 'text-teal-500' : 'text-emerald-500'}`} />
                              <span className={`font-medium ${timeChanged ? 'font-bold text-indigo-700' : ''}`}>
                                {h.new_time || '—'}
                              </span>
                            </div>
                            <div className={`flex items-center space-x-1.5 ${staffChanged ? 'p-1 rounded-md bg-teal-100/70 border border-teal-200 text-teal-950 font-bold' : 'text-slate-800'}`}>
                              {staffChanged ? (
                                <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              ) : (
                                <User className={`w-3.5 h-3.5 shrink-0 ${historyType === 'reassign' ? 'text-teal-500' : 'text-emerald-500'}`} />
                              )}
                              <span>{h.new_staff?.name || `Staff #${h.new_staff_id}`}</span>
                              {staffChanged && (
                                <span className="text-[10px] text-teal-700 font-semibold px-1 rounded bg-teal-200/60">
                                  (Reassigned)
                                </span>
                              )}
                            </div>
                            {h.new_commission !== null && h.new_commission !== undefined && (
                              <div className="flex items-center space-x-1.5 text-slate-800 text-[11px]">
                                <span className={`font-bold shrink-0 ${historyType === 'reassign' ? 'text-teal-600' : 'text-emerald-500'}`}>₹</span>
                                <span className="font-mono font-medium">Commission: ₹{Number(h.new_commission).toFixed(2)}</span>
                              </div>
                            )}

                            {/* New Products / Supplies */}
                            <div className={`pt-2 border-t ${historyType === 'reassign' ? 'border-teal-200/60' : 'border-emerald-200/60'}`}>
                              <span className={`block text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1 ${
                                historyType === 'reassign' ? 'text-teal-700' : 'text-emerald-700'
                              }`}>
                                <Package className={`w-3 h-3 shrink-0 ${historyType === 'reassign' ? 'text-teal-500' : 'text-emerald-500'}`} />
                                <span>Supplies Used</span>
                              </span>
                              {h.new_products && h.new_products.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {h.new_products.map((p) => (
                                    <span
                                      key={p.id}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border text-[11px] font-medium shadow-2xs ${
                                        historyType === 'reassign'
                                          ? 'text-teal-900 border-teal-200'
                                          : 'text-emerald-900 border-emerald-200'
                                      }`}
                                    >
                                      <span>{p.product_name}</span>
                                      {p.business_unit && (
                                        <span className={`text-[10px] font-mono ${historyType === 'reassign' ? 'text-teal-600' : 'text-emerald-600'}`}>
                                          ({p.business_unit})
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">No supplies allocated</span>
                              )}
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
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
