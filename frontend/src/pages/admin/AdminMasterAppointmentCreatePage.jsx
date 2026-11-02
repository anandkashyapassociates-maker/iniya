import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
  const [appointmentFees, setAppointmentFees] = useState('');
  const [masterServiceId, setMasterServiceId] = useState('');
  const [notes, setNotes] = useState('');

  // Flattened list of all services for easy lookup
  const allServicesList = useMemo(() => {
    const list = [];
    for (const cat of servicesTree) {
      for (const sub of cat.children || []) {
        for (const svc of sub.services || []) {
          list.push({
            ...svc,
            category_name: cat.name,
            category_id: cat.id,
            sub_category_name: sub.name,
            sub_category_id: sub.id,
          });
        }
      }
    }
    return list;
  }, [servicesTree]);

  // Read-only display string for selected clinical service
  const selectedServiceDisplayText = useMemo(() => {
    if (!masterServiceId) return '';
    const svcObj = allServicesList.find((s) => String(s.id) === String(masterServiceId));
    if (!svcObj) return '';
    return `${svcObj.name} (${svcObj.sub_category_name || 'Service'}) — ₹${Number(svcObj.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }, [allServicesList, masterServiceId]);

  // Dynamic Sessions state
  const [sessions, setSessions] = useState([
    {
      category_id: '',
      sub_category_id: '',
      service_id: '',
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
              setMasterServiceId(String(foundSvc.id));
              // Auto-fill Appointment Fees with the selected Service's price!
              setAppointmentFees(String(foundSvc.price !== undefined ? foundSvc.price : '0'));

              setSessions((prev) => [
                {
                  ...prev[0],
                  category_id: String(foundSvc.category_id),
                  sub_category_id: String(foundSvc.sub_category_id),
                  service_id: String(foundSvc.id),
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
  }, [toast, preServiceId, preCategoryId, preSubCategoryId]);

  // Master Service selection change handler
  const handleMasterServiceChange = (serviceId) => {
    setMasterServiceId(serviceId);
    if (!serviceId) return;

    const svcObj = allServicesList.find((s) => String(s.id) === String(serviceId));
    if (svcObj) {
      // Auto-fill Appointment Fees with the selected Service Price!
      setAppointmentFees(String(svcObj.price !== undefined ? svcObj.price : '0'));

      // Also link to Session #1
      setSessions((prev) => [
        {
          ...prev[0],
          category_id: String(svcObj.category_id || ''),
          sub_category_id: String(svcObj.sub_category_id || ''),
          service_id: String(svcObj.id),
          treatment_details: prev[0]?.treatment_details?.trim() || svcObj.name,
        },
        ...prev.slice(1),
      ]);
    }
  };

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
        treatment_details: lastSession?.treatment_details || '',
        session_date: lastSession?.session_date || todayStr,
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
      };
      return copy;
    });
  };

  const handleSessionServiceChange = (index, serviceId) => {
    setSessions((prev) => {
      const copy = [...prev];
      const s = copy[index];
      let serviceName = '';
      if (serviceId) {
        const cat = servicesTree.find((c) => String(c.id) === String(s.category_id));
        const sub = cat?.children?.find((sc) => String(sc.id) === String(s.sub_category_id));
        const svc = sub?.services?.find((sv) => String(sv.id) === String(serviceId));
        if (svc) serviceName = svc.name;
      }
      copy[index] = {
        ...s,
        service_id: serviceId,
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

    if (appointmentFees === '' || Number(appointmentFees) < 0) {
      setError('Please enter a valid appointment fee (0 or greater).');
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
      if (!s.treatment_details?.trim() && !s.service_id) {
        setError(`Session #${i + 1}: Please select a clinical service or enter treatment details.`);
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
        appointment_fees: Number(appointmentFees),
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm font-medium">Loading form options...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Book Master Appointment</span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              Multi-Session Architecture
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create a parent booking with multiple independent clinical sessions, assigned staff, fixed commissions, and products.
          </p>
        </div>

        <div className="flex items-center w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate('/admin/appointments')}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Top Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Booking Error: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: MASTER APPOINTMENT DETAILS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2.5 pb-4 mb-6 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">1. Master Appointment Information</h2>
              <p className="text-xs text-slate-500">Core parent details, patient identity, sales attribution, and total consultation fees</p>
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
                    {c.name} ({c.mobile}) {c.gender ? `- ${c.gender}` : ''}
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No active customers found. Please add a customer first.</p>
              )}
            </div>

            {/* Master Appointment Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Master Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                min={todayStr}
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
                    {st.name} ({st.sales_code}) {st.department ? `- ${st.department}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Total Appointment Fees (Read-Only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Appointment Fees (₹)</span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                  Read Only
                </span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={appointmentFees}
                  readOnly
                  placeholder="0.00"
                  required
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-100/90 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 cursor-not-allowed select-none focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Auto-assigned from selected clinical service</p>
            </div>

            {/* Clinical Services (Read-Only) */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Clinical Services</span>
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                    Read Only
                  </span>
                  {!masterServiceId && (
                    <button
                      type="button"
                      onClick={() => navigate('/admin/appointments/services')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 cursor-pointer"
                    >
                      Choose from Services Catalog
                    </button>
                  )}
                </div>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={
                    selectedServiceDisplayText ||
                    'No service selected — please select from Services catalog'
                  }
                  readOnly
                  className="w-full px-4 py-2.5 bg-slate-100/90 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 cursor-not-allowed select-none focus:outline-none"
                />
                {masterServiceId && (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Selected &amp; Linked</span>
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Fixed from Services Management module selection (non-editable)
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: DYNAMIC MULTIPLE SESSIONS BUILDER */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">2. Individual Clinical Sessions</h2>
                <p className="text-xs text-slate-500">
                  Add unlimited sessions. Each session has its own date, time, assigned staff member, fixed commission, and product.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddSession}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Session</span>
            </button>
          </div>

          {/* List of Dynamic Session Cards */}
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <div
                key={index}
                className="relative p-5 rounded-2xl border-2 border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 hover:border-indigo-300 transition-colors shadow-xs"
              >
                {/* Session Card Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/70">
                  <div className="flex items-center space-x-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-xs">
                      {index + 1}
                    </span>
                    <h3 className="font-semibold text-sm text-slate-800">
                      Session #{index + 1} Configuration
                    </h3>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Default: Pending
                    </span>
                  </div>

                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSession(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove this session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* 3-Tier Clinical Service Selection: Category -> Sub-Category -> Service */}
                <div className="p-3.5 bg-slate-100/70 border border-slate-200/90 rounded-xl mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-display">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Select Clinical Service (Category → Sub-Category → Service)</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Optional • Loads procedure & price</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* 1. Category */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        1. Category
                      </label>
                      <select
                        value={session.category_id || ''}
                        onChange={(e) => handleSessionCategoryChange(index, e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        2. Sub-Category
                      </label>
                      <select
                        value={session.sub_category_id || ''}
                        onChange={(e) => handleSessionSubCategoryChange(index, e.target.value)}
                        disabled={!session.category_id}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
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
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        3. Clinical Service
                      </label>
                      <select
                        value={session.service_id || ''}
                        onChange={(e) => handleSessionServiceChange(index, e.target.value)}
                        disabled={!session.sub_category_id}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium disabled:opacity-50"
                      >
                        <option value="">-- Choose Service --</option>
                        {servicesTree
                          .find((c) => String(c.id) === String(session.category_id))
                          ?.children?.find((sub) => String(sub.id) === String(session.sub_category_id))
                          ?.services?.map((svc) => (
                            <option key={svc.id} value={svc.id}>
                              {svc.name} (₹{Number(svc.price).toLocaleString('en-IN')})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Session Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Treatment Details */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Treatment Details / Procedure <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={session.treatment_details}
                      onChange={(e) => handleSessionChange(index, 'treatment_details', e.target.value)}
                      placeholder="e.g. Physiotherapy Cervical Spine Traction, OPD Checkup..."
                      required
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                    />
                  </div>

                  {/* Session Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Session Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={session.session_date}
                      onChange={(e) => handleSessionChange(index, 'session_date', e.target.value)}
                      required
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                    />
                  </div>

                  {/* Session Time */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Session Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={session.session_time}
                      onChange={(e) => handleSessionChange(index, 'session_time', e.target.value)}
                      required
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                    />
                  </div>

                  {/* Assigned Staff Member */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Assign Staff Member <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={session.staff_id}
                      onChange={(e) => handleSessionChange(index, 'staff_id', e.target.value)}
                      required
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                    >
                      <option value="">-- Select Staff Member --</option>
                      {staffList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} {st.department ? `(${st.department})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fixed Staff Commission */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Fixed Staff Commission (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">
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
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Inventory Products Used (Multi-Select with Checkboxes) */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Package className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Inventory Products Used</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Multiple Allowed • Optional
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
                      placeholder="-- Select Inventory Products (Check all that apply) --"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Session Bottom Button */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddSession}
              className="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Session</span>
            </button>

            <span className="text-xs text-slate-500 font-medium">
              Total {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} queued for creation
            </span>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/appointments')}
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
                <span>Creating Master Appointment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Book Appointment & Sessions</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

