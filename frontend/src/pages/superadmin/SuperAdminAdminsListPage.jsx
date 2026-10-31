import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  UserCheck,
  UserX,
  KeyRound,
  Edit,
  Shield,
  Search,
  Filter,
  CheckCircle,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import superAdminService from '../../services/superAdminService';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminAdminsListPage() {
  const toast = useToast();

  const [admins, setAdmins] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Status toggle modal state
  const [statusDialog, setStatusDialog] = useState({
    isOpen: false,
    admin: null,
    nextStatus: true,
    isLoading: false,
  });

  // Password reset modal state
  const [resetDialog, setResetDialog] = useState({
    isOpen: false,
    admin: null,
    isLoading: false,
    resultPassword: null,
  });

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await superAdminService.getAdmins({
        search,
        status: statusFilter,
        page,
      });
      setAdmins(res.data || []);
      setPagination({
        current_page: res.current_page,
        last_page: res.last_page,
        total: res.total,
        from: res.from,
        to: res.to,
      });
    } catch (err) {
      toast.error('Failed to load administrator accounts.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page, toast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleStatusChange = async () => {
    const { admin, nextStatus } = statusDialog;
    if (!admin) return;

    setStatusDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      await superAdminService.updateAdminStatus(admin.id, nextStatus);
      toast.success(
        `Admin '${admin.name}' has been ${nextStatus ? 'activated' : 'deactivated'} successfully.`
      );
      setStatusDialog({ isOpen: false, admin: null, nextStatus: true, isLoading: false });
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update admin status.');
      setStatusDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handlePasswordReset = async () => {
    const { admin } = resetDialog;
    if (!admin) return;

    setResetDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await superAdminService.resetAdminPassword(admin.id, {
        generate_random: true,
      });
      setResetDialog((prev) => ({
        ...prev,
        isLoading: false,
        resultPassword: res.temporary_password,
      }));
      toast.success(`Temporary password generated for ${admin.name}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
      setResetDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const columns = [
    {
      header: 'Sr. No.',
      className: 'w-[75px] text-center',
      render: (row, index) => {
        const srNo = (pagination?.from || 1) + index;
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-medium">
            {srNo}
          </span>
        );
      },
    },
    {
      header: 'Admin Name & Email',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
            {row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-900">{row.name}</div>
            <div className="text-[11px] text-slate-500 font-mono">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
            row.is_active
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {row.is_active ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      header: 'Creator',
      render: (row) => (
        <span className="text-slate-600 font-medium text-[11px]">
          {row.super_admin?.name || 'Super Admin'}
        </span>
      ),
    },
    {
      header: 'Created Date',
      render: (row) => (
        <span className="text-slate-500 text-[11px]">
          {new Date(row.created_at).toLocaleDateString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/superadmin/admins/${row.id}/edit`}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit Admin"
          >
            <Edit className="w-4 h-4" />
          </Link>

          <button
            onClick={() =>
              setStatusDialog({
                isOpen: true,
                admin: row,
                nextStatus: !row.is_active,
                isLoading: false,
              })
            }
            className={`p-1.5 rounded-lg transition-colors ${
              row.is_active
                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            title={row.is_active ? 'Deactivate Account' : 'Activate Account'}
          >
            {row.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>

          <button
            onClick={() =>
              setResetDialog({
                isOpen: true,
                admin: row,
                isLoading: false,
                resultPassword: null,
              })
            }
            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Reset Password"
          >
            <KeyRound className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Administrator Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage provisioned admin users, enforce access status, and execute password recoveries.
          </p>
        </div>

        <Link
          to="/superadmin/admins/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-900/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New Admin</span>
        </Link>
      </div>

      {/* Table & Filters */}
      <DataTable
        columns={columns}
        data={admins}
        isLoading={isLoading}
        emptyTitle="No Admins Found"
        emptyDescription="No administrator accounts matched your search criteria."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Filter by name or email..."
        pagination={pagination}
        onPageChange={(newPage) => setPage(newPage)}
        extraHeaderActions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">All Admins</option>
              <option value="true">Active Only</option>
              <option value="false">Deactivated Only</option>
            </select>
          </div>
        }
      />

      {/* Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={statusDialog.isOpen}
        title={statusDialog.nextStatus ? 'Activate Admin Account?' : 'Deactivate Admin Account?'}
        message={
          statusDialog.nextStatus
            ? `Are you sure you want to activate '${statusDialog.admin?.name}'? They will regain immediate access to the Admin Portal.`
            : `Are you sure you want to deactivate '${statusDialog.admin?.name}'? Their current sessions will be instantly terminated, and they will be blocked from logging in.`
        }
        confirmText={statusDialog.nextStatus ? 'Activate Account' : 'Deactivate Account'}
        isDangerous={!statusDialog.nextStatus}
        isLoading={statusDialog.isLoading}
        onConfirm={handleStatusChange}
        onCancel={() =>
          setStatusDialog({ isOpen: false, admin: null, nextStatus: true, isLoading: false })
        }
      />

      {/* Password Reset Modal */}
      {resetDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reset Password for {resetDialog.admin?.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{resetDialog.admin?.email}</p>
              </div>
            </div>

            {!resetDialog.resultPassword ? (
              <>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  This will immediately invalidate all active sessions for this administrator and generate a secure temporary password.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() =>
                      setResetDialog({
                        isOpen: false,
                        admin: null,
                        isLoading: false,
                        resultPassword: null,
                      })
                    }
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordReset}
                    disabled={resetDialog.isLoading}
                    className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-2"
                  >
                    {resetDialog.isLoading && (
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    Generate Temporary Password
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <span className="text-xs font-bold block mb-1">Temporary Password Created:</span>
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-300 font-mono text-sm font-bold text-slate-900 tracking-wider select-all text-center">
                    {resetDialog.resultPassword}
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-2">
                    Copy and provide this password securely to the administrator. They should change it upon login.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      setResetDialog({
                        isOpen: false,
                        admin: null,
                        isLoading: false,
                        resultPassword: null,
                      })
                    }
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

