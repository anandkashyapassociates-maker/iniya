import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Activity,
  ShieldCheck,
  HeartPulse,
  Clock,
  X,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Lock,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { useAdminAuth } from '../../features/auth/AdminAuthContext';

function CustomerAvatar({ customer, size = 'sm' }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [customer?.image_url, customer?.id]);

  const sizeClass = size === 'lg' ? 'w-16 h-16 rounded-2xl text-xl' : 'w-11 h-11 rounded-2xl text-sm';

  const genderBg =
    customer?.gender === 'female'
      ? 'bg-gradient-to-tr from-pink-500 via-rose-500 to-rose-600'
      : customer?.gender === 'other'
      ? 'bg-gradient-to-tr from-purple-500 via-indigo-500 to-indigo-600'
      : 'bg-gradient-to-tr from-blue-600 via-sky-600 to-cyan-600';

  if (customer?.image_url && !imgError) {
    return (
      <img
        src={customer.image_url}
        alt={customer.name}
        className={`${sizeClass} object-cover border-2 border-white shadow-xs shrink-0 ring-1 ring-slate-200/80`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center font-bold text-white shadow-xs uppercase shrink-0 ${genderBg} border-2 border-white ring-1 ring-slate-200/80`}
    >
      {customer?.name ? customer.name.charAt(0) : 'P'}
    </div>
  );
}

export default function AdminCustomersPage() {
  const toast = useToast();
  const { user } = useAdminAuth();

  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Selected customer for Quick View Modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Delete modal state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    customer: null,
    isLoading: false,
  });

  const fetchStats = async () => {
    try {
      const data = await adminService.getCustomerStats();
      setStats(data);
    } catch {
      // ignore
    }
  };

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getCustomers({
        search,
        gender: genderFilter !== 'all' ? genderFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
      });

      setCustomers(res.data || []);
      setPagination({
        current_page: res.current_page,
        last_page: res.last_page,
        total: res.total,
        from: res.from,
        to: res.to,
      });
    } catch (err) {
      toast.error('Failed to load customer records.');
    } finally {
      setIsLoading(false);
    }
  }, [search, genderFilter, statusFilter, page, toast]);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [fetchCustomers]);

  const handleDelete = async () => {
    const { customer } = deleteDialog;
    if (!customer) return;

    setDeleteDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      await adminService.deleteCustomer(customer.id);
      toast.success(`Patient record '${customer.name}' removed successfully.`);
      setDeleteDialog({ isOpen: false, customer: null, isLoading: false });
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(null);
      }
      fetchCustomers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer.');
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const formatRecordId = (id) => `REC-${String(id).padStart(4, '0')}`;

  const columns = [
    {
      header: '#',
      className: 'w-14 text-center px-2',
      render: (c, index) => {
        const srNo = (pagination?.from || 1) + index;
        return (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-500 font-mono text-xs font-bold tabular-nums border border-slate-200/80 shadow-2xs">
            {srNo < 10 ? `0${srNo}` : srNo}
          </span>
        );
      },
    },
    {
      header: 'PATIENT DETAILS',
      accessor: 'name',
      className: 'min-w-[260px]',
      render: (c) => (
        <div className="flex items-center gap-3.5 py-1">
          <CustomerAvatar customer={c} size="sm" />
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setSelectedCustomer(c)}
              className="text-left font-bold text-slate-900 text-xs sm:text-[13px] hover:text-blue-600 transition-colors block truncate w-full cursor-pointer leading-snug tracking-tight"
              title={c.name}
            >
              {c.name}
            </button>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70 shadow-2xs">
                <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                <span>{formatRecordId(c.id)}</span>
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'CONTACT CHANNELS',
      accessor: 'mobile',
      className: 'min-w-[210px]',
      render: (c) => (
        <div className="space-y-1.5 py-1">
          <a
            href={`tel:${c.mobile}`}
            className="inline-flex items-center gap-2 text-xs font-bold font-mono text-slate-800 hover:text-blue-600 transition-colors group/phone"
            title="Click to Call"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 group-hover/phone:bg-blue-600 group-hover/phone:text-white transition-colors shrink-0 shadow-2xs">
              <Phone className="w-3 h-3" />
            </div>
            <span className="tracking-wide">{c.mobile}</span>
          </a>
          {c.email ? (
            <a
              href={`mailto:${c.email}`}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 transition-colors truncate max-w-[200px] group/mail"
              title={c.email}
            >
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover/mail:text-slate-600" />
              <span className="truncate">{c.email}</span>
            </a>
          ) : (
            <span className="text-[11px] text-slate-400 italic block pl-0.5">
              No email recorded
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'DEMOGRAPHICS',
      accessor: 'gender',
      className: 'min-w-[170px]',
      render: (c) => (
        <div className="space-y-1.5 py-1">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize shadow-2xs ${
                c.gender === 'female'
                  ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                  : c.gender === 'male'
                  ? 'bg-sky-50 text-sky-700 border-sky-200/80'
                  : 'bg-purple-50 text-purple-700 border-purple-200/80'
              }`}
            >
              <span className="text-xs">
                {c.gender === 'female' ? '👩' : c.gender === 'male' ? '👨' : '🧑'}
              </span>
              <span>{c.gender || 'Unspecified'}</span>
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-600 font-mono flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{c.age ? `${c.age} Years Old` : 'Age Not Recorded'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'ADDRESS & LOCATION',
      accessor: 'address',
      className: 'min-w-[260px]',
      render: (c) => (
        <div className="py-1">
          {c.address ? (
            <div className="flex items-start gap-2 max-w-xs text-xs text-slate-700 leading-relaxed font-normal">
              <div className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="line-clamp-2" title={c.address}>
                {c.address}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">
              No residential address
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'OPD STATUS',
      accessor: 'is_active',
      className: 'min-w-[140px]',
      render: (c) => (
        <div className="py-1">
          {c.is_active ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Active OPD</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <span>Inactive</span>
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'REGISTERED ON',
      accessor: 'created_at',
      className: 'min-w-[150px]',
      render: (c) => {
        const dateObj = new Date(c.created_at);
        return (
          <div className="space-y-0.5 py-1">
            <div className="text-xs font-bold text-slate-800">
              {dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <div className="text-[11px] text-slate-400 font-mono font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                {dateObj.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'ACTIONS',
      accessor: 'actions',
      className: 'w-[140px] text-right',
      render: (c) => {
        const isOwner = Number(c.admin_id) === Number(user?.id);

        return (
          <div className="flex items-center justify-end gap-1.5 py-1">
            <button
              type="button"
              onClick={() => setSelectedCustomer(c)}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 text-slate-600 hover:text-blue-600 transition-all shadow-2xs hover:shadow-xs cursor-pointer group/btn"
              title="View Patient Medical Chart"
            >
              <Eye className="w-4 h-4 text-slate-500 group-hover/btn:text-blue-600 transition-colors" />
            </button>
            {isOwner ? (
              <>
                <Link
                  to={`/admin/customers/${c.id}/edit`}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 transition-all shadow-2xs hover:shadow-xs cursor-pointer group/btn"
                  title="Edit Patient Record"
                >
                  <Edit className="w-4 h-4 text-slate-500 group-hover/btn:text-indigo-600 transition-colors" />
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    setDeleteDialog({
                      isOpen: true,
                      customer: c,
                      isLoading: false,
                    })
                  }
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition-all shadow-2xs hover:shadow-xs cursor-pointer group/btn"
                  title="Delete Patient Record"
                >
                  <Trash2 className="w-4 h-4 text-slate-400 group-hover/btn:text-rose-600 transition-colors" />
                </button>
              </>
            ) : (
              <span
                className="p-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 inline-flex items-center cursor-not-allowed shadow-2xs"
                title={`Registered by ${c.admin?.name || 'another admin'} (Read-only)`}
              >
                <Lock className="w-4 h-4 text-slate-400" />
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Top Header & Quick Action */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-50 via-indigo-50/40 to-transparent rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-medium">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Clinic Clinical Registry</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sorted: Newest First</span>
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold font-display text-slate-800 tracking-tight">
            Patient &amp; Customer Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 max-w-2xl leading-relaxed">
            Manage clinical enrollments, patient demographics, and contact records in real-time.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <Link
            to="/admin/customers/create"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-medium transition-all shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Patient</span>
          </Link>
        </div>
      </div>

      {/* Metrics Banner (Mobile Responsive 1 to 4 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs flex items-center gap-4 relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-medium shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest micro-label">
              Total Enrolled
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display tabular-numbers text-slate-900 mt-0.5 tracking-tight">{stats.total}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">All registered patients</div>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs flex items-center gap-4 relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-medium shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest micro-label">
              Active OPD Records
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display tabular-numbers text-emerald-600 mt-0.5 tracking-tight">{stats.active}</div>
            <div className="text-[10px] text-emerald-700 font-medium">Cleared for consultations</div>
          </div>
        </div>

        {/* Inactive Records */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs flex items-center gap-4 relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-medium shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest micro-label">
              Inactive Records
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display tabular-numbers text-slate-700 mt-0.5 tracking-tight">{stats.inactive}</div>
            <div className="text-[10px] text-slate-500 font-medium">Archived or pending review</div>
          </div>
        </div>

        {/* Clinical Desk Status */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs flex items-center gap-4 relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-medium shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest micro-label">
              Registry Status
            </div>
            <div className="text-base font-bold font-display text-indigo-900 mt-0.5">Clinic Operational</div>
            <div className="text-[10px] text-indigo-600 font-medium truncate">Real-time sync active</div>
          </div>
        </div>
      </div>

      {/* Data Table with Clinical Filters */}
      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search by patient name, mobile, email..."
        emptyTitle="No patient records found"
        emptyDescription={
          search || genderFilter !== 'all' || statusFilter !== 'all'
            ? 'No entries match your search criteria. Try adjusting your filters or search keywords.'
            : 'No patients have been registered yet. Click "Add New Patient" above to enroll the first clinical record.'
        }
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
        extraHeaderActions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50/90 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">All Demographics</option>
              <option value="male">👨 Male Only</option>
              <option value="female">👩 Female Only</option>
              <option value="other">🧑 Other Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50/90 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="true">Active OPD Only</option>
              <option value="false">Inactive Only</option>
            </select>

            {(search || genderFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setGenderFilter('all');
                  setStatusFilter('all');
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                title="Reset Filters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        }
      />

      {/* Patient Medical Chart Quick View Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 transform transition-all relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Chart"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Clinical Header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>Patient Medical Chart</span>
              </span>
              <span className="font-mono text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {formatRecordId(selectedCustomer.id)}
              </span>
            </div>

            {/* Patient Hero Info */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-100 mb-5">
              <CustomerAvatar customer={selectedCustomer} size="lg" />
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold font-display text-slate-800 tracking-tight truncate">
                  {selectedCustomer.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                    {formatRecordId(selectedCustomer.id)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                      selectedCustomer.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedCustomer.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    {selectedCustomer.is_active ? 'Active OPD Clearance' : 'Inactive Record'}
                  </span>
                </div>
              </div>
            </div>

            {/* Clinical Demographic Grid */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                    Mobile Phone
                  </span>
                  <a
                    href={`tel:${selectedCustomer.mobile}`}
                    className="font-mono font-medium text-slate-800 hover:text-blue-600 mt-1 block"
                  >
                    {selectedCustomer.mobile}
                  </a>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                    Email Address
                  </span>
                  <span className="font-medium text-slate-700 mt-1 block truncate">
                    {selectedCustomer.email || 'None on record'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                    Gender
                  </span>
                  <span className="font-medium text-slate-800 mt-1 block capitalize">
                    {selectedCustomer.gender === 'female' ? '👩 Female' : selectedCustomer.gender === 'male' ? '👨 Male' : '🧑 Other'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                    Patient Age
                  </span>
                  <span className="font-medium text-slate-800 mt-1 block">
                    {selectedCustomer.age ? `${selectedCustomer.age} Years` : 'Not specified'}
                  </span>
                </div>
              </div>

              {/* Full Address */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Full Residential Address
                </span>
                <p className="text-slate-700 leading-relaxed font-normal">
                  {selectedCustomer.address || 'No residential address recorded.'}
                </p>
              </div>

              {/* Audit Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 font-normal pt-2 border-t border-slate-100 gap-1">
                <span>Enrolled: {new Date(selectedCustomer.created_at).toLocaleString()}</span>
                {selectedCustomer.admin && (
                  <span>Admin: {selectedCustomer.admin.name}</span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              {Number(selectedCustomer.admin_id) === Number(user?.id) && (
                <Link
                  to={`/admin/customers/${selectedCustomer.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium transition-all shadow-xs cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Patient Record</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Remove Patient Record"
        message={`Are you sure you want to permanently delete the medical profile of "${deleteDialog.customer?.name}"? All associated clinical consultations and contact history will be removed.`}
        confirmText="Yes, Delete Record"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={deleteDialog.isLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, customer: null, isLoading: false })}
      />
    </div>
  );
}
