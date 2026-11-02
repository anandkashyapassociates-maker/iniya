import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Boxes,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
  Package,
  Calendar,
  User,
  FileText,
  Lock,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import superAdminInventoryService from '../services/superAdminInventoryService';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminStockDetailsPage() {
  const { id } = useParams();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDetails = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await superAdminInventoryService.getStockLogs(id);
      if (res.product) {
        setProduct(res.product);
      }
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load stock details.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Aggregate stats from logs
  const totalAdded = logs
    .filter((l) => l.type === 'purchase' || l.type === 'add' || Number(l.quantity) > 0)
    .reduce((acc, curr) => acc + Math.abs(Number(curr.quantity) || 0), 0);

  const totalIssued = logs
    .filter((l) => l.type === 'issue' || Number(l.quantity) < 0)
    .reduce((acc, curr) => acc + Math.abs(Number(curr.quantity) || 0), 0);

  if (isLoading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 font-display">Loading inventory stock details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Product Not Found</h3>
        <p className="text-xs text-slate-500">The requested stock ledger product record does not exist or was removed.</p>
        <Link
          to="/superadmin/inventory/stocks"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Stock Ledger</span>
        </Link>
      </div>
    );
  }

  const isOutOfStock = (product.quantity ?? 0) <= 0;
  const isLowStock = !isOutOfStock && product.quantity <= (product.low_stock_threshold || 10);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Clinical Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
              <Boxes className="w-3.5 h-3.5 text-blue-600" />
              <span>SuperAdmin Stock Ledger Oversight</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <Lock className="w-3 h-3 text-slate-400" />
              Read-Only Oversight
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <Link to="/superadmin/inventory/stocks" className="hover:text-blue-600 transition-colors">
              Stock Ledger
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-700 truncate max-w-xs">{product.product_name}</span>
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <Link
              to="/superadmin/inventory/stocks"
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Back to Stock Ledger"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight">
              {product.product_name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchDetails(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer"
            title="Refresh details"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Product Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Boxes className="w-7 h-7 drop-shadow-sm" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {product.product_code || `PRD-${String(product.id).padStart(4, '0')}`}
              </span>

              {product.category?.name && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  {product.category.name}
                </span>
              )}

              {product.brand?.name && (
                <span className="text-xs font-medium text-slate-500">
                  Brand: <strong className="text-slate-700">{product.brand.name}</strong>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Unit: <strong className="text-slate-700">{product.business_unit || 'Units'}</strong>
              {product.vendor?.vendor_name && (
                <>
                  <span className="mx-2 text-slate-300">•</span>
                  Assigned Vendor: <strong className="text-slate-700">{product.vendor.vendor_name}</strong>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Status & Available Pill */}
        <div className="flex items-center gap-4 self-start md:self-center shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Stock Status</span>
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Low Stock Warning
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                In Stock Healthy
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI 4-Card Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available Stock */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Current Available
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-2xl font-bold font-mono ${
                  isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {product.quantity ?? 0}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {product.business_unit || 'Units'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Ready for clinical dispense</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Low Stock Threshold */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
              Alert Threshold
            </span>
            <span className="text-2xl font-bold text-amber-700 font-mono mt-0.5 block">
              {product.low_stock_threshold || 10}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Reorder alert trigger level</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total Stock Added */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
              Total Added
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono text-emerald-700">
                +{totalAdded || (product.last_added_quantity ?? product.quantity ?? 0)}
              </span>
              <span className="text-xs text-emerald-600 font-medium">
                {product.business_unit || 'Units'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Lifetime procurement inflow</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Stock Issued */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
              Total Issued / Lessed
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono text-rose-700">
                -{totalIssued || (product.last_issued_quantity ?? 0)}
              </span>
              <span className="text-xs text-rose-600 font-medium">
                {product.business_unit || 'Units'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Clinical consumption outflow</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Stock Audit Log History Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Stock Transactions Audit Trail</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed chronological record of every addition and issuance with admin ownership and timestamps.
            </p>
          </div>

          <span className="text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
            {logs.length} Log Record{logs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Historical Stock Logs Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Transactions performed through the Add Inventory or Issue Inventory actions will appear here with full audit details.
            </p>

            <div className="inline-block text-left bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 shadow-2xs mt-2">
              {product.inventory_updated_at && (
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Initial Addition: <strong>{product.last_added_quantity ?? product.quantity} {product.business_unit}</strong> on{' '}
                    {new Date(product.inventory_updated_at).toLocaleDateString()}
                    {product.inventory_updater?.name ? ` by ${product.inventory_updater.name}` : ''}
                  </span>
                </div>
              )}
              {product.last_issued_at && (
                <div className="flex items-center gap-2 text-rose-600">
                  <MinusCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>
                    Last Issuance: <strong>-{product.last_issued_quantity} {product.business_unit}</strong> on{' '}
                    {new Date(product.last_issued_at).toLocaleDateString()}
                    {product.issue_issuer?.name ? ` by ${product.issue_issuer.name}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
            {logs.map((log) => {
              const isIssue = log.type === 'issue' || Number(log.quantity) < 0;
              const qtyVal = Math.abs(Number(log.quantity) || 0);
              const unit = log.business_unit || product.business_unit || 'Units';
              const adminName = log.admin?.name || 'Administrator';
              const adminEmail = log.admin?.email || '';
              const dateStr = log.created_at ? new Date(log.created_at).toLocaleString() : '—';
              const vendorName = log.vendor?.vendor_name || (log.vendor?.company_name ? `${log.vendor.vendor_name} (${log.vendor.company_name})` : null);

              return (
                <div
                  key={log.id}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    isIssue ? 'hover:bg-amber-50/40 bg-white' : 'hover:bg-emerald-50/40 bg-white'
                  }`}
                >
                  {/* Left: Action Icon, Type Badge, and Performed By */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                        isIssue
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isIssue ? <MinusCircle className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            isIssue
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isIssue ? 'Stock Issued / Lessed' : 'Stock Added'}
                        </span>

                        <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{adminName}</span>
                          {adminEmail && (
                            <span className="text-slate-400 font-normal text-[11px]">({adminEmail})</span>
                          )}
                        </span>
                      </div>

                      {/* Date & Vendor / Price */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {dateStr}
                        </span>

                        {vendorName && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-700">
                              Supplier: <strong>{vendorName}</strong>
                            </span>
                          </>
                        )}

                        {log.buy_price && Number(log.buy_price) > 0 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-slate-700">
                              Buy Price: ₹{Number(log.buy_price).toFixed(2)}
                            </span>
                          </>
                        )}

                        {log.mrp && Number(log.mrp) > 0 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-emerald-700 font-semibold">
                              MRP: ₹{Number(log.mrp).toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Notes / Batch Ref */}
                      {log.notes && (
                        <p className="text-xs text-slate-600 mt-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100 inline-block">
                          <strong className="text-slate-700">Note:</strong> {log.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Quantity Badge */}
                  <div className="text-right shrink-0 md:self-center">
                    <span
                      className={`text-base sm:text-lg font-bold font-mono px-3.5 py-1.5 rounded-2xl inline-block ${
                        isIssue
                          ? 'text-amber-800 bg-amber-50 border border-amber-200'
                          : 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                      }`}
                    >
                      {isIssue ? `-${qtyVal}` : `+${qtyVal}`} {unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
