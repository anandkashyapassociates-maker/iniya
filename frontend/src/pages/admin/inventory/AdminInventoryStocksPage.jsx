import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Boxes,
  Plus,
  Minus,
  MinusCircle,
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
  FileText,
  PlusCircle,
  User,
  Calendar,
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

  const [searchParams] = useSearchParams();

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [stockStatus, setStockStatus] = useState(() => searchParams.get('status') || 'all');
  const [page, setPage] = useState(1);

  // Sync stockStatus if URL parameter changes
  useEffect(() => {
    const paramStatus = searchParams.get('status');
    if (paramStatus && paramStatus !== stockStatus) {
      setStockStatus(paramStatus);
      setPage(1);
    }
  }, [searchParams]);

  // Modal State
  const [stockModal, setStockModal] = useState({
    isOpen: false,
    mode: 'add', // 'add' | 'edit'
    product: null,
    isSubmitting: false,
  });

  // Issue Inventory Modal State
  const [issueModal, setIssueModal] = useState({
    isOpen: false,
    product: null,
    isSubmitting: false,
  });

  const [issueFormData, setIssueFormData] = useState({
    quantity: '',
    inventory_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [issueFormErrors, setIssueFormErrors] = useState({});

  // Inventory Details Modal State
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    product: null,
    logs: [],
    isLoading: false,
  });

  const openDetailsModal = useCallback(async (product) => {
    setDetailsModal({
      isOpen: true,
      product,
      logs: [],
      isLoading: true,
    });

    try {
      const res = await adminInventoryService.getStockLogs(product.id);
      setDetailsModal({
        isOpen: true,
        product,
        logs: Array.isArray(res.data) ? res.data : [],
        isLoading: false,
      });
    } catch {
      toast.error('Failed to load inventory stock history.');
      setDetailsModal((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [toast]);

  const [formData, setFormData] = useState({
    quantity: '',
    buy_price: '',
    mrp: '',
    average_price: '',
    vendor_id: '',
    business_unit: '',
    inventory_date: new Date().toISOString().split('T')[0],
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
      inventory_date: new Date().toISOString().split('T')[0],
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
      inventory_date: product.inventory_updated_at ? new Date(product.inventory_updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
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

    const todayStr = new Date().toISOString().split('T')[0];
    if (formData.inventory_date && formData.inventory_date < todayStr) {
      errs.inventory_date = 'Inventory date cannot be in the past. Please select today or a future date.';
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
        inventory_date: formData.inventory_date || new Date().toISOString().split('T')[0],
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

  const openIssueStockModal = (product) => {
    setIssueFormErrors({});
    setIssueFormData({
      quantity: '',
      inventory_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIssueModal({
      isOpen: true,
      product,
      isSubmitting: false,
    });
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setIssueFormErrors({});

    const qty = parseInt(issueFormData.quantity, 10);
    const available = issueModal.product?.quantity ?? 0;

    const errors = {};
    if (!issueFormData.quantity || isNaN(qty) || qty <= 0) {
      errors.quantity = 'Please enter a valid positive quantity to issue.';
    } else if (qty > available) {
      errors.quantity = `Cannot issue ${qty} units. Only ${available} units are available in stock.`;
    }

    if (!issueFormData.inventory_date) {
      errors.inventory_date = 'Please select the issue date.';
    }

    if (Object.keys(errors).length > 0) {
      setIssueFormErrors(errors);
      return;
    }

    setIssueModal((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const payload = {
        quantity: qty,
        inventory_date: issueFormData.inventory_date,
        notes: issueFormData.notes.trim() || undefined,
      };

      const res = await adminInventoryService.issueStock(issueModal.product.id, payload);
      toast.success(res.message || `Successfully issued ${qty} units from '${issueModal.product.product_name}'.`);
      setIssueModal({ isOpen: false, product: null, isSubmitting: false });
      fetchStocks();
    } catch (err) {
      if (err.response?.data?.errors) {
        setIssueFormErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.message || 'Failed to issue inventory.');
      }
      setIssueModal((prev) => ({ ...prev, isSubmitting: false }));
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
      className: 'w-[22%]',
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
      className: 'w-[8%]',
      render: (p) => (
        <div className="text-xs text-slate-700 font-medium">
          <span>{p.business_unit || 'Piece'}</span>
        </div>
      ),
    },
    {
      header: 'AVAILABLE STOCK',
      className: 'w-[18%]',
      render: (p) => {
        const qty = p.quantity ?? 0;
        const threshold = p.low_stock_threshold ?? 10;
        const isOutOfStock = qty <= 0;
        const isLow = qty > 0 && qty <= threshold;
        const addedQty = p.last_added_quantity ?? qty;
        const issuedQty = p.last_issued_quantity;

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
              <span className="text-[10px] text-slate-400 font-normal">Available</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
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
      className: 'w-[12%]',
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
      className: 'w-[18%]',
      render: (p) => {
        return (
          <div>
            <span className="text-xs font-semibold text-slate-800 block truncate" title={p.vendor?.vendor_name || 'No Vendor Assigned'}>
              {p.vendor ? p.vendor.vendor_name : <span className="text-slate-400 italic text-[11px]">No Vendor Assigned</span>}
            </span>
            {p.vendor?.company_name && (
              <span className="text-[11px] text-slate-400 block truncate" title={p.vendor.company_name}>
                {p.vendor.company_name}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'ACTIONS',
      className: 'w-[24%] text-right',
      render: (p) => {
        return (
          <div className="flex items-center justify-end gap-1.5 flex-wrap">
            {/* Add Inventory Button */}
            <button
              onClick={() => openAddStockModal(p)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/80 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Add Inventory"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Inventory</span>
            </button>

            {/* Issue Inventory Button */}
            <button
              onClick={() => openIssueStockModal(p)}
              disabled={(p.quantity ?? 0) <= 0}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                (p.quantity ?? 0) <= 0
                  ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                  : 'bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200/80'
              }`}
              title={(p.quantity ?? 0) <= 0 ? 'No stock available to issue' : 'Issue / Deduct Inventory Stock'}
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Issue Inventory</span>
            </button>

            {/* Inventory Details Button (replaces the circled edit button) */}
            <button
              onClick={() => openDetailsModal(p)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200/80 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="View Complete Stock History & Details"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Inventory Details</span>
            </button>
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

              {/* Inventory Addition Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inventory Date (Stock Addition Date) *
                </label>
                <input
                  type="date"
                  name="inventory_date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.inventory_date}
                  onChange={handleModalChange}
                  className={`w-full px-3 py-2 text-xs rounded-xl border ${
                    formErrors.inventory_date ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'
                  } focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono`}
                  required
                />
                {formErrors.inventory_date && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.inventory_date}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">Date must be today or a future date (past dates not allowed).</p>
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

      {/* ======================================================== */}
      {/* Issue / Less Inventory Modal                             */}
      {/* ======================================================== */}
      {issueModal.isOpen && issueModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 via-rose-50/30 to-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Minus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900">
                    Issue Inventory Stock
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    Deduct / less stock quantity for clinical use, dispensary, or department.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIssueModal({ isOpen: false, product: null, isSubmitting: false })}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary Box */}
            <div className="m-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                {issueModal.product.product_image ? (
                  <img
                    src={issueModal.product.image_url || issueModal.product.product_image}
                    alt={issueModal.product.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {issueModal.product.product_name}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-normal">
                  <span>Unit: {issueModal.product.business_unit || 'Piece'}</span>
                  <span>•</span>
                  <span>
                    Available Stock:{' '}
                    <strong className="text-emerald-700 font-mono font-bold">
                      {issueModal.product.quantity ?? 0} {issueModal.product.business_unit || 'Units'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleIssueSubmit} className="p-5 pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Quantity to Issue / Less */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity to Issue (Less) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={issueModal.product.quantity ?? 0}
                    placeholder="e.g. 10"
                    value={issueFormData.quantity}
                    onChange={(e) => setIssueFormData({ ...issueFormData, quantity: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Max deductible: {issueModal.product.quantity ?? 0} {issueModal.product.business_unit || 'Units'}
                  </p>
                  {issueFormErrors.quantity && (
                    <p className="text-[11px] text-rose-500 mt-1">{issueFormErrors.quantity}</p>
                  )}
                </div>

                {/* Issue Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={issueFormData.inventory_date}
                    onChange={(e) => setIssueFormData({ ...issueFormData, inventory_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Date when stock is issued / deducted.
                  </p>
                  {issueFormErrors.inventory_date && (
                    <p className="text-[11px] text-rose-500 mt-1">{issueFormErrors.inventory_date}</p>
                  )}
                </div>
              </div>

              {/* Admin Performing Issuance */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issued By (Admin)
                </label>
                <div className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{user?.name || 'Admin User'}</span>
                  <span className="text-slate-400 font-normal">({user?.email || 'admin@hospital.com'})</span>
                </div>
              </div>

              {/* Notes / Purpose */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Procurement Notes / Batch / Supplier Bill No (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Dispensed to ICU Ward 3, Prescription #RX-2026-88, or Bill/Batch Ref"
                  value={issueFormData.notes}
                  onChange={(e) => setIssueFormData({ ...issueFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIssueModal({ isOpen: false, product: null, isSubmitting: false })}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issueModal.isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {issueModal.isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Issuing Stock...</span>
                    </>
                  ) : (
                    <>
                      <Minus className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Less Stock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. INVENTORY DETAILS & STOCK HISTORY MODAL               */}
      {/* ======================================================== */}
      {detailsModal.isOpen && detailsModal.product && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-100 shadow-2xl p-6 sm:p-7 space-y-6 max-h-[92vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                      {detailsModal.product.product_code || `PRD-${String(detailsModal.product.id).padStart(4, '0')}`}
                    </span>
                    {detailsModal.product.category?.name && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {detailsModal.product.category.name}
                      </span>
                    )}
                    {detailsModal.product.brand?.name && (
                      <span className="text-[10px] font-medium text-slate-400">
                        • {detailsModal.product.brand.name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display mt-0.5">
                    {detailsModal.product.product_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive Stock Inflow &amp; Outflow Audit History
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModal({ isOpen: false, product: null, logs: [], isLoading: false })}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <span className="text-[10px] font-semibold uppercase text-slate-500 block">Available Stock</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-bold font-mono text-slate-900">
                    {detailsModal.product.quantity ?? 0}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {detailsModal.product.business_unit || 'Units'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <span className="text-[10px] font-semibold uppercase text-slate-500 block">Min Threshold</span>
                <span className="text-lg font-bold font-mono text-amber-700 mt-0.5 block">
                  {detailsModal.product.low_stock_threshold || 10}
                </span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <span className="text-[10px] font-semibold uppercase text-slate-500 block">Avg / Buy Price</span>
                <span className="text-lg font-bold font-mono text-slate-800 mt-0.5 block">
                  ₹{Number(detailsModal.product.calculated_average_price ?? detailsModal.product.average_price ?? detailsModal.product.buy_price ?? 0).toFixed(2)}
                </span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <span className="text-[10px] font-semibold uppercase text-slate-500 block">MRP / Retail</span>
                <span className="text-lg font-bold font-mono text-emerald-700 mt-0.5 block">
                  ₹{Number(detailsModal.product.mrp ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Scrollable Audit Log History */}
            <div className="flex-1 overflow-y-auto space-y-3 min-h-[220px] custom-scrollbar pr-1">
              <div className="flex items-center justify-between pb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Stock Addition &amp; Issuance History</span>
                </h4>
                <span className="text-[11px] font-mono text-slate-400">
                  {detailsModal.logs.length} record{detailsModal.logs.length !== 1 ? 's' : ''} found
                </span>
              </div>

              {detailsModal.isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs">Loading transaction logs...</span>
                </div>
              ) : detailsModal.logs.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <Package className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No stock logs recorded yet</p>
                  <div className="text-[11px] text-slate-500 space-y-1">
                    {detailsModal.product.inventory_updated_at && (
                      <p>
                        Initial Stock Added: <strong>{detailsModal.product.last_added_quantity ?? detailsModal.product.quantity} {detailsModal.product.business_unit}</strong> on{' '}
                        {new Date(detailsModal.product.inventory_updated_at).toLocaleDateString()}
                        {detailsModal.product.inventory_updater?.name ? ` by ${detailsModal.product.inventory_updater.name}` : ''}
                      </p>
                    )}
                    {detailsModal.product.last_issued_at && (
                      <p className="text-amber-700">
                        Last Issued: <strong>-{detailsModal.product.last_issued_quantity} {detailsModal.product.business_unit}</strong> on{' '}
                        {new Date(detailsModal.product.last_issued_at).toLocaleDateString()}
                        {detailsModal.product.issue_issuer?.name ? ` by ${detailsModal.product.issue_issuer.name}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
                  {detailsModal.logs.map((log) => {
                    const isIssue = log.type === 'issue' || (log.quantity ?? 0) < 0;
                    const qtyVal = Math.abs(log.quantity ?? 0);
                    const unit = log.business_unit || detailsModal.product.business_unit || 'Units';
                    const adminName = log.admin?.name || 'Administrator';
                    const adminEmail = log.admin?.email || '';
                    const dateStr = log.created_at ? new Date(log.created_at).toLocaleString() : '—';
                    const vendorName = log.vendor?.vendor_name || (log.vendor?.company_name ? `${log.vendor.vendor_name} (${log.vendor.company_name})` : null);

                    return (
                      <div
                        key={log.id}
                        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          isIssue ? 'hover:bg-amber-50/40' : 'hover:bg-emerald-50/40'
                        }`}
                      >
                        {/* Left: Action badge & Performed By */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                              isIssue
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isIssue ? <MinusCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  isIssue
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isIssue ? 'Stock Issued / Lessed' : 'Stock Added'}
                              </span>

                              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>{adminName}</span>
                                {adminEmail && <span className="text-slate-400 font-normal text-[10px]">({adminEmail})</span>}
                              </span>
                            </div>

                            {/* Date and Vendor / Notes info */}
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1 font-mono text-slate-600">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {dateStr}
                              </span>

                              {vendorName && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-600">
                                    Supplier: <strong>{vendorName}</strong>
                                  </span>
                                </>
                              )}

                              {log.buy_price && Number(log.buy_price) > 0 && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-600 font-mono">
                                    Rate: ₹{Number(log.buy_price).toFixed(2)}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Notes / Reason */}
                            {log.notes && (
                              <p className="text-[11px] text-slate-600 mt-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 inline-block">
                                <span className="font-semibold text-slate-700">Note:</span> {log.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Quantity badge */}
                        <div className="text-right shrink-0 sm:self-center">
                          <span
                            className={`text-sm sm:text-base font-bold font-mono px-2.5 py-1 rounded-xl block ${
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

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setDetailsModal({ isOpen: false, product: null, logs: [], isLoading: false })}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
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
