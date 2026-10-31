import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  UserPlus,
  Search,
  Filter,
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
} from 'lucide-react';
import StaffStatusBadge from './StaffStatusBadge';
import StaffEditModal from './StaffEditModal';
import staffManagementService from '../services/staffManagementService';
import { useToast } from '../../context/ToastContext';

export default function StaffDetailsPage() {
  const toast = useToast();

  const [staffList, setStaffList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & search state
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Edit modal state
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await staffManagementService.getStaff({
        search: activeSearch,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        status: statusFilter,
        page,
        per_page: perPage,
        sort_by: 'created_at',
        sort_direction: 'desc',
      });

      setStaffList(res.data || []);
      setPagination({
        current_page: res.current_page || 1,
        last_page: res.last_page || 1,
        total: res.total || 0,
        from: res.from || 0,
        to: res.to || 0,
        per_page: res.per_page || perPage,
      });
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Unable to load staff records. Please check database connectivity.');
      toast.error('Failed to load staff accounts.');
    } finally {
      setIsLoading(false);
    }
  }, [activeSearch, departmentFilter, statusFilter, page, perPage, toast]);

  // Load departments once
  useEffect(() => {
    staffManagementService
      .getDepartments()
      .then((data) => {
        if (Array.isArray(data)) setDepartmentsList(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

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

  const handleResetFilters = () => {
    setSearchInput('');
    setActiveSearch('');
    setDepartmentFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const handleOpenEditModal = (staffMember) => {
    setSelectedStaffForEdit(staffMember);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedStaffForEdit(null);
  };

  const handleEditSuccess = (updatedStaff) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === updatedStaff.id ? { ...s, ...updatedStaff } : s))
    );
    fetchStaff();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/superadmin/dashboard" className="hover:text-slate-900 transition-colors">
          Superadmin
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-600">Staff Management</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-blue-600 font-semibold">Staff Details</span>
      </nav>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight">
              Staff Details
            </h1>
            {pagination && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {pagination.total} {pagination.total === 1 ? 'Staff Member' : 'Staff Members'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Directory of organizational personnel provisioned from the dedicated{' '}
            <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">
              staff
            </code>{' '}
            table.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchStaff}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Table"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/superadmin/staff-management/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Staff</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by code, name, email, mobile..."
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
            <div className="relative min-w-[160px] w-full sm:w-auto">
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

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto justify-center overflow-x-auto">
              <button
                type="button"
                onClick={() => handleStatusFilterChange('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('active')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'active' || statusFilter === 'true'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('inactive')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'inactive' || statusFilter === 'false'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Inactive
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('blocked')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'blocked'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Blocked
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Badges */}
        {(activeSearch || departmentFilter !== 'all' || statusFilter !== 'all') && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-700">Active filters:</span>
              {activeSearch && (
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px]">
                  Keyword: "{activeSearch}"
                </span>
              )}
              {departmentFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px]">
                  Department: {departmentFilter}
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[11px] capitalize">
                  Status: {statusFilter}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline shrink-0"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <span className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Loading staff records...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{error}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't retrieve the table data. Please verify database connectivity and try again.
            </p>
            <button
              type="button"
              onClick={fetchStaff}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : staffList.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Staff Records Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {activeSearch || departmentFilter !== 'all' || statusFilter !== 'all'
                ? 'No staff members match your current filter criteria. Try clearing the filters.'
                : 'No staff profiles have been provisioned yet. Add your first team member to begin.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              {activeSearch || departmentFilter !== 'all' || statusFilter !== 'all' ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : null}
              <Link
                to="/superadmin/staff-management/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Staff Record</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Populated Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-14 text-center">Sr. No.</th>
                  <th className="py-3.5 px-4">Staff Code</th>
                  <th className="py-3.5 px-4">Full Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Mobile</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Designation</th>
                  <th className="py-3.5 px-4">Employment</th>
                  <th className="py-3.5 px-4">Joining Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {staffList.map((member, index) => (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Sr. No. */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-medium">
                        {(pagination?.from || 1) + index}
                      </span>
                    </td>

                    {/* Staff Code */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
                        {member.staff_code}
                      </span>
                    </td>

                    {/* Full Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {member.name ? member.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <span className="font-bold text-slate-900">{member.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{member.email}</span>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {member.mobile ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{member.mobile}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not recorded</span>
                      )}
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      {member.department ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {member.department}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Designation */}
                    <td className="py-3.5 px-4 text-slate-700">
                      {member.designation || <span className="text-slate-400">—</span>}
                    </td>

                    {/* Employment Type */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="text-[11px] font-medium text-slate-600">
                        {member.employment_type || 'Full-Time'}
                      </span>
                    </td>

                    {/* Joining Date */}
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {member.joining_date ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{member.joining_date.split('T')[0]}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <StaffStatusBadge
                        status={member.status}
                        isActive={member.is_active}
                        size="small"
                      />
                    </td>

                    {/* Actions: Edit button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(member)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                        title={`Edit Staff ${member.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-400" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-side Pagination Footer */}
        {pagination && pagination.total > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{pagination.from || 1}</span> to{' '}
              <span className="font-bold text-slate-800">{pagination.to || staffList.length}</span>{' '}
              of <span className="font-bold text-slate-800">{pagination.total}</span> records
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={pagination.current_page <= 1 || isLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="px-2 font-mono text-[11px] font-bold text-slate-700">
                Page {pagination.current_page} of {pagination.last_page}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(p + 1, pagination.last_page))}
                disabled={pagination.current_page >= pagination.last_page || isLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Staff Modal */}
      {selectedStaffForEdit && (
        <StaffEditModal
          staff={selectedStaffForEdit}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

