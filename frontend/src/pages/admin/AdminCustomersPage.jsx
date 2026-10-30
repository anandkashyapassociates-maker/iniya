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
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import adminService from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

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
      toast.error('Failed to load customers.');
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
      toast.success(`Customer '${customer.name}' deleted successfully.`);
      setDeleteDialog({ isOpen: false, customer: null, isLoading: false });
      fetchCustomers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer.');
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const columns = [
    {
      header: 'Customer',
      accessor: 'name',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs uppercase">
            {c.name ? c.name.charAt(0) : 'C'}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">{c.name}</div>
            <div className="text-[11px] text-slate-400">ID: #{c.id}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Mobile & Email',
      accessor: 'mobile',
      render: (c) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{c.mobile}</span>
          </div>
          {c.email ? (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{c.email}</span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 italic">No email provided</span>
          )}
        </div>
      ),
    },
    {
      header: 'Gender & Age',
      accessor: 'gender',
      render: (c) => (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
              c.gender === 'female'
                ? 'bg-pink-100 text-pink-700'
                : c.gender === 'male'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-purple-100 text-purple-700'
            }`}
          >
            {c.gender}
          </span>
          <span className="text-xs text-slate-600 font-medium">
            {c.age ? `${c.age} yrs` : '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Address',
      accessor: 'address',
      render: (c) => (
        <div className="max-w-xs text-xs text-slate-600 flex items-start gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{c.address || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (c) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
            c.is_active
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          {c.is_active ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Active
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 text-slate-400" />
              Inactive
            </>
          )}
        </span>
      ),
    },
    {
      header: 'Registered',
      accessor: 'created_at',
      render: (c) => (
        <span className="text-[11px] text-slate-500 font-medium">
          {new Date(c.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (c) => (
        <div className="flex items-center gap-1.5">
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
            title="Delete Customer"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Customer Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              Admin Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, view, manage and search all customer records in the database.
          </p>
        </div>

        <Link
          to="/admin/customers/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </Link>
      </div>

      {/* Metrics summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Customers
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Accounts
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{stats.active}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Inactive Accounts
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{stats.inactive}</div>
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
        emptyTitle="No customers found"
        emptyDescription={
          search || genderFilter !== 'all' || statusFilter !== 'all'
            ? 'No customers match your selected filters. Try changing or clearing search terms.'
            : 'No customers have been registered yet. Click "Add New Customer" above to create one.'
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
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Genders</option>
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
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        }
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Customer Account"
        message={`Are you sure you want to permanently delete customer "${deleteDialog.customer?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete Customer"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={deleteDialog.isLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, customer: null, isLoading: false })}
      />
    </div>
  );
}

