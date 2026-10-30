import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Users,
  Stethoscope,
  FileText,
  CreditCard,
  Save,
} from 'lucide-react';
import adminAppointmentService from '../../services/adminAppointmentService';
import { useToast } from '../../context/ToastContext';

export default function AdminAppointmentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    staff_id: '',
    appointment_date: '',
    appointment_time: '',
    session_slot: 'Morning',
    session_number: 1,
    total_sessions: 1,
    treatment_name: '',
    treatment_details: '',
    fee: '',
    payment_status: 'pending',
    notes: '',
    status: 'pending',
  });

  const [appointment, setAppointment] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [appRes, staffData] = await Promise.all([
          adminAppointmentService.get(id),
          adminAppointmentService.staffOptions(),
        ]);

        const app = appRes.data || appRes;
        setAppointment(app);
        setStaffList(Array.isArray(staffData) ? staffData : []);

        setFormData({
          staff_id: app.staff_id || '',
          appointment_date: app.appointment_date || '',
          appointment_time: app.appointment_time || '',
          session_slot: app.session_slot || 'Morning',
          session_number: app.session_number || 1,
          total_sessions: app.total_sessions || 1,
          treatment_name: app.treatment_name || '',
          treatment_details: app.treatment_details || '',
          fee: app.fee || '',
          payment_status: app.payment_status || 'pending',
          notes: app.notes || '',
          status: app.status || 'pending',
        });
      } catch (err) {
        toast.error('Failed to load appointment details.');
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSlotSelect = (slot) => {
    setFormData((prev) => ({ ...prev, session_slot: slot }));
    if (errors.session_slot) {
      setErrors((prev) => ({ ...prev, session_slot: null }));
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setIsLoading(true);
      await adminAppointmentService.updateStatus(id, { status: newStatus });
      setFormData((prev) => ({ ...prev, status: newStatus }));
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Client-side date and time validation
    const todayStr = new Date().toISOString().split('T')[0];
    if (formData.appointment_date < todayStr) {
      setErrors({ appointment_date: 'Appointment date cannot be in the past.' });
      return;
    }

    if (formData.appointment_date === todayStr && formData.appointment_time) {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      if (formData.appointment_time < currentTimeStr) {
        setErrors({ appointment_time: 'Appointment time cannot be in the past for today.' });
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = {
        staff_id: formData.staff_id ? parseInt(formData.staff_id, 10) : null,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        session_slot: formData.session_slot,
        session_number: parseInt(formData.session_number, 10),
        total_sessions: parseInt(formData.total_sessions, 10),
        treatment_name: formData.treatment_name,
        treatment_details: formData.treatment_details || null,
        fee: formData.fee ? parseFloat(formData.fee) : null,
        payment_status: formData.payment_status,
        notes: formData.notes || null,
      };

      await adminAppointmentService.update(id, payload);

      if (appointment?.status !== formData.status) {
        await adminAppointmentService.updateStatus(id, { status: formData.status });
      }

      toast.success('Appointment details updated successfully!');
      navigate('/admin/appointments');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to update appointment.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderError = (field) => {
    if (!errors[field]) return null;
    return (
      <p className="text-[11px] text-rose-500 mt-1.5 font-medium">
        {Array.isArray(errors[field]) ? errors[field][0] : errors[field]}
      </p>
    );
  };

  const inputClass = (field) =>
    `w-full pl-10 pr-4 py-3 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
        : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
    }`;

  const selectClass = (field) =>
    `w-full pl-10 pr-4 py-3 text-xs bg-slate-50/80 hover:bg-slate-50 border rounded-2xl focus:outline-none focus:ring-2 transition-all appearance-none ${
      errors[field]
        ? 'border-rose-400 focus:ring-rose-500/20 text-slate-900'
        : 'border-slate-200 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900'
    }`;

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-500 text-sm font-semibold">Appointment not found.</p>
        <Link to="/admin/appointments" className="mt-4 inline-block text-xs text-blue-600 hover:underline">
          Return to list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-2">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Appointment Management</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Manage Appointment
            </h1>
            <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-lg">
              {appointment.appointment_number}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Update date, schedule time slot, modify assigned therapist, and track treatment sessions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/admin/appointments"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>

          {/* Quick Status Badges */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200/70">
            {['pending', 'confirmed', 'completed', 'cancelled'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleStatusChange(st)}
                disabled={isLoading}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all cursor-pointer ${
                  formData.status === st
                    ? st === 'confirmed'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : st === 'completed'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : st === 'cancelled'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Summary Card */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">{appointment.customer?.name}</div>
            <div className="text-[11px] text-slate-500">
              {appointment.customer?.mobile} • {appointment.customer?.gender} • {appointment.customer?.age || 'N/A'} yrs
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-800">
            Booking ID: #{appointment.id}
          </span>
          <div className="text-[11px] text-slate-500">
            Current Status: <span className="font-semibold text-blue-600 capitalize">{appointment.status}</span>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-9 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1: Schedule (Date & Time) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Clock className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Schedule & Session Slot
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Appointment Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    name="appointment_date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.appointment_date}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className={inputClass('appointment_date')}
                  />
                </div>
                {renderError('appointment_date')}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Appointment Time <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="time"
                    name="appointment_time"
                    value={formData.appointment_time}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className={inputClass('appointment_time')}
                  />
                </div>
                {renderError('appointment_time')}
              </div>
            </div>

            {/* Session Slot Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Session Slot <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'Morning', emoji: '🌅', label: 'Morning' },
                  { key: 'Afternoon', emoji: '☀️', label: 'Afternoon' },
                  { key: 'Evening', emoji: '🌙', label: 'Evening' },
                ].map((slot) => (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => handleSlotSelect(slot.key)}
                    disabled={isLoading}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      formData.session_slot === slot.key
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{slot.emoji}</span>
                    <span>{slot.label}</span>
                  </button>
                ))}
              </div>
              {renderError('session_slot')}
            </div>
          </div>

          {/* Section 2: Staff & Status */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Staff Assignment & Status
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Assigned Staff
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    name="staff_id"
                    value={formData.staff_id}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={selectClass('staff_id')}
                  >
                    <option value="">-- No Staff Assigned --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.department} ({s.staff_code})
                      </option>
                    ))}
                  </select>
                </div>
                {renderError('staff_id')}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Current Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={selectClass('status')}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                {renderError('status')}
              </div>
            </div>
          </div>

          {/* Section 3: Session & Treatment */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Treatment & Session Progress
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Session Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    name="session_number"
                    min="1"
                    max="100"
                    value={formData.session_number}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className={inputClass('session_number')}
                  />
                </div>
                {renderError('session_number')}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Total Sessions <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    name="total_sessions"
                    min="1"
                    max="100"
                    value={formData.total_sessions}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className={inputClass('total_sessions')}
                  />
                </div>
                {renderError('total_sessions')}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Treatment Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="treatment_name"
                  value={formData.treatment_name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className={inputClass('treatment_name')}
                />
              </div>
              {renderError('treatment_name')}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Treatment Details
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <textarea
                  name="treatment_details"
                  rows="3"
                  value={formData.treatment_details}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900 transition-all leading-relaxed"
                />
              </div>
              {renderError('treatment_details')}
            </div>
          </div>

          {/* Section 4: Payment & Notes */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                4. Payment & Notes
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Fee (₹)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    name="fee"
                    min="0"
                    step="0.01"
                    value={formData.fee}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={inputClass('fee')}
                  />
                </div>
                {renderError('fee')}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Payment Status
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={selectClass('payment_status')}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="waived">Waived</option>
                  </select>
                </div>
                {renderError('payment_status')}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Additional Notes
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <textarea
                  name="notes"
                  rows="2"
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:border-blue-600 focus:ring-blue-500/20 text-slate-900 transition-all leading-relaxed"
                />
              </div>
              {renderError('notes')}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/admin/appointments"
              className="px-5 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Appointment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
