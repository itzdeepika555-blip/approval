import React, { useState, useEffect } from 'react';
import { useApplication } from '../context/ApplicationContext';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import { SLAProgress } from '../components/common/SLAProgress';
import { Modal } from '../components/common/Modal';
import { appealService } from '../services/appeal.service';
import { AppealItem } from '../types';
import {
  ShieldCheck,
  GitFork,
  ShieldAlert,
  Scale,
  Gavel,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';

export const ApprovalTrackerSLAPage: React.FC = () => {
  const { activeSubmission } = useApplication();
  const appNumber = activeSubmission?.applicationNumber || 'MH-IND-2026-89421';

  // Statutory Appeals State (Phase 7 RTS 2015)
  const [appeals, setAppeals] = useState<AppealItem[]>([]);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [appellateAuthority, setAppellateAuthority] = useState<'FIRST_APPELLATE' | 'SECOND_APPELLATE'>('FIRST_APPELLATE');
  const [departmentCode, setDepartmentCode] = useState('MPCB');
  const [groundForAppeal, setGroundForAppeal] = useState<'SLA_BREACH' | 'REJECTION_WITHOUT_REASON' | 'UNREASONABLE_QUERY' | 'CORRUPTION_HARASSMENT' | 'OTHER'>('SLA_BREACH');
  const [applicantStatement, setApplicantStatement] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadAppeals = async () => {
    try {
      const data = await appealService.getAppeals();
      setAppeals(data);
    } catch (err) {
      console.error('Failed to load appeals:', err);
    }
  };

  useEffect(() => {
    loadAppeals();
  }, []);

  const handleFileAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantStatement.trim()) {
      alert('Please enter statutory appeal grounds and detailed justification.');
      return;
    }
    setIsSubmittingAppeal(true);
    try {
      const created = await appealService.fileAppeal({
        applicationId: activeSubmission?.id || 'app-sample-01',
        departmentCode,
        appellateAuthority,
        groundForAppeal,
        applicantStatement,
      });
      setAppeals((prev) => [created, ...prev]);
      setIsAppealModalOpen(false);
      setApplicantStatement('');
      setToastMessage(`Statutory Appeal ${created.appealNumber} filed successfully under Maharashtra RTS Act 2015.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to file appeal.');
    } finally {
      setIsSubmittingAppeal(false);
    }
  };


  const timelineSteps = [
    {
      title: '1. Application Submitted & Token Generated',
      description: 'Consolidated filing received. Acknowledgement token issued and distributed to 5 participating departments.',
      date: '20-Sep-2026 11:32 AM',
      status: 'COMPLETED',
      slaNote: 'Day 0 of 45 statutory days',
    },
    {
      title: '2. Document Pre-Scrutiny & AI Verification',
      description: 'Factory layout blueprints, ETP drawings, and land title deeds verified for completeness.',
      date: '21-Sep-2026 04:15 PM',
      status: 'COMPLETED',
      slaNote: 'Completed in 24 hours',
    },
    {
      title: '3. Parallel Department Scrutiny',
      description: 'MPCB & MIDC have completed technical scrutiny and granted approval. DISH & CEI scrutinies are active.',
      date: 'Active • Day 6 of Scrutiny',
      status: 'IN_PROGRESS',
      slaNote: '39 days remaining on RTS clock',
    },
    {
      title: '4. Clarification Query Resolution',
      description: 'Maharashtra Fire Services deficiency query resolved by applicant. Awaiting officer sign-off.',
      date: '25-Sep-2026 02:40 PM',
      status: 'IN_PROGRESS',
      slaNote: 'Query stop-clock resolved in 24 hours',
    },
    {
      title: '5. Joint Common Inspection',
      description: 'Synchronized multi-agency site visit scheduled with DISH Safety Inspector, MPCB Field Officer, and Fire Officer.',
      date: 'Scheduled: 04-Oct-2026 (10:30 AM)',
      status: 'PENDING',
      slaNote: 'Inspection within SLA window',
    },
    {
      title: '6. Final Approval & Digitally Signed License',
      description: 'Consolidated issuance of MPCB CTE, DISH Plan Approval, Provisional Fire NOC, and MIDC Water Sanction.',
      date: 'Target Clearance: 15-Oct-2026',
      status: 'PENDING',
      slaNote: 'Before statutory day 45 deadline',
    },
  ];

  return (
    <DashboardLayout
      title="Statutory Approval Tracker & SLA"
      subtitle="Guaranteed public service delivery monitoring under Maharashtra Right to Public Services Act 2015"
      breadcrumbs={[
        { label: 'Citizen Dashboard', href: '/dashboard' },
        { label: 'Parallel Processing', href: '/application/tracking' },
        { label: 'Approval Tracker & SLA' },
      ]}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-900 text-white flex items-center gap-3 shadow-lg border border-emerald-700 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Statutory RTS Clock */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-xl border border-blue-900/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Maharashtra RTS Act 2015 Enforced</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Application: <span className="font-mono text-amber-400">{appNumber}</span>
            </h2>
            <p className="text-xs text-blue-200 max-w-xl">
              By law, all designated departments must complete scrutiny, joint inspection, and license grant within <strong>45 calendar days</strong>.
            </p>
          </div>

          {/* SLA Countdown Display */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-blue-800 text-center shrink-0">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              RTS Statutory Countdown
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono mt-1">
              39 Days
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              Remaining of 45-day statutory guarantee
            </div>
          </div>
        </div>

        {/* Live SLA Progress Bar */}
        <div className="mt-8 pt-6 border-t border-blue-900/60">
          <SLAProgress maxDays={45} daysRemaining={39} />
        </div>
      </div>

      {/* Main Grid: Stepper Timeline & RTS Appellate Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Stepper Timeline (6 Steps) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-8">
          <h3 className="text-sm font-extrabold text-gray-900 mb-6 uppercase tracking-wider flex items-center gap-2">
            <GitFork className="w-4 h-4 text-blue-700" />
            <span>End-to-End Scrutiny Stepper Timeline</span>
          </h3>

          <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {timelineSteps.map((step, idx) => {
              const isDone = step.status === 'COMPLETED';
              const isCurrent = step.status === 'IN_PROGRESS';

              return (
                <div key={idx} className="relative group">
                  {/* Step Dot */}
                  <div
                    className={`absolute -left-[27px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>

                  <div className="bg-gray-50/70 hover:bg-blue-50/40 p-4 rounded-xl border border-gray-200 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                      <h4 className="text-xs font-extrabold text-gray-900">{step.title}</h4>
                      <StatusBadge status={step.status} size="sm" />
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed mb-2 font-normal">
                      {step.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400 font-mono pt-2 border-t border-gray-100">
                      <span>{step.date}</span>
                      <span className="text-blue-900 font-bold font-sans">{step.slaNote}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legal Safeguards & RTS Statutory Appeals Action Panel */}
        <div className="space-y-6">
          {/* Statutory RTS Appeal Trigger Card */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl border border-blue-800 p-6 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Scale className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                  Statutory Appeal Mechanism
                </h4>
                <div className="text-[11px] text-blue-200">RTS Act 2015 Sections 18 & 19</div>
              </div>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed mb-4">
              If any designated department delays processing beyond the statutory RTS SLA or issues an arbitrary rejection without lawful grounds, you hold a legally binding right to appeal before the Statutory Appellate Authority.
            </p>
            <button
              onClick={() => setIsAppealModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
            >
              <Gavel className="w-4 h-4" />
              <span>File Statutory RTS Appeal</span>
            </button>
          </div>

          {/* Deemed Approval Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
              Deemed Approval Clause (Section 7)
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              Under the Maharashtra Right to Public Services Act 2015, if any designated officer fails to provide a clearance or query within the statutory SLA without recorded justification, the application shall be deemed granted by operation of law.
            </p>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium">
              Statutory Escrow: Automatic escalation triggers to First Appellate Authority on Day 41.
            </div>
          </div>

          {/* Appellate Authorities Hierarchy */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
              Appellate Authorities Hierarchy
            </h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">First Appellate Authority</span>
                <span className="font-bold text-gray-900">Joint Director of Industries (Pune Region)</span>
                <div className="text-[10px] text-gray-500 mt-0.5">SLA Escalation Window: 30 Days</div>
              </div>

              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Second Appellate Authority</span>
                <span className="font-bold text-gray-900">Principal Secretary (Industries), Govt. of Maharashtra</span>
                <div className="text-[10px] text-gray-500 mt-0.5">Final Statutory Grievance Forum</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appeals Docket Table (Phase 7) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                Statutory RTS Appeals Docket
              </h3>
              <p className="text-xs text-gray-500">
                Active & disposed grievances filed under Maharashtra RTS Act 2015 Section 18
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAppealModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Appeal Petition</span>
          </button>
        </div>

        {appeals.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Scale className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-gray-700">No Statutory Appeals Filed</div>
            <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
              Your clearances are progressing within statutory timelines. You may file an appeal if any clearance exceeds 45 days.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Appeal Number</th>
                  <th className="py-3 px-4">Appellate Authority</th>
                  <th className="py-3 px-4">Target Clearance</th>
                  <th className="py-3 px-4">Grounds</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Order / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {appeals.map((app) => (
                  <tr key={app.id} className="hover:bg-blue-50/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                      {app.appealNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 block">
                        {app.appellateAuthorityTitle ||
                          (app.appellateAuthority === 'FIRST_APPELLATE'
                            ? 'First Appellate Authority'
                            : 'Second Appellate Authority')}
                      </span>
                      <span className="text-[10px] text-gray-500">{app.appellateAuthority}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      {app.departmentName || app.departmentCode}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate" title={app.applicantStatement}>
                      {app.groundForAppeal}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'DIRECTED_CLEARANCE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'HEARING_SCHEDULED'
                            ? 'bg-amber-100 text-amber-800'
                            : app.status === 'DISMISSED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {app.officerRemarks ? (
                        <div className="text-[10px] text-gray-700 italic max-w-xs truncate" title={app.officerRemarks}>
                          "{app.officerRemarks}"
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-mono">Under Adjudication</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* File RTS Appeal Modal */}
      <Modal
        isOpen={isAppealModalOpen}
        onClose={() => setIsAppealModalOpen(false)}
        title="File Statutory RTS Appeal (Maharashtra RTS Act 2015)"
      >
        <form onSubmit={handleFileAppeal} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <strong>Statutory Declaration:</strong> You are lodging a formal grievance under Section 18 of the Maharashtra Right to Public Services Act 2015. Decisions by the Appellate Authority are binding on the department.
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Appellate Tier</label>
            <select
              value={appellateAuthority}
              onChange={(e: any) => setAppellateAuthority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="FIRST_APPELLATE">First Appellate Authority (Joint Director of Industries)</option>
              <option value="SECOND_APPELLATE">Second Appellate Authority (Principal Secretary Industries)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Target Department</label>
            <select
              value={departmentCode}
              onChange={(e) => setDepartmentCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="MPCB">MPCB — Maharashtra Pollution Control Board</option>
              <option value="DISH">DISH — Directorate of Industrial Safety & Health</option>
              <option value="MIDC">MIDC — Maharashtra Industrial Development Corporation</option>
              <option value="FIRE">MFS — Maharashtra Fire Services</option>
              <option value="CEI">CEI — Chief Electrical Inspectorate</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Statutory Grounds for Appeal</label>
            <select
              value={groundForAppeal}
              onChange={(e: any) => setGroundForAppeal(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="SLA_BREACH">Section 18(1)(a) — Statutory 45-day SLA exceeded without recorded reason</option>
              <option value="REJECTION_WITHOUT_REASON">Section 18(1)(b) — Arbitrary rejection or adverse order without lawful justification</option>
              <option value="UNREASONABLE_QUERY">Section 18(1)(c) — Unlawful demand for documents outside verified repository</option>
              <option value="CORRUPTION_HARASSMENT">Section 18(1)(d) — Grievance / Unreasonable procedural roadblock</option>
              <option value="OTHER">Other statutory violation under RTS Act 2015</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Detailed Justification & Chronology</label>
            <textarea
              required
              rows={4}
              value={applicantStatement}
              onChange={(e) => setApplicantStatement(e.target.value)}
              placeholder="State the specific dates, interactions, and reasons why statutory relief or deemed clearance should be directed..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsAppealModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingAppeal}
              className="px-5 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmittingAppeal ? 'Filing Petition...' : 'Submit Statutory Petition'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default ApprovalTrackerSLAPage;
