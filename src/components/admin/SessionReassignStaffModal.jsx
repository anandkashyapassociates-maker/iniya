import React, { useState, useEffect } from 'react';
import { UserCheck, User, AlertCircle, X, Check, Loader2, Sparkles, Building2 } from 'lucide-react';
import adminMasterAppointmentService from '../../services/adminMasterAppointmentService';
import { useToast } from '../../context/ToastContext';
import { useAdminAuth } from '../../features/auth/AdminAuthContext';
import { getImageUrl } from '../../utils/imageUrl';

export default function SessionReassignStaffModal({
  isOpen,
  onClose,
  session,
  staffList = [],
  onSuccess,
}) {
  const toast = useToast();
  const { user } = useAdminAuth();
  const isStaff =
    user?.role?.toLowerCase() === 'staff' ||
    user?.user_type?.toLowerCase() === 'staff' ||
    Boolean(user?.is_staff) ||
    user?.role === 'Staff Practitioner' ||
    Boolean(user?.staff_code);

  const [loading, setLoading] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [staffCommission, setStaffCommission] = useState('0');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      // Find current staff (either executed_by or initial staff)
      const currentStaffId = session.executed_by_staff_id || session.staff_id || '';
      setSelectedStaffId(currentStaffId ? String(currentStaffId) : (staffList[0]?.id ? String(staffList[0].id) : ''));
      setStaffCommission(
        session.staff_commission !== undefined && session.staff_commission !== null
          ? String(session.staff_commission)
          : '0'
      );
      setReason('');
      setError('');
    }
  }, [session, staffList]);

  if (!isOpen || !session || isStaff) return null;

  const isPending = session.status === 'pending';

  const currentStaff = session.executed_by || session.executedBy || session.staff;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPending) {
      setError("Only 'Pending' sessions can have staff reassigned.");
      return;
    }

    if (!selectedStaffId) {
      setError('Please select a staff practitioner.');
      return;
    }

    if (staffCommission === '' || isNaN(Number(staffCommission)) || Number(staffCommission) < 0) {
      setError('Please enter a valid staff commission (₹0 or greater).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await adminMasterAppointmentService.reassignStaff(session.id, {
        staff_id: Number(selectedStaffId),
        staff_commission: Number(staffCommission),
        reason: reason.trim() || undefined,
      });

      toast.success(res.message || 'Staff reassigned successfully!');
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.staff_id?.[0] ||
        err.response?.data?.errors?.status?.[0] ||
        'Failed to reassign staff.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Reassign Session Staff</h3>
              <p className="text-xs text-teal-100">
                Session #{session.session_number} &bull; {session.treatment_details || session.service?.name || 'Clinical Procedure'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!isPending && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Staff reassignment is only allowed when session status is <strong>Pending</strong>. Current status: <strong>{session.status}</strong>.
              </span>
            </div>
          )}

          {/* Current Staff & Session Info Summary Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-700 pb-2 border-b border-slate-200/60">
              <span className="font-bold text-slate-900">Current Assigned Practitioner</span>
              <span className="text-slate-500 font-mono text-[11px]">
                {session.session_date ? String(session.session_date).slice(0, 10) : ''} at {session.session_time}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5">
                {currentStaff?.image_url || currentStaff?.profile_photo || currentStaff?.image ? (
                  <img
                    src={getImageUrl(currentStaff.image_url || currentStaff.profile_photo || currentStaff.image)}
                    alt={currentStaff.name}
                    className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {currentStaff?.name ? currentStaff.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
                <div>
                  <div className="font-bold text-slate-900">{currentStaff?.name || 'Unassigned'}</div>
                  <div className="text-[11px] text-slate-500">{currentStaff?.department || 'Practitioner'}</div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Commission</span>
                <span className="font-bold text-slate-800 font-mono text-sm">
                  ₹{Number(session.staff_commission || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Select New Staff */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select New Staff Practitioner <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              disabled={!isPending || loading}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Staff Member</option>
              {staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.department ? `(${st.department})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Staff Commission */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Staff Commission (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-xs sm:text-sm">
                ₹
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={staffCommission}
                onChange={(e) => setStaffCommission(e.target.value)}
                placeholder="0.00"
                disabled={!isPending || loading}
                required
                className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors font-mono disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Fixed commission allocated to this staff practitioner upon completing this session.
            </p>
          </div>

          {/* Reassignment Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason for Reassignment <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Previous staff unavailable, schedule reallocation, client requested..."
              disabled={!isPending || loading}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isPending || loading}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Reassigning...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Confirm Reassignment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
