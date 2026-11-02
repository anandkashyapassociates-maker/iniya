import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Save,
  ArrowLeft,
  DollarSign,
  Package,
  Layers,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import adminMasterAppointmentService from '../../services/adminMasterAppointmentService';
import { useToast } from '../../context/ToastContext';

export default function AdminMasterAppointmentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointment, setAppointment] = useState(null);

  // Dropdown options
  const [customers, setCustomers] = useState([]);
  const [salesTeams, setSalesTeams] = useState([]);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [salesTeamId, setSalesTeamId] = useState('');
  const [appointmentFees, setAppointmentFees] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Fetch options
    adminMasterAppointmentService.getOptions()
      .then((res) => {
        if (res.success && res.data) {
          setCustomers(res.data.customers || []);
          setSalesTeams(res.data.sales_teams || []);
        }
      })
      .catch((err) => console.error(err));

    // 2. Fetch master appointment
    adminMasterAppointmentService.get(id)
      .then((res) => {
        if (res.success && res.data) {
          const appt = res.data;
          setAppointment(appt);
          setCustomerId(String(appt.customer_id || ''));
          setAppointmentDate(appt.appointment_date ? String(appt.appointment_date).slice(0, 10) : '');
          setSalesTeamId(String(appt.sales_team_id || ''));
          setAppointmentFees(String(appt.appointment_fees || ''));
          setNotes(appt.notes || '');
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load master appointment details.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    if (!appointmentDate) {
      setError('Please choose an appointment date.');
      return;
    }
    if (!salesTeamId) {
      setError('Please select a sales team member.');
      return;
    }
    if (appointmentFees === '' || Number(appointmentFees) < 0) {
      setError('Please enter a valid appointment fee.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customer_id: Number(customerId),
        appointment_date: appointmentDate,
        sales_team_id: Number(salesTeamId),
        appointment_fees: Number(appointmentFees),
        notes: notes || undefined,
      };

      const res = await adminMasterAppointmentService.update(id, payload);
      toast.success(res.message || 'Master appointment updated successfully!');
      navigate(`/admin/appointments/${id}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to update master appointment.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[450px] flex flex-col items-center justify-center text-slate-500">
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
        <p className="text-sm text-slate-500 mt-1">The requested appointment could not be found.</p>
        <button
          onClick={() => navigate('/admin/appointments')}
          className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const sessions = appointment.sessions || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(`/admin/appointments/${id}`)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Appointment Details</span>
          </button>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold text-slate-900">
              Edit Master Appointment: {appointment.appointment_number}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {sessions.length} Sessions Attached
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Update master booking metadata, assigned sales team, customer attribution, and total consultation fees.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate(`/admin/appointments/${id}`)}
            className="flex-1 sm:flex-initial px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Update Error: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2.5 pb-4 mb-6 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Master Booking Information</h2>
              <p className="text-xs text-slate-500">Edit core booking values</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Customer Dropdown */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Patient / Customer <span className="text-rose-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
              >
                <option value="">-- Select Patient --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobile})
                  </option>
                ))}
              </select>
            </div>

            {/* Master Appointment Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Master Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
              />
            </div>

            {/* Sales Team Member */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Sales Team / Lead <span className="text-rose-500">*</span>
              </label>
              <select
                value={salesTeamId}
                onChange={(e) => setSalesTeamId(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
              >
                <option value="">-- Select Sales Member --</option>
                {salesTeams.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.sales_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Total Appointment Fees */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Appointment Fees (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={appointmentFees}
                  onChange={(e) => setAppointmentFees(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Clinical Notes / Remarks (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special medical requirements, patient notes, consultation tags..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Existing Sessions Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Current Sessions Attached ({sessions.length})</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/admin/appointments/${id}`)}
              className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center space-x-1"
            >
              <span>Manage Sessions on Details Page</span>
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold flex items-center justify-center text-[11px]">
                    {s.session_number}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900">{s.treatment_details}</span>
                    <span className="text-slate-500 ml-2 font-mono">
                      {s.session_date ? String(s.session_date).slice(0, 10) : ''} at {s.session_time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-slate-600">
                    Staff: <strong className="text-slate-800">{s.staff?.name || 'Unassigned'}</strong>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      s.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : s.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 pt-2">
          <button
            type="button"
            onClick={() => navigate(`/admin/appointments/${id}`)}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-8 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Updating Master Booking...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Save Master Appointment Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

