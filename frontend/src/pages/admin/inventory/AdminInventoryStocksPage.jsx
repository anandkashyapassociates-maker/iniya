import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Package,
  Layers,
  Building2,
  DollarSign,
  TrendingDown,
  X,
  Lock,
  Edit,
  UserCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
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

export default function AdminInventoryStocksPage() {
  const toast = useToast();
  const { user } = useAdminAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [metrics, setMetrics] = useState({
    total_products: 0,
    in_stock_count: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    total_alerts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [stockStatus, setStockStatus] = useState('all');
  const [page, setPage] = useState(1);

  // Modal State
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

  const fetchFiltersData = useCallback(async () => {
    try {
      const [catsRes, brandsRes, vendorsRes] = await Promise.all([
        adminInventoryService.getCategoryDropdown(),
        adminInventoryService.getBrandDropdown(),
        adminInventoryService.getVendors(),
      ]);
      setCategories(catsRes.data || []);
      setBrands(brandsRes.data || []);
      setVendors(vendorsRes.data || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchStocks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedBrand) params.brand_id = selectedBrand;
      if (stockStatus && stockStatus !== 'all') params.stock_status = stockStatus;

      const res = await adminInventoryService.getStocks(params);
      setProducts(res.data || []);
      setPagination(res.pagination || null);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load inventory stock ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedCategory, selectedBrand, stockStatus, toast]);

  useEffect(() => {
    fetchFiltersData();
  }, [fetchFiltersData]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

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

      // Auto-calculate suggested average price in 'add' mode
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
      errs.quantity = stockModal.mode === 'add' ? 'Quantity must be at least 1 unit.' : 'Quantity cannot be negative.';
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
        toast.success(`Inventory stock added for '${stockModal.product.product_name}'.`);
      } else {
        await adminInventoryService.updateStock(stockModal.product.id, payload);
        toast.success(`Inventory stock updated for '${stockModal.product.product_name}'.`);
      }

      setStockModal({ isOpen: false, mode: 'add', product: null, isSubmitting: false });
      fetchStocks();
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
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-medium">
            {srNo}
          </span>
        );
      },
    },
    {
      header: 'PRODUCT DETAILS',
      className: 'w-[26%]',
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
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60 truncate max-w-[120px]">
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
      header: 'UNIT SPEC',
      className: 'w-[12%]',
      render: (p) => (
        <div className="text-xs text-slate-700 font-medium">
          <span>{p.business_unit || 'Piece'}</span>
        </div>
      ),
    },
    {
      header: 'AVAILABLE STOCK',
      className: 'w-[16%]',
      render: (p) => {
        const qty = p.quantity ?? 0;
        const threshold = p.low_stock_threshold ?? 10;
        const isOutOfStock = qty <= 0;
        const isLow = qty > 0 && qty <= threshold;

        return (
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-base font-bold font-mono ${
                  isOutOfStock
                    ? 'text-rose-600'
                    : isLow
                    ? 'text-amber-600'
                    : 'text-slate-800'
                }`}
              >
                {qty}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {p.business_unit || 'Units'}
              </span>
            </div>
            <div className="mt-1">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Out of Stock
                </span>
              ) : isLow ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Low Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  In Stock
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'AVG. PRICE',
      className: 'w-[16%]',
      render: (p) => {
        const avgPrice = p.calculated_average_price ?? p.average_price ?? p.buy_price;
        return avgPrice && Number(avgPrice) > 0 ? (
          <span className="text-xs font-bold font-mono text-slate-800">
            ₹{parseFloat(avgPrice).toFixed(2)}
          </span>
        ) : (
          <span className="text-slate-400 italic text-[11px]">—</span>
        );
      },
    },
    {
      header: 'VENDOR',
      className: 'w-[16%]',
      render: (p) =>
        p.vendor ? (
          <span className="text-xs font-semibold text-slate-800 block truncate" title={p.vendor.vendor_name}>
            {p.vendor.vendor_name}
          </span>
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
            {/* Add Inventory Button */}
            <button
              onClick={() => openAddStockModal(p)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/80 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Add Inventory"
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
    <div className="w-full space-y-6">
      {/* Top Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
              <Boxes className="w-3.5 h-3.5 text-blue-600" />
              <span>Pharmacy &amp; Clinic Supply Logistics</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight mt-1.5">
            Inventory Stock Ledger &amp; Updates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 max-w-2xl leading-relaxed">
            Monitor real-time product quantities, supplier buy prices, retail MRPs, weighted average costs, and reorder levels.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Low Stock Alerts Button */}
          <Link
            to="/admin/inventory/low-stock"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              metrics.total_alerts > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="View products requiring immediate replenishment"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Low Inventory</span>
            {metrics.total_alerts > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white text-amber-700 font-mono text-[11px] font-bold">
                {metrics.total_alerts}
              </span>
            )}
          </Link>

          <button
            onClick={fetchStocks}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all shadow-2xs cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Prominent Alert Banner if low inventory exists */}
      {metrics.total_alerts > 0 && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Critical Stock Replenishment Notice
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                <strong>{metrics.total_alerts} product(s)</strong> have reached critical or low stock threshold ({metrics.out_of_stock_count} completely depleted). Procure stock to avoid clinical interruptions.
              </p>
            </div>
          </div>
          <Link
            to="/admin/inventory/low-stock"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs self-start sm:self-auto shrink-0 transition-colors"
          >
            <span>Review Low Stock</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product, category, vendor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all"
            />
          </div>

          {/* Stock Status Filter */}
          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-700"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (Healthy)</option>
            <option value="low_stock">Low Stock (Threshold Warning)</option>
            <option value="out_of_stock">Out of Stock (Depleted)</option>
          </select>

          {/* Category Filter */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-40 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Brand Filter */}
          {brands.length > 0 && (
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-36 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden transition-all text-slate-700"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {(search || selectedCategory || selectedBrand || stockStatus !== 'all') && (
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('');
              setSelectedBrand('');
              setStockStatus('all');
              setPage(1);
            }}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 self-end sm:self-auto cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Stock Table */}
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        emptyMessage="No inventory products found matching your criteria."
        pagination={{
          page,
          totalPages: pagination?.last_page || 1,
          total: pagination?.total || 0,
          from: pagination?.from || 0,
          to: pagination?.to || 0,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      {/* Add / Edit Inventory Modal */}
      {stockModal.isOpen && stockModal.product && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900">
                    {stockModal.mode === 'add' ? 'Add Inventory Stock' : 'Edit Inventory Details'}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    {stockModal.mode === 'add'
                      ? 'Record new supplier procurement quantity and prices.'
                      : 'Update existing stock balance, prices, and vendor.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStockModal({ isOpen: false, mode: 'add', product: null, isSubmitting: false })}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary Box */}
            <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                {stockModal.product.product_image ? (
                  <img
                    src={stockModal.product.image_url || stockModal.product.product_image}
                    alt={stockModal.product.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {stockModal.product.product_name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-normal">
                  <span>Category: {stockModal.product.category?.name || 'General'}</span>
                  <span>•</span>
                  <span>
                    Current Stock:{' '}
                    <strong className="text-slate-800 font-mono">
                      {stockModal.product.quantity ?? 0} {stockModal.product.business_unit || 'Units'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {stockModal.mode === 'add' ? 'Quantity to Add *' : 'Total Stock Quantity *'}
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min={stockModal.mode === 'add' ? '1' : '0'}
                    placeholder={stockModal.mode === 'add' ? 'e.g. 50' : '0'}
                    value={formData.quantity}
                    onChange={handleModalChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono"
                    required
                  />
                  {formErrors.quantity && (
                    <p className="text-[11px] text-rose-500 mt-1">{formErrors.quantity}</p>
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
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

                {/* Buy Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Buy / Purchase Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="buy_price"
                    placeholder="0.00"
                    value={formData.buy_price}
                    onChange={handleModalChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono"
                    required
                  />
                  {formErrors.buy_price && (
                    <p className="text-[11px] text-rose-500 mt-1">{formErrors.buy_price}</p>
                  )}
                </div>

                {/* MRP */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    MRP / Retail Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="mrp"
                    placeholder="0.00"
                    value={formData.mrp}
                    onChange={handleModalChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono"
                    required
                  />
                  {formErrors.mrp && (
                    <p className="text-[11px] text-rose-500 mt-1">{formErrors.mrp}</p>
                  )}
                </div>
              </div>

              {/* Vendor Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Procured From Vendor (Supplier)
                </label>
                <select
                  name="vendor_id"
                  value={formData.vendor_id}
                  onChange={handleModalChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                >
                  <option value="">-- Select Vendor / Supplier (Optional) --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendor_name} ({v.company_name || v.vendor_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Procurement Notes / Batch / Supplier Bill No (Optional)
                </label>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="e.g. Invoice #INV-2026-889, Expiry Oct 2028"
                  value={formData.notes}
                  onChange={handleModalChange}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockModal({ isOpen: false, mode: 'add', product: null, isSubmitting: false })}
                  disabled={stockModal.isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockModal.isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {stockModal.isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{stockModal.mode === 'add' ? 'Confirm & Add Stock' : 'Update Inventory'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
