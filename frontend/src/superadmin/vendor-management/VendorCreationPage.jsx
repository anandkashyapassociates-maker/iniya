import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, ChevronRight, ArrowLeft } from 'lucide-react';
import VendorForm from './VendorForm';
import vendorManagementService from '../services/vendorManagementService';
import { useToast } from '../../context/ToastContext';

export default function VendorCreationPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVendorSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const response = await vendorManagementService.createVendor(formData);
      const vendorCode = response.vendor?.vendor_code || '';
      toast.success(
        `Vendor '${formData.vendor_name}' (${vendorCode}) created successfully!`
      );
      navigate('/superadmin/vendors');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/superadmin/dashboard" className="hover:text-slate-900 transition-colors">
          Superadmin
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-600">Vendor Management</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-blue-600 font-semibold">Vendor Creation</span>
      </nav>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight">
              Create Vendor Profile
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Provision verified vendors into the dedicated <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">vendors</code> table. Sequential vendor codes (<code className="font-mono text-blue-600 text-[11px]">VEN-XXXX</code>) are generated automatically.
          </p>
        </div>

        <Link
          to="/superadmin/vendors"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Back to Vendor Directory</span>
        </Link>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <VendorForm onSubmit={handleVendorSubmit} isLoading={isSubmitting} cancelPath="/superadmin/vendors" />
      </div>
    </div>
  );
}

