import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Trash2,
  ArrowLeft,
  DollarSign,
  Package,
  Layers,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Stethoscope,
  Phone,
  Coins,
  HeartPulse,
  UserPlus,
  Save,
  Check,
  Upload,
  Image as ImageIcon,
  X,
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Handle consultation/appointment image selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size cannot exceed 10MB.');
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setError('');
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  // Selected customer preview
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
      image_file: null,
      image_preview: null,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load dropdown options
  useEffect(() => {
    let isMounted = true;
    adminMasterAppointmentService.getOptions()
      .then((res) => {
        if (!isMounted) return;
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

          // If pre-selected service was passed from Services Management Page, prefill
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
        if (!isMounted) return;
        console.error('Failed to load options', err);
        toast.error('Failed to load customers, staff, and sales teams list.');
      })
      .finally(() => {
        if (isMounted) {
          setOptionsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
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
        image_file: null,
        image_preview: null,
      },
    ]);
  };

  const handleSessionImageChange = (index, e) => {
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
    setSessions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        image_file: file,
        image_preview: previewUrl,
      };
      return copy;
    });
  };

  const handleRemoveSessionImage = (index) => {
    setSessions((prev) => {
      const copy = [...prev];
      if (copy[index]?.image_preview) {
        URL.revokeObjectURL(copy[index].image_preview);
      }
      copy[index] = {
        ...copy[index],
        image_file: null,
        image_preview: null,
      };
      return copy;
    });
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
      toast.warning('At least one session is required.');
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

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!customerId) {
      setError('Please select a patient.');
      return;
    }

    if (!appointmentDate) {
      setError('Please select the Consultation Date.');
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

    if (!imageFile) {
      setError('Appointment image is required. Please upload an image.');
      return;
    }

    // Validate sessions
    const now = new Date();
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      if (!s.category_id || !s.sub_category_id || !s.service_id) {
        setError(`Session #${i + 1}: Please select Category, Sub-Category, and Service.`);
        return;
      }
      if (!s.treatment_details?.trim()) {
        setError(`Session #${i + 1}: Treatment details are required.`);
        return;
      }
      if (!s.session_date) {
        setError(`Session #${i + 1}: Please choose a date.`);
        return;
      }
      if (!s.session_time) {
        setError(`Session #${i + 1}: Please choose a time.`);
        return;
      }
      if (!s.staff_id) {
        setError(`Session #${i + 1}: Please assign a doctor or staff member.`);
        return;
      }
      if (s.staff_commission === '' || Number(s.staff_commission) < 0) {
        setError(`Session #${i + 1}: Commission must be 0 or a positive amount.`);
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
      const toBase64 = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (err) => reject(err);
        });

      const imageBase64 = await toBase64(imageFile);

      const processedSessions = await Promise.all(
        sessions.map(async (s) => {
          let sessionImageBase64 = null;
          if (s.image_file) {
            sessionImageBase64 = await toBase64(s.image_file);
          }
          return {
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
            image: sessionImageBase64 || undefined,
          };
        })
      );

      const payload = {
        customer_id: Number(customerId),
        appointment_date: appointmentDate,
        sales_team_id: Number(salesTeamId),
        appointment_fees: totalAppointmentFees,
        image: imageBase64,
        notes: notes ? notes.trim() : undefined,
        sessions: processedSessions,
      };

      const res = await adminMasterAppointmentService.create(payload);

      toast.success(res.message || 'Appointment created successfully!');
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
      <div className="min-h-[400px] sm:min-h-[500px] flex flex-col items-center justify-center text-slate-500 px-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 shadow-lg sm:shadow-xl shadow-indigo-500/25 flex items-center justify-center text-white animate-pulse">
          <HeartPulse className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow" />
        </div>
        <p className="text-sm sm:text-base font-bold text-slate-800 mt-4 font-display">Loading Appointment Form...</p>
        <p className="text-xs text-slate-400 mt-1 text-center">Fetching patients, doctors, and clinic services</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-8 pb-32 sm:pb-28">
      {/* Page Header with 3D Icon (Responsive Stack on Mobile) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-1">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 shadow-md sm:shadow-xl shadow-indigo-500/25 ring-2 sm:ring-4 ring-indigo-50 flex items-center justify-center text-white shrink-0">
            <Calendar className="w-5 h-5 sm:w-7 sm:h-7 drop-shadow-md" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-display">
              Book Appointment
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate sm:whitespace-normal">
              Schedule clinical consultation and treatment sessions
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/appointments')}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer w-full sm:w-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
          <span>Back to Appointments</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200/90 rounded-2xl flex items-start gap-2.5 sm:gap-3 text-rose-800 shadow-xs">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm font-medium leading-relaxed">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
        {/* SECTION 1: MASTER APPOINTMENT DETAILS */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 lg:p-8 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4 sm:space-y-6">
          {/* Card Header (Responsive wrap on mobile so "+ New Patient" never clips) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-5 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-50 flex items-center justify-center text-white shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                  1. Patient &amp; Consultation Details
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Select patient, date and sales partner
                </p>
              </div>
            </div>

            <Link
              to="/admin/customers/create"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-all cursor-pointer self-start sm:self-center"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>+ New Patient</span>
            </Link>
          </div>

          {/* Form Fields: Patient, Date, Sales Team */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Customer Dropdown */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                Patient <span className="text-rose-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="">-- Select Patient --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobile}) {c.gender ? `• ${c.gender}` : ''}
                  </option>
                ))}
              </select>

              {/* Selected Patient Compact Info */}
              {selectedCustomer && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-600 bg-blue-50/60 border border-blue-100 rounded-xl px-2.5 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="font-semibold text-blue-950 truncate max-w-[140px] sm:max-w-none">{selectedCustomer.name}</span>
                  {selectedCustomer.mobile && <span className="text-slate-500">• {selectedCustomer.mobile}</span>}
                  {selectedCustomer.gender && <span className="text-slate-500 capitalize">• {selectedCustomer.gender}</span>}
                </div>
              )}
            </div>

            {/* Master Appointment Date */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                  Consultation Date <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAppointmentDate(todayStr)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Set Today
                </button>
              </div>
              <input
                type="date"
                min={todayStr}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-xs"
              />
            </div>

            {/* Sales Team Member */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                Sales Partner <span className="text-rose-500">*</span>
              </label>
              <select
                value={salesTeamId}
                onChange={(e) => setSalesTeamId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-xs"
              >
                <option value="">-- Select Sales Partner --</option>
                {salesTeams.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.sales_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2-Column Row: Image & Notes (Half-Half) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
            {/* Consultation / Appointment Image (Required) */}
            <div className="flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                  Image <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-medium text-slate-400">
                  Mandatory document
                </span>
              </div>

              <input
                type="file"
                name="image"
                id="appointment_image"
                accept="image/*"
                required
                onChange={handleImageChange}
                className="hidden"
              />

              {!imagePreview ? (
                <label
                  htmlFor="appointment_image"
                  className="group flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-2xl p-4 sm:p-5 transition-all cursor-pointer text-center bg-slate-50/60 min-h-[120px]"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all mb-2 shadow-xs">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    Click to browse and upload image <span className="text-rose-500">*</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                    Supported: PNG, JPG, JPEG, WEBP (Max 10MB)
                  </p>
                </label>
              ) : (
                <div className="flex-1 p-3 sm:p-3.5 bg-slate-50/90 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-xs">
                      <img
                        src={imagePreview}
                        alt="Appointment Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3" /> Image Selected
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate mt-1">
                        {imageFile?.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {(imageFile?.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <label
                      htmlFor="appointment_image"
                      className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      Change
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 rounded-xl transition-all cursor-pointer"
                      title="Remove Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Notes */}
            <div className="flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                  Notes (Optional)
                </label>
                <span className="text-[11px] font-medium text-slate-400">
                  Clinical Remarks
                </span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Clinical remarks, patient instructions, or special notes..."
                className="w-full flex-1 min-h-[120px] px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: INDIVIDUAL CLINICAL SESSIONS */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 lg:p-8 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4 sm:space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-5 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 shadow-md shadow-purple-500/25 ring-2 ring-purple-50 flex items-center justify-center text-white shrink-0">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                  2. Clinical Sessions
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Procedures, doctor assignment, and schedules
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddSession}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Session</span>
            </button>
          </div>

          {/* List of Session Cards */}
          <div className="space-y-4 sm:space-y-6">
            {sessions.map((session, index) => (
              <div
                key={index}
                className="p-3.5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white hover:border-indigo-300 shadow-xs sm:shadow-sm transition-all duration-200 space-y-4 sm:space-y-6"
              >
                {/* Session Card Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 sm:pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    {/* 3D Session Number Badge */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 shadow-md shadow-indigo-500/25 ring-2 ring-indigo-50 flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 font-display">
                        Session {index + 1}
                      </h3>
                      <span className="text-[11px] sm:text-xs text-amber-600 font-medium">Pending Confirmation</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Standard Fee Pill */}
                    <div className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold font-mono">
                      ₹{Number(session.service_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>

                    {/* Remove button */}
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSession(index)}
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Remove session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Service Selection Grid: 4 Clean Columns */}
                <div>
                  <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">
                    Service Procedure
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* 1. Category */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={session.category_id || ''}
                        onChange={(e) => handleSessionCategoryChange(index, e.target.value)}
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="">-- Select Category --</option>
                        {servicesTree.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Sub-Category */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Sub-Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={session.sub_category_id || ''}
                        onChange={(e) => handleSessionSubCategoryChange(index, e.target.value)}
                        disabled={!session.category_id}
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100 transition-all cursor-pointer"
                      >
                        <option value="">-- Select Sub-Category --</option>
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
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Service <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={session.service_id || ''}
                        onChange={(e) => handleSessionServiceChange(index, e.target.value)}
                        disabled={!session.sub_category_id}
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-emerald-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50 disabled:bg-slate-100 transition-all cursor-pointer"
                      >
                        <option value="">-- Select Service --</option>
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

                    {/* 4. Consultation Fee */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Consultation Fee (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-xs sm:text-sm pointer-events-none select-none">
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
                          className="w-full pl-8 pr-3 py-2 sm:pl-9 sm:pr-3.5 sm:py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 cursor-not-allowed select-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Treatment Details & Doctor Assignment Grid */}
                <div>
                  <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">
                    Doctor &amp; Procedure
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Treatment Details */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Procedure / Details <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={session.treatment_details}
                        onChange={(e) => handleSessionChange(index, 'treatment_details', e.target.value)}
                        placeholder="e.g. Physiotherapy Cervical Spine Traction..."
                        required
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                      />
                    </div>

                    {/* Assigned Doctor / Staff */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Doctor / Staff <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={session.staff_id}
                        onChange={(e) => handleSessionChange(index, 'staff_id', e.target.value)}
                        required
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                      >
                        <option value="">-- Assign Doctor --</option>
                        {staffList.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} {st.department ? `(${st.department})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Doctor Commission */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Commission (₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-xs sm:text-sm pointer-events-none select-none">
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
                          className="w-full pl-8 pr-3 py-2 sm:pl-9 sm:pr-3.5 sm:py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date, Time & Supplies */}
                <div>
                  <div className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">
                    Schedule &amp; Medical Supplies
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Session Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        min={todayStr}
                        value={session.session_date}
                        onChange={(e) => handleSessionChange(index, 'session_date', e.target.value)}
                        required
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                      />
                    </div>

                    {/* Session Time */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Time <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={session.session_time}
                        onChange={(e) => handleSessionChange(index, 'session_time', e.target.value)}
                        required
                        className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                      />
                    </div>

                    {/* Inventory Products Used */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Consumables / Supplies (Optional)
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
                        placeholder="-- Allocate Supplies / Consumables --"
                      />
                    </div>
                  </div>
                </div>

                {/* Session Image (Optional) */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Session Image (Optional)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Before/after procedure photo or clinical scan
                    </span>
                  </div>

                  <input
                    type="file"
                    id={`session_image_${index}`}
                    accept="image/*"
                    onChange={(e) => handleSessionImageChange(index, e)}
                    className="hidden"
                  />

                  {!session.image_preview ? (
                    <label
                      htmlFor={`session_image_${index}`}
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
                            src={session.image_preview}
                            alt={`Session #${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                            <Check className="w-2.5 h-2.5" /> Session Image Attached
                          </span>
                          <p className="text-xs font-medium text-slate-800 truncate mt-0.5">
                            {session.image_file?.name || 'Session Image'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <label
                          htmlFor={`session_image_${index}`}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Change
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveSessionImage(index)}
                          className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove session image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Another Session Link */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleAddSession}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Session</span>
            </button>
          </div>
        </div>

        {/* Sticky Bottom Action Bar (Fully Responsive on Mobile) */}
        <div className="sticky bottom-3 sm:bottom-6 z-20 bg-white/98 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/90 shadow-xl shadow-slate-900/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 transform-gpu">
          <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 shadow-md sm:shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-50 flex items-center justify-center text-white shrink-0">
                <Coins className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow" />
              </div>
              <div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Total Consultation Fee</div>
                <div className="text-base sm:text-xl font-bold text-slate-900 font-mono">
                  ₹{totalAppointmentFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  <span className="text-[11px] sm:text-xs font-normal text-slate-500 ml-1.5">
                    ({sessions.length} {sessions.length === 1 ? 'session' : 'sessions'})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('/admin/appointments')}
              className="col-span-1 px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl sm:rounded-2xl border border-slate-200/80 transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="col-span-2 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 cursor-pointer text-center"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span className="truncate">Booking...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 shrink-0" />
                  <span className="truncate">Confirm Booking</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
