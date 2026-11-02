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
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import adminInventoryService from '../../../services/adminInventoryService';
import { useToast } from '../../../context/ToastContext';

export default function AdminStockDetailsPage() {
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
      const res = await adminInventoryService.getStockLogs(id);
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
          to="/admin/inventory/stocks"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Stock Ledger</span>
        </Link>
      </div>
    );
  }

  const currentStock = product.quantity ?? 0;
  const unit = product.business_unit || 'Units';
  const isOutOfStock = currentStock <= 0;
  const isLowStock = !isOutOfStock && currentStock <= (product.low_stock_threshold || 10);

  // Compute running balance chronologically (oldest to newest)
  const sortedChronological = [...logs].sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    return (a.id || 0) - (b.id || 0);
  });

  const netLogChange = sortedChronological.reduce((acc, curr) => {
    const isIssue = curr.type === 'issue' || Number(curr.quantity) < 0;
    const qty = Math.abs(Number(curr.quantity) || 0);
    return isIssue ? acc - qty : acc + qty;
  }, 0);

  const initialOpeningBalance = Math.max(0, currentStock - netLogChange);

  let running = initialOpeningBalance;
  const enrichedLogs = sortedChronological.map((l) => {
    const isIssue = l.type === 'issue' || Number(l.quantity) < 0;
    const qty = Math.abs(Number(l.quantity) || 0);
    if (isIssue) {
      running -= qty;
    } else {
      running += qty;
    }
    return {
      ...l,
      isIssue,
      credit: isIssue ? 0 : qty,
      debit: isIssue ? qty : 0,
      balance: Math.max(0, running),
    };
  });

  // Display logs in descending order (newest on top)
  const displayLogs = [...enrichedLogs].reverse();

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/admin/inventory/stocks" className="hover:text-blue-600 transition-colors">
              Stock Ledger
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-700 truncate max-w-xs">{product.product_name}</span>
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <Link
              to="/admin/inventory/stocks"
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
              Unit: <strong className="text-slate-700">{unit}</strong>
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
                {currentStock}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {unit}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Closing inventory balance</span>
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

        {/* Card 3: Total Stock Added (Credit) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
              Total Credit (+ In)
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono text-emerald-700">
                +{totalAdded || (product.last_added_quantity ?? currentStock)}
              </span>
              <span className="text-xs text-emerald-600 font-medium">
                {unit}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Cumulative stock additions</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Stock Issued (Debit) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
              Total Debit (- Out)
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono text-rose-700">
                -{totalIssued || (product.last_issued_quantity ?? 0)}
              </span>
              <span className="text-xs text-rose-600 font-medium">
                {unit}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Cumulative stock deductions</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Stock Audit Ledger Table: Credit, Debit & Balance Format */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Stock Statement (Credit, Debit &amp; Balance Ledger)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological passbook of all stock additions (Credits), issuances (Debits), and running inventory balance.
            </p>
          </div>

          <span className="text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
            {displayLogs.length} Transaction{displayLogs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* CURRENT NET STOCK SUMMARY (Positioned at the blue line) */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
              Current Net Stock Summary
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Total Credit (+ In) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Credit (+ In):</span>
              <span className="font-mono font-bold text-emerald-800 text-sm">
                +{totalAdded || (product.last_added_quantity ?? currentStock)} {unit}
              </span>
            </div>

            {/* Total Debit (- Out) */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Debit (- Out):</span>
              <span className="font-mono font-bold text-rose-800 text-sm">
                -{totalIssued || (product.last_issued_quantity ?? 0)} {unit}
              </span>
            </div>

            {/* Current Balance */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-100/70 border border-blue-300 text-xs">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Balance:</span>
              <span className="font-mono font-bold text-blue-900 text-sm">
                {currentStock} {unit}
              </span>
            </div>
          </div>
        </div>

        {displayLogs.length === 0 && initialOpeningBalance === 0 ? (
          <div className="py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Transaction Records Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Transactions performed through the Add Inventory or Less Inventory actions will appear here with Credit, Debit, and Running Balance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                  <th className="py-3 px-4 w-[16%]">Date &amp; Time</th>
                  <th className="py-3 px-4 w-[34%]">Transaction / Performed By</th>
                  <th className="py-3 px-4 w-[12%]">Rate (₹)</th>
                  <th className="py-3 px-4 w-[12%] text-right text-emerald-800 bg-emerald-50/70 border-l border-emerald-100">
                    Credit (+ In)
                  </th>
                  <th className="py-3 px-4 w-[12%] text-right text-rose-800 bg-rose-50/70 border-l border-rose-100">
                    Debit (- Out)
                  </th>
                  <th className="py-3 px-4 w-[14%] text-right text-blue-900 bg-blue-50/70 border-l border-blue-100">
                    Balance
                  </th>
                </tr>
                {/* Top Summary Row inside table header */}
                <tr className="border-b-2 border-slate-200 bg-slate-100/90 font-bold text-xs">
                  <td colSpan={3} className="py-3 px-4 text-slate-700 uppercase tracking-wider text-[11px]">
                    Current Net Stock Summary
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700 text-sm bg-emerald-100/50 border-l border-emerald-200">
                    +{totalAdded || (product.last_added_quantity ?? currentStock)} {unit}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-700 text-sm bg-rose-100/50 border-l border-rose-200">
                    -{totalIssued || (product.last_issued_quantity ?? 0)} {unit}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-blue-700 text-sm bg-blue-100/50 border-l border-blue-200">
                    {currentStock} {unit}
                  </td>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-normal">
                {displayLogs.map((log) => {
                  const isIssue = log.isIssue;
                  const adminName = log.admin?.name || 'Administrator';
                  const adminEmail = log.admin?.email || '';
                  const dateStr = log.created_at ? new Date(log.created_at).toLocaleDateString() : '—';
                  const timeStr = log.created_at
                    ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '';
                  const vendorName = log.vendor?.vendor_name || (log.vendor?.company_name ? `${log.vendor.vendor_name} (${log.vendor.company_name})` : null);

                  return (
                    <tr
                      key={log.id}
                      className={`transition-colors hover:bg-slate-50/90 ${
                        isIssue ? 'bg-amber-50/15' : 'bg-emerald-50/15'
                      }`}
                    >
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono text-slate-800 font-semibold">{dateStr}</div>
                        {timeStr && <div className="text-[11px] font-mono text-slate-400 mt-0.5">{timeStr}</div>}
                      </td>

                      {/* Transaction Description & Performed By */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                isIssue
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isIssue ? (
                                <>
                                  <MinusCircle className="w-3 h-3 text-amber-600" />
                                  <span>Stock Issued / Lessed</span>
                                </>
                              ) : (
                                <>
                                  <PlusCircle className="w-3 h-3 text-emerald-600" />
                                  <span>Stock Added</span>
                                </>
                              )}
                            </span>

                            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{adminName}</span>
                              {adminEmail && (
                                <span className="text-slate-400 font-normal text-[10px]">({adminEmail})</span>
                              )}
                            </span>
                          </div>

                          {/* Supplier / Notes */}
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                            {vendorName && (
                              <span>
                                Supplier: <strong className="text-slate-700">{vendorName}</strong>
                              </span>
                            )}
                            {log.notes && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                Note: {log.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Rate */}
                      <td className="py-3.5 px-4 align-top">
                        {log.buy_price && Number(log.buy_price) > 0 ? (
                          <div className="font-mono text-slate-800 font-semibold">
                            ₹{Number(log.buy_price).toFixed(2)}
                            {log.mrp && Number(log.mrp) > 0 && (
                              <div className="text-[10px] text-slate-400 font-normal">
                                MRP: ₹{Number(log.mrp).toFixed(2)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Credit (+ In) */}
                      <td className="py-3.5 px-4 text-right align-top bg-emerald-50/25 border-l border-emerald-100 font-mono">
                        {log.credit > 0 ? (
                          <span className="text-emerald-700 font-bold text-sm">
                            +{log.credit} <span className="text-xs font-normal text-emerald-600">{unit}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Debit (- Out) */}
                      <td className="py-3.5 px-4 text-right align-top bg-rose-50/25 border-l border-rose-100 font-mono">
                        {log.debit > 0 ? (
                          <span className="text-rose-700 font-bold text-sm">
                            -{log.debit} <span className="text-xs font-normal text-rose-600">{unit}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Running Balance */}
                      <td className="py-3.5 px-4 text-right align-top bg-blue-50/25 border-l border-blue-100 font-mono">
                        <span className="text-slate-900 font-bold text-sm">
                          {log.balance} <span className="text-xs font-normal text-slate-500">{unit}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {/* Initial Opening Stock row if present */}
                {initialOpeningBalance > 0 && (
                  <tr className="bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {product.inventory_updated_at
                        ? new Date(product.inventory_updated_at).toLocaleDateString()
                        : 'Initial Record'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Opening / Baseline Stock
                      </span>
                      {product.inventory_updater?.name && (
                        <span className="text-[11px] text-slate-400 ml-2">
                          recorded by {product.inventory_updater.name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {product.buy_price ? `₹${Number(product.buy_price).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold bg-emerald-50/25 border-l border-emerald-100">
                      +{initialOpeningBalance} <span className="text-xs font-normal">{unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300 bg-rose-50/25 border-l border-rose-100">
                      —
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900 font-bold bg-blue-50/25 border-l border-blue-100">
                      {initialOpeningBalance} <span className="text-xs font-normal">{unit}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
