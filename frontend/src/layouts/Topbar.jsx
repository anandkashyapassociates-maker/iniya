import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, User, LogOut, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left side: Mobile Toggle & Clinic Context Pill */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold micro-label ${
              isSuperAdmin
                ? 'bg-purple-50 text-purple-700 border border-purple-200/80'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {isSuperAdmin ? 'Hospital Governance HQ' : 'OPD Live • Doctors On Duty'}
          </span>
        </div>
      </div>

      {/* Right side: Status & Profile dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shadow-xs font-display ${
                isSuperAdmin
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                  : 'bg-gradient-to-tr from-blue-600 to-cyan-500'
              }`}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-semibold text-slate-800 block leading-tight font-display tracking-tight">
                {user?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                {user?.email || 'admin@example.com'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800 font-display tracking-tight">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate font-mono">{user?.email}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Authenticated Clinic Session</span>
                </div>
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
