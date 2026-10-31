import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Package,
  Layers,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  UserCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
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

  // Edit modal state
  const [editProduct, setEditProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({
    product_name: '',
    category_id: '',
    brand_id: '',
    business_unit: '',
    product_type: '',
    status: 'active',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    product: null,
    isLoading: false,
  });

  // Load dropdown options for filters & edit modal
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

  const handleStatusToggle = async (product) => {
    const nextStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await superAdminInventoryService.updateProductStatus(product.id, nextStatus);
      toast.success(`Product status updated to ${nextStatus}.`);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  const openEditModal = (product) => {
    setEditProduct(product);
    setEditFormData({
      product_name: product.product_name,
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      business_unit: product.business_unit || 'Piece',
      product_unit: product.product_unit || 1,
      product_type: product.product_type || 'Consumable',
      status: product.status || 'active',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editProduct) return;
    setIsUpdating(true);
    try {
      const payload = new FormData();
      payload.append('product_name', editFormData.product_name);
      payload.append('category_id', editFormData.category_id);
      if (editFormData.brand_id) payload.append('brand_id', editFormData.brand_id);
      payload.append('business_unit', editFormData.business_unit);
      payload.append('product_unit', parseInt(editFormData.product_unit, 10) || 1);
      payload.append('product_type', editFormData.product_type);
      payload.append('status', editFormData.status);

      await superAdminInventoryService.updateProduct(editProduct.id, payload);
      toast.success('Product updated successfully.');
      setEditProduct(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update product.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.product) return;
    setDeleteDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await superAdminInventoryService.deleteProduct(deleteDialog.product.id);
      toast.success(res.message || 'Product deleted successfully.');
      setDeleteDialog({ isOpen: false, product: null, isLoading: false });
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product.');
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const columns = [
    {
      header: 'SR. NO.',
      className: 'w-[70px] text-center',
      render: (product, index) => {
        const srNo = (pagination?.from || 1) + index;
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-medium">
            {srNo}
          </span>
        );
      },
    },
    {
      header: 'PRODUCT IDENTIFICATION',
      className: 'w-[28%]',
      render: (product) => (
        <div className="flex items-center gap-3">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.product_name}
              className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0 bg-slate-50"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-medium shadow-2xs shrink-0">
              <Package className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-800 block truncate">
              {product.product_name}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-400 font-normal">
                Unit: <span className="text-slate-700 font-medium">{product.business_unit} ({product.product_unit ?? 1})</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
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
        <span className="text-xs text-slate-700 font-medium">
          {product.category?.name || <span className="text-slate-400 italic">None</span>}
        </span>
      ),
    },
    {
      header: 'BRAND',
      className: 'w-[14%]',
      render: (product) => (
        <span className="text-xs text-slate-600 font-normal">
          {product.brand?.name || <span className="text-slate-400 italic">None</span>}
        </span>
      ),
    },
    {
      header: 'CATALOGED BY ADMIN',
      className: 'w-[18%]',
      render: (product) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-xs shrink-0">
            {product.creator?.name ? product.creator.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-700 block truncate">
              {product.creator?.name || 'Clinic Admin'}
            </span>
            <span className="text-[10px] font-normal text-slate-400 block truncate font-mono">
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
        <button
          type="button"
          onClick={() => handleStatusToggle(product)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
            product.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
          }`}
          title="Click to toggle status"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              product.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span className="capitalize">{product.status}</span>
        </button>
      ),
    },
    {
      header: 'ACTIONS',
      className: 'w-[14%] text-right',
      render: (product, index) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedProduct(product);
              setSelectedIndex((pagination?.from || 1) + index);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => openEditModal(product)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
            title="Edit Product"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteDialog({ isOpen: true, product, isLoading: false })}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Product"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Top Clinical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-medium">
              <Boxes className="w-3.5 h-3.5 text-blue-600" />
              <span>Global Product Registry</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-800 tracking-normal mt-1.5">
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all shadow-2xs cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Table Card (col-12) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
        {/* Search & 4 Filters */}
        <div className="space-y-3">
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-slate-100">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-700 font-normal"
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
              className="px-3 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-700 font-normal"
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
              className="px-3 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-700 font-normal"
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
              className="px-3 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-700 font-normal"
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
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.product_name}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-medium border border-blue-200 shrink-0">
                    <Package className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    {selectedProduct.product_name}
                  </h3>
                  <span className="font-mono text-xs text-slate-400">
                    PRD-{String(selectedProduct.id).padStart(4, '0')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                    Category
                  </span>
                  <p className="font-semibold text-slate-800">
                    {selectedProduct.category?.name || 'None'}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                    Brand
                  </span>
                  <p className="font-semibold text-slate-800">
                    {selectedProduct.brand?.name || 'None'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                    Business Unit
                  </span>
                  <p className="font-semibold text-slate-800">
                    {selectedProduct.business_unit} ({selectedProduct.product_unit ?? 1})
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                    Product Type
                  </span>
                  <p className="font-semibold text-slate-800">
                    {selectedProduct.display_product_type || selectedProduct.product_type}
                  </p>
                </div>
              </div>

              {selectedProduct.creator && (
                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-medium shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-blue-700 font-medium block">
                      Cataloged by {selectedProduct.creator.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {selectedProduct.creator.email}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Edit Product Specifications</h3>
                <p className="text-xs text-slate-400">
                  Editing PRD-{String(editProduct.id).padStart(4, '0')} • Creator Admin preserved
                </p>
              </div>
              <button
                onClick={() => setEditProduct(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  value={editFormData.product_name}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, product_name: e.target.value }))
                  }
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Category *</label>
                  <select
                    value={editFormData.category_id}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, category_id: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Brand</label>
                  <select
                    value={editFormData.brand_id}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, brand_id: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">No Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Business Unit *</label>
                  <select
                    value={editFormData.business_unit}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, business_unit: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="">Select Business Unit</option>
                    {[
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
                    ].map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Product Unit (Integer) *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editFormData.product_unit}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, product_unit: e.target.value }))
                    }
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Product Type *</label>
                  <select
                    value={editFormData.product_type}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, product_type: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Consumable">Consumable</option>
                    <option value="Retail">Retail</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Service">Service</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Status</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={editFormData.status === 'active'}
                      onChange={() => setEditFormData((prev) => ({ ...prev, status: 'active' }))}
                      className="text-blue-600"
                    />
                    <span className="text-slate-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={editFormData.status === 'inactive'}
                      onChange={() => setEditFormData((prev) => ({ ...prev, status: 'inactive' }))}
                      className="text-blue-600"
                    />
                    <span className="text-slate-700">Inactive</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? 'Saving Changes...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Inventory Product?"
        message={`Are you sure you want to delete '${deleteDialog.product?.product_name}'? This action cannot be undone.`}
        confirmText="Delete Product"
        confirmVariant="danger"
        isLoading={deleteDialog.isLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ isOpen: false, product: null, isLoading: false })}
      />
    </div>
  );
}

