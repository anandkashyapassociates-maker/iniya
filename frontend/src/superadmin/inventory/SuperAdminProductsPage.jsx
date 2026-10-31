import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Package,
  Layers,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Tag,
  Bookmark,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import superAdminInventoryService from '../services/superAdminInventoryService';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminProductsPage() {
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  // View modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Load dropdown options for filters
  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [catsRes, brsRes] = await Promise.all([
          superAdminInventoryService.getCategories({ per_page: 100 }),
          superAdminInventoryService.getBrands({ per_page: 100 }),
        ]);
        setCategories(catsRes.data || []);
        setBrands(brsRes.data || []);
      } catch {
        // Non-blocking
      }
    }
    loadDropdowns();
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter !== 'all') params.category_id = categoryFilter;
      if (brandFilter !== 'all') params.brand_id = brandFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.product_type = typeFilter;

      const res = await superAdminInventoryService.getProducts(params);
      setProducts(res.data || []);
      setPagination({
        current_page: res.current_page,
        last_page: res.last_page,
        total: res.total,
        from: res.from,
        to: res.to,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load inventory products.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, categoryFilter, brandFilter, statusFilter, typeFilter, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);


  const columns = [
    {
      header: 'SR. NO.',
      className: 'w-[75px] text-center',
      render: (product, index) => {
        const srNo = (pagination?.from || 1) + index;
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-semibold tabular-numbers">
            {srNo}
          </span>
        );
      },
    },
    {
      header: 'PRODUCT SPECIFICATIONS',
      className: 'w-[30%]',
      render: (product) => (
        <div className="flex items-center gap-3">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.product_name}
              className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0 bg-slate-50"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-2xs shrink-0 icon-3d">
              <Package className="w-5 h-5 drop-shadow-sm" />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-xs font-bold font-display text-slate-900 block truncate">
              {product.product_name}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">
                Unit: <span className="text-slate-700 font-semibold font-mono">{product.business_unit} ({product.product_unit ?? 1})</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60 font-mono">
                {product.display_product_type || product.product_type}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'CATEGORY',
      className: 'w-[14%]',
      render: (product) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60 max-w-full">
          <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">{product.category?.name || 'Unassigned'}</span>
        </span>
      ),
    },
    {
      header: 'BRAND',
      className: 'w-[14%]',
      render: (product) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 max-w-full">
          <Bookmark className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{product.brand?.name || 'Generic / None'}</span>
        </span>
      ),
    },
    {
      header: 'CATALOGED BY ADMIN',
      className: 'w-[18%]',
      render: (product) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {product.creator?.name ? product.creator.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-800 block truncate">
              {product.creator?.name || 'Clinic Admin'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block truncate">
              {product.creator?.email || 'admin@clinic.local'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'STATUS',
      className: 'w-[12%] text-center',
      render: (product) => (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${
            product.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              product.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
          <span className="capitalize">{product.status}</span>
        </span>
      ),
    },
    {
      header: 'ACTIONS',
      className: 'w-[10%] text-right',
      render: (product, index) => (
        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              setSelectedProduct(product);
              setSelectedIndex((pagination?.from || 1) + index);
            }}
            className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold font-display">
              <Boxes className="w-3.5 h-3.5 text-blue-600" />
              <span>Global Product Registry</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold font-display">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Clinic Feeds
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight mt-1.5">
            All Inventory Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Superadmin master catalog with real-time clinic admin attribution, status toggles, and edit controls.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchProducts()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold font-display transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-98"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Table Card (col-12) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Search & 4 Filters */}
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search products by name, category, brand, or admin..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-normal text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium transition-all"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Brand Filter */}
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium transition-all"
            >
              <option value="all">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium transition-all"
            >
              <option value="all">All Types</option>
              <option value="Consumable">Consumable</option>
              <option value="Retail">Retail</option>
              <option value="Equipment">Equipment</option>
              <option value="Medicine">Medicine</option>
              <option value="Service">Service</option>
              <option value="Other">Other</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2.5 text-xs bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={products}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={setPage}
          emptyMessage="No products match your criteria."
        />
      </div>

      {/* Quick View Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden space-y-6">
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.product_name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 icon-3d shrink-0">
                    <Package className="w-7 h-7 drop-shadow-sm" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900">
                    {selectedProduct.product_name}
                  </h3>
                  {selectedIndex && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 font-mono text-[10px] font-bold mt-1">
                      Sr. No. #{selectedIndex}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 micro-label">
                    Category
                  </span>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>{selectedProduct.category?.name || 'None'}</span>
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 micro-label">
                    Brand
                  </span>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedProduct.brand?.name || 'None'}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 micro-label">
                    Business Unit
                  </span>
                  <p className="font-bold text-slate-900 font-mono">
                    {selectedProduct.business_unit} ({selectedProduct.product_unit ?? 1})
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 micro-label">
                    Product Type
                  </span>
                  <p className="font-bold text-slate-900">
                    {selectedProduct.display_product_type || selectedProduct.product_type}
                  </p>
                </div>
              </div>

              {selectedProduct.creator && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-blue-900 block">
                      Cataloged by {selectedProduct.creator.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 block truncate">
                      {selectedProduct.creator.email}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold font-display text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
