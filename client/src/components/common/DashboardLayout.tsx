import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ChevronRight } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  breadcrumbs,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Desktop Sidebar */}
        <div className="hidden md:flex flex-col">
          <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
        </div>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {(title || breadcrumbs) && (
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5">
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

          <div className="p-4 sm:p-6 lg:p-8 flex-1">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-500">
            Government of Maharashtra • Single Window Industrial Approval System • MAITRI 2.0 • SIH26130
          </footer>
        </main>
      </div>
    </div>
  );
};
