import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/common/Navbar';
import {
  GitFork,
  ClockAlert,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const isOfficer = user?.role === 'OFFICER' || user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0d2347] via-[#163a6e] to-[#0a1628] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold tracking-wide uppercase mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Maharashtra State Single Window 2.0 • SIH26130
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight">
            Industrial Approval, Compliance & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
              Government Support Navigator
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-blue-100/90 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            A next-generation regulatory intelligence platform for the Government of Maharashtra.
            Identify statutory NOCs, orchestrate parallel departmental clearances across MPCB, DISH, MIDC & Fire,
            verify blueprints with AI, and track guaranteed time-bound delivery under the
            <strong className="text-white"> Maharashtra Right to Public Services Act 2015</strong>.
          </p>

          {/* Strict Authentication Flow CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto mb-6">
            {isAuthenticated ? (
              isOfficer ? (
                <Link
                  to="/officer/dashboard"
                  className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl shadow-lg transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <span>Open Officer Scrutiny Desk</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl shadow-lg transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <span>Go to Citizen Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )
            ) : (
              <>
                <Link
                  to="/signup"
                  className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl shadow-lg transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <span>Step 1: Register Business (Signup)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl backdrop-blur-sm transition flex items-center justify-center gap-2"
                >
                  <span>Step 2: Login</span>
                </Link>
              </>
            )}
          </div>

          {/* Statutory Flow Notice */}
          <div className="inline-flex items-center gap-2 text-xs text-blue-200/80 bg-blue-950/60 px-4 py-2 rounded-lg border border-blue-800/40">
            <span className="font-semibold text-amber-400">Mandatory Sequence:</span>
            <span>Welcome → Signup → Login → Citizen Dashboard → Start New Application → Business Profile</span>
          </div>
        </div>
      </section>

      {/* Key Metric Highlights */}
      <section className="bg-white border-y border-gray-200 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="border-r last:border-r-0 border-gray-100 pr-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-900">45 Days</div>
            <div className="text-xs text-gray-500 mt-0.5 font-medium">Max Statutory SLA (RTS Act)</div>
          </div>
          <div className="border-r last:border-r-0 border-gray-100 pr-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-900">5+ Depts</div>
            <div className="text-xs text-gray-500 mt-0.5 font-medium">Parallel Synchronous Scrutiny</div>
          </div>
          <div className="border-r last:border-r-0 border-gray-100 pr-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-900">1 Single</div>
            <div className="text-xs text-gray-500 mt-0.5 font-medium">Joint Common Inspection Visit</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">40% ECI</div>
            <div className="text-xs text-gray-500 mt-0.5 font-medium">Capital Subsidy (PSI Scheme)</div>
          </div>
        </div>
      </section>

      {/* Core Innovation Pillars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-3">
            Why Single Window 2.0 Transforms Ease of Doing Business
          </h2>
          <p className="text-sm text-gray-600">
            Eliminating bureaucratic bottlenecks through synchronized departmental routing and intelligent AI assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Deterministic Rule Assessment</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Dynamically evaluates your plant investment, power load, fuel usage, and pollution categorization (Red, Orange, Green, White) to produce an authoritative checklist of required approvals.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <GitFork className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Parallel Department Processing</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              No more sequential waiting. MPCB, DISH, Maharashtra Fire Services, MIDC, and Electrical Inspectorate review your application concurrently with transparent inter-departmental visibility.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <ClockAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Statutory SLA & Joint Inspection</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Strict compliance with Maharashtra Right to Public Services Act 2015. Multi-department inspectors conduct a single joint site inspection to minimize factory disruption.
            </p>
          </div>
        </div>
      </section>

      {/* 16 Modules Interactive Grid */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
                Comprehensive Architecture
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                All 16 Specialized Portal Modules
              </h2>
            </div>
            <span className="text-xs text-gray-500 mt-2 sm:mt-0">
              Fully built and responsive under Phase 2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: '1', title: 'Welcome / Home', path: '/', badge: 'Public', desc: 'Single-window introduction and discovery portal.' },
              { id: '2', title: 'Signup (Registration)', path: '/signup', badge: 'Public', desc: 'Secure registration for industrial applicants.' },
              { id: '3', title: 'Login & Session', path: '/login', badge: 'Public', desc: 'Role-based JWT gateway for Citizen, Officer & Admin.' },
              { id: '4', title: 'Citizen Dashboard', path: '/dashboard', badge: 'Citizen', desc: 'Central command for applications and SLA timers.' },
              { id: '5', title: 'Business Profile', path: '/business-profile', badge: 'Citizen', desc: 'Comprehensive industrial data capture.' },
              { id: '6', title: 'Smart Assessment', path: '/start-assessment', badge: 'Citizen', desc: 'Rule engine determining statutory clearances.' },
              { id: '7', title: 'Applicable Approvals', path: '/applicable-approvals', badge: 'Citizen', desc: 'Catalog of required licenses, NOCs & timelines.' },
              { id: '8', title: 'Document Checklist', path: '/document-checklist', badge: 'Citizen', desc: 'Zero-ambiguity statutory document roadmap.' },
              { id: '9', title: 'AI Document Verification', path: '/document-verification', badge: 'AI Tool', desc: 'OCR blueprint scanning and validity checks.' },
              { id: '10', title: 'Document Wallet', path: '/wallet', badge: 'Vault', desc: 'Encrypted document locker preventing re-uploads.' },
              { id: '11', title: 'Application Review & Submit', path: '/application/review', badge: 'Filing', desc: 'Consolidated filing with digital undertaking.' },
              { id: '12', title: 'Parallel Dept Processing', path: '/application/tracking', badge: 'Tracking', desc: 'Synchronized scrutiny across 5+ departments.' },
              { id: '13', title: 'Approval Tracker + SLA', path: '/sla-tracker', badge: 'RTS Act', desc: 'Statutory deadline countdown and alerts.' },
              { id: '14', title: 'Common Joint Inspection', path: '/inspections', badge: 'Joint Desk', desc: 'Single unified site visit scheduling.' },
              { id: '15', title: 'Schemes & Incentives', path: '/schemes', badge: 'Subsidies', desc: 'PSI 2019/2024 and green capital grants.' },
              { id: '16', title: 'Compliance & Renewal', path: '/compliance-renewals', badge: 'Post-Setup', desc: 'Annual statutory filings and license renewals.' },
            ].map(mod => (
              <Link
                key={mod.id}
                to={mod.path}
                className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                      Module {mod.id}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {mod.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition mb-1">
                    {mod.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-snug">{mod.desc}</p>
                </div>
                <div className="mt-3 text-[11px] font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 text-xs py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-white mb-1">Government of Maharashtra — Industry & Commerce Department</div>
            <p>Smart India Hackathon SIH26130 • MAITRI 2.0 Next-Gen Implementation</p>
          </div>
          <div className="text-right text-[11px]">
            <p>Compliant with Maharashtra Right to Public Services Act 2015</p>
            <p className="text-gray-500 mt-0.5">Designed with React, TypeScript & Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
