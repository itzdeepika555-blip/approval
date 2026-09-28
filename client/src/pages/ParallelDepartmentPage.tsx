import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApplication } from '../context/ApplicationContext';
import { approvalService } from '../services/approval.service';
import { officerService } from '../services/officer.service';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import { DepartmentClearanceStatus, DepartmentQuery } from '../types';
import {
  GitFork,
  CheckCircle2,
  AlertTriangle,
  Send,
  UploadCloud,
  FileText,
  User,
  Inbox,
} from 'lucide-react';

export const ParallelDepartmentPage: React.FC = () => {
  const { activeSubmission } = useApplication();
  const [clearances, setClearances] = useState<DepartmentClearanceStatus[]>([]);
  const [queries, setQueries] = useState<DepartmentQuery[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replySuccessToast, setReplySuccessToast] = useState<string | null>(null);

  const hasSubmission = Boolean(activeSubmission);
  const appNumber = activeSubmission?.applicationNumber || '';

  const loadData = async () => {
    if (!activeSubmission) return;
    const cl = await approvalService.getDepartmentClearances();
    setClearances(cl);
    const qr = await officerService.getQueries(activeSubmission.id);
    setQueries(qr);
  };

  useEffect(() => {
    loadData();
  }, [activeSubmission]);

  const handleResolveQuery = async (queryId: string) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);

    try {
      await officerService.replyQuery(queryId, replyText);
      setReplySuccessToast('Clarification response submitted to Departmental Scrutiny Officer!');
      setReplyText('');
      await loadData();
      setTimeout(() => setReplySuccessToast(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  if (!hasSubmission) {
    return (
      <DashboardLayout
        title="Parallel Department Processing"
        subtitle="Synchronous multi-agency clearance orchestrator under Maharashtra Single Window 2.0"
        breadcrumbs={[
          { label: 'Citizen Dashboard', href: '/dashboard' },
          { label: 'Parallel Processing' },
        ]}
      >
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-gray-900">
            No Active Application Under Scrutiny
          </h3>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Multi-department parallel processing, joint queries, and clearance certificates activate once your consolidated application is submitted.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/business-profile"
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition shadow-sm"
            >
              Start New Application
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Parallel Department Processing"
      subtitle="Synchronous multi-agency clearance orchestrator under Maharashtra Single Window 2.0"
      breadcrumbs={[
        { label: 'Citizen Dashboard', href: '/dashboard' },
        { label: 'Parallel Processing' },
      ]}
    >
      {/* Information Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 mb-8 shadow-sm border border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
            <GitFork className="w-4 h-4" />
            <span>Synchronous Multi-Agency Scrutiny</span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-white">
            Application: <span className="font-mono text-amber-300">{appNumber}</span>
          </h2>
          <p className="text-xs text-blue-200 mt-1 max-w-2xl">
            Departments process your application concurrently. Delays in one department do not stall scrutinies in others.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-blue-900/60 border border-blue-700/60 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-blue-300 uppercase font-bold block">Total Departments</span>
            <span className="text-lg font-black text-white">{clearances.length} Agencies</span>
          </div>
          <div className="bg-emerald-900/60 border border-emerald-700/60 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-emerald-300 uppercase font-bold block">Approved</span>
            <span className="text-lg font-black text-emerald-300">
              {clearances.filter(c => c.status === 'APPROVED').length} Granted
            </span>
          </div>
        </div>
      </div>

      {replySuccessToast && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{replySuccessToast}</span>
        </div>
      )}

      {/* Query Notification Alert if any query is pending */}
      {queries.some(q => q.status === 'PENDING_CITIZEN_REPLY') && (
        <div className="mb-8 bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Action Required: Official Department Query Raised</span>
          </div>

          {queries
            .filter(q => q.status === 'PENDING_CITIZEN_REPLY')
            .map(q => (
              <div key={q.id} className="bg-white rounded-xl p-5 border border-amber-200 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      {q.departmentCode}
                    </span>
                    <span className="font-bold text-gray-900 text-xs">{q.departmentName}</span>
                    <span className="text-gray-400 text-xs">• {q.officerName}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">{q.createdAt}</span>
                </div>

                <p className="text-xs text-gray-800 leading-relaxed font-medium mb-4 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                  "{q.queryText}"
                </p>

                {q.attachmentName && (
                  <div className="mb-4 inline-flex items-center gap-2 text-xs bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Officer Deficiency Note: {q.attachmentName}</span>
                  </div>
                )}

                {/* Reply Form */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-700" htmlFor="replyText">
                    Your Official Clarification Reply *
                  </label>
                  <textarea
                    id="replyText"
                    rows={3}
                    placeholder="Provide detailed technical clarification conforming to Maharashtra statutory regulations..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
                  />

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <UploadCloud className="w-4 h-4 text-blue-600" />
                      <span>Attach Revised Drawing / Certificate (Optional PDF)</span>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmittingReply || !replyText.trim()}
                      onClick={() => handleResolveQuery(q.id)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingReply ? 'Submitting Clarification...' : 'Submit Clarification Reply'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Visual Workflow: Parallel Department Lanes */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-8">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900">
              Departmental Scrutiny Workflow Status
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live status tracking across independent departmental desks
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
            Parallel Synchronization Active
          </span>
        </div>

        <div className="space-y-4">
          {clearances.map((c, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition ${
                c.status === 'APPROVED'
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : c.status === 'QUERY_RAISED'
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-100">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {c.departmentCode}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">{c.departmentName}</h4>
                    <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3 h-3 text-gray-400" />
                        {c.officerAssigned || 'Scrutiny Desk'}
                      </span>
                      <span>•</span>
                      <span>Last Updated: {c.updatedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-start md:self-center shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Statutory SLA</span>
                    <span className="font-bold text-gray-800 text-xs">
                      {c.daysRemaining > 0 ? `${c.daysRemaining}d remaining` : 'Cleared'}
                    </span>
                  </div>
                  <StatusBadge status={c.status} size="md" />
                </div>
              </div>

              {/* Departmental Officer Notes */}
              {c.notes && (
                <div className="pt-3 text-xs text-gray-700 flex items-start gap-2 bg-gray-50/60 p-3 rounded-xl mt-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mt-0.5">
                    Officer Note:
                  </span>
                  <p className="text-gray-600 leading-relaxed font-sans">{c.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
