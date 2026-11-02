import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  DollarSign,
  Package,
  Layers,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Stethoscope,
  Phone,
  Mail,
  Coins,
  ShieldCheck,
  ChevronRight,
  Activity,
  UserPlus,
  HeartPulse,
} from 'lucide-react';
import adminMasterAppointmentService from '../../services/adminMasterAppointmentService';
import ProductMultiSelectDropdown from '../../components/admin/ProductMultiSelectDropdown';
import { useToast } from '../../context/ToastContext';

export default function AdminMasterAppointmentCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const preCategoryId = location.state?.category_id || searchParams.get('category_id') || '';
  const preSubCategoryId = location.state?.sub_category_id || searchParams.get('sub_category_id') || '';
  const preServiceId = location.state?.service_id || searchParams.get('service_id') || '';

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to get future time string (HH:mm)
  const getDefaultTime = (offsetHours = 1) => {
    const d = new Date();
    d.setHours(d.getHours() + offsetHours);
    d.setMinutes(0);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // Options loaded from backend
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [salesTeams, setSalesTeams] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [servicesTree, setServicesTree] = useState([]);

  // Master form state
  const [customerId, setCustomerId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(todayStr);
  const [salesTeamId, setSalesTeamId] = useState('');
  const [notes, setNotes] = useState('');

  // Selected customer details preview
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => String(c.id) === String(customerId)) || null;
  }, [customers, customerId]);

  // Dynamic Sessions state
  const [sessions, setSessions] = useState([
    {
      category_id: '',
      sub_category_id: '',
      service_id: '',
      service_price: '0',
      treatment_details: '',
      session_date: todayStr,
      session_time: getDefaultTime(1),
      staff_id: '',
      staff_commission: '0',
      inventory_product_ids: [],
      inventory_product_id: '',
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load dropdown options
  useEffect(() => {
    adminMasterAppointmentService.getOptions()
      .then((res) => {
        if (res.success && res.data) {
          const custs = res.data.customers || [];
          const teams = res.data.sales_teams || [];
          const stfs = res.data.staff || [];
          const prods = res.data.inventory_products || [];
          const tree = res.data.services_tree || [];

          setCustomers(custs);
          setSalesTeams(teams);
          setStaffList(stfs);
          setInventoryProducts(prods);
          setServicesTree(tree);

          if (custs.length > 0) setCustomerId(String(custs[0].id));
          if (teams.length > 0) setSalesTeamId(String(teams[0].id));

          // Auto pre-fill staff_id for initial session if not already chosen
          if (stfs.length > 0) {
            setSessions((prev) =>
              prev.map((s) => ({
                ...s,
                staff_id: s.staff_id || String(stfs[0].id),
              }))
            );
          }

          // If pre-selected service was passed from Services Management Page, prefill master service, fee & session #1
          if (preServiceId && tree.length > 0) {
            let foundSvc = null;
            for (const cat of tree) {
              for (const sub of cat.children || []) {
                const svc = (sub.services || []).find((s) => String(s.id) === String(preServiceId));
                if (svc) {
                  foundSvc = {
                    ...svc,
                    category_id: cat.id,
                    sub_category_id: sub.id,
                  };
                  break;
                }
              }
              if (foundSvc) break;
            }

            if (foundSvc) {
              setSessions((prev) => [
                {
                  ...prev[0],
                  category_id: String(foundSvc.category_id),
                  sub_category_id: String(foundSvc.sub_category_id),
                  service_id: String(foundSvc.id),
                  service_price: String(foundSvc.price !== undefined ? foundSvc.price : '0'),
                  treatment_details: prev[0]?.treatment_details?.trim() || foundSvc.name,
                },
                ...prev.slice(1),
              ]);
            }
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load options', err);
        toast.error('Failed to load customers, staff, and sales teams list.');
      })
      .finally(() => {
        setOptionsLoading(false);
      });
  }, [preServiceId, preCategoryId, preSubCategoryId]);

  // Session handler methods
  const handleAddSession = () => {
    const lastSession = sessions[sessions.length - 1];
    let nextTime = '11:00';
    if (lastSession?.session_time) {
      const [h, m] = lastSession.session_time.split(':').map(Number);
      const nextH = (h + 1) % 24;
      nextTime = `${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } else {
      nextTime = getDefaultTime(sessions.length + 1);
    }

    setSessions((prev) => [
      ...prev,
      {
        category_id: '',
        sub_category_id: '',
        service_id: '',
        service_price: '0',
        treatment_details: lastSession?.treatment_details || '',
        session_date: lastSession?.session_date || appointmentDate || todayStr,
        session_time: nextTime,
        staff_id: staffList[0]?.id ? String(staffList[0].id) : '',
        staff_commission: '0',
        inventory_product_ids: [],
        inventory_product_id: '',
      },
    ]);
  };

  const handleSessionCategoryChange = (index, catId) => {
    setSessions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        category_id: catId,
        sub_category_id: '',
        service_id: '',
        service_price: '0',
      };
      return copy;
    });
  };

  const handleSessionSubCategoryChange = (index, subId) => {
    setSessions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        sub_category_id: subId,
        service_id: '',
        service_price: '0',
      };
      return copy;
    });
  };

  const handleSessionServiceChange = (index, serviceId) => {
    setSessions((prev) => {
      const copy = [...prev];
      const s = copy[index];
      let serviceName = '';
      let servicePrice = '0';
      if (serviceId) {
        const cat = servicesTree.find((c) => String(c.id) === String(s.category_id));
        const sub = cat?.children?.find((sc) => String(sc.id) === String(s.sub_category_id));
        const svc = sub?.services?.find((sv) => String(sv.id) === String(serviceId));
        if (svc) {
          serviceName = svc.name;
          servicePrice = String(svc.price !== undefined && svc.price !== null ? svc.price : '0');
        }
      }
      copy[index] = {
        ...s,
        service_id: serviceId,
        service_price: servicePrice,
        treatment_details: s.treatment_details?.trim() ? s.treatment_details : serviceName,
      };
      return copy;
    });
  };

  const handleRemoveSession = (index) => {
    if (sessions.length <= 1) {
      toast.warning('A master appointment must have at least one session.');
      return;
    }
    setSessions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSessionChange = (index, field, value) => {
    setSessions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Aggregated live financial calculations
  const totalAppointmentFees = useMemo(() => {
    return sessions.reduce((sum, s) => sum + Number(s.service_price || 0), 0);
  }, [sessions]);

  const totalStaffCommissions = useMemo(() => {
    return sessions.reduce((sum, s) => sum + Number(s.staff_commission || 0), 0);
  }, [sessions]);

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    if (!appointmentDate) {
      setError('Please select the Master Appointment Date.');
      return;
    }

    if (!salesTeamId) {
      setError('Please select a Sales Team member.');
      return;
    }

    if (sessions.length === 0) {
      setError('Please add at least one session.');
      return;
    }

    // Validate sessions
    const now = new Date();
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      if (!s.category_id || !s.sub_category_id || !s.service_id) {
        setError(`Session #${i + 1}: Please select a Clinical Service (Category → Sub-Category → Service).`);
        return;
      }
      if (!s.treatment_details?.trim()) {
        setError(`Session #${i + 1}: Treatment details are required.`);
        return;
      }
      if (!s.session_date) {
        setError(`Session #${i + 1}: Please choose a session date.`);
        return;
      }
      if (!s.session_time) {
        setError(`Session #${i + 1}: Please choose a session time.`);
        return;
      }
      if (!s.staff_id) {
        setError(`Session #${i + 1}: Please assign a staff member.`);
        return;
      }
      if (s.staff_commission === '' || Number(s.staff_commission) < 0) {
        setError(`Session #${i + 1}: Staff commission must be 0 or a positive fixed amount.`);
        return;
      }

      // Check past time for today
      if (s.session_date === todayStr) {
        const [h, m] = s.session_time.split(':').map(Number);
        const sessionTimeObj = new Date();
        sessionTimeObj.setHours(h, m, 0, 0);
        if (sessionTimeObj < now) {
          setError(`Session #${i + 1}: Time (${s.session_time}) cannot be in the past for today.`);
          return;
        }
      }
    }

    setSaving(true);

    try {
      const payload = {
        customer_id: Number(customerId),
        appointment_date: appointmentDate,
        sales_team_id: Number(salesTeamId),
        appointment_fees: totalAppointmentFees,
        notes: notes ? notes.trim() : undefined,
        sessions: sessions.map((s) => ({
          service_id: s.service_id ? Number(s.service_id) : null,
          treatment_details: (s.treatment_details || '').trim(),
          session_date: s.session_date,
          session_time: s.session_time,
          staff_id: Number(s.staff_id),
          staff_commission: Number(s.staff_commission || 0),
          inventory_product_ids: (s.inventory_product_ids || []).map(Number),
          inventory_product_id: (s.inventory_product_ids && s.inventory_product_ids.length > 0)
            ? Number(s.inventory_product_ids[0])
            : (s.inventory_product_id ? Number(s.inventory_product_id) : null),
        })),
      };

      const res = await adminMasterAppointmentService.create(payload);

      toast.success(res.message || 'Master Appointment and sessions booked successfully!');
      navigate('/admin/appointments');
    } catch (err) {
      console.error('Master appointment booking error:', err);
      let msg = 'Failed to save appointment. Please check all fields.';

      if (err.response?.data?.errors) {
        const errorList = Object.values(err.response.data.errors).flat();
        if (errorList.length > 0) {
          msg = errorList.join(' • ');
        }
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }

      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (optionsLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center text-slate-500">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-sm animate-pulse">
            <HeartPulse className="w-6 h-6 animate-bounce" />
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-800 mt-4 font-display">Loading Clinic Consultation Desk...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving registered patients, doctors, and treatment services</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Clinical Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/90 relative overflow-hidden">
        {/* Background decorative soft glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-blue-100/60 via-indigo-50/40 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-[11px] font-bold tracking-tight">
                <HeartPulse className="w-3.5 h-3.5 text-blue-600" />
                <span>Clinical OPD Desk</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Multi-Session Architecture
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
              Schedule Master Appointment
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Create a unified master parent consultation with independent clinical sessions, assigned doctors, automated commission tracking, and medical inventory allocation.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={() => navigate('/admin/appointments')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer font-display"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Back to Directory</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric Overview Ribbon */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block micro-label">
              Selected Patient
            </span>
            <span className="text-xs font-bold text-slate-900 truncate block mt-0.5" title={selectedCustomer?.name || 'None selected'}>
              {selectedCustomer ? selectedCustomer.name : '— Awaiting Selection —'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block micro-label">
              Master Date
            </span>
            <span className="text-xs font-bold text-slate-900 font-mono block mt-0.5">
              {appointmentDate || todayStr}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block micro-label">
              Sessions Queued
            </span>
            <span className="text-xs font-black text-indigo-900 font-mono block mt-0.5">
              {sessions.length} {sessions.length === 1 ? 'Clinical Session' : 'Clinical Sessions'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block micro-label">
              Total Consultation Fee
            </span>
            <span className="text-xs font-black text-emerald-900 font-mono block mt-0.5 tabular-numbers">
              ₹{totalAppointmentFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Top Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800 animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Booking Validation Required: </span>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: MASTER APPOINTMENT DETAILS */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/90 relative overflow-hidden transition-all hover:shadow-sm">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                  1. Master Appointment Information
                </h2>
                <p className="text-xs text-slate-500">
                  Core consultation details, patient identity, referral sales attribution, and date
                </p>
              </div>
            </div>

            <Link
              to="/admin/customers/create"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 rounded-xl transition-all cursor-pointer"
              title="Add New Patient"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>+ New Patient</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Customer Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider micro-label">
                  Patient / Customer <span className="text-rose-500">*</span>
                </label>
                <Link
                  to="/admin/customers/create"
                  className="sm:hidden text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  + Add New
                </Link>
              </div>
              <div className="relative">
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50/90 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
                >
                  <option value="">-- Select Registered Patient --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.mobile}) {c.gender ? `• ${c.gender}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {customers.length === 0 ? (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>No active customers found. Please add a customer first.</span>
                </p>
              ) : selectedCustomer ? (
                /* Patient Quick Identity Snapshot */
                <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-blue-50/60 to-slate-50/80 border border-blue-200/60 flex items-center gap-3 animate-in fade-in duration-200">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {selectedCustomer.name}
                      </span>
                      {selectedCustomer.gender && (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded capitalize">
                          {selectedCustomer.gender}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{selectedCustomer.mobile || 'No Mobile'}</span>
                      </span>
                      {selectedCustomer.email && (
                        <span className="hidden sm:flex items-center gap-1 truncate max-w-[150px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{selectedCustomer.email}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Master Appointment Date */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider micro-label">
                  Master Consultation Date <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAppointmentDate(todayStr)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Set Today
                </button>
              </div>
              <div className="relative">
                <input
                  type="date"
                  min={todayStr}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50/90 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Baseline primary date for this master clinical file
              </p>
            </div>

            {/* Sales Team Member */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 micro-label">
                Sales Team / Lead Attribution <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={salesTeamId}
                  onChange={(e) => setSalesTeamId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50/90 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
                >
                  <option value="">-- Select Sales Representative --</option>
                  {salesTeams.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.sales_code}) {st.department ? `• ${st.department}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Staff representative credited for patient intake
              </p>
            </div>
          </div>

          {/* Optional Clinical Consultation Notes */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 micro-label flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Clinical Intake Notes &amp; Special Remarks (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter special clinical remarks, allergy disclosures, doctor instructions, or referral history..."
              className="w-full px-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-y"
            />
          </div>
        </div>

        {/* SECTION 2: DYNAMIC MULTIPLE SESSIONS BUILDER */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/90 space-y-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                    2. Individual Clinical Sessions
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure procedural sessions with assigned doctors, consultation fees, commission allocation, and supplies.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddSession}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-950/20 transition-all cursor-pointer font-display hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Session</span>
            </button>
          </div>

          {/* List of Dynamic Session Cards */}
          <div className="space-y-5">
            {sessions.map((session, index) => (
              <div
                key={index}
                className="group relative p-5 sm:p-6 rounded-3xl border border-slate-200 hover:border-indigo-300/90 bg-white hover:bg-slate-50/30 transition-all duration-300 shadow-xs hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                {/* Session Card Header Bar */}
                <div className="flex flex-wrap items-center justify-between pb-3.5 mb-4 border-b border-slate-100 gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-black text-xs shadow-xs font-mono">
                      {index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 font-display">
                      Session #{index + 1} Procedure
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Pending Review
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Live Fee Badge */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-mono text-xs font-black shadow-2xs tabular-numbers">
                      <span>Fee:</span>
                      <span>₹{Number(session.service_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </span>

                    {/* Remove Session Button */}
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSession(index)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-all text-xs font-semibold cursor-pointer"
                        title="Remove this session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3-Tier Clinical Service Selection Stepper Pipeline */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-slate-50/80 border border-indigo-100/90 mb-5 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 font-display">
                        Clinical Service Selection Pipeline
                      </span>
                      <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full border border-indigo-200">
                        Category → Sub-Category → Service
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Required
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* 1. Category */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5 micro-label">
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                        <span>1. Category</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={session.category_id || ''}
                        onChange={(e) => handleSessionCategoryChange(index, e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer shadow-2xs"
                      >
                        <option value="">-- Choose Category --</option>
                        {servicesTree.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Sub-Category */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5 micro-label">
                        <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${session.category_id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
                        <span>2. Sub-Category</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={session.sub_category_id || ''}
                        onChange={(e) => handleSessionSubCategoryChange(index, e.target.value)}
                        disabled={!session.category_id}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:opacity-50 disabled:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                      >
                        <option value="">-- Choose Sub-Category --</option>
                        {servicesTree
                          .find((c) => String(c.id) === String(session.category_id))
                          ?.children?.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* 3. Service */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5 micro-label">
                        <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${session.sub_category_id ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
                        <span>3. Clinical Service</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={session.service_id || ''}
                        onChange={(e) => handleSessionServiceChange(index, e.target.value)}
                        disabled={!session.sub_category_id}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:opacity-50 disabled:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                      >
                        <option value="">-- Choose Clinical Service --</option>
                        {servicesTree
                          .find((c) => String(c.id) === String(session.category_id))
                          ?.children?.find((sub) => String(sub.id) === String(session.sub_category_id))
                          ?.services?.map((svc) => (
                            <option key={svc.id} value={svc.id}>
                              {svc.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* 4. Appointment Fees (₹) */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5 micro-label">
                        <span className="w-4 h-4 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center">₹</span>
                        <span>Standard Fee (Auto)</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs pointer-events-none">
                          ₹
                        </span>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={
                            session.service_price !== undefined && session.service_price !== ''
                              ? Number(session.service_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })
                              : '0.00'
                          }
                          className="w-full pl-7 pr-3 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-xs font-black text-slate-900 cursor-not-allowed select-none font-mono shadow-2xs tabular-numbers"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Treatment Details */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 micro-label flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Treatment Details / Procedure Name</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={session.treatment_details}
                      onChange={(e) => handleSessionChange(index, 'treatment_details', e.target.value)}
                      placeholder="e.g. Physiotherapy Cervical Spine Traction, Dental Scaling..."
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                    />
                  </div>

                  {/* Session Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 micro-label flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>Session Date</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={session.session_date}
                      onChange={(e) => handleSessionChange(index, 'session_date', e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                    />
                  </div>

                  {/* Session Time */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 micro-label flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Session Time</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={session.session_time}
                      onChange={(e) => handleSessionChange(index, 'session_time', e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                    />
                  </div>

                  {/* Assigned Staff Member */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 micro-label flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Assigned Doctor / Staff</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={session.staff_id}
                      onChange={(e) => handleSessionChange(index, 'staff_id', e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                    >
                      <option value="">-- Assign Doctor / Medical Staff --</option>
                      {staffList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} {st.department ? `(${st.department})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fixed Staff Commission */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 micro-label flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>Doctor Commission (₹)</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-xs pointer-events-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={session.staff_commission}
                        onChange={(e) => handleSessionChange(index, 'staff_commission', e.target.value)}
                        placeholder="0.00"
                        required
                        className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all tabular-numbers"
                      />
                    </div>
                  </div>

                  {/* Inventory Products Used (Multi-Select with Checkboxes) */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 micro-label flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Inventory Consumables / Items</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Multiple selection optional
                      </span>
                    </label>
                    <ProductMultiSelectDropdown
                      products={inventoryProducts}
                      selectedIds={
                        session.inventory_product_ids && session.inventory_product_ids.length > 0
                          ? session.inventory_product_ids
                          : (session.inventory_product_id ? [Number(session.inventory_product_id)] : [])
                      }
                      onChange={(newIds) => {
                        handleSessionChange(index, 'inventory_product_ids', newIds);
                        handleSessionChange(index, 'inventory_product_id', newIds[0] ? String(newIds[0]) : '');
                      }}
                      placeholder="-- Allocate Medical Supplies / Consumables --"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Session Bottom Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleAddSession}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer font-display"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Clinical Session</span>
            </button>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-slate-500 font-medium">
                Total {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} configured
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold font-mono shadow-2xs tabular-numbers">
                Subtotal: ₹{totalAppointmentFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Sticky/Floating Bottom Action Footer */}
        <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800 font-display">
                Ready for Confirmation:
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
                {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-black border border-emerald-200 tabular-numbers">
                Total: ₹{totalAppointmentFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              {totalStaffCommissions > 0 && (
                <span className="hidden md:inline-flex px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200 tabular-numbers">
                  Dr. Comm: ₹{totalStaffCommissions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/appointments')}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer font-display"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-7 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer font-display hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Appointment Booking...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm &amp; Book Master Appointment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
