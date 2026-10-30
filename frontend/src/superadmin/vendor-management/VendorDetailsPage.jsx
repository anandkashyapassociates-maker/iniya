import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Phone,
  Mail,
  AlertCircle,
  Building,
  Pencil,
  Hash,
  CreditCard,
  MapPin,
  Layers,
} from 'lucide-react';
import VendorStatusBadge from './VendorStatusBadge';
import VendorEditModal from './VendorEditModal';
import vendorManagementService from '../services/vendorManagementService';
import { useToast } from '../../context/ToastContext';

export default function VendorDetailsPage() {
  const toast = useToast();

  const [vendorList, setVendorList] = useState([]);
  const [typesList, setTypesList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & search state
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Edit modal state
  const [selectedVendorForEdit, setSelectedVendorForEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await vendorManagementService.getVendors({
        search: activeSearch,
        vendor_type: typeFilter !== 'all' ? typeFilter : undefined,
        status: statusFilter,
        page,
        per_page: perPage,
        sort_by: 'created_at',
        sort_direction: 'desc',
      });

      setVendorList(res.data || []);
      setPagination({
        current_page: res.current_page || 1,
        last_page: res.last_page || 1,
        total: res.total || 0,
        from: res.from || 0,
        to: res.to || 0,
        per_page: res.per_page || perPage,
      });
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Unable to load vendor records. Please check database connectivity.');
      toast.error('Failed to load vendor records.');
    } finally {
      setIsLoading(false);
    }
  }, [activeSearch, typeFilter, statusFilter, page, perPage, toast]);

  // Load vendor types
  useEffect(() => {
    vendorManagementService
      .getVendorTypes()
      .then((data) => {
        if (Array.isArray(data)) {
          setTypesList(data);
        } else if (Array.isArray(data?.types)) {
          setTypesList(data.types);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchInput.trim());
  };

  const handleStatusFilterChange = (newStatus) => {
    setPage(1);
    setStatusFilter(newStatus);
  };

  const handleTypeFilterChange = (e) => {
    setPage(1);
    setTypeFilter(e.target.value);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setActiveSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const handleOpenEditModal = (vendor) => {
    setSelectedVendorForEdit(vendor);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedVendorForEdit(null);
  };

  const handleEditSuccess = (updatedVendor) => {
    setVendorList((prev) =>
      prev.map((v) => (v.id === updatedVendor.id ? { ...v, ...updatedVendor } : v))
    );
    fetchVendors();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/superadmin/dashboard" className="hover:text-slate-900 transition-colors">
          Superadmin
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-600">Vendor Management</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-blue-600 font-semibold">Vendor Details</span>
      </nav>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Vendor Details
            </h1>
            {pagination && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {pagination.total} {pagination.total === 1 ? 'Vendor' : 'Vendors'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Directory of approved procurement suppliers provisioned from the dedicated{' '}
            <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">
              vendors
            </code>{' '}
            table.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchVendors}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Table"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/superadmin/vendors/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Vendor</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search code, name, company, email, GST..."
              className="w-full pl-10 pr-20 py-2 text-xs bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
            {/* Vendor Type Filter */}
            <div className="relative min-w-[150px] w-full sm:w-auto">
              <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={typeFilter}
                onChange={handleTypeFilterChange}
                className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-slate-50 text-slate-800 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer"
              >
                <option value="all">All Vendor Types</option>
                {typesList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto justify-center overflow-x-auto">
              {['all', 'active', 'inactive', 'blocked'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleStatusFilterChange(tab)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer capitalize whitespace-nowrap ${
                    statusFilter === tab
                      ? tab === 'active'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : tab === 'inactive'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : tab === 'blocked'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab}
                </button>
              ))}
            </div>

            {/* Reset Filters */}
            {(activeSearch || typeFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center gap-3 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
            <button
              onClick={fetchVendors}
              className="ml-auto underline font-bold hover:text-rose-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Vendor Code</th>
                <th className="py-3 px-4">Vendor / Company</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">GST / PAN</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-slate-500">
                        Loading vendor accounts...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : vendorList.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Truck className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">No Vendors Found</span>
                      <p className="text-xs text-slate-400">
                        {activeSearch || typeFilter !== 'all' || statusFilter !== 'all'
                          ? 'No vendor profiles match the selected search or filter criteria.'
                          : 'No vendors have been registered in the system yet.'}
                      </p>
                      {activeSearch || typeFilter !== 'all' || statusFilter !== 'all' ? (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      ) : (
                        <Link
                          to="/superadmin/vendors/create"
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Register First Vendor</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                vendorList.map((vendor, idx) => {
                  const rowNumber = pagination
                    ? (pagination.current_page - 1) * pagination.per_page + idx + 1
                    : idx + 1;

                  return (
                    <tr
                      key={vendor.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* # */}
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {rowNumber}
                      </td>

                      {/* Vendor Code */}
                      <td className="py-3 px-4 font-medium">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono text-[11px] font-bold border border-blue-200/70">
                          <Hash className="w-3 h-3 text-blue-500" />
                          {vendor.vendor_code}
                        </span>
                      </td>

                      {/* Vendor / Company Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {vendor.vendor_name}
                        </div>
                        {vendor.company_name && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{vendor.company_name}</span>
                          </div>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {vendor.vendor_type || 'General'}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]" title={vendor.email}>
                            {vendor.email}
                          </span>
                        </div>
                        {vendor.contact_person && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Attn: {vendor.contact_person}
                          </div>
                        )}
                      </td>

                      {/* Mobile */}
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{vendor.mobile}</span>
                        </div>
                      </td>

                      {/* GST / PAN */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {vendor.gst_number ? (
                          <div className="font-bold text-slate-800">
                            GST: <span className="text-blue-700">{vendor.gst_number}</span>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[10px]">No GST</div>
                        )}
                        {vendor.pan_number && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            PAN: <span className="font-medium text-slate-700">{vendor.pan_number}</span>
                          </div>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-slate-600">
                        {vendor.city || vendor.state ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {[vendor.city, vendor.state].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <VendorStatusBadge status={vendor.status} size="small" />
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {vendor.created_at
                              ? new Date(vendor.created_at).toLocaleDateString()
                              : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(vendor)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-600 text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                          title="Edit Vendor"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        {pagination && pagination.total > 0 && (
          <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="font-bold text-slate-900">{pagination.from || 1}</strong> to{' '}
                <strong className="font-bold text-slate-900">
                  {pagination.to || vendorList.length}
                </strong>{' '}
                of <strong className="font-bold text-slate-900">{pagination.total}</strong> results
              </span>

              {/* Per page selector */}
              <div className="ml-4 flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Per page:</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.current_page <= 1 || isLoading}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="px-3 py-1 text-xs font-bold text-slate-700">
                Page {pagination.current_page} of {pagination.last_page}
              </div>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                disabled={pagination.current_page >= pagination.last_page || isLoading}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Vendor Modal */}
      {selectedVendorForEdit && (
        <VendorEditModal
          vendor={selectedVendorForEdit}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
