import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Plus,
  Search,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Phone,
  Mail,
  AlertCircle,
  Building2,
  Briefcase,
  Pencil,
  Hash,
  MapPin,
  Layers,
  Compass,
  User,
} from 'lucide-react';
import SalesMemberStatusBadge from './SalesMemberStatusBadge';
import SalesMemberEditModal from './SalesMemberEditModal';
import salesMemberManagementService from '../services/salesMemberManagementService';
import { useToast } from '../../context/ToastContext';

export default function SalesMemberDetailsPage() {
  const toast = useToast();

  const [salesList, setSalesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [territoriesList, setTerritoriesList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & search state
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [territoryFilter, setTerritoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Edit modal state
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchSalesMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await salesMemberManagementService.getSalesMembers({
        search: activeSearch,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        territory: territoryFilter !== 'all' ? territoryFilter : undefined,
        status: statusFilter,
        page,
        per_page: perPage,
        sort_by: 'created_at',
        sort_direction: 'desc',
      });

      setSalesList(res.data || []);
      setPagination({
        current_page: res.current_page || 1,
        last_page: res.last_page || 1,
        total: res.total || 0,
        from: res.from || 0,
        to: res.to || 0,
        per_page: res.per_page || perPage,
      });
    } catch (err) {
      console.error('Error fetching sales members:', err);
      setError('Unable to load sales members. Please check database connectivity.');
      toast.error('Failed to load sales team records.');
    } finally {
      setIsLoading(false);
    }
  }, [activeSearch, departmentFilter, territoryFilter, statusFilter, page, perPage, toast]);

  // Load departments and territories
  useEffect(() => {
    salesMemberManagementService
      .getDepartments()
      .then((data) => {
        if (Array.isArray(data)) setDepartmentsList(data);
        else if (Array.isArray(data?.departments)) setDepartmentsList(data.departments);
      })
      .catch(() => {});

    salesMemberManagementService
      .getTerritories()
      .then((data) => {
        if (Array.isArray(data)) setTerritoriesList(data);
        else if (Array.isArray(data?.territories)) setTerritoriesList(data.territories);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSalesMembers();
  }, [fetchSalesMembers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchInput.trim());
  };

  const handleStatusFilterChange = (newStatus) => {
    setPage(1);
    setStatusFilter(newStatus);
  };

  const handleDepartmentFilterChange = (e) => {
    setPage(1);
    setDepartmentFilter(e.target.value);
  };

  const handleTerritoryFilterChange = (e) => {
    setPage(1);
    setTerritoryFilter(e.target.value);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setActiveSearch('');
    setDepartmentFilter('all');
    setTerritoryFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const handleOpenEditModal = (member) => {
    setSelectedMemberForEdit(member);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedMemberForEdit(null);
  };

  const handleEditSuccess = (updatedMember) => {
    setSalesList((prev) =>
      prev.map((m) => (m.id === updatedMember.id ? { ...m, ...updatedMember } : m))
    );
    fetchSalesMembers();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/superadmin/dashboard" className="hover:text-slate-900 transition-colors">
          Superadmin
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-600">Sales Team Management</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-blue-600 font-semibold">Sales Member Details</span>
      </nav>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight">
              Sales Member Details
            </h1>
            {pagination && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {pagination.total} {pagination.total === 1 ? 'Member' : 'Members'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Directory of sales representatives provisioned from the dedicated{' '}
            <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">
              sales_members
            </code>{' '}
            table.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchSalesMembers}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Table"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/superadmin/sales-members/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Sales Member</span>
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
              placeholder="Search code, name, email, territory, city..."
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
            {/* Department Filter */}
            <div className="relative min-w-[140px] w-full sm:w-auto">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={departmentFilter}
                onChange={handleDepartmentFilterChange}
                className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-slate-50 text-slate-800 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Territory Filter */}
            <div className="relative min-w-[130px] w-full sm:w-auto">
              <Compass className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={territoryFilter}
                onChange={handleTerritoryFilterChange}
                className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-slate-50 text-slate-800 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer"
              >
                <option value="all">All Territories</option>
                {territoriesList.map((t) => (
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
            {(activeSearch || departmentFilter !== 'all' || territoryFilter !== 'all' || statusFilter !== 'all') && (
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
              onClick={fetchSalesMembers}
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
                <th className="py-3 px-4 w-14 text-center">Sr. No.</th>
                <th className="py-3 px-4">Sales Code</th>
                <th className="py-3 px-4">Profile</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Territory</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan="14" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-slate-500">
                        Loading sales members...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : salesList.length === 0 ? (
                <tr>
                  <td colSpan="14" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">No Sales Members Found</span>
                      <p className="text-xs text-slate-400">
                        {activeSearch || departmentFilter !== 'all' || territoryFilter !== 'all' || statusFilter !== 'all'
                          ? 'No sales team members match the selected search or filter criteria.'
                          : 'No sales members have been provisioned in the system yet.'}
                      </p>
                      {activeSearch || departmentFilter !== 'all' || territoryFilter !== 'all' || statusFilter !== 'all' ? (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      ) : (
                        <Link
                          to="/superadmin/sales-members/create"
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Provision First Member</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                salesList.map((member, index) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Sr. No. */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-medium">
                        {(pagination?.from || 1) + index}
                      </span>
                    </td>
                    {/* 1. Sales Code */}
                    <td className="py-3 px-4 font-medium whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono text-[11px] font-bold border border-blue-200/70 whitespace-nowrap">
                        <Hash className="w-3 h-3 text-blue-500" />
                        {member.sales_code}
                      </span>
                    </td>

                    {/* 2. Profile Photo / Avatar */}
                    <td className="py-3 px-4">
                      {member.profile_photo ? (
                        <img
                          src={member.profile_photo.startsWith('http') || member.profile_photo.startsWith('blob:') ? member.profile_photo : `/storage/${member.profile_photo}`}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-[11px] font-bold">
                          {member.name ? member.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                      )}
                    </td>

                    {/* 3. Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {member.name}
                      </div>
                      {member.gender && (
                        <span className="text-[10px] text-slate-400 capitalize">
                          {member.gender}
                        </span>
                      )}
                    </td>

                    {/* 4. Email */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]" title={member.email}>
                          {member.email}
                        </span>
                      </div>
                    </td>

                    {/* 5. Mobile */}
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{member.mobile}</span>
                      </div>
                    </td>

                    {/* 6. Designation */}
                    <td className="py-3 px-4 text-slate-700">
                      {member.designation || '—'}
                    </td>

                    {/* 7. Department */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {member.department || 'General'}
                      </span>
                    </td>

                    {/* 8. Territory */}
                    <td className="py-3 px-4">
                      {member.territory ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                          <Compass className="w-3 h-3 text-sky-500 shrink-0" />
                          <span>{member.territory}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>

                    {/* 9. City */}
                    <td className="py-3 px-4 text-slate-600">
                      {member.city || '—'}
                    </td>

                    {/* 10. Joining Date */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {member.joining_date ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(member.joining_date).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* 11. Status */}
                    <td className="py-3 px-4">
                      <SalesMemberStatusBadge status={member.status} size="small" />
                    </td>

                    {/* 12. Created Date */}
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {member.created_at
                        ? new Date(member.created_at).toLocaleDateString()
                        : '—'}
                    </td>

                    {/* 13. Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(member)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-600 text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                        title="Edit Sales Member"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
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
                  {pagination.to || salesList.length}
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

      {/* Edit Sales Member Modal */}
      {selectedMemberForEdit && (
        <SalesMemberEditModal
          member={selectedMemberForEdit}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

