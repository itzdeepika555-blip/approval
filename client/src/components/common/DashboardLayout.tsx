import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ChevronRight } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  showSidebar?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  breadcrumbs,
  showSidebar,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Citizen application workflow pages NEVER display a vertical sidebar.
  // Full width is given to the citizen workflow and content area.
  // Government Officer Dashboard and Admin control desks retain their scrutiny desk sidebar.
  const isOfficerOrAdmin = user?.role === 'OFFICER' || user?.role === 'ADMIN';
  const isOfficerRoute = location.pathname.startsWith('/officer') || location.pathname.startsWith('/admin');
  const displaySidebar = showSidebar ?? (isOfficerOrAdmin && isOfficerRoute);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full">
      <Navbar />

      <div className="flex-1 flex overflow-hidden w-full">
        {/* Responsive Desktop Sidebar - Preserved ONLY for Government Officer / Admin Desks */}
        {displaySidebar && (
          <div className="hidden md:flex flex-col shrink-0">
            <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
          </div>
        )}

        {/* Content Viewport - Full available width for Citizen Workflow */}
        <main className="flex-1 overflow-y-auto flex flex-col w-full min-w-0">
          {(title || breadcrumbs) && (
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5 w-full">
              {breadcrumbs && (
                <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-2 font-medium">
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                      {crumb.href ? (
                        <a href={crumb.href} className="hover:text-blue-700 transition">
                          {crumb.label}
                        </a>
                      ) : (
                        <span className="text-gray-900 font-semibold">{crumb.label}</span>
                      )}
                      {idx < breadcrumbs.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                    </React.Fragment>
                  ))}
                </nav>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  {title && <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h1>}
                  {subtitle && <p className="text-xs sm:text-sm text-gray-600 mt-1">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
              </div>
            </div>
          )}

          <div className="p-4 sm:p-6 lg:p-8 flex-1 w-full">
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </div>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-500 mt-auto">
            Government of Maharashtra • Single Window Industrial Approval System • MAITRI 2.0 • SIH26130
          </footer>
        </main>
      </div>
    </div>
  );
};
