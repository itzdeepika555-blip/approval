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
  Inbox,
} from 'lucide-react';

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { profile, activeSubmission, approvals } = useApplication();
  const navigate = useNavigate();

  const hasSubmission = Boolean(activeSubmission);
  const appNumber = activeSubmission?.applicationNumber || '';

  const approvedCount = approvals.filter(a => (a as any).status === 'APPROVED').length;
  const totalApprovalsCount = approvals.length;

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
          <span>{hasSubmission ? 'Update Profile' : 'Start New Application'}</span>
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
            {hasSubmission ? 'Active Industrial Project Under Scrutiny' : 'Ready to establish or expand an industrial unit in Maharashtra?'}
          </h2>
          <p className="text-xs text-blue-200 mt-0.5 max-w-2xl">
            {hasSubmission
              ? 'Your consolidated application is filed and actively tracked under Maharashtra Right to Public Services Act 2015.'
              : 'Complete your Business Profile to activate the Smart Rule Assessment engine and generate statutory clearance requirements.'}
          </p>
        </div>
        <button
          onClick={() => navigate(hasSubmission ? '/application/tracking' : '/business-profile')}
          className="shrink-0 px-4 py-2 bg-white text-blue-950 hover:bg-blue-50 font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
        >
          <span>{hasSubmission ? 'Track Approvals' : 'Fill Business Profile'}</span>
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
          <div className="text-2xl font-extrabold text-gray-900">
            {hasSubmission ? '01' : '00'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            {hasSubmission ? (
              <span className="font-semibold text-blue-700">{appNumber}</span>
            ) : (
              <span>No active submissions</span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Clearances Granted</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {hasSubmission ? `${approvedCount} / ${totalApprovalsCount}` : '00'}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            {hasSubmission && totalApprovalsCount > 0 ? `${approvedCount} Statutory Clearances Issued` : 'Awaiting Filing'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Action Needed</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {hasSubmission ? '00' : '00'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {hasSubmission ? 'No pending queries' : 'No queries raised'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Joint Inspection</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-900">
            {hasSubmission ? 'Desk Queue' : 'N/A'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {hasSubmission ? 'Subject to scrutiny schedule' : 'Available post-submission'}
          </div>
        </div>
      </div>

      {/* Main Grid: Active Application Details & Live SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Active Application Card or Empty State */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {hasSubmission ? (
            <div>
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-md">
                      {appNumber}
                    </span>
                    <StatusBadge status={activeSubmission?.status || 'UNDER_REVIEW'} />
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 mt-2">
                    {profile.businessName || 'Industrial Unit'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {profile.surveyPlotNumber ? `${profile.surveyPlotNumber}, ` : ''}{profile.midcEstateName || profile.district || 'Maharashtra'}
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
                {/* Statutory SLA progress bar */}
                <div>
                  <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider flex items-center justify-between">
                    <span>RTS Act Statutory SLA Guarantee</span>
                    <Link to="/sla-tracker" className="text-blue-700 text-xs font-semibold hover:underline">
                      View SLA Countdown →
                    </Link>
                  </div>
                  <SLAProgress maxDays={45} daysRemaining={40} />
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">Category</span>
                    <span className="font-bold text-amber-700">{profile.pollutionCategory || 'GREEN'} Category</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">Capital Investment</span>
                    <span className="font-bold text-gray-800">₹ {((profile.investmentPlantMachinery || 0) + (profile.investmentLandBuilding || 0)) / 100} Cr</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">Power Requirement</span>
                    <span className="font-bold text-gray-800">{profile.powerRequirementKva || 0} kVA</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-semibold uppercase">Water Tap-off</span>
                    <span className="font-bold text-gray-800">{profile.waterUsageKld || 0} KLD</span>
                  </div>
                </div>

                {/* Parallel Department Quick Statuses */}
                {approvals.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
                      Statutory Approvals Bundled ({approvals.length} Clearances)
                    </div>
                    <div className="space-y-2.5">
                      {approvals.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 font-bold text-xs flex items-center justify-center shrink-0">
                              {item.departmentCode}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-900">{item.name}</div>
                              <div className="text-[10px] text-gray-500">Statutory review under Maharashtra RTS Act</div>
                            </div>
                          </div>
                          <StatusBadge status={(item as any).status || 'UNDER_REVIEW'} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900">
                No Active Consolidated Application
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-2 leading-relaxed">
                You have not filed any industrial applications yet. Click below to begin by entering your enterprise and manufacturing parameters.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => navigate('/business-profile')}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>Fill Business Profile</span>
                </button>
                <button
                  onClick={() => navigate('/start-assessment')}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition"
                >
                  Run Smart Assessment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Actions & Quick Modules */}
        <div className="space-y-6">
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
