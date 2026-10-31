import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Package,
  Plus,
  RefreshCw,
  Search,
  Lock,
  Edit,
  DollarSign,
  TrendingDown,
  X,
  ShieldAlert,
  CheckCircle2,
  Building2,
  Clock,
  Layers,
} from 'lucide-react';
import DataTable from '../../../components/DataTable';
import adminInventoryService from '../../../services/adminInventoryService';
import { useToast } from '../../../context/ToastContext';
import { useAdminAuth } from '../../../features/auth/AdminAuthContext';

const commonBusinessUnits = [
  'Piece',
  'Box',
  'Packet',
  'Bottle',
  'Vial',
  'Ampoule',
  'Strip',
  'Roll',
  'Tube',
  'Kg',
  'Litre',
  'Set',
];

export default function AdminLowInventoryPage() {
  const toast = useToast();
  const { user } = useAdminAuth();

  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [metrics, setMetrics] = useState({
    total_low_stock_alerts: 0,
    out_of_stock_count: 0,
    low_stock_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal State for adding/updating inventory stock
  const [stockModal, setStockModal] = useState({
    isOpen: false,
    mode: 'add', // 'add' | 'edit'
    product: null,
    isSubmitting: false,
  });

  const [formData, setFormData] = useState({
    quantity: '',
    buy_price: '',
    mrp: '',
    average_price: '',
    vendor_id: '',
    business_unit: '',
    low_stock_threshold: 10,
    notes: '',
  });

  const [formErrors, setFormErrors] = useState({});

  const fetchVendors = useCallback(async () => {
    try {
      const res = await adminInventoryService.getVendors();
      setVendors(res.data || []);
    } catch {
      // non-blocking
    }
  }, []);

  const fetchLowStock = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();

      const res = await adminInventoryService.getLowStock(params);
      setProducts(res.data || []);
      setPagination(res.pagination || null);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load low inventory list.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  const openAddStockModal = (product) => {
    setFormErrors({});
    const defaultBU = product.business_unit || 'Piece';
    setFormData({
      quantity: '',
      buy_price: product.buy_price ? String(product.buy_price) : '',
      mrp: product.mrp ? String(product.mrp) : '',
      average_price: product.average_price ? String(product.average_price) : '',
      vendor_id: product.vendor_id ? String(product.vendor_id) : '',
      business_unit: defaultBU,
      low_stock_threshold: product.low_stock_threshold ?? 10,
      notes: '',
    });
    setStockModal({
      isOpen: true,
      mode: 'add',
      product,
      isSubmitting: false,
    });
  };

  const openEditStockModal = (product) => {
    setFormErrors({});
    setFormData({
      quantity: product.quantity ?? 0,
      buy_price: product.buy_price ? String(product.buy_price) : '',
      mrp: product.mrp ? String(product.mrp) : '',
      average_price: product.average_price ? String(product.average_price) : '',
      vendor_id: product.vendor_id ? String(product.vendor_id) : '',
      business_unit: product.business_unit || 'Piece',
      low_stock_threshold: product.low_stock_threshold ?? 10,
      notes: '',
    });
    setStockModal({
      isOpen: true,
      mode: 'edit',
      product,
      isSubmitting: false,
    });
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (stockModal.mode === 'add' && (name === 'buy_price' || name === 'quantity')) {
        const addQty = parseFloat(name === 'quantity' ? value : next.quantity) || 0;
        const addPrice = parseFloat(name === 'buy_price' ? value : next.buy_price) || 0;
        const currentQty = parseFloat(stockModal.product?.quantity) || 0;
        const currentAvg = parseFloat(stockModal.product?.average_price || stockModal.product?.buy_price) || 0;
        const total = currentQty + addQty;

        if (total > 0 && addPrice > 0) {
          const calculatedAvg = ((currentQty * currentAvg) + (addQty * addPrice)) / total;
          next.average_price = calculatedAvg.toFixed(2);
        }
      }

      return next;
    });

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const errs = {};

    if (!formData.quantity || isNaN(formData.quantity) || Number(formData.quantity) < (stockModal.mode === 'add' ? 1 : 0)) {
      errs.quantity = stockModal.mode === 'add' ? 'Replenish quantity must be at least 1 unit.' : 'Quantity cannot be negative.';
    }
    if (!formData.buy_price || isNaN(formData.buy_price) || Number(formData.buy_price) < 0) {
      errs.buy_price = 'Please enter a valid buy price.';
    }
    if (!formData.mrp || isNaN(formData.mrp) || Number(formData.mrp) < 0) {
      errs.mrp = 'Please enter a valid MRP.';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setStockModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const payload = {
        quantity: parseInt(formData.quantity, 10),
        buy_price: parseFloat(formData.buy_price),
        mrp: parseFloat(formData.mrp),
        vendor_id: formData.vendor_id ? parseInt(formData.vendor_id, 10) : null,
        business_unit: formData.business_unit,
        notes: formData.notes?.trim() || null,
      };

      if (stockModal.mode === 'add') {
        await adminInventoryService.addStock(stockModal.product.id, payload);
        toast.success(`Stock replenished for '${stockModal.product.product_name}'.`);
      } else {
        await adminInventoryService.updateStock(stockModal.product.id, payload);
        toast.success(`Inventory details updated for '${stockModal.product.product_name}'.`);
      }

      setStockModal({ isOpen: false, mode: 'add', product: null, isSubmitting: false });
      fetchLowStock();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save inventory stock.');
      setStockModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const columns = [
    {
      header: 'SR. NO.',
      className: 'w-[70px] text-center',
      render: (_, index) => {
        const srNo = (pagination?.from || 1) + index;
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-50 text-rose-700 font-mono text-[11px] font-semibold">
            {srNo}
          </span>
        );
      },
    },
    {
      header: 'PRODUCT DETAILS',
      className: 'w-[28%]',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
            {p.product_image ? (
              <img
                src={p.image_url || p.product_image}
                alt={p.product_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 block truncate" title={p.product_name}>
              {p.product_name}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60 truncate max-w-[120px]">
                {p.category?.name || 'General'}
              </span>
              {p.brand?.name && (
                <span className="text-[10px] text-slate-500 font-normal truncate max-w-[100px]">
                  • {p.brand.name}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'STOCK & ALERT STATUS',
      className: 'w-[20%]',
      render: (p) => {
        const qty = p.quantity ?? 0;
        const threshold = p.low_stock_threshold ?? 10;
        const isOutOfStock = qty <= 0;
        const deficit = Math.max(0, threshold - qty);

        return (
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-lg font-bold font-mono ${
                  isOutOfStock ? 'text-rose-600' : 'text-amber-600'
                }`}
              >
                {qty}
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                {p.business_unit || 'Units'}
              </span>
              <span className="text-[10px] text-slate-400">
                (Min: {threshold})
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                  Depleted (0 Stock)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Deficit: -{deficit}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'PRICING METRICS',
      className: 'w-[15%]',
      render: (p) => (
        <div className="space-y-0.5 text-xs font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-sans text-[10px]">Buy:</span>
            <span className="font-semibold text-slate-700">
              {p.buy_price ? `₹${parseFloat(p.buy_price).toFixed(2)}` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-sans text-[10px]">MRP:</span>
            <span className="font-semibold text-blue-600">
              {p.mrp ? `₹${parseFloat(p.mrp).toFixed(2)}` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] pt-0.5 border-t border-slate-100">
            <span className="text-slate-400 font-sans">Avg:</span>
            <span className="text-slate-500">
              {p.average_price ? `₹${parseFloat(p.average_price).toFixed(2)}` : '—'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'SUPPLIER / VENDOR',
      className: 'w-[15%]',
      render: (p) =>
        p.vendor ? (
          <div>
            <span className="text-xs font-bold text-slate-800 block truncate" title={p.vendor.vendor_name}>
              {p.vendor.vendor_name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block truncate">
              {p.vendor.mobile || p.vendor.vendor_code}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 italic text-[11px]">No Vendor Assigned</span>
        ),
    },
    {
      header: 'ACTIONS',
      className: 'w-[14%] text-right',
      render: (p) => {
        const isStockOwner = p.inventory_updated_by && Number(p.inventory_updated_by) === Number(user?.id);
        const hasStock = (p.quantity ?? 0) > 0 || p.inventory_updated_by;

        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Quick Restock / Add Inventory Button */}
            <button
              onClick={() => openAddStockModal(p)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Add Inventory / Replenish Stock"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Inventory</span>
            </button>

            {/* Edit Stock Button (strictly owner only) */}
            {hasStock && (
              isStockOwner ? (
                <button
                  onClick={() => openEditStockModal(p)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                  title="Edit Inventory Details"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span
                  className="p-1.5 rounded-lg text-slate-400 inline-flex items-center cursor-not-allowed"
                  title={`Inventory added by ${p.inventory_updater?.name || 'another admin'} (Read-only)`}
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                </span>
              )
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              to="/admin/inventory/stocks"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Stock Ledger</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-700 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>Critical Replenishment Priority</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
            Low Inventory &amp; Stock Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal mt-0.5 max-w-2xl leading-relaxed">
            All medical products at or below replenishment threshold. Rapidly restock critical inventory items below.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLowStock}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer"
            title="Refresh Alert List"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/admin/inventory/stocks"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs"
          >
            <Boxes className="w-4 h-4" />
            <span>All Inventory Stocks</span>
          </Link>
        </div>
      </div>

      {/* Alert KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Low Stock Alerts */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
              Total Low Stock Alerts
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-900 font-mono mt-1 block">
              {metrics.total_low_stock_alerts}
            </span>
            <span className="text-[11px] text-amber-600 mt-0.5 block">
              Require replenishment attention
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Depleted (0 Stock) */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">
              Depleted / Out of Stock
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-900 font-mono mt-1 block">
              {metrics.out_of_stock_count}
            </span>
            <span className="text-[11px] text-rose-600 mt-0.5 block">
              0 units available for clinical use
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Approaching Zero */}
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">
              Under Threshold (&le; Min)
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-900 font-mono mt-1 block">
              {metrics.low_stock_count}
            </span>
            <span className="text-[11px] text-blue-600 mt-0.5 block">
              Nearing complete exhaustion
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        {/* Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search low stock products, brands, or vendors..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{products.length}</strong> critical items
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={products}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={setPage}
          emptyTitle="No Low Stock Products!"
          emptyDescription="All products in the inventory currently have stock above their minimum threshold."
        />
      </div>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT INVENTORY STOCK                        */}
      {/* ======================================================== */}
      {stockModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-500/40 text-rose-300 flex items-center justify-center font-bold">
                  {stockModal.mode === 'add' ? <Plus className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    {stockModal.mode === 'add' ? 'Replenish Inventory Stock' : 'Edit Inventory Details'}
                  </h3>
                  <p className="text-xs text-slate-300 truncate max-w-xs">
                    {stockModal.product?.product_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStockModal({ isOpen: false, mode: 'add', product: null, isSubmitting: false })}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              {/* Product Info Strip */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Current Stock</span>
                  <span className="text-sm font-bold font-mono text-rose-600">
                    {stockModal.product?.quantity ?? 0} {stockModal.product?.business_unit || 'Units'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Min Threshold</span>
                  <span className="text-sm font-bold font-mono text-slate-800">
                    {stockModal.product?.low_stock_threshold ?? 10} Units
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Last Buy Price</span>
                  <span className="text-sm font-bold font-mono text-slate-800">
                    {stockModal.product?.buy_price ? `₹${parseFloat(stockModal.product.buy_price).toFixed(2)}` : '—'}
                  </span>
                </div>
              </div>

              {/* Quantity & Business Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {stockModal.mode === 'add' ? 'Replenish Quantity (Units) *' : 'Total Stock Quantity *'}
                  </label>
                  <input
                    type="number"
                    min={stockModal.mode === 'add' ? '1' : '0'}
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleModalChange}
                    placeholder="e.g. 50"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono ${
                      formErrors.quantity ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'
                    } focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500`}
                  />
                  {formErrors.quantity && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.quantity}</p>
                  )}
                </div>

                {/* Business Unit Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Unit *
                  </label>
                  <select
                    name="business_unit"
                    value={formData.business_unit}
                    onChange={handleModalChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
                    required
                  >
                    <option value="">Select Unit (Piece, Box...)</option>
                    {commonBusinessUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    {formData.business_unit && !commonBusinessUnits.includes(formData.business_unit) && (
                      <option value={formData.business_unit}>{formData.business_unit}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Buy Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="buy_price"
                    value={formData.buy_price}
                    onChange={handleModalChange}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                      formErrors.buy_price ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'
                    } focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500`}
                  />
                  {formErrors.buy_price && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.buy_price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    MRP (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleModalChange}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono ${
                      formErrors.mrp ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'
                    } focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500`}
                  />
                  {formErrors.mrp && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.mrp}</p>
                  )}
                </div>
              </div>

              {/* Vendor Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vendor / Supplier
                </label>
                <select
                  name="vendor_id"
                  value={formData.vendor_id}
                  onChange={handleModalChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendor_name} ({v.vendor_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockModal({ isOpen: false, mode: 'add', product: null, isSubmitting: false })}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockModal.isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {stockModal.isSubmitting ? 'Saving...' : stockModal.mode === 'add' ? 'Replenish Inventory' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

