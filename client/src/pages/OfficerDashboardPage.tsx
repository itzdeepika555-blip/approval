import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { officerService } from '../services/officer.service';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { OfficerApplication, DepartmentQuery } from '../types';
import {
  Shield,
  FileText,
  ClockAlert,
  CheckCircle2,
  AlertTriangle,
  Search,
  Eye,
  Send,
} from 'lucide-react';

export const OfficerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<OfficerApplication[]>([]);
  const [queries, setQueries] = useState<DepartmentQuery[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Selected Application for Scrutiny Desk Detail Modal
  const [selectedApp, setSelectedApp] = useState<OfficerApplication | null>(null);

  // Decision controls state
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [newQueryText, setNewQueryText] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const loadData = async () => {
    const apps = await officerService.getApplications();
    setApplications(apps);
    const qrs = await officerService.getQueries();
    setQueries(qrs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const counts = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'PENDING').length,
    underReview: applications.filter(a => a.status === 'UNDER_REVIEW').length,
    approved: applications.filter(a => a.status === 'APPROVED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length,
    slaApproaching: applications.filter(a => a.rtsDaysRemaining <= 7 && a.status !== 'APPROVED').length,
    inspections: applications.filter(a => a.inspectionRequired && a.inspectionStatus === 'SCHEDULED').length,
  };

  const filteredApps = applications.filter(app => {
    if (selectedStatusFilter !== 'ALL' && app.status !== selectedStatusFilter) return false;
    if (selectedDeptFilter !== 'ALL' && !app.assignedDepartment.toLowerCase().includes(selectedDeptFilter.toLowerCase())) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        app.applicationNumber.toLowerCase().includes(q) ||
        app.businessName.toLowerCase().includes(q) ||
        app.applicantName.toLowerCase().includes(q) ||
        app.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedApp) return;
    if (!decisionRemarks.trim()) {
      alert('Please provide statutory officer remarks/findings before issuing decision.');
      return;
    }

    setIsProcessingAction(true);
    try {
      await officerService.submitDecision(
        selectedApp.id,
        decision,
        decisionRemarks,
        user?.fullName || 'Scrutiny Officer'
      );
      setFeedbackToast(`Application ${selectedApp.applicationNumber} marked as ${decision}!`);
      setDecisionRemarks('');
      setSelectedApp(null);
      await loadData();
      setTimeout(() => setFeedbackToast(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRaiseQuery = async () => {
    if (!selectedApp || !newQueryText.trim()) return;

    setIsProcessingAction(true);
    try {
      await officerService.raiseQuery(
        selectedApp.applicationNumber,
        user?.departmentId ? user.departmentId.replace('DEPT-', '') : 'MPCB',
        newQueryText,
        user?.fullName || 'Scrutiny Officer'
      );
      setFeedbackToast(`Deficiency Query raised to ${selectedApp.applicantName}!`);
      setNewQueryText('');
      await loadData();
      setTimeout(() => setFeedbackToast(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <DashboardLayout
      title="Government Officer Scrutiny Desk"
      subtitle={`${user?.designation || 'Competent Authority'} • Departmental Scrutiny & Approval Gateway`}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Officer Desk' },
      ]}
    >
      {feedbackToast && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* KPI Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Received</span>
          <div className="text-2xl font-black text-gray-900 mt-1">{counts.total}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pending</span>
          <div className="text-2xl font-black text-slate-700 mt-1">{counts.pending}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Under Review</span>
          <div className="text-2xl font-black text-blue-700 mt-1">{counts.underReview}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Approved</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{counts.approved}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Rejected</span>
          <div className="text-2xl font-black text-rose-700 mt-1">{counts.rejected}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">SLA Alert (&lt;7d)</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{counts.slaApproaching}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Inspections</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{counts.inspections}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Application No, Enterprise Name, Applicant, or District..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500 font-semibold">Filter Status:</span>
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses ({applications.length})</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="QUERY_RAISED">Query Raised</option>
            <option value="PENDING">Pending Initial Scrutiny</option>
            <option value="APPROVED">Approved</option>
          </select>

          <span className="text-gray-500 font-semibold ml-2">Dept:</span>
          <select
            value={selectedDeptFilter}
            onChange={e => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="MPCB">MPCB</option>
            <option value="DISH">DISH</option>
            <option value="MIDC">MIDC</option>
            <option value="FIRE">Fire Services</option>
            <option value="CEI">CEI</option>
          </select>
        </div>
      </div>

      {/* Applications Scrutiny Queue Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Application No & Enterprise</th>
                <th className="px-4 py-3.5">Applicant & Contact</th>
                <th className="px-4 py-3.5">Sector & District</th>
                <th className="px-4 py-3.5">Pollution Class</th>
                <th className="px-4 py-3.5">RTS Statutory SLA</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Scrutiny Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredApps.map(app => {
                const isUrgent = app.rtsDaysRemaining <= 5 && app.status !== 'APPROVED';

                return (
                  <tr key={app.id} className="hover:bg-blue-50/40 transition">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-mono text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                          {app.applicationNumber}
                        </span>
                        <div className="font-extrabold text-gray-900 mt-1">{app.businessName}</div>
                        <div className="text-[10px] text-gray-500">{app.clearanceName}</div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-gray-800">{app.applicantName}</div>
                      <div className="text-[10px] text-gray-500">{app.applicantPhone}</div>
                      <div className="text-[10px] text-gray-400">{app.applicantEmail}</div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-800">{app.district}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[150px]">{app.industrySector}</div>
                      <div className="text-[10px] text-gray-400">₹ {app.investmentAmountCr} Cr • {app.employeeCount} Staff</div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          app.pollutionCategory === 'RED'
                            ? 'bg-rose-100 text-rose-800'
                            : app.pollutionCategory === 'ORANGE'
                            ? 'bg-amber-100 text-amber-800'
                            : app.pollutionCategory === 'GREEN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {app.pollutionCategory}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <ClockAlert className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-600 animate-pulse' : 'text-gray-400'}`} />
                        <span className={isUrgent ? 'text-rose-600' : 'text-gray-700'}>
                          {app.rtsDaysRemaining} Days left
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Deadline: {app.rtsDeadline}</div>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={app.status} size="sm" />
                      {app.queriesCount > 0 && (
                        <div className="text-[10px] text-amber-700 font-bold mt-1">
                          {app.queriesCount} Query Active
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 ml-auto shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Scrutiny Desk</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Officer Application Detail Scrutiny Workspace Modal */}
      {selectedApp && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedApp(null)}
          title={`Scrutiny Workspace: ${selectedApp.applicationNumber}`}
          subtitle={`${selectedApp.businessName} • ${selectedApp.assignedDepartment}`}
          maxWidth="4xl"
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4 text-blue-700" />
                <span>Statutory Decision Authority: {user?.fullName}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDecision('REJECTED')}
                  disabled={isProcessingAction}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  Reject Application
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision('APPROVED')}
                  disabled={isProcessingAction}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Grant Statutory Clearance</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-xs">
            {/* Applicant & Business Overview */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                1. Enterprise Profile & Technical Parameters
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-gray-500 block text-[10px]">Applicant Name</span>
                  <span className="font-bold text-gray-900">{selectedApp.applicantName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">District & Estate</span>
                  <span className="font-bold text-gray-900">{selectedApp.district}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Capital Investment</span>
                  <span className="font-bold text-gray-900">₹ {selectedApp.investmentAmountCr} Crores</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Workforce</span>
                  <span className="font-bold text-gray-900">{selectedApp.employeeCount} Employees</span>
                </div>
              </div>
            </div>

            {/* Document Verification & AI Findings */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                2. Uploaded Blueprint & Report Dossier (AI Pre-Vetted)
              </span>
              <div className="space-y-2">
                {[
                  { name: 'Factory Architectural Layout & Machinery Blueprint', status: 'PASSED', score: '95%', tag: 'Verified' },
                  { name: 'Effluent Treatment Plant (ETP) Scheme & Project Report', status: 'PASSED', score: '92%', tag: 'Verified' },
                  { name: 'Fire Hydrant & Emergency Evacuation Layout', status: 'WARNING', score: '84%', tag: 'Bay B Sprinkler Clarification' },
                  { name: 'MIDC Land Possession Letter & Lease Agreement', status: 'PASSED', score: '98%', tag: 'Verified' },
                ].map((d, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-bold text-gray-900">{d.name}</div>
                        <div className="text-[10px] text-gray-500">AI Confidence: {d.score} • {d.tag}</div>
                      </div>
                    </div>
                    <StatusBadge status={d.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Raise Official Query Form */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>3. Raise Official Statutory Deficiency Query</span>
              </span>
              <p className="text-[11px] text-gray-600 mb-2">
                Under Maharashtra RTS Act, issuing a query pauses the statutory clock until the citizen furnishes clarification.
              </p>

              {queries.filter(q => q.applicationId === selectedApp.applicationNumber).length > 0 && (
                <div className="mb-3 space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Active Queries for this Filing:</span>
                  {queries.filter(q => q.applicationId === selectedApp.applicationNumber).map(q => (
                    <div key={q.id} className="p-2.5 rounded-lg bg-white border border-amber-200 text-xs">
                      <div className="font-bold text-gray-900">{q.queryText}</div>
                      <div className="text-[10px] text-gray-500 mt-1 font-mono">Status: {q.status} • {q.createdAt}</div>
                      {q.citizenResponse && (
                        <div className="mt-1.5 p-2 bg-emerald-50 rounded border border-emerald-200 text-[11px] text-emerald-900">
                          <strong>Citizen Reply:</strong> {q.citizenResponse}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <textarea
                rows={2}
                placeholder="Type specific statutory deficiency note or document request..."
                value={newQueryText}
                onChange={e => setNewQueryText(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-amber-300 bg-white focus:outline-none focus:border-blue-600 transition"
              />
              <button
                type="button"
                onClick={handleRaiseQuery}
                disabled={!newQueryText.trim() || isProcessingAction}
                className="mt-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Query to Applicant</span>
              </button>
            </div>

            {/* Officer Findings / Approval Remarks */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                4. Competent Authority Scrutiny Findings & Conditions (Mandatory for Approval/Rejection)
              </span>
              <textarea
                rows={2}
                placeholder="Enter statutory inspection findings, specific conditions of consent, and compliance covenants..."
                value={decisionRemarks}
                onChange={e => setDecisionRemarks(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition font-medium"
              />
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};
