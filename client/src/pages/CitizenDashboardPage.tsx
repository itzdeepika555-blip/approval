import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApplication } from '../context/ApplicationContext';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import { SLAProgress } from '../components/common/SLAProgress';
import {
  PlusCircle,
  Building2,
  FileCheck2,
  AlertTriangle,
  FolderLock,
  ArrowRight,
  ShieldCheck,
  CalendarDays,
  FileText,
  Award,
  ChevronRight,
} from 'lucide-react';

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { profile, activeSubmission } = useApplication();
  const navigate = useNavigate();

  const appNumber = activeSubmission?.applicationNumber || 'MH-IND-2026-89421';

  return (
    <DashboardLayout
      title={`Welcome, ${user?.fullName || 'Entrepreneur'}`}
      subtitle="Industrialist Central Desk • Maharashtra Single Window Portal"
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Citizen Dashboard' }]}
      actions={
        <button
          onClick={() => navigate('/business-profile')}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl shadow-md transition flex items-center gap-2 text-xs uppercase tracking-wide transform hover:-translate-y-0.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Start New Application</span>
        </button>
      }
    >
      {/* Top Banner Notice on the Statutory Flow */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-5 mb-8 shadow-sm border border-blue-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Statutory Onboarding Sequence</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            Ready to establish or expand an industrial unit in Maharashtra?
          </h2>
          <p className="text-xs text-blue-200 mt-0.5 max-w-2xl">
            Click <strong>Start New Application</strong> to complete your Business Profile. The Smart Rule Assessment engine will automatically determine your applicable approvals, statutory fees, and documents.
          </p>
        </div>
        <button
          onClick={() => navigate('/business-profile')}
          className="shrink-0 px-4 py-2 bg-white text-blue-950 hover:bg-blue-50 font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
        >
          <span>Fill Business Profile</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Applications</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-900">01</div>
          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-blue-700">{appNumber}</span>
            <span>(Consolidated)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Clearances Granted</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">02 / 06</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            MPCB CTE & MIDC Water Granted
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Action Needed</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">01 Query</div>
          <div className="text-[11px] text-gray-500 mt-1">
            Fire Dept query awaiting clarification
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Joint Inspection</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-900">04 Oct</div>
          <div className="text-[11px] text-gray-500 mt-1">
            MPCB + DISH + Fire joint visit
          </div>
        </div>
      </div>

      {/* Main Grid: Active Application Details & Live SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Active Application Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-md">
                  {appNumber}
                </span>
                <StatusBadge status="UNDER_REVIEW" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 mt-2">
                {profile.businessName}
              </h3>
              <p className="text-xs text-gray-500">
                {profile.surveyPlotNumber}, {profile.midcEstateName || profile.district}
              </p>
            </div>
            <Link
              to="/application/tracking"
              className="px-3.5 py-2 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Track Departments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 space-y-6">
            {/* Live Statutory SLA progress bar */}
            <div>
              <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider flex items-center justify-between">
                <span>RTS Act Statutory SLA Guarantee</span>
                <Link to="/sla-tracker" className="text-blue-700 text-xs font-semibold hover:underline">
                  View SLA Countdown →
                </Link>
              </div>
              <SLAProgress maxDays={45} daysRemaining={39} />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Category</span>
                <span className="font-bold text-amber-700">{profile.pollutionCategory} Category</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Capital Investment</span>
                <span className="font-bold text-gray-800">₹ {(profile.investmentPlantMachinery + profile.investmentLandBuilding) / 100} Cr</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Power Requirement</span>
                <span className="font-bold text-gray-800">{profile.powerRequirementKva} kVA</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Water Tap-off</span>
                <span className="font-bold text-gray-800">{profile.waterUsageKld} KLD</span>
              </div>
            </div>

            {/* Parallel Department Quick Statuses */}
            <div>
              <div className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
                Parallel Clearances In Progress (5 Departments)
              </div>
              <div className="space-y-2.5">
                {[
                  { dept: 'MPCB', title: 'Consent to Establish (CTE Orange)', status: 'APPROVED', days: 0 },
                  { dept: 'DISH', title: 'Factory Building Plan Approval', status: 'UNDER_REVIEW', days: 12 },
                  { dept: 'FIRE', title: 'Provisional Fire Safety NOC', status: 'QUERY_RAISED', days: 6 },
                  { dept: 'MIDC', title: 'Industrial Water Tap-off Sanction', status: 'APPROVED', days: 0 },
                  { dept: 'CEI', title: '250 kVA DG Set Installation Clearance', status: 'UNDER_REVIEW', days: 9 },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 font-bold text-xs flex items-center justify-center shrink-0">
                        {item.dept}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{item.title}</div>
                        <div className="text-[10px] text-gray-500">Statutory review under Maharashtra RTS Act</div>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Quick Modules */}
        <div className="space-y-6">
          {/* Action Needed Card */}
          <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Department Query Pending</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed mb-4">
              Maharashtra Fire Services has requested revised sprinkler schematics for Raw Material Storage Bay B.
            </p>
            <Link
              to="/application/tracking"
              className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <span>View & Resolve Query</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Navigator Hub */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
              Application Modules
            </h4>
            <div className="space-y-1 text-xs">
              <Link
                to="/business-profile"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-900 font-medium transition"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Business Profile Setup</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                to="/start-assessment"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-900 font-medium transition"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-indigo-600" />
                  <span>Smart Approval Assessment</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                to="/wallet"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-900 font-medium transition"
              >
                <div className="flex items-center gap-2.5">
                  <FolderLock className="w-4 h-4 text-emerald-600" />
                  <span>Verified Document Wallet</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                to="/inspections"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-900 font-medium transition"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-amber-600" />
                  <span>Joint Inspection Scheduler</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>

              <Link
                to="/schemes"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-900 font-medium transition"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Maharashtra PSI Schemes</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
