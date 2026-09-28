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
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { notifications, markNotificationRead } = useApplication();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b border-slate-800">
      {/* Top micro-bar for Government branding */}
      <div className="bg-slate-950 py-1 px-4 sm:px-6 lg:px-8 text-[11px] text-gray-400 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Government of Maharashtra • Single Window Regulatory Portal</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-gray-300">
          <span>Toll-Free Helpline: 1800 120 8040</span>
          <span>•</span>
          <span className="text-amber-400 font-medium">Right to Public Services (RTS) Act 2015</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-extrabold text-slate-950 shadow-md group-hover:scale-105 transition transform">
            <span className="text-base tracking-tighter">MH</span>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>MAITRI 2.0 • SIH26130</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white tracking-tight group-hover:text-amber-200 transition">
              Industrial Approval & Support Navigator
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold">
          <Link
            to="/"
            className={`hover:text-amber-300 transition py-1 ${
              location.pathname === '/' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-300'
            }`}
          >
            Home
          </Link>
          <Link
            to="/schemes"
            className={`hover:text-amber-300 transition py-1 ${
              location.pathname === '/schemes' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-300'
            }`}
          >
            Schemes & Incentives
          </Link>

          {isAuthenticated && user && (
            <>
              {user.role === 'CITIZEN' ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`hover:text-amber-300 transition py-1 ${
                      location.pathname === '/dashboard' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-300'
                    }`}
                  >
                    Citizen Desk
                  </Link>
                  <Link
                    to="/start-assessment"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                  >
                    + New Application
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
          )}
        </nav>

        {/* Right Action Icons & Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-lg bg-slate-800 text-gray-300 hover:text-white hover:bg-slate-700 relative transition"
                  aria-label="Notifications"
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
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 text-slate-900 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 bg-slate-900 text-white rounded-t-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">Statutory Notifications</span>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                        {unreadCount} unread
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                      {notifications.map(n => (
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
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Pill */}
              <div className="hidden md:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {user.fullName.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-gray-100 leading-tight truncate max-w-[120px]">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono leading-none">
                    {user.role}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-rose-950/40 text-rose-300 hover:text-white hover:bg-rose-900 transition flex items-center gap-1 text-xs"
                title="Sign out of portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs text-gray-200 hover:text-white hover:bg-slate-800 rounded-lg transition font-medium"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-3.5 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-sm transition"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-800 text-gray-300 hover:text-white"
            aria-label="Open Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-t border-slate-800 px-4 py-4 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-gray-300 hover:text-amber-400 py-1"
          >
            Home
          </Link>
          <Link
            to="/schemes"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-gray-300 hover:text-amber-400 py-1"
          >
            Schemes & Subsidies
          </Link>

          {isAuthenticated && user && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              {user.role === 'CITIZEN' ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm font-semibold text-gray-300 hover:text-amber-400 py-1"
                  >
                    Citizen Dashboard
                  </Link>
                  <Link
                    to="/start-assessment"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm font-bold text-amber-400 py-1"
                  >
                    + Start New Application
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
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left text-sm font-semibold text-rose-400 py-1"
              >
                Logout ({user.email})
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
