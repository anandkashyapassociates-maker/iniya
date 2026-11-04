import React from 'react';
import { Package, X, Check, Box } from 'lucide-react';

export default function SessionProductsModal({
  isOpen,
  onClose,
  session,
}) {
  if (!isOpen || !session) return null;

  const productsList = session.selected_products && session.selected_products.length > 0
    ? session.selected_products
    : (session.inventory_product ? [session.inventory_product] : []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-2xl">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base font-display leading-tight">
                Allocated Supplies &amp; Products
              </h3>
              <p className="text-xs text-blue-100">
                Session #{session.session_number} &bull; {session.treatment_details || 'Clinical Session'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Summary Box */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs text-slate-600">
            <div>
              <span className="font-medium text-slate-500">Scheduled:</span>{' '}
              <span className="font-semibold text-slate-800">
                {session.session_date ? String(session.session_date).slice(0, 10) : ''} at {session.session_time}
              </span>
            </div>
            <div>
              <span className="font-medium text-slate-500">Doctor / Staff:</span>{' '}
              <span className="font-semibold text-slate-800">
                {session.staff?.name || 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Products List */}
          {productsList.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Box className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No Inventory Products Allocated</p>
              <p className="text-xs text-slate-400 mt-1">This session has no consumables or supplies attached.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                <span>Product Name</span>
                <span>Unit / Details</span>
              </div>
              {productsList.map((prod, idx) => (
                <div
                  key={prod.id || idx}
                  className="p-3.5 bg-slate-50 hover:bg-indigo-50/40 border border-slate-200/90 hover:border-indigo-200 rounded-2xl flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">
                        {prod.product_name}
                      </p>
                      {prod.display_product_type && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Type: {prod.display_product_type}
                        </p>
                      )}
                    </div>
                  </div>

                  {prod.business_unit && (
                    <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold font-mono shrink-0 shadow-2xs">
                      {prod.business_unit}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-slate-500">
            Total {productsList.length} {productsList.length === 1 ? 'item' : 'items'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

