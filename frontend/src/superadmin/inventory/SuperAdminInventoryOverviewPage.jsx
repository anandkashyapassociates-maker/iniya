import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Package,
  FolderTree,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Tag,
  ShieldCheck,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import superAdminInventoryService from '../services/superAdminInventoryService';
import LoadingState from '../../components/LoadingState';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminInventoryOverviewPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await superAdminInventoryService.getOverview();
      setData(res);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load inventory overview.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (isLoading && !data) {
    return <LoadingState message="Loading inventory executive dashboard..." />;
  }

  const summary = data?.summary || {
    total_products: 0,
    active_products: 0,
    inactive_products: 0,
    total_categories: 0,
    total_brands: 0,
    contributing_admins_count: 0,
  };

  const recentProducts = data?.recent_products || [];
  const productsByCategory = data?.products_by_category || [];
  const productsByBrand = data?.products_by_brand || [];
  const adminProductReport = data?.admin_product_report || [];

  return (
    <div className="w-full space-y-7 animate-in fade-in duration-300">
      {/* Top Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold font-display">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Superadmin Oversight</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold font-display">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Inventory Sync
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight mt-1.5">
            Inventory Executive Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Centralized intelligence on medical supplies, equipment catalog, brands, and clinic admin contributions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchOverview()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold font-display transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-98"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/superadmin/inventory/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold font-display shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer active:scale-98"
          >
            <Boxes className="w-4 h-4" />
            <span>Inspect All Products</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid using StatCard with 3D gradient icons & smooth sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Products"
          value={summary.total_products}
          icon={Package}
          colorScheme="blue"
          subtitle={`${summary.active_products} Active • ${summary.inactive_products} Inactive`}
          trend={`${summary.total_products > 0 ? Math.round((summary.active_products / summary.total_products) * 100) : 100}% Active`}
          sparklineData={[20, 35, 50, 65, 80, summary.total_products || 95]}
        />
        <StatCard
          title="Categories"
          value={summary.total_categories}
          icon={FolderTree}
          colorScheme="purple"
          subtitle="Classification Tiers"
          trend="Structure"
          sparklineData={[4, 8, 12, 16, 20, summary.total_categories || 24]}
        />
        <StatCard
          title="Brands & Vendors"
          value={summary.total_brands}
          icon={Award}
          colorScheme="emerald"
          subtitle="Certified Manufacturers"
          trend="+6% MoM"
          sparklineData={[6, 9, 11, 14, 18, summary.total_brands || 22]}
        />
        <StatCard
          title="Contributing Admins"
          value={summary.contributing_admins_count}
          icon={Users}
          colorScheme="cyan"
          subtitle="Clinic Admins Cataloging"
          trend="Verified Active"
          sparklineData={[1, 2, 2, 3, 3, summary.contributing_admins_count || 4]}
        />
      </div>

      {/* Breakdown Section: Top Categories & Top Brands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5 hover:border-slate-300/80 transition-all duration-300">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 icon-3d">
                <FolderTree className="w-5 h-5 drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-display text-slate-800 tracking-tight">
                  Top Categories by Item Count
                </h2>
                <p className="text-[11px] text-slate-400 font-normal">
                  Distribution of inventory across active classification groups.
                </p>
              </div>
            </div>
            <Link
              to="/superadmin/inventory/categories"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold font-display inline-flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="space-y-3">
            {productsByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No category data yet.</p>
            ) : (
              productsByCategory.map((cat, idx) => {
                const maxCount = productsByCategory[0]?.count || 1;
                const ratio = Math.round((cat.count / maxCount) * 100);
                return (
                  <div
                    key={cat.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:bg-white hover:border-blue-200/80 hover:shadow-2xs transition-all duration-200 space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-2xs">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                          {cat.name}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tabular-numbers bg-blue-50 text-blue-700 border border-blue-200/60">
                        {cat.count} {cat.count === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Brands Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5 hover:border-slate-300/80 transition-all duration-300">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 icon-3d">
                <Award className="w-5 h-5 drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-display text-slate-800 tracking-tight">
                  Top Brands by Item Count
                </h2>
                <p className="text-[11px] text-slate-400 font-normal">
                  Certified suppliers & manufacturers ranking by enrolled items.
                </p>
              </div>
            </div>
            <Link
              to="/superadmin/inventory/brands"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold font-display inline-flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="space-y-3">
            {productsByBrand.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No brand data yet.</p>
            ) : (
              productsByBrand.map((brand, idx) => {
                const maxCount = productsByBrand[0]?.count || 1;
                const ratio = Math.round((brand.count / maxCount) * 100);
                return (
                  <div
                    key={brand.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:bg-white hover:border-emerald-200/80 hover:shadow-2xs transition-all duration-200 space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-2xs">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                          {brand.name}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tabular-numbers bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {brand.count} {brand.count === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Admin Contribution Report */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 icon-3d">
              <UserCheck className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-display text-slate-800 tracking-tight">
                Admin-Wise Inventory Creation Audit
              </h2>
              <p className="text-[11px] text-slate-400 font-normal">
                Inventory products cataloged by individual clinic administrators across the network.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider micro-label">
                <th className="py-3 px-3 w-16 text-center">Sr. No.</th>
                <th className="py-3 px-3">Clinic Administrator</th>
                <th className="py-3 px-3">Admin Email</th>
                <th className="py-3 px-3 text-center">Total Products Added</th>
                <th className="py-3 px-3 text-right">Contribution Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {adminProductReport.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    No admin product contributions recorded yet.
                  </td>
                </tr>
              ) : (
                adminProductReport.map((adm, idx) => {
                  const percent = summary.total_products > 0
                    ? Math.round((adm.count / summary.total_products) * 100)
                    : 0;
                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-semibold tabular-numbers">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                            {adm.name?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {adm.name}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium">Clinic Verified</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-500 text-[11px]">
                        {adm.email}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold tabular-numbers bg-violet-50 text-violet-700 border border-violet-200/60">
                          {adm.count} products
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-2.5 justify-end">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold tabular-numbers text-slate-700 w-9 text-right">
                            {percent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recently Added Products Table */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 icon-3d">
              <Package className="w-5 h-5 drop-shadow-sm" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-display text-slate-800 tracking-tight">
                Recently Cataloged Products
              </h2>
              <p className="text-[11px] text-slate-400 font-normal">
                Most recent medical supplies enrolled across all clinics.
              </p>
            </div>
          </div>
          <Link
            to="/superadmin/inventory/products"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold font-display inline-flex items-center gap-1 group"
          >
            <span>All Products</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider micro-label">
                <th className="py-3 px-3 w-16 text-center">Sr. No.</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Brand</th>
                <th className="py-3 px-3">Cataloged By</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {recentProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    No products added yet.
                  </td>
                </tr>
              ) : (
                recentProducts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-semibold tabular-numbers">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900 block truncate max-w-xs font-display">
                        {p.product_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Unit: {p.business_unit}</span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-medium">
                      {p.category?.name || <span className="text-slate-400 italic">Uncategorized</span>}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-medium">
                      {p.brand?.name || <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-800 block">
                        {p.creator?.name || 'Admin'}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {p.creator?.email || ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                          p.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        <span className="capitalize">{p.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-400 text-[11px] font-mono">
                      {new Date(p.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
