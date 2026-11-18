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
  Eye,
  Hash,
  MapPin,
  Compass,
} from 'lucide-react';
import StaffStatusBadge from './StaffStatusBadge';
import StaffAvatar from '../../components/StaffAvatar';
import staffManagementService from '../services/staffManagementService';
import clinicManagementService from '../services/clinicManagementService';
import { useToast } from '../../context/ToastContext';
import { useAdminAuth } from '../../features/auth/AdminAuthContext';
import { getImageUrl } from '../../utils/imageUrl';

const formatJoiningDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const raw = String(dateString).split('T')[0];
    const parts = raw.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      }
    }
    const fallbackDate = new Date(dateString);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    return raw;
  } catch {
    return dateString;
  }
};

const COMMON_DEPARTMENTS = [
  'Dental',
  'Dermatology',
  'Physiotherapy',
  'Aesthetics & Cosmetology',
  'Trichology (Hair Care)',
  'General Medicine / OPD',
  'Plastic & Cosmetic Surgery',
  'Nutrition & Dietetics',
  'Ayurveda & Wellness',
  'Orthopedics',
  'Gynecology & Obstetrics',
  'Pediatrics',
  'Cardiology',
  'ENT (Ear, Nose, Throat)',
  'Ophthalmology',
  'Psychiatry & Psychology',
  'Radiology & Diagnostics',
  'Pathology & Laboratory',
  'Nursing & Patient Care',
  'Pharmacy',
  'Clinical Administration',
];

export default function StaffDetailsPage() {
  const toast = useToast();
  const { setSession } = useAdminAuth();

  const [staffList, setStaffList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState(COMMON_DEPARTMENTS);
  const [clinicsList, setClinicsList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loggingInStaffId, setLoggingInStaffId] = useState(null);

  // Filters & search state
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [clinicFilter, setClinicFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await staffManagementService.getStaff({
        search: activeSearch,
        clinic_id: clinicFilter !== 'all' ? clinicFilter : undefined,
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
  }, [activeSearch, clinicFilter, departmentFilter, statusFilter, page, perPage, toast]);

  // Load departments and clinics on mount
  useEffect(() => {
    staffManagementService
      .getDepartments()
      .then((data) => {
        if (Array.isArray(data)) {
          const merged = Array.from(new Set([...COMMON_DEPARTMENTS, ...data])).filter(Boolean);
          setDepartmentsList(merged);
        }
      })
      .catch(() => { });

    clinicManagementService
      .getClinicOptions()
      .then((res) => {
        if (Array.isArray(res.clinics)) {
          setClinicsList(res.clinics);
        }
      })
      .catch(() => { });
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

  const handleClinicFilterChange = (e) => {
    setPage(1);
    setClinicFilter(e.target.value);
  };

  const handleDepartmentFilterChange = (e) => {
    setPage(1);
    setDepartmentFilter(e.target.value);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setActiveSearch('');
    setClinicFilter('all');
    setDepartmentFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const handleLoginAsStaff = async (member) => {
    if (member.status === 'blocked') {
      toast.error(`Cannot login as '${member.name}': Account is blocked.`);
      return;
    }
    if (!member.is_active || member.status === 'inactive') {
      toast.error(`Cannot login as '${member.name}': Account is inactive.`);
      return;
    }

    // Pre-open tab synchronously on user action to prevent browser popup blockers
    const newTab = window.open('about:blank', '_blank');

    setLoggingInStaffId(member.id);
    try {
      const res = await staffManagementService.impersonateStaff(member.id);

      // Store in localStorage for both Admin & Staff fallback keys
      localStorage.setItem('admin_token', res.token);
      localStorage.setItem('admin_user', JSON.stringify(res.user));
      localStorage.setItem('staff_token', res.token);
      localStorage.setItem('staff_user', JSON.stringify(res.user));
      localStorage.setItem('clinic_active_role', 'staff');
      localStorage.setItem(
        'admin_impersonated_by_superadmin',
        JSON.stringify(res.impersonated_by || { active: true, staff_id: member.id })
      );

      // Directly set sessionStorage on newTab if accessible
      try {
        if (newTab && newTab.sessionStorage) {
          newTab.sessionStorage.setItem('clinic_tab_token', res.token);
          newTab.sessionStorage.setItem('clinic_tab_user', JSON.stringify(res.user));
          newTab.sessionStorage.setItem('clinic_tab_role', 'staff');
        }
      } catch (e) {
        // Safe to ignore
      }

      if (setSession) {
        setSession(res.token, res.user);
      }

      toast.success(`Logged in as Staff '${member.name}'! Staff portal opened in next tab.`);

      if (newTab) {
        newTab.location.href = '/admin/dashboard';
      } else {
        window.open('/admin/dashboard', '_blank');
      }
    } catch (err) {
      if (newTab) {
        newTab.close();
      }
      toast.error(err.response?.data?.message || `Failed to log in as ${member.name}.`);
    } finally {
      setLoggingInStaffId(null);
    }
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 via-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0 icon-3d shadow-md shadow-emerald-500/20">
              <UserCheck className="w-6 h-6 drop-shadow-sm" />
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
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3.5">
        {/* ROW 1: Search and Select Dropdowns (Top Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} className="relative lg:col-span-6 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search code, name, email, mobile..."
              className="w-full pl-10 pr-20 py-2.5 text-xs bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium shadow-2xs"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors shadow-2xs"
            >
              Search
            </button>
          </form>

          {/* Clinic Filter Dropdown */}
          <div className="relative lg:col-span-3 min-w-0">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={clinicFilter}
              onChange={handleClinicFilterChange}
              className="w-full pl-10 pr-8 py-2.5 text-xs bg-slate-50 text-slate-800 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer font-medium shadow-2xs"
            >
              <option value="all">All Clinics (Branches)</option>
              {clinicsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.clinic_code})
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter Dropdown */}
          <div className="relative lg:col-span-3 min-w-0">
            <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={departmentFilter}
              onChange={handleDepartmentFilterChange}
              className="w-full pl-10 pr-8 py-2.5 text-xs bg-slate-50 text-slate-800 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer font-medium shadow-2xs"
            >
              <option value="all">All Departments</option>
              {departmentsList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ROW 2: Status Tabs (Bottom Row) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
              Status:
            </span>
            <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-2xs">
              <button
                type="button"
                onClick={() => handleStatusFilterChange('all')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('active')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'active' || statusFilter === 'true'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Active</span>
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('inactive')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'inactive' || statusFilter === 'false'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Inactive</span>
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('blocked')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'blocked'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Blocked</span>
              </button>
            </div>
          </div>

          {/* Active Filter Badges & Reset Button */}
          {(activeSearch || clinicFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-600 text-[11px]">Filtered by:</span>
              {activeSearch && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium">
                  "{activeSearch}"
                </span>
              )}
              {clinicFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-medium">
                  Clinic: {clinicsList.find((c) => String(c.id) === String(clinicFilter))?.name || `#${clinicFilter}`}
                </span>
              )}
              {departmentFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium">
                  {departmentFilter}
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] capitalize font-medium">
                  {statusFilter}
                </span>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
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
                  <th className="py-3.5 px-4 w-14 text-center whitespace-nowrap">Sr. No.</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[120px]">Staff Code</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[210px]">Clinic &amp; Branch</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[190px]">Location</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[160px]">Full Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[180px]">Email</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">Mobile</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">Department</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">Designation</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[120px]">Employment</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">Joining Date</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">Status</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[90px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {staffList.map((member, index) => (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Sr. No. */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-medium">
                        {(pagination?.from || 1) + index}
                      </span>
                    </td>

                    {/* Staff Code */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs whitespace-nowrap tracking-wide">
                        <Hash className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>{member.staff_code}</span>
                      </span>
                    </td>

                    {/* Clinic & Branch (Without Clinic Code) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {member.clinic ? (
                        <div className="flex flex-col gap-1 min-w-[200px]">
                          <span className="font-bold text-slate-900 text-xs">
                            {member.clinic.name}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/90 shadow-2xs w-fit">
                            <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>{member.clinic.branch_name || 'Main Branch'}</span>
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Dedicated Location Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {member.clinic?.location || member.clinic?.city ? (
                        <div className="flex items-center gap-1.5 text-slate-700 text-xs font-medium">
                          <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span title={member.clinic.address || member.clinic.location}>
                            {member.clinic.location || member.clinic.city}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not recorded</span>
                      )}
                    </td>

                    {/* Full Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <StaffAvatar staff={member} size="md" />
                        <span className="font-bold text-slate-900">{member.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{member.email}</span>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
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
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {member.department ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {member.department}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Designation */}
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      {member.designation || <span className="text-slate-400">—</span>}
                    </td>

                    {/* Employment Type */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-slate-600">
                        {member.employment_type || 'Full-Time'}
                      </span>
                    </td>

                    {/* Joining Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {member.joining_date ? (
                        <div className="inline-flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-[11px]">
                            {formatJoiningDate(member.joining_date)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StaffStatusBadge
                        status={member.status}
                        isActive={member.is_active}
                        size="small"
                      />
                    </td>

                    {/* Actions: View (open staff panel) & Edit */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleLoginAsStaff(member)}
                          disabled={loggingInStaffId === member.id || member.status === 'blocked' || !member.is_active}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                            member.status === 'blocked' || !member.is_active
                              ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                              : 'border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 hover:text-blue-800'
                          }`}
                          title={
                            member.status === 'blocked'
                              ? 'Account blocked - cannot view'
                              : !member.is_active
                              ? 'Account inactive - cannot view'
                              : `View Staff Portal as ${member.name} (Opens in next tab)`
                          }
                        >
                          <Eye className={`w-3.5 h-3.5 ${loggingInStaffId === member.id ? 'animate-spin' : ''}`} />
                          <span>{loggingInStaffId === member.id ? 'Opening...' : 'View'}</span>
                        </button>

                        <Link
                          to={`/superadmin/staff-management/${member.id}/edit`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                          title={`Edit Staff ${member.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-400" />
                          <span>Edit</span>
                        </Link>
                      </div>
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
    </div>
  );
}

