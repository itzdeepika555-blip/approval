import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApplication } from '../context/ApplicationContext';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ShieldCheck,
  Building2,
  MapPin,
  FileCheck2,
  FolderLock,
  ArrowRight,
  Printer,
  ClockAlert,
  GitFork,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const ApplicationReviewPage: React.FC = () => {
  const { user } = useAuth();
  const { profile, approvals, documents, submitApplication, activeSubmission } = useApplication();

  const [declarationAgreed, setDeclarationAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionCompleted, setSubmissionCompleted] = useState(!!activeSubmission);
  const [submittedData, setSubmittedData] = useState<any>(activeSubmission);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!declarationAgreed) {
      setError('You must accept the statutory declaration before submitting your consolidated application.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await submitApplication();
      setSubmittedData(res);
      setSubmissionCompleted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please verify all details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout
      title={submissionCompleted ? 'Application Submission Confirmation' : 'Consolidated Application Review'}
      subtitle={
        submissionCompleted
          ? `Application successfully filed under Maharashtra Right to Public Services Act 2015`
          : `Review enterprise data and attach verified credentials prior to final departmental submission`
      }
      breadcrumbs={[
        { label: 'Citizen Dashboard', href: '/dashboard' },
        { label: 'Document Checklist', href: '/document-checklist' },
        { label: 'Application Review' },
      ]}
    >
      {/* Post-Submission Confirmation Screen */}
      {submissionCompleted && submittedData ? (
        <div className="space-y-8 animate-in fade-in">
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-3xl p-8 shadow-xl border border-emerald-700/60 text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400/40 flex items-center justify-center mx-auto mb-4 font-bold text-3xl">
              ✓
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Consolidated Statutory Application Acknowledged</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Application Successfully Lodged!
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mx-auto mt-2 leading-relaxed">
              Your application has been registered into the Government of Maharashtra Single Window Engine.
              Synchronous parallel scrutiny has commenced across all 5 participating departments.
            </p>

            {/* Application Reference ID Box */}
            <div className="mt-6 inline-block bg-slate-950/80 px-8 py-4 rounded-2xl border border-emerald-500/40 shadow-inner">
              <div className="text-[11px] text-gray-400 uppercase font-mono tracking-widest">
                Official Application Number (Maharashtra RTS Ref)
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-wider mt-1">
                {submittedData.applicationNumber}
              </div>
              <div className="text-[10px] text-emerald-300 mt-1">
                Filed on: {submittedData.submittedAt ? new Date(submittedData.submittedAt).toLocaleString() : 'Just now'}
              </div>
            </div>
          </div>

          {/* Acknowledgement Summary Slip */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-200 gap-4">
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Government of Maharashtra • Single Window System
                </div>
                <h3 className="text-lg font-black text-gray-900 mt-0.5">
                  Statutory Filing Acknowledgement Receipt
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs mb-8">
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Applicant:</span>
                  <span className="font-bold text-gray-900">{user?.fullName || 'Rajesh Patil'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Enterprise Name:</span>
                  <span className="font-bold text-gray-900">{profile.businessName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Proposed Site:</span>
                  <span className="font-bold text-gray-900">{profile.surveyPlotNumber}, {profile.location}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Pollution Category:</span>
                  <span className="font-bold text-amber-700">{profile.pollutionCategory} Category</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Clearances Bundled:</span>
                  <span className="font-bold text-blue-900">{approvals.length} Clearances</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">RTS Statutory SLA:</span>
                  <span className="font-bold text-emerald-700">45 Calendar Days Max</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Parallel Departments:</span>
                  <span className="font-bold text-gray-900">MPCB, DISH, Fire, MIDC, CEI</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Current Status:</span>
                  <StatusBadge status="UNDER_REVIEW" />
                </div>
              </div>
            </div>

            {/* Next Steps Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <Link
                to="/application/tracking"
                className="p-4 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center mx-auto mb-2 shadow-xs group-hover:scale-105 transition transform">
                  <GitFork className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-blue-950 text-xs">Track Parallel Processing</h4>
                <p className="text-[11px] text-blue-700 mt-0.5">Live multi-department scrutiny</p>
              </Link>

              <Link
                to="/sla-tracker"
                className="p-4 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-slate-950 flex items-center justify-center mx-auto mb-2 shadow-xs group-hover:scale-105 transition transform">
                  <ClockAlert className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-amber-950 text-xs">SLA Countdown & Alerts</h4>
                <p className="text-[11px] text-amber-800 mt-0.5">RTS Act 45-day statutory timer</p>
              </Link>

              <Link
                to="/inspections"
                className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2 shadow-xs group-hover:scale-105 transition transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-emerald-950 text-xs">Joint Site Inspection</h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">View scheduled common visit</p>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Pre-Submission Comprehensive Review */
        <div className="space-y-8">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Applicant & Entity Details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>1. Applicant & Enterprise Information</span>
              </div>
              <Link to="/business-profile" className="text-xs text-blue-700 font-semibold hover:underline">
                Edit Details
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Authorized Applicant</span>
                <span className="font-bold text-gray-900">{user?.fullName || 'Rajesh Patil'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Official Email</span>
                <span className="font-bold text-gray-900">{user?.email || 'rajesh.patil@omkara-engg.com'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Enterprise Name</span>
                <span className="font-bold text-gray-900">{profile.businessName}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Entity Type</span>
                <span className="font-bold text-gray-900">{profile.businessType}</span>
              </div>
            </div>
          </div>

          {/* 2. Location & Utility Parameters */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>2. Location, Infrastructure & Environmental Class</span>
              </div>
              <Link to="/business-profile" className="text-xs text-blue-700 font-semibold hover:underline">
                Edit Details
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Site Plot</span>
                <span className="font-bold text-gray-900">{profile.surveyPlotNumber}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Industrial District</span>
                <span className="font-bold text-gray-900">{profile.district} (MIDC: {profile.isMidcArea ? 'Yes' : 'No'})</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Capital Investment</span>
                <span className="font-bold text-gray-900">₹ {(profile.investmentPlantMachinery + profile.investmentLandBuilding) / 100} Cr</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Pollution Class</span>
                <span className="font-bold text-amber-700">{profile.pollutionCategory} Category</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Power Requirement</span>
                <span className="font-bold text-gray-900">{profile.powerRequirementKva} kVA</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Water Requirement</span>
                <span className="font-bold text-gray-900">{profile.waterUsageKld} KLD</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Steam Boiler</span>
                <span className="font-bold text-gray-900">{profile.hasBoiler ? `${profile.boilerCapacityTph} TPH` : 'None'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] font-semibold uppercase">Backup DG Set</span>
                <span className="font-bold text-gray-900">{profile.hasDgSet ? `${profile.dgSetCapacityKva} kVA` : 'None'}</span>
              </div>
            </div>
          </div>

          {/* 3. Applicable Approvals Matrix */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                <span>3. Selected Statutory Approvals ({approvals.length} Clearances)</span>
              </div>
              <Link to="/applicable-approvals" className="text-xs text-blue-700 font-semibold hover:underline">
                View Catalog
              </Link>
            </div>

            <div className="divide-y divide-gray-100 text-xs">
              {approvals.map(app => (
                <div key={app.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded">
                      {app.departmentCode}
                    </span>
                    <div>
                      <div className="font-bold text-gray-900">{app.name}</div>
                      <div className="text-[11px] text-gray-500">{app.statutoryAct}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-800">{app.statutoryTimelineDays} Days SLA</span>
                    <div className="text-[10px] text-gray-400">{app.feeEstimate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Attached Verified Documents */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                <FolderLock className="w-4 h-4 text-blue-600" />
                <span>4. Attached Verified Documents</span>
              </div>
              <Link to="/wallet" className="text-xs text-blue-700 font-semibold hover:underline">
                Open Wallet
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {documents.filter(d => d.uploaded).map(doc => (
                <div
                  key={doc.id}
                  className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900 line-clamp-1">{doc.title}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{doc.fileName}</div>
                    </div>
                  </div>
                  <StatusBadge status={doc.verificationStatus} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* 5. Statutory Declaration Checkbox */}
          <div className="bg-amber-50/60 border border-amber-300 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <input
                id="declaration"
                type="checkbox"
                checked={declarationAgreed}
                onChange={e => setDeclarationAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="declaration" className="text-xs text-gray-800 leading-relaxed cursor-pointer font-medium">
                <strong className="block text-gray-900 font-bold mb-1">
                  Solemn Statutory Declaration under Maharashtra Right to Public Services Act 2015:
                </strong>
                I/We hereby solemnly affirm that the statements made and documents uploaded in this consolidated application are true, accurate, and correct to the best of my knowledge and belief. 
                I understand that any misrepresentation of facts regarding pollution loads, built-up areas, power load, or fire measures will render this application liable for immediate cancellation, forfeiture of statutory fees, and statutory penal proceedings under Section 43/44 of the Water Act, Section 92 of Factories Act, and relevant Maharashtra enactments.
              </label>
            </div>
          </div>

          {/* 6. Submit Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl">
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Final Statutory Filing</div>
              <p className="text-xs text-gray-300 mt-0.5">
                Consolidated submission routes simultaneously to MPCB, DISH, Fire Services, MIDC, and Electrical Inspectorate.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg transition transform active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Consolidated Application...</span>
                </>
              ) : (
                <>
                  <span>Submit Consolidated Application</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
