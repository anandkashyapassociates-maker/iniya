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
} from 'lucide-react';
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
    <div className="w-full space-y-6">
      {/* Top Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Superadmin Oversight</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Inventory Sync
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-normal mt-1.5">
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all shadow-2xs cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/superadmin/inventory/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium transition-all shadow-sm shadow-blue-500/20"
          >
            <Boxes className="w-4 h-4" />
            <span>Inspect All Products</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Products
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/70 text-blue-600 flex items-center justify-center font-medium shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-2 font-mono">
            {summary.total_products}
          </p>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              {summary.active_products} Active
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-slate-400 font-normal">
              <XCircle className="w-3 h-3" />
              {summary.inactive_products} Inactive
            </span>
          </div>
        </div>

        {/* Card 2: Categories */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Categories
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex items-center justify-center font-medium shadow-2xs">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-2 font-mono">
            {summary.total_categories}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Classification Tiers</span>
            <Link
              to="/superadmin/inventory/categories"
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Brands */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Brands & Vendors
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex items-center justify-center font-medium shadow-2xs">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-2 font-mono">
            {summary.total_brands}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Certified Manufacturers</span>
            <Link
              to="/superadmin/inventory/brands"
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Contributing Admins */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Contributing Admins
            </span>
            <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-200/70 text-violet-600 flex items-center justify-center font-medium shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-slate-800 mt-2 font-mono">
            {summary.contributing_admins_count}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Clinic Admins with Products</span>
            <span className="text-emerald-600 font-medium">Verified Active</span>
          </div>
        </div>
      </div>

      {/* Breakdown Section: Top Categories & Top Brands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Categories Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-800">
                Top Categories by Item Count
              </h2>
            </div>
            <Link
              to="/superadmin/inventory/categories"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {productsByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No category data yet.</p>
            ) : (
              productsByCategory.map((cat, idx) => (
                <div
                  key={cat.id || idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-100/70 text-blue-700 text-[11px] font-mono font-medium flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-800">{cat.name}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                    {cat.count} products
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Brands Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-800">
                Top Brands by Item Count
              </h2>
            </div>
            <Link
              to="/superadmin/inventory/brands"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {productsByBrand.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No brand data yet.</p>
            ) : (
              productsByBrand.map((brand, idx) => (
                <div
                  key={brand.id || idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100/70 text-emerald-700 text-[11px] font-mono font-medium flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-800">{brand.name}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {brand.count} products
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Admin Contribution Report */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-violet-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Admin-Wise Inventory Creation Audit
              </h2>
              <p className="text-[11px] text-slate-400 font-normal">
                Inventory products cataloged by individual clinic administrators.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 w-16 text-center">Sr. No.</th>
                <th className="py-2.5 px-3">Clinic Administrator</th>
                <th className="py-2.5 px-3">Admin Email</th>
                <th className="py-2.5 px-3 text-center">Total Products Added</th>
                <th className="py-2.5 px-3 text-right">Contribution Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {adminProductReport.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                    No admin product contributions recorded yet.
                  </td>
                </tr>
              ) : (
                adminProductReport.map((adm, idx) => {
                  const percent = summary.total_products > 0
                    ? Math.round((adm.count / summary.total_products) * 100)
                    : 0;
                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-medium">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-xs">
                            {adm.name?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <span className="font-medium text-slate-800">{adm.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                        {adm.email}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-violet-50 text-violet-700 border border-violet-200/60">
                          {adm.count} products
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 font-medium">
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
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-800">
              Recently Cataloged Products
            </h2>
          </div>
          <Link
            to="/superadmin/inventory/products"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
          >
            <span>All Products</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 w-16 text-center">Sr. No.</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Brand</th>
                <th className="py-2.5 px-3">Cataloged By</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {recentProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                    No products added yet.
                  </td>
                </tr>
              ) : (
                recentProducts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-medium">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block truncate">
                        {p.product_name}
                      </span>
                      <span className="text-[10px] text-slate-400">Unit: {p.business_unit}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {p.category?.name || 'Uncategorized'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {p.brand?.name || <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-700 block">
                        {p.creator?.name || 'Admin'}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {p.creator?.email || ''}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                          p.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
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
                    <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
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

