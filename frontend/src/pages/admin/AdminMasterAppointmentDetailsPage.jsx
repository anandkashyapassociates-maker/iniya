import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  DollarSign,
  Plus,
  Trash2,
  Edit3,
  History,
  RotateCw,
  Package,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import adminMasterAppointmentService from '../../services/adminMasterAppointmentService';
import SessionRescheduleModal from '../../components/admin/SessionRescheduleModal';
import SessionRescheduleHistoryModal from '../../components/admin/SessionRescheduleHistoryModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../context/ToastContext';

export default function AdminMasterAppointmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);

  // Modals state
  const [rescheduleSession, setRescheduleSession] = useState(null);
  const [historySession, setHistorySession] = useState(null);
  const [deleteSessionId, setDeleteSessionId] = useState(null);
  const [deletingSession, setDeletingSession] = useState(false);

  // Add extra session modal/form state
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [addingSession, setAddingSession] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const [newSessionData, setNewSessionData] = useState({
    treatment_details: '',
    session_date: todayStr,
    session_time: '10:00',
    staff_id: '',
    staff_commission: '0',
    inventory_product_id: '',
  });

  // Load appointment details
  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminMasterAppointmentService.get(id);
      if (res.success && res.data) {
        setAppointment(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load master appointment details.');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  // Load options for staff and products
  useEffect(() => {
    adminMasterAppointmentService.getOptions()
      .then((res) => {
        if (res.success && res.data) {
          setStaffList(res.data.staff || []);
          setInventoryProducts(res.data.inventory_products || []);
          if (res.data.staff?.length > 0) {
            setNewSessionData((prev) => ({ ...prev, staff_id: String(res.data.staff[0].id) }));
          }
        }
      })
      .catch((err) => console.error(err));

    fetchDetails();
  }, [fetchDetails]);

  // Update session status
  const handleStatusChange = async (sessionId, newStatus) => {
    try {
      const res = await adminMasterAppointmentService.updateSessionStatus(sessionId, newStatus);
      toast.success(res.message || 'Session status updated!');
      fetchDetails();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update session status.');
    }
  };

  // Delete session
  const handleDeleteSessionConfirm = async () => {
    if (!deleteSessionId) return;
    setDeletingSession(true);
    try {
      await adminMasterAppointmentService.deleteSession(deleteSessionId);
      toast.success('Session deleted successfully.');
      setDeleteSessionId(null);
      fetchDetails();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete session.');
    } finally {
      setDeletingSession(false);
    }
  };

  // Add new session submit
  const handleAddSessionSubmit = async (e) => {
    e.preventDefault();
    if (!newSessionData.treatment_details.trim()) {
      toast.error('Please enter treatment details.');
      return;
    }
    if (!newSessionData.staff_id) {
      toast.error('Please assign a staff member.');
      return;
    }

    setAddingSession(true);
    try {
      const payload = {
        treatment_details: newSessionData.treatment_details.trim(),
        session_date: newSessionData.session_date,
        session_time: newSessionData.session_time,
        staff_id: Number(newSessionData.staff_id),
        staff_commission: Number(newSessionData.staff_commission || 0),
        inventory_product_id: newSessionData.inventory_product_id ? Number(newSessionData.inventory_product_id) : null,
      };

      const res = await adminMasterAppointmentService.addSession(id, payload);
      toast.success(res.message || 'New session attached successfully!');
      setShowAddSessionModal(false);
      setNewSessionData({
        treatment_details: '',
        session_date: todayStr,
        session_time: '10:00',
        staff_id: staffList[0]?.id ? String(staffList[0].id) : '',
        staff_commission: '0',
        inventory_product_id: '',
      });
      fetchDetails();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to add new session.');
    } finally {
      setAddingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Loading appointment details...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-auto mt-12 border border-slate-100 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Appointment Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">
          The requested master appointment record does not exist or has been removed.
        </p>
        <button
          onClick={() => navigate('/admin/appointments')}
          className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Back to Appointments
        </button>
      </div>
    );
  }

  const sessions = appointment.sessions || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/admin/appointments')}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Appointments Directory</span>
          </button>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">
              Master Appointment: {appointment.appointment_number}
            </h1>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Booked on {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString() : 'N/A'} &bull; Managed by {appointment.admin?.name || 'Admin'}
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate(`/admin/appointments/${id}/edit`)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all shadow-xs"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Master Info</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddSessionModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Extra Session</span>
          </button>
        </div>
      </div>

      {/* Master Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Customer Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Patient Details</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <User className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-bold text-slate-900 text-base">{appointment.customer?.name || 'N/A'}</h3>
          <p className="text-xs text-slate-600 font-mono mt-0.5">{appointment.customer?.mobile || ''}</p>
          <p className="text-xs text-slate-400 truncate">{appointment.customer?.email || 'No email registered'}</p>
        </div>

        {/* Sales Team Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sales Attribution</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="font-bold text-slate-900 text-base">{appointment.sales_team?.name || 'N/A'}</h3>
          <p className="text-xs text-slate-600 mt-0.5">{appointment.sales_team?.department || 'Direct OPD'}</p>
          <p className="text-xs text-slate-400 font-mono">{appointment.sales_team?.sales_code || ''}</p>
        </div>

        {/* Fees Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Appointment Fees</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{Number(appointment.appointment_fees || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Charged once at Master level</p>
        </div>

        {/* Notes Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Clinical Notes</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-slate-700 italic line-clamp-3">
            {appointment.notes || 'No additional notes provided for this booking.'}
          </p>
        </div>
      </div>

      {/* SESSIONS TABLE */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Associated Clinical Sessions</h2>
              <p className="text-xs text-slate-500">
                Each session operates independently. Reschedule is only permitted when status is <strong>Pending</strong>.
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            {sessions.length} {sessions.length === 1 ? 'Session Registered' : 'Sessions Registered'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200/70">
              <tr>
                <th className="py-3 px-3.5 text-center w-12">#</th>
                <th className="py-3 px-4">Treatment / Procedure</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4">Product Used</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((ses) => {
                const isPending = ses.status === 'pending';
                const hasRescheduleHistories = (ses.reschedule_histories?.length ?? 0) > 0;

                return (
                  <tr key={ses.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* # */}
                    <td className="py-3 px-3.5 text-center font-bold text-slate-700">
                      {ses.session_number}
                    </td>

                    {/* Treatment / Service */}
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">
                      <div>{ses.treatment_details || (ses.service ? ses.service.name : 'Clinical Procedure')}</div>
                      {ses.service && (
                        <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[11px] font-semibold mt-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>{ses.service.name} (₹{Number(ses.service.price || 0).toLocaleString('en-IN')})</span>
                        </div>
                      )}
                      {hasRescheduleHistories && (
                        <div className="inline-flex items-center space-x-1 text-[10px] text-indigo-600 font-medium mt-1 block">
                          <History className="w-3 h-3" />
                          <span>Rescheduled ({ses.reschedule_histories.length}x)</span>
                        </div>
                      )}
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-4 text-xs">
                      <div className="font-semibold text-slate-800">
                        {ses.session_date ? String(ses.session_date).slice(0, 10) : ''}
                      </div>
                      <div className="text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{ses.session_time}</span>
                      </div>
                    </td>

                    {/* Staff */}
                    <td className="py-3 px-4 text-xs">
                      <div className="font-semibold text-slate-800">{ses.staff?.name || 'Unassigned'}</div>
                      <div className="text-slate-400 text-[11px]">{ses.staff?.department || ''}</div>
                    </td>

                    {/* Commission */}
                    <td className="py-3 px-4 text-xs font-bold text-slate-800">
                      ₹{Number(ses.staff_commission || 0).toFixed(2)}
                    </td>

                    {/* Inventory Product */}
                    <td className="py-3 px-4 text-xs">
                      {ses.selected_products && ses.selected_products.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {ses.selected_products.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]"
                            >
                              <Package className="w-3 h-3 text-slate-400" />
                              <span>{p.product_name}</span>
                            </span>
                          ))}
                        </div>
                      ) : ses.inventory_product ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          <Package className="w-3 h-3 text-slate-400" />
                          <span>{ses.inventory_product.product_name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">None</span>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={ses.status}
                        onChange={(e) => handleStatusChange(ses.id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none transition-colors ${
                          ses.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : ses.status === 'in_progress'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : ses.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Reschedule Button */}
                        <button
                          type="button"
                          onClick={() => setRescheduleSession(ses)}
                          disabled={!isPending}
                          title={
                            isPending
                              ? 'Reschedule Session'
                              : `Reschedule blocked: Status is ${ses.status}`
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            isPending
                              ? 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 cursor-pointer'
                              : 'text-slate-300 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>

                        {/* History Button */}
                        <button
                          type="button"
                          onClick={() => setHistorySession(ses)}
                          title="View Reschedule Audit History"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Delete Session Button */}
                        {sessions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setDeleteSessionId(ses.id)}
                            title="Delete this session"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Extra Session Modal */}
      {showAddSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <h3 className="font-bold text-base">Add Extra Session</h3>
              </div>
              <button
                onClick={() => setShowAddSessionModal(false)}
                className="text-white/80 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSessionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Treatment / Procedure <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSessionData.treatment_details}
                  onChange={(e) =>
                    setNewSessionData({ ...newSessionData, treatment_details: e.target.value })
                  }
                  placeholder="e.g. Follow-up Therapy..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    required
                    value={newSessionData.session_date}
                    onChange={(e) =>
                      setNewSessionData({ ...newSessionData, session_date: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={newSessionData.session_time}
                    onChange={(e) =>
                      setNewSessionData({ ...newSessionData, session_time: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assigned Staff <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newSessionData.staff_id}
                  onChange={(e) =>
                    setNewSessionData({ ...newSessionData, staff_id: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="">Select Staff</option>
                  {staffList.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} {st.department ? `(${st.department})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Staff Commission (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newSessionData.staff_commission}
                    onChange={(e) =>
                      setNewSessionData({ ...newSessionData, staff_commission: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Inventory Product
                  </label>
                  <select
                    value={newSessionData.inventory_product_id}
                    onChange={(e) =>
                      setNewSessionData({ ...newSessionData, inventory_product_id: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  >
                    <option value="">None</option>
                    {inventoryProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSession}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50"
                >
                  {addingSession ? 'Attaching...' : 'Attach Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      <SessionRescheduleModal
        isOpen={Boolean(rescheduleSession)}
        onClose={() => setRescheduleSession(null)}
        session={rescheduleSession}
        staffList={staffList}
        onSuccess={() => fetchDetails()}
      />

      {/* Reschedule History Modal */}
      <SessionRescheduleHistoryModal
        isOpen={Boolean(historySession)}
        onClose={() => setHistorySession(null)}
        session={historySession}
      />

      {/* Delete Session Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteSessionId)}
        title="Delete Session"
        message="Are you sure you want to delete this session? This action cannot be undone."
        confirmLabel={deletingSession ? 'Deleting...' : 'Delete Session'}
        onConfirm={handleDeleteSessionConfirm}
        onCancel={() => setDeleteSessionId(null)}
        isLoading={deletingSession}
      />
    </div>
  );
}

