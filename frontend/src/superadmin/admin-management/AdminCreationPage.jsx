import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Shield, ChevronRight } from 'lucide-react';
import AdminForm from './AdminForm';
import adminManagementService from '../services/adminManagementService';
import { useToast } from '../../context/ToastContext';

export default function AdminCreationPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAdmin = async (data) => {
    setIsLoading(true);
    try {
      const response = await adminManagementService.createAdmin(data);
      toast.success(`Admin account '${data.name}' provisioned successfully.`);
      navigate('/superadmin/admin-management/details');
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/superadmin/dashboard" className="hover:text-slate-900 transition-colors">
          Superadmin
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-600">Admin Management</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-blue-600 font-semibold">Admin Creation</span>
      </nav>

      {/* Page Title & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              Create Admin Account
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Provision a new operational administrator account in the dedicated <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">admins</code> table.
          </p>
        </div>

        <Link
          to="/superadmin/admin-management/details"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>View Admin Details</span>
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <AdminForm
          onSubmit={handleCreateAdmin}
          isLoading={isLoading}
          cancelPath="/superadmin/admin-management/details"
        />
      </div>

      {/* Multi-Panel Isolation Notice */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 flex items-start gap-3 text-xs text-blue-900">
        <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold block">Account Privilege Notice:</span>
          Admins created here are assigned to Panel 2 (Operational Tier). They do not possess Superadmin rights and are strictly restricted from accessing executive Superadmin endpoints.
        </div>
      </div>
    </div>
  );
}

