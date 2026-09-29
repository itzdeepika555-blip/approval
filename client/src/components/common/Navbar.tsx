import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApplication } from '../../context/ApplicationContext';
import {
  Bell,
  LogOut,
  Menu,
  X,
  Shield,
  User as UserIcon,
  CheckCircle2,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { notifications, markNotificationRead, profile } = useApplication();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isOfficerOrAdmin = user?.role === 'OFFICER' || user?.role === 'ADMIN';

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800">
      {/* Top micro-bar for Government of Maharashtra branding */}
      <div className="bg-slate-950 py-1.5 px-4 sm:px-6 lg:px-8 text-[11px] text-gray-400 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-gray-300">
            Government of Maharashtra • Industry, Energy & Labour Department
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-gray-300 text-[11px]">
          <span>Single Window Regulatory Portal</span>
          <span>•</span>
          <span className="text-amber-400 font-medium">Right to Public Services (RTS) Act 2015</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 shadow-md group-hover:scale-105 transition transform shrink-0">
            <span className="text-base tracking-tighter">MH</span>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>MAITRI 2.0 • SIH26130</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white tracking-tight group-hover:text-amber-200 transition">
              Industrial Compliance Navigator
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
          <Link
            to="/"
            className={`hover:text-amber-300 transition py-1 ${
              location.pathname === '/' ? 'text-amber-400 border-b-2 border-amber-400 font-bold' : 'text-gray-300'
            }`}
          >
            Home
          </Link>

          {isAuthenticated && user ? (
            <>
              {user.role === 'CITIZEN' ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`hover:text-amber-300 transition py-1 ${
                      location.pathname === '/dashboard' || location.pathname.startsWith('/application')
                        ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
                        : 'text-gray-300'
                    }`}
                  >
                    My Applications
                  </Link>

                  <Link
                    to="/schemes"
                    className={`hover:text-amber-300 transition py-1 ${
                      location.pathname === '/schemes'
                        ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
                        : 'text-gray-300'
                    }`}
                  >
                    Schemes & Incentives
                  </Link>
                </>
              ) : (
                <Link
                  to="/officer/dashboard"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Officer Scrutiny Desk
                </Link>
              )}
            </>
          ) : (
            <Link
              to="/schemes"
              className={`hover:text-amber-300 transition py-1 ${
                location.pathname === '/schemes' ? 'text-amber-400 border-b-2 border-amber-400 font-bold' : 'text-gray-300'
              }`}
            >
              Schemes & Subsidies
            </Link>
          )}
        </nav>

        {/* Right Action Icons & Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setProfileOpen(false);
                  }}
                  className="p-2 rounded-xl bg-slate-800 text-gray-300 hover:text-white hover:bg-slate-700 relative transition cursor-pointer"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 text-slate-900 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Statutory Notifications</span>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                        {unreadCount} unread
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-500">
                          No notifications at this time.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationRead(n.id);
                              if (n.link) {
                                navigate(n.link);
                                setNotificationsOpen(false);
                              }
                            }}
                            className={`p-3 text-xs hover:bg-blue-50 cursor-pointer transition flex items-start gap-2.5 ${
                              !n.read ? 'bg-amber-50/50 font-semibold' : 'text-gray-600'
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                n.type === 'ALERT'
                                  ? 'bg-rose-500'
                                  : n.type === 'WARNING'
                                  ? 'bg-amber-500'
                                  : n.type === 'SUCCESS'
                                  ? 'bg-emerald-500'
                                  : 'bg-blue-500'
                              }`}
                            />
                            <div className="flex-1">
                              <div className="font-bold text-gray-900 flex justify-between">
                                <span>{n.title}</span>
                                <span className="text-[10px] font-normal text-gray-400">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-gray-600 mt-0.5">{n.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Pill & Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-1.5 transition text-left cursor-pointer"
                  title="User Profile"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-gray-100 leading-tight truncate max-w-[120px]">
                      {user.fullName}
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono leading-none">
                      {isOfficerOrAdmin ? user.role : 'Citizen'}
                    </div>
                  </div>
                </button>

                {/* Profile Card Popover */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 text-slate-900 animate-in fade-in slide-in-from-top-2 p-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-sm">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-sm font-extrabold text-gray-900 truncate">
                          {user.fullName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                    </div>

                    <div className="py-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Role:</span>
                        <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                          {user.role}
                        </span>
                      </div>
                      {profile.businessName && (
                        <div className="flex items-center justify-between text-gray-600">
                          <span>Enterprise:</span>
                          <span className="font-bold text-gray-900 truncate max-w-[140px]">
                            {profile.businessName}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Status:</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          handleLogout();
                        }}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl bg-rose-950/40 text-rose-300 hover:text-white hover:bg-rose-900 transition flex items-center gap-1 text-xs cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline font-semibold">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs text-gray-200 hover:text-white hover:bg-slate-800 rounded-xl transition font-medium"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-3.5 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm transition"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-gray-300 hover:text-white cursor-pointer"
            aria-label="Open Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Responsive Menu) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-t border-slate-800 px-4 py-4 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-gray-300 hover:text-amber-400 py-1"
          >
            Home
          </Link>

          {isAuthenticated && user ? (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              {user.role === 'CITIZEN' ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm font-semibold text-gray-300 hover:text-amber-400 py-1"
                  >
                    My Applications
                  </Link>
                  <Link
                    to="/schemes"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm font-semibold text-gray-300 hover:text-amber-400 py-1"
                  >
                    Schemes & Incentives
                  </Link>
                </>
              ) : (
                <Link
                  to="/officer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-bold text-amber-400 py-1"
                >
                  Officer Scrutiny Desk
                </Link>
              )}

              {/* User Profile Summary */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white">{user.fullName}</span>
                </div>
                <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded font-mono">
                  {user.role}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left text-sm font-semibold text-rose-400 py-1 flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <Link
                to="/schemes"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-gray-300 hover:text-amber-400 py-1"
              >
                Schemes & Subsidies
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-gray-300 hover:text-amber-400 py-1"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-bold text-amber-400 py-1"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
