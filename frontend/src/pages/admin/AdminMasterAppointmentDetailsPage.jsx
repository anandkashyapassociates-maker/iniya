import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  IndianRupee,
  Plus,
  Trash2,
  History,
  RotateCw,
  Package,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ReceiptIndianRupee,
  Image as ImageIcon,
  ExternalLink,
  Upload,
  X,
  Check,
} from 'lucide-react';
import adminMasterAppointmentService from '../../services/adminMasterAppointmentService';
import SessionRescheduleModal from '../../components/admin/SessionRescheduleModal';
import SessionRescheduleHistoryModal from '../../components/admin/SessionRescheduleHistoryModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import ProductMultiSelectDropdown from '../../components/admin/ProductMultiSelectDropdown';
import AppointmentReceiptModal from '../../components/admin/AppointmentReceiptModal';
import SessionProductsModal from '../../components/admin/SessionProductsModal';
import { useToast } from '../../context/ToastContext';
import { useAdminAuth } from '../../features/auth/AdminAuthContext';

export default function AdminMasterAppointmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAdminAuth();

  const isStaff =
    user?.role?.toLowerCase() === 'staff' ||
    user?.user_type?.toLowerCase() === 'staff' ||
    Boolean(user?.is_staff) ||
    user?.role === 'Staff Practitioner' ||
    Boolean(user?.staff_code);

  if (isStaff) {
    return <Navigate to="/admin/my-appointments" replace />;
  }

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [servicesTree, setServicesTree] = useState([]);

  // Modals state
  const [rescheduleSession, setRescheduleSession] = useState(null);
  const [historySession, setHistorySession] = useState(null);
  const [deleteSessionId, setDeleteSessionId] = useState(null);
  const [deletingSession, setDeletingSession] = useState(false);
  const [receiptModal, setReceiptModal] = useState({ isOpen: false, type: 'master', session: null });
  const [viewProductsSession, setViewProductsSession] = useState(null);

  // Receipt Handlers
  const handleOpenMasterReceipt = () => {
    setReceiptModal({ isOpen: true, type: 'master', session: null });
  };

  const handleOpenSessionReceipt = (ses) => {
    setReceiptModal({ isOpen: true, type: 'session', session: ses });
  };

  const handleCloseReceipt = () => {
    setReceiptModal({ isOpen: false, type: 'master', session: null });
  };

  // Add extra session modal/form state
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [addingSession, setAddingSession] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const [newSessionData, setNewSessionData] = useState({
    category_id: '',
    sub_category_id: '',
    service_id: '',
    service_price: '0',
    treatment_details: '',
    session_date: todayStr,
    session_time: '10:00',
    staff_id: '',
    staff_commission: '0',
    inventory_product_id: '',
    inventory_product_ids: [],
    image_file: null,
    image_preview: null,
  });

  const handleNewSessionCategoryChange = (catId) => {
    setNewSessionData((prev) => ({
      ...prev,
      category_id: catId,
      sub_category_id: '',
      service_id: '',
      service_price: '0',
    }));
  };

  const handleNewSessionSubCategoryChange = (subId) => {
    setNewSessionData((prev) => ({
      ...prev,
      sub_category_id: subId,
      service_id: '',
      service_price: '0',
    }));
  };

  const handleNewSessionServiceChange = (serviceId) => {
    const cat = servicesTree.find((c) => String(c.id) === String(newSessionData.category_id));
    const sub = cat?.children?.find((s) => String(s.id) === String(newSessionData.sub_category_id));
    const svc = sub?.services?.find((s) => String(s.id) === String(serviceId));

    setNewSessionData((prev) => ({
      ...prev,
      service_id: serviceId,
      service_price: svc ? String(svc.price) : '0',
      treatment_details: prev.treatment_details?.trim() ? prev.treatment_details : (svc?.name || ''),
    }));
  };

  const handleNewSessionImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Session image size cannot exceed 10MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setNewSessionData((prev) => ({
      ...prev,
      image_file: file,
      image_preview: previewUrl,
    }));
  };

  const handleRemoveNewSessionImage = () => {
    if (newSessionData.image_preview) {
      URL.revokeObjectURL(newSessionData.image_preview);
    }
    setNewSessionData((prev) => ({
      ...prev,
      image_file: null,
      image_preview: null,
    }));
  };

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
  }, [id]);

  // Load options for staff, products, and services tree
  useEffect(() => {
    adminMasterAppointmentService.getOptions()
      .then((res) => {
        if (res.success && res.data) {
          setStaffList(res.data.staff || []);
          setInventoryProducts(res.data.inventory_products || []);
          setServicesTree(res.data.services_tree || []);
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
    if (!newSessionData.category_id) {
      toast.error('Please select a Category.');
      return;
    }
    if (!newSessionData.sub_category_id) {
      toast.error('Please select a Sub-Category.');
      return;
    }
    if (!newSessionData.service_id) {
      toast.error('Please select a Service.');
      return;
    }
    if (!newSessionData.treatment_details?.trim()) {
      toast.error('Please enter procedure / treatment details.');
      return;
    }
    if (!newSessionData.staff_id) {
      toast.error('Please assign a doctor / staff member.');
      return;
    }

    setAddingSession(true);
    try {
      const pIds = (newSessionData.inventory_product_ids || []).map((pId) => Number(pId));

      let sessionImageBase64 = null;
      if (newSessionData.image_file) {
        const toBase64 = (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
          });
        sessionImageBase64 = await toBase64(newSessionData.image_file);
      }

      const payload = {
        service_id: newSessionData.service_id ? Number(newSessionData.service_id) : null,
        treatment_details: newSessionData.treatment_details.trim(),
        session_date: newSessionData.session_date,
        session_time: newSessionData.session_time,
        staff_id: Number(newSessionData.staff_id),
        staff_commission: Number(newSessionData.staff_commission || 0),
        inventory_product_ids: pIds,
        inventory_product_id: pIds.length > 0 ? pIds[0] : null,
        image: sessionImageBase64 || undefined,
      };

      const res = await adminMasterAppointmentService.addSession(id, payload);
      toast.success(res.message || 'New session attached successfully!');
      setShowAddSessionModal(false);
      setNewSessionData({
        category_id: '',
        sub_category_id: '',
        service_id: '',
        service_price: '0',
        treatment_details: '',
        session_date: todayStr,
        session_time: '10:00',
        staff_id: staffList[0]?.id ? String(staffList[0].id) : '',
        staff_commission: '0',
        inventory_product_id: '',
        inventory_product_ids: [],
        image_file: null,
        image_preview: null,
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0">
          <button
            onClick={() => navigate('/admin/appointments')}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors cursor-pointer"
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

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={handleOpenMasterReceipt}
            className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            <ReceiptIndianRupee className="w-4 h-4" />
            <span>Payment Receipt</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddSessionModal(true)}
            className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Extra Session</span>
          </button>
        </div>
      </div>

      {/* Master Info Cards Grid (Compact 3-Column Layout without vertical stretch) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{Number(appointment.appointment_fees || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Charged once at Master level</p>
        </div>
      </div>

      {/* Consultation Document Banner (Separate, sleek horizontal card) */}
      {appointment.image_url && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <a
              href={appointment.image_url}
              target="_blank"
              rel="noreferrer"
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 group block shadow-xs"
              title="Click to view full image"
            >
              <img
                src={appointment.image_url}
                alt="Consultation Document"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <ExternalLink className="w-4 h-4" />
              </div>
            </a>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">Consultation Document / Image</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Uploaded Document
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                Attached to appointment #{appointment.appointment_number} &bull; Click thumbnail or button to open full size
              </p>
            </div>
          </div>

          <a
            href={appointment.image_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all shrink-0 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>View Full Image &rarr;</span>
          </a>
        </div>
      )}

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
                <th className="py-3 px-3.5 text-center w-16 whitespace-nowrap">S.NO.</th>
                <th className="py-3 px-4">Treatment / Procedure</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4">Product Used</th>
                <th className="py-3 px-4 text-center">Session Photo</th>
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
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      {(() => {
                        const productsList = ses.selected_products && ses.selected_products.length > 0
                          ? ses.selected_products
                          : (ses.inventory_product ? [ses.inventory_product] : []);

                        if (productsList.length === 0) {
                          return <span className="text-slate-300 font-mono text-xs">—</span>;
                        }

                        const firstProduct = productsList[0];
                        const remainingCount = productsList.length - 1;

                        return (
                          <button
                            type="button"
                            onClick={() => setViewProductsSession(ses)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 font-medium text-xs transition-all cursor-pointer group shadow-2xs"
                            title="Click to view all allocated products"
                          >
                            <Package className="w-3.5 h-3.5 text-indigo-500 shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate max-w-[130px] font-semibold text-slate-800 group-hover:text-indigo-700">
                              {firstProduct.product_name}
                            </span>
                            {remainingCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[10px] font-mono shrink-0 shadow-2xs">
                                +{remainingCount}
                              </span>
                            )}
                          </button>
                        );
                      })()}
                    </td>

                    {/* Session Photo */}
                    <td className="py-3 px-4 text-center">
                      {ses.image_url ? (
                        <a
                          href={ses.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 hover:border-purple-500 bg-slate-50 shadow-xs transition-all group align-middle"
                          title="Click to view session photo full size"
                        >
                          <img
                            src={ses.image_url}
                            alt={`Session #${ses.session_number}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        </a>
                      ) : (
                        <span className="text-slate-900 font-bold text-sm font-mono select-none">—</span>
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
                        {/* Session Receipt Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenSessionReceipt(ses)}
                          title="View & Download Session Payment Receipt (₹)"
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <ReceiptIndianRupee className="w-4 h-4" />
                        </button>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-white/20 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-display leading-tight">Add Extra Session</h3>
                  <p className="text-[11px] text-blue-100 font-normal">
                    Complete procedure, doctor, schedule & supplies details
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {Number(newSessionData.service_price || 0) > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-white/20 text-white text-xs font-bold font-mono">
                    ₹{Number(newSessionData.service_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleAddSessionSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* SECTION: SERVICE PROCEDURE */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Service Classification</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newSessionData.category_id || ''}
                      onChange={(e) => handleNewSessionCategoryChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="">-- Select Category --</option>
                      {servicesTree.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sub-Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newSessionData.sub_category_id || ''}
                      onChange={(e) => handleNewSessionSubCategoryChange(e.target.value)}
                      disabled={!newSessionData.category_id}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100 transition-all cursor-pointer"
                    >
                      <option value="">-- Select Sub-Category --</option>
                      {servicesTree
                        .find((c) => String(c.id) === String(newSessionData.category_id))
                        ?.children?.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Service */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Service <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newSessionData.service_id || ''}
                      onChange={(e) => handleNewSessionServiceChange(e.target.value)}
                      disabled={!newSessionData.sub_category_id}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100 transition-all cursor-pointer"
                    >
                      <option value="">-- Select Service --</option>
                      {servicesTree
                        .find((c) => String(c.id) === String(newSessionData.category_id))
                        ?.children?.find((s) => String(s.id) === String(newSessionData.sub_category_id))
                        ?.services?.map((svc) => (
                          <option key={svc.id} value={svc.id}>
                            {svc.name} {svc.price ? `(₹${svc.price})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION: PROCEDURE & DOCTOR */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Doctor &amp; Procedure
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Procedure / Details <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newSessionData.treatment_details}
                      onChange={(e) =>
                        setNewSessionData({ ...newSessionData, treatment_details: e.target.value })
                      }
                      placeholder="e.g. Physiotherapy Cervical Spine Traction..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Doctor / Staff <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={newSessionData.staff_id}
                        onChange={(e) =>
                          setNewSessionData({ ...newSessionData, staff_id: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                      >
                        <option value="">-- Assign Doctor --</option>
                        {staffList.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} {st.department ? `(${st.department})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Commission (₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-xs pointer-events-none">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={newSessionData.staff_commission}
                          onChange={(e) =>
                            setNewSessionData({ ...newSessionData, staff_commission: e.target.value })
                          }
                          placeholder="0.00"
                          className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: SCHEDULE & MEDICAL SUPPLIES */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Schedule &amp; Medical Supplies
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Time <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={newSessionData.session_time}
                        onChange={(e) =>
                          setNewSessionData({ ...newSessionData, session_time: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Inventory Products */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
                        <Package className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Consumables / Supplies (Optional)</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Multiple Allowed</span>
                    </label>
                    <ProductMultiSelectDropdown
                      products={inventoryProducts}
                      selectedIds={newSessionData.inventory_product_ids || []}
                      onChange={(newIds) => {
                        setNewSessionData((prev) => ({
                          ...prev,
                          inventory_product_ids: newIds,
                          inventory_product_id: newIds[0] ? String(newIds[0]) : '',
                        }));
                      }}
                      placeholder="-- Allocate Supplies / Consumables --"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: SESSION IMAGE (OPTIONAL) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Session Image (Optional)
                </label>

                <input
                  type="file"
                  id="new_session_image"
                  accept="image/*"
                  onChange={handleNewSessionImageChange}
                  className="hidden"
                />

                {!newSessionData.image_preview ? (
                  <label
                    htmlFor="new_session_image"
                    className="group flex items-center justify-between p-3 border border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/40 rounded-xl transition-all cursor-pointer bg-slate-50/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                          Click to upload session image (Optional)
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Supported: PNG, JPG, JPEG, WEBP (Max 10MB)
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 group-hover:underline pr-2">
                      Browse file &rarr;
                    </span>
                  </label>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                        <img
                          src={newSessionData.image_preview}
                          alt="Session preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-2.5 h-2.5" /> Session Image Attached
                        </span>
                        <p className="text-xs font-medium text-slate-800 truncate mt-0.5">
                          {newSessionData.image_file?.name || 'Session Image'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <label
                        htmlFor="new_session_image"
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Change
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveNewSessionImage}
                        className="p-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove session image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 flex justify-end space-x-3 border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSession}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  {addingSession && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{addingSession ? 'Attaching Session...' : 'Attach Session'}</span>
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
        inventoryProducts={inventoryProducts}
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

      {/* Appointment & Session Payment Receipt Modal */}
      <AppointmentReceiptModal
        isOpen={receiptModal.isOpen}
        onClose={handleCloseReceipt}
        appointment={appointment}
        session={receiptModal.session}
        type={receiptModal.type}
      />

      {/* Allocated Products / Supplies Details Modal */}
      <SessionProductsModal
        isOpen={Boolean(viewProductsSession)}
        onClose={() => setViewProductsSession(null)}
        session={viewProductsSession}
      />
    </div>
  );
}

