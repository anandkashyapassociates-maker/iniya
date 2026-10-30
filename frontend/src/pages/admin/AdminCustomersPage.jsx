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
  Clock,
  X,
  FileText,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

function CustomerAvatar({ customer, size = 'sm' }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [customer?.image_url, customer?.id]);

  const sizeClass = size === 'lg' ? 'w-14 h-14 rounded-2xl text-xl' : 'w-10 h-10 rounded-xl text-sm';

  const genderBg =
    customer?.gender === 'female'
      ? 'bg-gradient-to-tr from-pink-500 to-rose-600'
      : customer?.gender === 'other'
      ? 'bg-gradient-to-tr from-purple-500 to-indigo-600'
      : 'bg-gradient-to-tr from-blue-600 to-cyan-600';

  if (customer?.image_url && !imgError) {
    return (
      <img
        src={customer.image_url}
        alt={customer.name}
        className={`${sizeClass} object-cover border border-slate-200/90 shadow-2xs shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center font-bold text-white shadow-xs uppercase shrink-0 ${genderBg}`}
    >
      {customer?.name ? customer.name.charAt(0) : 'P'}
    </div>
  );
}

export default function AdminCustomersPage() {
  const toast = useToast();

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
      toast.success(`Customer profile '${customer.name}' removed successfully.`);
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
      header: 'CUSTOMER / PATIENT',
      accessor: 'name',
      render: (c) => (
        <div className="flex items-center gap-3">
          <CustomerAvatar customer={c} size="sm" />
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm hover:text-blue-600 transition-colors">
              {c.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded">
                {formatRecordId(c.id)}
              </span>
              <span className="text-[10px] text-slate-400">ID #{c.id}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'MOBILE & EMAIL',
      accessor: 'mobile',
      render: (c) => (
        <div className="space-y-1">
          <a
            href={`tel:${c.mobile}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-blue-600 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{c.mobile}</span>
          </a>
          {c.email ? (
            <a
              href={`mailto:${c.email}`}
              className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-800 transition-colors"
            >
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-[170px]">{c.email}</span>
            </a>
          ) : (
            <div className="text-[10px] text-slate-400 italic">No email provided</div>
          )}
        </div>
      ),
    },
    {
      header: 'GENDER & AGE',
      accessor: 'gender',
      render: (c) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold capitalize border ${
              c.gender === 'female'
                ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                : c.gender === 'male'
                ? 'bg-sky-50 text-sky-700 border-sky-200/80'
                : 'bg-purple-50 text-purple-700 border-purple-200/80'
            }`}
          >
            {c.gender}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {c.age ? `${c.age} Yrs` : 'N/A'}
          </span>
        </div>
      ),
    },
    {
      header: 'ADDRESS',
      accessor: 'address',
      render: (c) => (
        <div className="max-w-xs text-xs text-slate-600 flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <span className="line-clamp-2 leading-relaxed" title={c.address}>
            {c.address || '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'STATUS',
      accessor: 'is_active',
      render: (c) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            c.is_active
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              c.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          {c.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'REGISTERED ON',
      accessor: 'created_at',
      render: (c) => {
        const dateObj = new Date(c.created_at);
        return (
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-slate-800">
              {dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <div className="text-[10px] text-slate-400">
              {dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        );
      },
    },
    {
      header: 'ACTIONS',
      accessor: 'actions',
      render: (c) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedCustomer(c)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            title="View Full Record"
          >
            <Eye className="w-4 h-4" />
          </button>
          <Link
            to={`/admin/customers/${c.id}/edit`}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Customer"
          >
            <Edit className="w-4 h-4" />
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
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-2">
            <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
            <span>Clinical &amp; Administrative Records</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Customer &amp; Patient Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Official records management with chronological timeline (sorted latest entries first).
          </p>
        </div>

        <Link
          to="/admin/customers/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </Link>
      </div>

      {/* Metrics summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 shadow-xs relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Registered
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{stats.total}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">All active database records</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 shadow-xs relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Accounts
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{stats.active}</div>
            <div className="text-[10px] text-emerald-700 font-medium">Cleared for consultations</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 shadow-xs relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Inactive Records
            </div>
            <div className="text-2xl font-black text-slate-700 mt-0.5">{stats.inactive}</div>
            <div className="text-[10px] text-slate-500 font-medium">Archived or pending review</div>
          </div>
        </div>
      </div>

      {/* Filters & Data Table */}
      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search customer by name, mobile, email..."
        emptyTitle="No records found"
        emptyDescription={
          search || genderFilter !== 'all' || statusFilter !== 'all'
            ? 'No entries match your search criteria. Try adjusting the filters.'
            : 'No customers have been registered yet. Click "Add New Customer" above to create the first record.'
        }
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
        extraHeaderActions={
          <div className="flex items-center gap-2">
            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Demographics</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        }
      />

      {/* Quick View Customer Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 transform transition-all relative">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <CustomerAvatar customer={selectedCustomer} size="lg" />
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedCustomer.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                    {formatRecordId(selectedCustomer.id)}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedCustomer.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {selectedCustomer.is_active ? 'Active Record' : 'Inactive Record'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Mobile Phone
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {selectedCustomer.mobile}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Email Address
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                    {selectedCustomer.email || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Gender
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block capitalize">
                    {selectedCustomer.gender}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Age
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {selectedCustomer.age ? `${selectedCustomer.age} Years` : 'Not Specified'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Residential Address
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {selectedCustomer.address || 'No address details recorded.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span>Created: {new Date(selectedCustomer.created_at).toLocaleString()}</span>
                {selectedCustomer.admin && (
                  <span>Registered by Admin: {selectedCustomer.admin.name}</span>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <Link
                to={`/admin/customers/${selectedCustomer.id}/edit`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Remove Customer Record"
        message={`Are you sure you want to permanently delete the profile of "${deleteDialog.customer?.name}"? All associated clinical and contact records will be removed.`}
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
