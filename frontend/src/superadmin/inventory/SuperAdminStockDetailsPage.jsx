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
  Tag,
  Building2,
  CheckCircle2,
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
      <div className="w-full py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 shadow-xl shadow-indigo-500/25 flex items-center justify-center text-white animate-pulse">
          <Boxes className="w-7 h-7 drop-shadow" />
        </div>
        <p className="text-base font-bold text-slate-800 font-display mt-2">Loading Stock Statement...</p>
        <p className="text-xs text-slate-400">Retrieving ledger audit logs and inventory passbook</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 font-display">Product Not Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested stock ledger product record does not exist or was removed.
        </p>
        <Link
          to="/superadmin/inventory/stocks"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
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
    <div className="w-full space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <Link
            to="/superadmin/inventory/stocks"
            className="p-2.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 shadow-xs hover:shadow transition-all cursor-pointer shrink-0"
            title="Back to Stock Ledger"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/superadmin/inventory/stocks"
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
              >
                Stock Ledger
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-blue-600 font-mono">
                {product.product_code || `PRD-${String(product.id).padStart(4, '0')}`}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                <Lock className="w-3 h-3 text-slate-400" />
                Read-Only Passbook
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight mt-0.5">
              {product.product_name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={() => fetchDetails(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 transition-all shadow-xs hover:shadow cursor-pointer"
            title="Refresh details"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Statement</span>
          </button>
        </div>
      </div>

      {/* Product Hero Overview Card with 3D Icon */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-start gap-4">
          {/* 3D Icon Container */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 shadow-xl shadow-indigo-500/25 ring-4 ring-indigo-50 flex items-center justify-center text-white shrink-0 transform -rotate-1 hover:rotate-0 transition-transform">
            <Boxes className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-md" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold font-mono px-3 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                {product.product_code || `PRD-${String(product.id).padStart(4, '0')}`}
              </span>

              {product.category?.name && (
                <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60">
                  {product.category.name}
                </span>
              )}

              {product.brand?.name && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/70">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{product.brand.name}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span>Unit: <strong className="text-slate-800">{unit}</strong></span>
              {product.vendor?.vendor_name && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>Vendor: <strong className="text-slate-800">{product.vendor.vendor_name}</strong></span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stock Status Pill */}
        <div className="flex items-center gap-4 self-start md:self-center shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <div className="text-left md:text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
              Inventory Health
            </span>
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Low Stock Alert
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Healthy In Stock
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI 4-Card Summary Grid with 3D Icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Available Stock */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Current Available
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span
                className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                  isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-900'
                }`}
              >
                {currentStock}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {unit}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Live closing balance</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 flex items-center justify-center text-white shrink-0">
            <Boxes className="w-6 h-6 drop-shadow" />
          </div>
        </div>

        {/* Card 2: Low Stock Threshold */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">
              Alert Threshold
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono tracking-tight">
                {product.low_stock_threshold || 10}
              </span>
              <span className="text-xs font-semibold text-amber-600">
                {unit}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Reorder trigger quantity</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25 flex items-center justify-center text-white shrink-0">
            <AlertTriangle className="w-6 h-6 drop-shadow" />
          </div>
        </div>

        {/* Card 3: Total Stock Added (Credit) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
              Total Credit (+ In)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 tracking-tight">
                +{totalAdded || (product.last_added_quantity ?? currentStock)}
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                {unit}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Cumulative stock received</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center text-white shrink-0">
            <TrendingUp className="w-6 h-6 drop-shadow" />
          </div>
        </div>

        {/* Card 4: Total Stock Issued (Debit) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider block">
              Total Debit (- Out)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-700 tracking-tight">
                -{totalIssued || (product.last_issued_quantity ?? 0)}
              </span>
              <span className="text-xs font-semibold text-rose-600">
                {unit}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Cumulative stock issued</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25 flex items-center justify-center text-white shrink-0">
            <TrendingDown className="w-6 h-6 drop-shadow" />
          </div>
        </div>
      </div>

      {/* Main Stock Audit Ledger Table: Clean & Unified Passbook Format */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-5">
        {/* Table Title and Entry Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md shadow-indigo-500/20 text-white flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 drop-shadow" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-slate-900">
                Stock Passbook Statement
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit passbook of all stock additions (Credits), issuances (Debits), and real-time running balance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-50 text-slate-700 text-xs font-mono font-semibold border border-slate-200/80 shadow-2xs">
              {displayLogs.length} {displayLogs.length === 1 ? 'Transaction' : 'Transactions'}
            </span>
          </div>
        </div>

        {displayLogs.length === 0 && initialOpeningBalance === 0 ? (
          <div className="py-14 px-4 rounded-3xl bg-slate-50/60 border border-dashed border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Transaction Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Transactions performed through the Add Inventory or Less Inventory actions will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
            <table className="w-full text-left border-collapse min-w-[920px]">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-3 w-12 text-center font-bold text-slate-400 whitespace-nowrap">SR.</th>
                  <th className="py-3.5 px-4 w-[14%] whitespace-nowrap">Date &amp; Time</th>
                  <th className="py-3.5 px-4 w-[32%] min-w-[300px]">Transaction &amp; Performer</th>
                  <th className="py-3.5 px-4 w-[12%] whitespace-nowrap">Rate (₹)</th>
                  <th className="py-3.5 px-4 w-[14%] text-right font-bold text-emerald-700 whitespace-nowrap">
                    Credit (+ In)
                  </th>
                  <th className="py-3.5 px-4 w-[14%] text-right font-bold text-rose-600 whitespace-nowrap">
                    Debit (- Out)
                  </th>
                  <th className="py-3.5 px-5 w-[14%] text-right font-bold text-slate-900 whitespace-nowrap">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayLogs.map((log, index) => {
                  const isIssue = log.isIssue;
                  const adminName = log.admin?.name || 'Administrator';
                  const adminEmail = log.admin?.email || '';
                  const dateStr = log.created_at ? new Date(log.created_at).toLocaleDateString() : '—';
                  const timeStr = log.created_at
                    ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : '';
                  const vendorName = !isIssue
                    ? (log.vendor?.vendor_name || (log.vendor?.company_name ? `${log.vendor.vendor_name} (${log.vendor.company_name})` : null))
                    : null;
                  const srNo = index + 1;

                  return (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      {/* SR. NO. */}
                      <td className="py-4 px-3 text-center align-top">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-bold tabular-nums">
                          {srNo < 10 ? `0${srNo}` : srNo}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-mono text-slate-800 font-bold">{dateStr}</div>
                        {timeStr && <div className="text-[11px] font-mono text-slate-400 mt-0.5">{timeStr}</div>}
                      </td>

                      {/* Transaction Description & Performed By (Clean, Structured & Beautiful) */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-start gap-3">
                          {/* 3D-styled indicator icon */}
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
                              isIssue
                                ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/20'
                                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20'
                            }`}
                          >
                            {isIssue ? (
                              <MinusCircle className="w-4 h-4 drop-shadow" />
                            ) : (
                              <PlusCircle className="w-4 h-4 drop-shadow" />
                            )}
                          </div>

                          <div className="space-y-1.5 min-w-0">
                            {/* Row 1: Badge + Supplier (Single horizontal line) */}
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg whitespace-nowrap ${
                                  isIssue
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                }`}
                              >
                                {isIssue ? 'Stock Deducted' : 'Stock Added'}
                              </span>

                              {!isIssue && vendorName && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/70 whitespace-nowrap">
                                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>Supplier: <strong className="text-slate-900 font-semibold">{vendorName}</strong></span>
                                </span>
                              )}
                            </div>

                            {/* Row 2: Performed By Admin (Strictly single line, never wraps) */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-800 whitespace-nowrap">{adminName}</span>
                              {adminEmail && (
                                <span className="text-slate-400 font-normal text-[11px] whitespace-nowrap">({adminEmail})</span>
                              )}
                            </div>

                            {/* Row 3: Optional Notes */}
                            {log.notes && (
                              <p className="text-[11px] text-slate-500 italic bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1 mt-1 max-w-sm">
                                "{log.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Rate */}
                      <td className="py-4 px-4 align-top">
                        {log.buy_price && Number(log.buy_price) > 0 ? (
                          <div className="font-mono text-slate-800 font-bold">
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

                      {/* Credit (+ In) - Seamless & High Contrast */}
                      <td className="py-4 px-4 text-right align-top font-mono whitespace-nowrap">
                        {log.credit > 0 ? (
                          <span className="inline-flex items-center justify-end font-mono font-bold text-emerald-700 text-sm whitespace-nowrap">
                            +{log.credit}{' '}
                            <span className="text-xs font-semibold text-emerald-600 ml-1">{unit}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Debit (- Out) - Seamless & High Contrast */}
                      <td className="py-4 px-4 text-right align-top font-mono whitespace-nowrap">
                        {log.debit > 0 ? (
                          <span className="inline-flex items-center justify-end font-mono font-bold text-rose-600 text-sm whitespace-nowrap">
                            -{log.debit}{' '}
                            <span className="text-xs font-semibold text-rose-500 ml-1">{unit}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Running Balance */}
                      <td className="py-4 px-5 text-right align-top font-mono whitespace-nowrap">
                        <div className="font-mono font-extrabold text-slate-900 text-sm whitespace-nowrap">
                          {log.balance}{' '}
                          <span className="text-xs font-semibold text-slate-500 ml-0.5">{unit}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Initial Opening Stock row if present */}
                {initialOpeningBalance > 0 && (
                  <tr className="bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-bold tabular-nums">
                        {displayLogs.length + 1 < 10 ? `0${displayLogs.length + 1}` : displayLogs.length + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {product.inventory_updated_at
                        ? new Date(product.inventory_updated_at).toLocaleDateString()
                        : 'Initial Record'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          Opening / Baseline Stock
                        </span>
                        {product.inventory_updater?.name && (
                          <span className="text-[11px] text-slate-400">
                            recorded by {product.inventory_updater.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {product.buy_price ? `₹${Number(product.buy_price).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-bold">
                      +{initialOpeningBalance} <span className="text-xs font-normal text-emerald-600 ml-1">{unit}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300 text-xs">
                      —
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-900 font-extrabold text-sm">
                      {initialOpeningBalance} <span className="text-xs font-normal text-slate-500 ml-0.5">{unit}</span>
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
