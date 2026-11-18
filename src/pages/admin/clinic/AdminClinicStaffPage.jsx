import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Building2,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Briefcase,
  Eye,
  X,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import adminClinicManagementService from '../../../services/adminClinicManagementService';
import { useAdminAuth } from '../../../features/auth/AdminAuthContext';
import StaffAvatar from '../../../components/StaffAvatar';
import { useToast } from '../../../context/ToastContext';

export default function AdminClinicStaffPage() {
  const { user } = useAdminAuth();
  const toast = useToast();

  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employmentFilter, setEmploymentFilter] = useState('all');
  const [page, setPage] = useState(1);

  // View Modal state
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const clinicInfo = user?.clinic || null;

  // Load staff members for this clinic
  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        per_page: 10,
        search: search.trim() || undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        employment_type: employmentFilter !== 'all' ? employmentFilter : undefined,
        sort_by: 'created_at',
        sort_direction: 'desc',
      };

      const res = await adminClinicManagementService.getStaff(params);
      setStaffList(res.data || []);
      setPagination({
        current_page: res.current_page || 1,
        last_page: res.last_page || 1,
        total: res.total || 0,
        per_page: res.per_page || 10,
      });
    } catch (err) {
      console.error('Failed to load clinic staff:', err);
      toast.error('Failed to load staff list. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, departmentFilter, statusFilter, employmentFilter, toast]);

  // Load departments
  useEffect(() => {
    adminClinicManagementService
      .getStaffDepartments()
      .then((data) => {
        if (Array.isArray(data)) {
          setDepartments(data);
        }
      })
      .catch((err) => console.warn('Could not load departments:', err));
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleResetFilters = () => {
    setSearch('');
    setDepartmentFilter('all');
    setStatusFilter('all');
    setEmploymentFilter('all');
    setPage(1);
  };

  const formatJoiningDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return !isNaN(d.getTime())
        ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : dateString;
    } catch {
      return dateString;
    }
  };

  // KPI calculations on loaded dataset
  const activeCount = staffList.filter((s) => s.status === 'active' || s.is_active).length;
  const inactiveCount = staffList.filter((s) => s.status === 'inactive' || s.status === 'blocked').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <UserCheck className="w-6 h-6 drop-shadow-sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Clinic Staff Details</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Staff Directory
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-700">{clinicInfo?.name || 'Assigned Clinic Branch'}</span>
              {clinicInfo?.clinic_code && (
                <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md">
                  {clinicInfo.clinic_code}
                </span>
              )}
              {clinicInfo?.location && <span>&bull; {clinicInfo.location}</span>}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchStaff()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Staff</span>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{pagination.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Assigned to this clinic</p>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Active Duty</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Current operational</p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Inactive / Leave</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">{inactiveCount}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Off duty or inactive</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Departments</span>
            <Briefcase className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{departments.length || '—'}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Clinical disciplines</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by code, name, mobile, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 font-medium"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Employment Type Filter */}
          <div>
            <select
              value={employmentFilter}
              onChange={(e) => {
                setEmploymentFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 font-medium"
            >
              <option value="all">All Employment Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Consultant">Consultant</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 font-medium"
            >
              <option value="all">Status: All</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="blocked">Blocked Only</option>
            </select>

            {(search || departmentFilter !== 'all' || statusFilter !== 'all' || employmentFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 border border-rose-200"
                title="Reset Filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h2 className="text-sm font-semibold text-slate-800">Staff Records</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {pagination.total} staff members
            </span>
          </div>

          <div className="text-xs text-slate-500">
            Page {pagination.current_page} of {pagination.last_page}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">Sr.</th>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Department &amp; Role</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4 text-center">Employment</th>
                <th className="py-3.5 px-4 text-center">Joining Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <p className="text-xs font-medium">Loading clinic staff...</p>
                    </div>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserCheck className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-medium text-slate-700">No staff members found</p>
                      <p className="text-[11px] text-slate-400">
                        No staff records match the selected filters for this clinic branch.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                staffList.map((item, idx) => {
                  const serialNo = (pagination.current_page - 1) * pagination.per_page + idx + 1;
                  const isActive = item.status === 'active' || item.is_active;
                  const isBlocked = item.status === 'blocked';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">{serialNo}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <StaffAvatar staff={item} size={36} className="shadow-xs shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">
                              {item.staff_code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{item.department || 'General'}</p>
                        <p className="text-[11px] text-slate-500">{item.designation || 'Staff Practitioner'}</p>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        {item.email && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{item.email}</span>
                          </div>
                        )}
                        {item.mobile && (
                          <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.mobile}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {item.employment_type || 'Full-Time'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 whitespace-nowrap">
                        {formatJoiningDate(item.joining_date)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedStaff(item);
                            setIsViewModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer border border-emerald-200/80 shadow-2xs"
                          title="View Staff Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} records
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.current_page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-medium text-slate-700">
                {pagination.current_page} / {pagination.last_page}
              </span>
              <button
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => setPage((p) => Math.min(p + 1, pagination.last_page))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* STAFF PROFILE & DETAILS MODAL                            */}
      {/* ======================================================== */}
      {isViewModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-fade-in">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Staff Member Profile</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedStaff.staff_code}</p>
                </div>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Profile Card */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <StaffAvatar staff={selectedStaff} size={56} className="shadow-md shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-base text-slate-900 truncate">{selectedStaff.name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        selectedStaff.status === 'active' || selectedStaff.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedStaff.status === 'blocked'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {selectedStaff.status === 'active' || selectedStaff.is_active ? 'Active' : selectedStaff.status}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">{selectedStaff.department || 'General'}</p>
                  <p className="text-xs text-slate-500">{selectedStaff.designation || 'Staff Practitioner'}</p>
                </div>
              </div>

              {/* Professional & Contact Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Employment Type</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{selectedStaff.employment_type || 'Full-Time'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Joining Date</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{formatJoiningDate(selectedStaff.joining_date)}</span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Contact Information</span>
                {selectedStaff.email && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{selectedStaff.email}</span>
                  </div>
                )}
                {selectedStaff.mobile && (
                  <div className="flex items-center gap-2 text-slate-700 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selectedStaff.mobile}</span>
                  </div>
                )}
                {selectedStaff.address && (
                  <div className="flex items-start gap-2 text-slate-700 pt-1 border-t border-slate-200/60">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-600 leading-relaxed">{selectedStaff.address}</span>
                  </div>
                )}
              </div>

              {/* Clinic Branch Context */}
              {selectedStaff.clinic && (
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">Assigned Clinic Branch</span>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-white text-emerald-700 border border-emerald-200">
                      {selectedStaff.clinic.clinic_code || 'CLINIC'}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900">{selectedStaff.clinic.name}</p>
                  {(selectedStaff.clinic.branch_name || selectedStaff.clinic.location) && (
                    <p className="text-[11px] text-slate-600">{selectedStaff.clinic.branch_name || selectedStaff.clinic.location}</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
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
