import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Package,
  IndianRupee,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ZoomIn,
  Stethoscope,
  Image as ImageIcon,
  Activity,
  PlayCircle,
  CheckCircle,
  XCircle,
  CreditCard,
  Receipt,
  Wallet,
} from 'lucide-react';
import { useAdminAuth } from '../../../features/auth/AdminAuthContext';
import staffAppointmentService from '../../../services/staffAppointmentService';
import { useToast } from '../../../context/ToastContext';

export default function StaffAppointmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const toast = useToast();

  const isStaff =
    user?.role?.toLowerCase() === 'staff' ||
    user?.user_type?.toLowerCase() === 'staff' ||
    Boolean(user?.is_staff) ||
    user?.role === 'Staff Practitioner' ||
    Boolean(user?.staff_code);

  // If logged-in user is not staff, redirect to admin appointments
  if (user && !isStaff) {
    return <Navigate to="/admin/appointments" replace />;
  }

  const [sessionData, setSessionData] = useState(null);
  const [appointmentData, setAppointmentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Status & Payment Modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Form State inside Modal
  const [modalStatus, setModalStatus] = useState('completed');
  const [receivePayment, setReceivePayment] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await staffAppointmentService.getAppointmentDetails(id);
      if (res) {
        setSessionData(res.session || null);
        setAppointmentData(res.appointment || res.session?.master_appointment || null);

        // Pre-fill modal states
        if (res.session?.status) {
          setModalStatus(res.session.status === 'completed' ? 'completed' : res.session.status);
        }
        if (res.session?.payment_amount) {
          setPaymentAmount(String(res.session.payment_amount));
        } else if (res.session?.service?.price) {
          setPaymentAmount(String(res.session.service.price));
        }
        if (res.session?.payment_date) {
          setPaymentDate(res.session.payment_date);
        }
        if (res.session?.payment_mode) {
          setPaymentMode(res.session.payment_mode);
        }
        if (res.session?.payment_notes) {
          setPaymentNotes(res.session.payment_notes);
        }
      }
    } catch (err) {
      console.error('Failed to load session details:', err);
      toast.error('Failed to load appointment session details.');
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Open the Status & Payment Popup Modal
  const handleOpenStatusModal = () => {
    const current = sessionData?.status || 'pending';
    setModalStatus(current);
    if (sessionData?.payment_amount) {
      setPaymentAmount(String(sessionData.payment_amount));
      setReceivePayment(true);
    } else if (sessionData?.service?.price) {
      setPaymentAmount(String(sessionData.service.price));
      setReceivePayment(true);
    }
    if (sessionData?.payment_date) {
      setPaymentDate(sessionData.payment_date);
    } else {
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
    if (sessionData?.payment_mode) {
      setPaymentMode(sessionData.payment_mode);
    } else {
      setPaymentMode('cash');
    }
    if (sessionData?.payment_notes) {
      setPaymentNotes(sessionData.payment_notes);
    }
    setIsStatusModalOpen(true);
  };

  // Submit Status Change & Payment from Modal
  const handleSaveStatusAndPayment = async (e) => {
    e.preventDefault();
    if (!sessionData?.id || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const payload = {
        status: modalStatus,
      };

      if (receivePayment && paymentAmount && Number(paymentAmount) >= 0) {
        payload.payment_amount = Number(paymentAmount);
        payload.payment_date = paymentDate || new Date().toISOString().split('T')[0];
        payload.payment_mode = paymentMode;
        payload.payment_notes = paymentNotes.trim() || undefined;
      }

      const res = await staffAppointmentService.updateSessionStatus(sessionData.id, payload);
      if (res && res.success) {
        setSessionData((prev) => ({
          ...prev,
          status: modalStatus,
          payment_amount: payload.payment_amount ?? prev.payment_amount,
          payment_date: payload.payment_date ?? prev.payment_date,
          payment_mode: payload.payment_mode ?? prev.payment_mode,
          payment_notes: payload.payment_notes ?? prev.payment_notes,
        }));

        const statusLabel =
          modalStatus === 'completed'
            ? 'Completed (Session Closed)'
            : modalStatus === 'in_progress'
            ? 'In Progress'
            : modalStatus === 'cancelled'
            ? 'Cancelled'
            : 'Pending';

        if (payload.payment_amount) {
          toast.success(`Session status updated to ${statusLabel} and payment of ${formatCurrency(payload.payment_amount)} recorded!`);
        } else {
          toast.success(`Session status successfully updated to ${statusLabel}!`);
        }

        setIsStatusModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to update session status & payment:', err);
      toast.error(err.response?.data?.message || 'Failed to update session status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatCurrency = (amount) => {
    const val = Number(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatTimeSlot = (timeStr) => {
    if (!timeStr) return '-';
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
      return timeStr;
    }
    const [hh, mm] = timeStr.split(':');
    if (hh !== undefined && mm !== undefined) {
      const hour = parseInt(hh, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${mm} ${ampm}`;
    }
    return timeStr;
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-semibold text-slate-600">
          Loading appointment session &amp; clinical details...
        </p>
      </div>
    );
  }

  if (!sessionData && !appointmentData) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Appointment Session Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            The requested session does not exist or you are not authorized to view it.
          </p>
          <button
            onClick={() => navigate('/admin/my-appointments')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Appointments</span>
          </button>
        </div>
      </div>
    );
  }

  const session = sessionData || {};
  const master = appointmentData || session.master_appointment || {};
  const customer = master.customer || session.customer || {};
  const sessionImage = session.image_url || session.image;
  const masterImage = master.image_url || master.image;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Top Navigation & Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/my-appointments')}
            className="p-2.5 rounded-xl text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Back to My Appointments"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono text-xs font-bold border border-emerald-200">
                Session #{session.session_number}
              </span>
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                {session.service?.name || session.treatment_details || 'Clinical Session Details'}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  session.status === 'completed'
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : session.status === 'in_progress'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : session.status === 'cancelled'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {session.status === 'completed' ? 'Closed / Completed' : session.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Master Appointment: <strong>{master.appointment_number}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Action Button: Opens Status & Payment Popup */}
          <button
            type="button"
            onClick={handleOpenStatusModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Update Status / Close Session</span>
          </button>

          <button
            onClick={fetchDetails}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Grid: Patient Details + Session Schedule + Master Appointment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Patient Information */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              Patient Details
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
              {customer.gender || 'Patient'}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-base font-bold text-slate-900">{customer.name || 'Walk-in Patient'}</p>
            {customer.age && (
              <p className="text-xs text-slate-500">
                Age: <span className="font-semibold text-slate-700">{customer.age} Years</span>
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <p className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <a href={`tel:${customer.mobile}`} className="font-mono text-slate-800 hover:text-emerald-600 font-semibold">
                {customer.mobile || 'No contact provided'}
              </a>
            </p>
            {customer.email && (
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a href={`mailto:${customer.email}`} className="text-slate-600 hover:text-emerald-600 truncate">
                  {customer.email}
                </a>
              </p>
            )}
            {customer.address && (
              <p className="flex items-start gap-2 pt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-slate-600 text-[11px] leading-relaxed">{customer.address}</span>
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Session Schedule & Practitioner Commission */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Session Schedule
            </span>
            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Session #{session.session_number}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <p className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date:
              </span>
              <strong className="text-slate-900 font-mono">
                {session.session_date ? new Date(session.session_date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }) : '-'}
              </strong>
            </p>

            <p className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Time Slot:
              </span>
              <strong className="text-slate-900 font-mono">{formatTimeSlot(session.session_time)}</strong>
            </p>

            <p className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-400" /> Service:
              </span>
              <strong className="text-slate-900 truncate max-w-[140px] text-right">
                {session.service?.name || session.treatment_details || 'Clinical Session'}
              </strong>
            </p>

            {session.service?.price && (
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Service Fee:</span>
                <span className="font-mono text-slate-700 font-semibold">{formatCurrency(session.service.price)}</span>
              </p>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/60">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Your Commission:
              </span>
              <span className="text-base font-bold font-mono text-emerald-700">
                {formatCurrency(session.staff_commission)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Master Appointment Overview */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              Master Appointment
            </span>
            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              {master.appointment_number}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <p className="flex items-center justify-between">
              <span className="text-slate-500">Booking Date:</span>
              <strong className="text-slate-900 font-mono">{master.appointment_date || '-'}</strong>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-slate-500">Total Consultation Fees:</span>
              <strong className="text-slate-900 font-mono">{formatCurrency(master.appointment_fees)}</strong>
            </p>
            {master.sales_team && (
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Referred by:</span>
                <span className="text-slate-800 font-medium">
                  {master.sales_team.name} ({master.sales_team.sales_code})
                </span>
              </p>
            )}
            {master.notes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Doctor / Reception Notes:
                </span>
                <p className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 italic text-[11px]">
                  "{master.notes}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Payment Received Banner (if already recorded) */}
      {session.payment_amount && Number(session.payment_amount) > 0 && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-900">Patient Payment Received</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  {session.payment_mode || 'Cash'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Amount: <strong className="text-emerald-700 font-mono text-sm">{formatCurrency(session.payment_amount)}</strong>
                {session.payment_date && ` • Received on ${session.payment_date}`}
                {session.payment_notes && ` • "${session.payment_notes}"`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenStatusModal}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer self-start sm:self-auto"
          >
            Update Payment &amp; Status &rarr;
          </button>
        </div>
      )}

      {/* Clinical Treatment & Consumables Allocated */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Clinical Treatment Details &amp; Allocated Supplies
            </h3>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              session.status === 'completed'
                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                : session.status === 'in_progress'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : session.status === 'cancelled'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            Execution Status: {session.status === 'completed' ? 'Closed' : session.status}
          </span>
        </div>

        {session.treatment_details && (
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Treatment Description:</span>
            {session.treatment_details}
          </div>
        )}

        {session.selected_products && session.selected_products.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Inventory Supplies &amp; Consumables Allocated for this Session:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {session.selected_products.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <Package className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-900 truncate">{prod.product_name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Unit: {prod.business_unit || 'Standard Unit'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* IMAGES SECTION: VIEW & ZOOM ONLY (VIEW-ONLY FOR STAFF)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Session Clinical Image (appointment_sessions.image) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Session Clinical Photo
                  </h4>
                </div>
              </div>
              {sessionImage ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Attached
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 italic">
                </span>
              )}
            </div>

            {sessionImage ? (
              <div className="space-y-3">
                <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs flex items-center justify-center">
                  <img
                    src={sessionImage}
                    alt="Session Clinical Photo"
                    className="w-full h-64 object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setLightboxImage(sessionImage)}
                    className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-semibold text-xs cursor-pointer"
                  >
                    <ZoomIn className="w-5 h-5" />
                    <span>Click to View Full Size</span>
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setLightboxImage(sessionImage)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                    <span>View / Zoom Photo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 space-y-1.5">
                <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">No clinical photo attached</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Clinical photo will be visible here once uploaded in session management.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Master Appointment Image (master_appointments.image) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Master Appointment Photo / Prescription
                  </h4>
                </div>
              </div>
              {masterImage ? (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Attached
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 italic">
                </span>
              )}
            </div>

            {masterImage ? (
              <div className="space-y-3">
                <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs flex items-center justify-center">
                  <img
                    src={masterImage}
                    alt="Master Appointment Photo"
                    className="w-full h-64 object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setLightboxImage(masterImage)}
                    className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-semibold text-xs cursor-pointer"
                  >
                    <ZoomIn className="w-5 h-5" />
                    <span>Click to View Full Size</span>
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setLightboxImage(masterImage)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                    <span>View / Zoom Master Prescription</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 space-y-1.5">
                <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">No master photo or prescription attached</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Initial consultation prescription or clinical referral scan from the master appointment record.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BOTTOM ACTION BAR: EASY ACCESS TO UPDATE STATUS / CLOSE  */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Session Action Center
            </h4>
            <p className="text-xs text-slate-500">
              Current Status:{' '}
              <strong className="text-slate-800 capitalize">
                {session.status === 'completed' ? 'Closed / Completed' : session.status}
              </strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenStatusModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Update Status &amp; Receive Payment</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* POPUP MODAL: UPDATE SESSION STATUS & RECEIVE PAYMENT    */}
      {/* ======================================================== */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">
                    Update Session Status &amp; Payment
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Session #{session.session_number} • {master.appointment_number} • {customer.name || 'Patient'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStatusAndPayment} className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* 1. Status Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  Select Session Status *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Pending */}
                  <button
                    type="button"
                    onClick={() => setModalStatus('pending')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      modalStatus === 'pending'
                        ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 font-bold text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <AlertCircle className={`w-4 h-4 ${modalStatus === 'pending' ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>Pending</span>
                  </button>

                  {/* In Progress */}
                  <button
                    type="button"
                    onClick={() => setModalStatus('in_progress')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      modalStatus === 'in_progress'
                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 font-bold text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <PlayCircle className={`w-4 h-4 ${modalStatus === 'in_progress' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>In Progress</span>
                  </button>

                  {/* Completed (Close Session) */}
                  <button
                    type="button"
                    onClick={() => {
                      setModalStatus('completed');
                      setReceivePayment(true);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      modalStatus === 'completed'
                        ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-500/20 font-bold text-teal-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 ${modalStatus === 'completed' ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span>Close (Completed)</span>
                  </button>

                  {/* Cancelled */}
                  <button
                    type="button"
                    onClick={() => setModalStatus('cancelled')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      modalStatus === 'cancelled'
                        ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 font-bold text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className={`w-4 h-4 ${modalStatus === 'cancelled' ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span>Cancelled</span>
                  </button>
                </div>
              </div>

              {/* 2. Patient Payment Collection Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                      Receive Payment from Patient
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={receivePayment}
                      onChange={(e) => setReceivePayment(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] font-semibold text-slate-600">Collect Payment</span>
                  </label>
                </div>

                {receivePayment ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Payment Date */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                          Payment Date *
                        </label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          required={receivePayment}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-medium"
                        />
                      </div>

                      {/* Payment Amount */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                          Amount Received (₹) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            required={receivePayment}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment Mode */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                        Payment Mode / Channel *
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'cash', label: 'Cash' },
                          { id: 'upi', label: 'UPI / QR' },
                          { id: 'card', label: 'Card' },
                          { id: 'bank', label: 'Bank' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setPaymentMode(m.id)}
                            className={`py-2 px-2 text-center rounded-xl border text-[11px] font-bold cursor-pointer transition-colors ${
                              paymentMode === m.id
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                        Payment Note / Receipt Remark (Optional)
                      </label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="e.g. Session 1 payment received in full"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    No payment will be recorded with this status update.
                  </p>
                )}
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingStatus ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : modalStatus === 'completed' ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isUpdatingStatus
                      ? 'Saving...'
                      : modalStatus === 'completed'
                      ? 'Confirm & Close Session'
                      : 'Save Status Update'}
                  </span>
                </button>
              </div>
            </form>
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
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors cursor-pointer"
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
