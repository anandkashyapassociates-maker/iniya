import React from 'react';
import {
  Calendar,
  Clock,
  User,
  Package,
  Layers,
  DollarSign,
  X,
  RotateCw,
  History,
  Eye,
  ShieldCheck,
} from 'lucide-react';

export default function SessionQuickDetailsModal({
  isOpen,
  onClose,
  session,
  onReschedule,
  onViewMaster,
}) {
  if (!isOpen || !session) return null;

  const isPending = session.status === 'pending';
  const customer = session.master_appointment?.customer;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'in_progress':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">
                Session #{session.session_number} Details
              </h3>
              <p className="text-xs text-blue-100 font-mono">
                {session.master_appointment?.appointment_number || 'Master Booking'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Status & Timing Banner */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1 font-semibold text-slate-800">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{session.session_date ? String(session.session_date).slice(0, 10) : ''}</span>
              </div>
              <div className="flex items-center space-x-1 font-semibold text-slate-800">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{session.session_time}</span>
              </div>
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getStatusBadge(
                session.status
              )}`}
            >
              {session.status?.replace('_', ' ')}
            </span>
          </div>

          {/* Patient Details */}
          {customer && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Patient / Customer
              </span>
              <div className="font-semibold text-sm text-slate-900">{customer.name}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{customer.mobile}</div>
            </div>
          )}

          {/* Treatment Details */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Treatment / Clinical Procedure
            </span>
            <div className="text-sm font-semibold text-slate-800">{session.treatment_details}</div>
          </div>

          {/* Staff & Commission Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Assigned Practitioner
              </span>
              <div className="font-semibold text-xs text-slate-800">{session.staff?.name || 'Unassigned'}</div>
              <div className="text-[11px] text-slate-500">{session.staff?.department || ''}</div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Staff Commission
              </span>
              <div className="font-bold text-sm text-slate-900">
                ₹{Number(session.staff_commission || 0).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400">Fixed Session Fee</div>
            </div>
          </div>

          {/* Product Used */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Inventory Product
            </span>
            {session.inventory_product ? (
              <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-800">
                <Package className="w-4 h-4 text-slate-400" />
                <span>{session.inventory_product.product_name}</span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">No inventory product used</div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onViewMaster(session.master_appointment_id)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Open Master Booking</span>
          </button>

          <div className="flex items-center space-x-2">
            {isPending && (
              <button
                type="button"
                onClick={() => onReschedule(session)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Reschedule</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

