import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, User, LogOut, CheckCircle2, Building2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import LiveClock from '../components/LiveClock';
import { getImageUrl } from '../utils/imageUrl';

export default function Topbar({
  role = 'admin',
  user,
  onLogout,
  onOpenMobileSidebar,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isSuperAdmin = role === 'superadmin';

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-3 sm:px-6 relative flex items-center justify-between">
      {/* Left zone: Mobile Sidebar Toggle & Operational Status Pill */}
      <div className="flex items-center gap-2 sm:gap-3 z-10 shrink-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open Navigation Menu"
          className="lg:hidden p-1.5 sm:p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Operational Status Pill */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold micro-label whitespace-nowrap shadow-2xs ${
            isSuperAdmin
              ? 'bg-purple-50 text-purple-700 border border-purple-200/80'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
          }`}
        >
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="hidden sm:inline">{isSuperAdmin ? 'Clinic Governance HQ' : 'OPD Live • Doctors On Duty'}</span>
          <span className="sm:hidden">{isSuperAdmin ? 'HQ' : 'OPD Live'}</span>
        </span>
      </div>

      {/* Center zone: Live Clock & Clean Calendar (Centered on Desktop & Mobile) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 pointer-events-auto flex items-center justify-center">
        <LiveClock />
      </div>

      {/* Right zone: Profile dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 z-10">
        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 rounded-2xl hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shadow-xs font-display overflow-hidden shrink-0 ${
                isSuperAdmin
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                  : user?.role === 'staff'
                  ? 'bg-gradient-to-tr from-teal-500 to-emerald-600'
                  : 'bg-gradient-to-tr from-blue-600 to-cyan-500'
              }`}
            >
              {user?.image_url || user?.profile_photo || user?.image ? (
                <img src={getImageUrl(user.image_url || user.profile_photo || user.image)} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div className="hidden md:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-800 block leading-tight font-display tracking-tight max-w-[120px] truncate">
                  {user?.name || (isSuperAdmin ? 'Super Administrator' : 'Administrator')}
                </span>
                {user?.role === 'staff' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                    Staff
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 block font-mono max-w-[120px] truncate">
                {user?.email || (isSuperAdmin ? 'superadmin@example.com' : 'admin@example.com')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-semibold text-slate-800 font-display tracking-tight truncate">{user?.name}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                    user?.role === 'staff'
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : isSuperAdmin
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {user?.role === 'staff' ? 'Staff' : isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate font-mono">{user?.email}</p>
                {user?.department && (
                  <p className="text-[10px] text-slate-500 mt-0.5">{user.department} {user.staff_code ? `• ${user.staff_code}` : ''}</p>
                )}
                {user?.clinic ? (
                  <div className="mt-2 p-2 rounded-xl bg-blue-50/70 border border-blue-200/70 text-[11px]">
                    <div className="flex items-center justify-between gap-1 text-blue-900 font-bold">
                      <span className="truncate">{user.clinic.name}</span>
                      <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded text-blue-700 font-bold border border-blue-200 shrink-0">
                        {user.clinic.clinic_code}
                      </span>
                    </div>
                    {(user.clinic.branch_name || user.clinic.location) && (
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {user.clinic.branch_name ? user.clinic.branch_name : ''}
                        {user.clinic.branch_name && user.clinic.location ? ' • ' : ''}
                        {user.clinic.location || ''}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Authenticated Clinic Session</span>
                  </div>
                )}
              </div>

              <div className="py-1">
                <Link
                  to={isSuperAdmin ? '/superadmin/profile' : '/admin/profile'}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
