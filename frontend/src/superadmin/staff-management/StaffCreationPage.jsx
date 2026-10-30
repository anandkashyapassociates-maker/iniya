import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ChevronRight, UserCheck, ArrowLeft, Shield } from 'lucide-react';
import StaffForm from './StaffForm';
import staffManagementService from '../services/staffManagementService';
import { useToast } from '../../context/ToastContext';

export default function StaffCreationPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStaffSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const response = await staffManagementService.createStaff(formData);
      const staffCode = response.staff?.staff_code || '';
      toast.success(
        `Staff member '${formData.name}' (${staffCode}) provisioned successfully!`
      );
      // Navigate to details after brief pause or stay
      navigate('/superadmin/staff-management/details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/superadmin/dashboard" className="hover:text-slate-900 transition-colors">
          Superadmin
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-600">Staff Management</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-blue-600 font-semibold">Staff Creation</span>
      </nav>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              Staff Creation
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Provision staff profiles into the dedicated <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">staff</code> table. Codes are automatically generated upon creation.
          </p>
        </div>

        <Link
          to="/superadmin/staff-management/details"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Back to Staff Directory</span>
        </Link>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <StaffForm onSubmit={handleStaffSubmit} isLoading={isSubmitting} />
      </div>
    </div>
  );
}

