import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, AlertCircle, X, Check, Loader2, Package } from 'lucide-react';
import adminMasterAppointmentService from '../../services/adminMasterAppointmentService';
import ProductMultiSelectDropdown from './ProductMultiSelectDropdown';
import { useToast } from '../../context/ToastContext';

export default function SessionRescheduleModal({
  isOpen,
  onClose,
  session,
  staffList = [],
  inventoryProducts = [],
  onSuccess,
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [staffId, setStaffId] = useState('');
  const [staffCommission, setStaffCommission] = useState('0');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (session) {
      setSessionDate(session.session_date ? String(session.session_date).slice(0, 10) : todayStr);
      setSessionTime(session.session_time || '10:00');
      setStaffId(session.staff_id || (staffList[0]?.id ?? ''));
      setStaffCommission(
        session.staff_commission !== undefined && session.staff_commission !== null
          ? String(session.staff_commission)
          : '0'
      );

      // Pre-populate products from session (support multiple or legacy single)
      const existingProductIds = session.selected_products && session.selected_products.length > 0
        ? session.selected_products.map((p) => Number(p.id))
        : (session.inventory_product_ids && session.inventory_product_ids.length > 0
            ? session.inventory_product_ids.map(Number)
            : (session.inventory_product_id ? [Number(session.inventory_product_id)] : []));
      setSelectedProductIds(existingProductIds);

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

    if (staffCommission === '' || isNaN(Number(staffCommission)) || Number(staffCommission) < 0) {
      setError('Please enter a valid staff commission (₹0 or greater).');
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
      const pIds = (selectedProductIds || []).map(Number);
      const res = await adminMasterAppointmentService.rescheduleSession(session.id, {
        session_date: sessionDate,
        session_time: sessionTime,
        staff_id: staffId,
        staff_commission: Number(staffCommission),
        inventory_product_ids: pIds,
        inventory_product_id: pIds.length > 0 ? pIds[0] : null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl my-auto max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/15 rounded-xl">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight font-display">
                Reschedule Session #{session.session_number}
              </h3>
              <p className="text-xs text-blue-100">
                Update date, time, assigned doctor, commission &amp; supplies
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
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {error && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Current Session Summary */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div>
                <span className="font-medium text-slate-500">Current Slot:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {session.session_date ? String(session.session_date).slice(0, 10) : ''} at {session.session_time}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <span className="font-medium text-slate-500">Staff:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {session.staff?.name || 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Commission:</span>{' '}
                  <span className="font-semibold text-slate-800 font-mono">
                    ₹{Number(session.staff_commission || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid 1: Date & Time in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* New Session Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Session Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>

              {/* New Session Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Session Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            {/* Grid 2: Assigned Staff & Commission in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* New Assigned Staff */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Assigned Staff <span className="text-rose-500">*</span>
                </label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors cursor-pointer"
                >
                  <option value="">Select Staff Member</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} {st.department ? `(${st.department})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* New Staff Commission */}
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
                    required
                    className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Product Used: Editable Multi-Select Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Product Used / Supplies (Optional)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Select &bull; Unselect Allowed
                </span>
              </div>
              <ProductMultiSelectDropdown
                products={inventoryProducts}
                selectedIds={selectedProductIds}
                onChange={(newIds) => setSelectedProductIds(newIds)}
                placeholder="-- Select or Search Supplies / Consumables --"
              />
            </div>

            {/* Reschedule Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reschedule Reason (Optional)
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this session being rescheduled?"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors resize-none placeholder:text-slate-400"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center space-x-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
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
