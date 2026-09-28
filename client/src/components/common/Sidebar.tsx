import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  FileCheck2,
  ShieldCheck,
  FolderLock,
  GitFork,
  ClockAlert,
  CalendarDays,
  Sparkles,
  RefreshCw,
  Award,
  ScanEye,
  CheckSquare,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const { user } = useAuth();
  const isOfficer = user?.role === 'OFFICER' || user?.role === 'ADMIN';

  const citizenNav = [
    { section: 'DASHBOARD' },
    { name: 'Citizen Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Business Profile', to: '/business-profile', icon: Building2 },

    { section: 'APPLICATION ENGINE' },
    { name: 'Smart Assessment', to: '/start-assessment', icon: Sparkles },
    { name: 'Applicable Approvals', to: '/applicable-approvals', icon: CheckSquare },
    { name: 'Required Documents', to: '/document-checklist', icon: FileCheck2 },
    { name: 'AI Doc Verification', to: '/document-verification', icon: ScanEye },
    { name: 'Verified Wallet', to: '/wallet', icon: FolderLock },
    { name: 'Review & Submit', to: '/application/review', icon: ShieldCheck },

    { section: 'PROCESSING & CLEARANCE' },
    { name: 'Parallel Department Scrutiny', to: '/application/tracking', icon: GitFork },
    { name: 'Approval Tracker & SLA', to: '/sla-tracker', icon: ClockAlert },
    { name: 'Common Joint Inspection', to: '/inspections', icon: CalendarDays },

    { section: 'GROWTH & COMPLIANCE' },
    { name: 'Schemes & Subsidies', to: '/schemes', icon: Award },
    { name: 'Compliance & Renewal', to: '/compliance-renewals', icon: RefreshCw },
  ];

  const officerNav = [
    { section: 'SCRUTINY DESK' },
    { name: 'Officer Dashboard', to: '/officer/dashboard', icon: LayoutDashboard },
    { name: 'Parallel Processing Monitor', to: '/application/tracking', icon: GitFork },
    { name: 'Joint Inspection Schedule', to: '/inspections', icon: CalendarDays },
    { name: 'Statutory SLA Alerts', to: '/sla-tracker', icon: ClockAlert },
    { name: 'AI Verification Desk', to: '/document-verification', icon: ScanEye },
    { name: 'Schemes Catalog', to: '/schemes', icon: Award },
  ];

  const adminNav = [
    { section: 'ADMINISTRATION & CONTROL' },
    { name: 'State Control Center', to: '/admin/dashboard', icon: ShieldCheck },
    { name: 'Officer Scrutiny Desk', to: '/officer/dashboard', icon: LayoutDashboard },
    { name: 'Statutory SLA Alerts', to: '/sla-tracker', icon: ClockAlert },
    { name: 'Joint Inspection Schedule', to: '/inspections', icon: CalendarDays },
    { name: 'Parallel Processing Monitor', to: '/application/tracking', icon: GitFork },
    { name: 'AI Verification Desk', to: '/document-verification', icon: ScanEye },
    { name: 'Schemes Catalog', to: '/schemes', icon: Award },
  ];

  const navItems = user?.role === 'ADMIN' ? adminNav : isOfficer ? officerNav : citizenNav;


  return (
    <aside
      className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        {!collapsed && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {isOfficer ? 'Government Authority' : 'Enterprise Workspace'}
            </div>
            <div className="text-xs font-bold text-gray-800 truncate">
              {user?.designation || user?.fullName || 'Single Window Desk'}
            </div>
          </div>
        )}
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
          {isOfficer ? 'GO' : 'IND'}
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item, idx) => {
          if ('section' in item) {
            if (collapsed) return <div key={idx} className="my-2 border-t border-gray-100" />;
            return (
              <div
                key={idx}
                className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              >
                {item.section}
              </div>
            );
          }

          const Icon = item.icon!;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-blue-900 hover:bg-blue-50/70'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      {!collapsed && (
        <div className="p-3 m-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <div className="text-[10px] text-gray-500 font-medium">Maharashtra RTS Act 2015</div>
          <div className="text-[11px] font-bold text-slate-800 mt-0.5">Time-Bound Public Delivery</div>
        </div>
      )}
    </aside>
  );
};
