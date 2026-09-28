import React, { useState, useEffect } from 'react';
import { adminService } from '../services/admin.service';

import { appealService } from '../services/appeal.service';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  StateAnalyticsData,
  AppealItem,
  AuditLogItem,
  AdminRuleItem,
  AdminUserItem,
} from '../types';
import {
  BarChart3,
  FileCode2,
  Users,
  ScrollText,
  Gavel,
  RefreshCw,
  Plus,
  CheckCircle2,
  Search,
  Building,
  Layers,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'RULES' | 'APPEALS' | 'AUDIT' | 'USERS'>('ANALYTICS');


  const [analytics, setAnalytics] = useState<StateAnalyticsData | null>(null);
  const [rules, setRules] = useState<AdminRuleItem[]>([]);
  const [appeals, setAppeals] = useState<AppealItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);

  // Modals & Action States
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<AppealItem | null>(null);
  const [appellateDecision, setAppellateDecision] = useState<'DIRECTED_CLEARANCE' | 'UPHELD' | 'DISMISSED'>('DIRECTED_CLEARANCE');
  const [appellateRemarks, setAppellateRemarks] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncingDataset, setIsSyncingDataset] = useState(false);

  // New Rule Form State
  const [newRuleData, setNewRuleData] = useState({
    ruleCode: '',
    ruleName: '',
    approvalCode: 'MPCB_CTE',
    priority: 50,
    field: 'powerRequirementKva',
    operator: 'GREATER_THAN',
    value: '100',
    explanationTpl: 'Statutory high-voltage load threshold met requiring formal clearance.',
  });

  const loadData = async () => {
    try {
      const [analyticsData, rulesData, appealsData, logsData, usersData] = await Promise.all([
        adminService.getStateAnalytics(),
        adminService.getRules(),
        appealService.getAppeals(),
        adminService.getAuditLogs(),
        adminService.getUsers(),
      ]);
      setAnalytics(analyticsData);
      setRules(rulesData);
      setAppeals(appealsData);
      setAuditLogs(logsData);
      setUsersList(usersData);
    } catch (err) {
      console.error('Failed to load admin datasets:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let parsedValue: any = newRuleData.value;
      if (!isNaN(Number(newRuleData.value))) {
        parsedValue = Number(newRuleData.value);
      } else if (newRuleData.value.toLowerCase() === 'true') {
        parsedValue = true;
      } else if (newRuleData.value.toLowerCase() === 'false') {
        parsedValue = false;
      }

      const conditionsJson = {
        field: newRuleData.field,
        operator: newRuleData.operator,
        value: parsedValue,
      };

      await adminService.createRule({
        ruleCode: newRuleData.ruleCode,
        ruleName: newRuleData.ruleName,
        approvalCode: newRuleData.approvalCode,
        priority: Number(newRuleData.priority),
        conditionsJson,
        explanationTpl: newRuleData.explanationTpl,
      });

      showToast(`Rule '${newRuleData.ruleCode}' successfully compiled and active in engine!`);
      setIsRuleModalOpen(false);
      setNewRuleData({
        ruleCode: '',
        ruleName: '',
        approvalCode: 'MPCB_CTE',
        priority: 50,
        field: 'powerRequirementKva',
        operator: 'GREATER_THAN',
        value: '100',
        explanationTpl: '',
      });
      const updatedRules = await adminService.getRules();
      setRules(updatedRules);
    } catch (err: any) {
      alert(err.message || 'Failed to register rule.');
    }
  };

  const handleDecideAppeal = async () => {
    if (!selectedAppeal) return;
    if (!appellateRemarks.trim()) {
      alert('Statutory appellate findings and reasoning must be provided.');
      return;
    }

    try {
      await appealService.decideAppeal(selectedAppeal.id, appellateDecision, appellateRemarks);
      showToast(`Appellate Order '${appellateDecision}' registered for ${selectedAppeal.appealNumber}!`);
      setSelectedAppeal(null);
      setAppellateRemarks('');
      const updatedAppeals = await appealService.getAppeals();
      setAppeals(updatedAppeals);
    } catch (err: any) {
      alert(err.message || 'Failed to register appellate order.');
    }
  };

  const handleToggleUser = async (userItem: AdminUserItem) => {
    try {
      const nextStatus = !userItem.isActive;
      await adminService.toggleUserStatus(userItem.id, nextStatus);
      showToast(`User ${userItem.fullName} set to ${nextStatus ? 'Active' : 'Inactive'}!`);
      const updated = await adminService.getUsers();
      setUsersList(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const handleTriggerDatasetSync = async () => {
    setIsSyncingDataset(true);
    try {
      await adminService.triggerDatasetImport();
      showToast('Master Approval and Rule CSV datasets re-indexed successfully!');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Dataset synchronization failed.');
    } finally {
      setIsSyncingDataset(false);
    }
  };

  return (
    <DashboardLayout
      title="State Administration & Governance Center"
      subtitle="Government of Maharashtra • Executive Single-Window Oversight & Regulatory Administration"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'State Administration' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerDatasetSync}
            disabled={isSyncingDataset}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isSyncingDataset ? 'animate-spin' : ''}`} />
            <span>Re-Index Master Datasets</span>
          </button>
          <button
            onClick={() => setIsRuleModalOpen(true)}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Statutory Rule</span>
          </button>
        </div>
      }
    >
      {toastMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-gray-200 pb-3">
        {[
          { key: 'ANALYTICS', label: 'Executive State Performance', icon: BarChart3 },
          { key: 'RULES', label: 'Statutory Rule Engine', icon: FileCode2, badge: rules.length },
          { key: 'APPEALS', label: 'RTS Statutory Appeals', icon: Gavel, badge: appeals.filter(a => a.status === 'PENDING').length },
          { key: 'AUDIT', label: 'Regulatory Audit Ledger', icon: ScrollText },
          { key: 'USERS', label: 'User Governance & Roles', icon: Users, badge: usersList.length },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                isActive
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-amber-400 text-slate-950 font-black' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE STATE PERFORMANCE ANALYTICS */}
      {activeTab === 'ANALYTICS' && analytics && (
        <div className="space-y-8 animate-in fade-in">
          {/* Executive KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Capital Investment</span>
              <div className="text-xl font-black text-gray-900 mt-1 font-mono">
                ₹ {analytics.stateSummary.totalIndustrialInvestmentCr} Cr
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Committed In-State</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Employment Potential</span>
              <div className="text-xl font-black text-blue-900 mt-1 font-mono">
                {analytics.stateSummary.totalEmploymentGenerated.toLocaleString()}
              </div>
              <div className="text-[10px] text-blue-700 font-semibold mt-0.5">Manufacturing Jobs</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Applications Filed</span>
              <div className="text-xl font-black text-gray-900 mt-1 font-mono">
                {analytics.stateSummary.totalApplicationsReceived}
              </div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Single-Window Dossiers</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">RTS SLA Compliance</span>
              <div className="text-xl font-black text-emerald-700 mt-1 font-mono">
                {analytics.stateSummary.overallSlaCompliancePercentage}%
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Disposed Within SLA</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Statutory Clearances</span>
              <div className="text-xl font-black text-indigo-900 mt-1 font-mono">
                {analytics.stateSummary.totalStatutoryClearancesIssued}
              </div>
              <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">Sanctioned & Issued</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30 shadow-xs">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Active Escalations</span>
              <div className="text-xl font-black text-rose-700 mt-1 font-mono">
                {analytics.stateSummary.activeEscalationsCount}
              </div>
              <div className="text-[10px] text-rose-800 font-semibold mt-0.5">Appellate Attention</div>
            </div>
          </div>

          {/* Cross-Department Performance Rankings */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-900" />
                  <span>Participating Authority Clearance Performance (Maharashtra RTS Act 2015)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Statutory adherence ranking, deemed clearance triggers, and average disposal turnaround time
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-900 px-3 py-1 rounded-full border border-blue-200">
                State Nodal Dashboard
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Department Authority</th>
                    <th className="px-4 py-3">Total Assigned</th>
                    <th className="px-4 py-3">Cleared</th>
                    <th className="px-4 py-3">Pending Scrutiny</th>
                    <th className="px-4 py-3">Deemed Triggers</th>
                    <th className="px-4 py-3">Avg Days Taken</th>
                    <th className="px-4 py-3">SLA Adherence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analytics.departmentRankings.map((dept, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">{dept.departmentName}</div>
                        <div className="font-mono text-[10px] text-gray-500 font-semibold">{dept.departmentCode}</div>
                      </td>
                      <td className="px-4 py-3.5 font-bold font-mono text-gray-800">{dept.totalApplications}</td>
                      <td className="px-4 py-3.5 font-bold font-mono text-emerald-700">{dept.approvedCount}</td>
                      <td className="px-4 py-3.5 font-bold font-mono text-amber-700">{dept.pendingCount}</td>
                      <td className="px-4 py-3.5 font-bold font-mono">
                        {dept.deemedApprovalsTriggered > 0 ? (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {dept.deemedApprovalsTriggered} Deemed
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-gray-700 font-bold">{dept.averageProcessingDays} Days</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                dept.slaComplianceRate >= 95 ? 'bg-emerald-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${dept.slaComplianceRate}%` }}
                            />
                          </div>
                          <span className="font-mono font-extrabold text-[11px] text-gray-800">
                            {dept.slaComplianceRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* District Industrial Activity Heatmap */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-900" />
              <span>District Industrial Investment & Clearance Distribution</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.districtHeatmap.map((dist, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-slate-50/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-extrabold text-xs text-gray-900">{dist.district}</span>
                    <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      {dist.complianceScore}% Score
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-200/60 font-mono">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-sans">Applications</span>
                      <span className="font-bold text-gray-800">{dist.applicationsCount} Filings</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-sans">CapEx Pipeline</span>
                      <span className="font-bold text-blue-900">₹ {dist.investmentAmountCr} Cr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STATUTORY RULE ENGINE MANAGEMENT */}
      {activeTab === 'RULES' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search statutory rules by rule code, name, or approval..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Active Rules:</span>
              <span className="font-mono text-xs font-bold bg-blue-50 text-blue-900 px-3 py-1 rounded-lg border border-blue-200">
                {rules.length} Statutory Predicates
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {rules
              .filter(
                r =>
                  r.ruleCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.approvalCode.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(rule => (
                <div key={rule.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-blue-300 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                          {rule.ruleCode}
                        </span>
                        <span className="font-mono text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          Target: {rule.approvalCode}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Priority {rule.priority}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-gray-900">{rule.ruleName}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Condition Predicate Tree (JSON)
                      </span>
                      <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed">
                        {JSON.stringify(rule.conditionsJson, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Statutory Regulatory Legal Explanation Template
                      </span>
                      <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-gray-800 text-xs leading-relaxed font-medium">
                        {rule.explanationTpl}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: STATUTORY RTS APPEALS & GRIEVANCE REDRESSAL */}
      {activeTab === 'APPEALS' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-6 rounded-2xl border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                <Gavel className="w-4 h-4" />
                <span>Statutory Appellate Forum • Maharashtra Right to Public Services Act 2015</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                First & Second Appellate Authority Grievance Redressal Desk
              </h3>
              <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
                Empowered under Section 8 & 9 to review departmental SLA delays, arbitrariness, or unreasonable deficiency queries, and issue binding clearance directives.
              </p>
            </div>
            <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/20 text-center shrink-0">
              <span className="text-[10px] text-amber-300 uppercase font-bold block">Appellate Queue</span>
              <span className="text-xl font-black text-white">{appeals.length} Appeals</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Appeal Number</th>
                    <th className="px-4 py-3">Applicant & Enterprise</th>
                    <th className="px-4 py-3">Target Department</th>
                    <th className="px-4 py-3">Ground of Appeal</th>
                    <th className="px-4 py-3">Authority Tier</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appeals.map(item => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-extrabold text-blue-950">{item.appealNumber}</div>
                        <div className="font-mono text-[10px] text-gray-400">App: {item.applicationNumber}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">{item.citizenName}</div>
                        <div className="text-[10px] text-gray-500">{item.businessName}</div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-800">{item.departmentCode}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                          {item.groundForAppeal}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-800 text-[11px] truncate max-w-[180px]">
                          {item.appellateAuthorityTitle}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppeal(item);
                            setAppellateRemarks(item.officerRemarks || '');
                          }}
                          className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-xs transition"
                        >
                          Review & Order
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REGULATORY AUDIT LOG LEDGER */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-blue-900" />
                  <span>Immutable Statutory Regulatory Audit Trail</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tamper-evident system ledger capturing user identity, entity transitions, IP signatures, and action metadata
                </p>
              </div>
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {auditLogs.length} Logged Events
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Role & User</th>
                    <th className="px-4 py-3">Target Entity</th>
                    <th className="px-4 py-3">Remote IP</th>
                    <th className="px-4 py-3">Details Snapshot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition font-mono">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 19)}
                      </td>
                      <td className="px-4 py-3 font-bold text-blue-900 font-sans">{log.action}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.userRole === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : log.userRole === 'OFFICER'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {log.userRole || 'SYSTEM'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-semibold">{log.entityName}</td>
                      <td className="px-4 py-3 text-gray-400">{log.ipAddress || '127.0.0.1'}</td>
                      <td className="px-4 py-3 max-w-xs truncate text-gray-600 font-sans text-[11px]">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: USER GOVERNANCE & ROLES */}
      {activeTab === 'USERS' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-900" />
                  <span>Single-Window User Accounts & Role Governance</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  RBAC management across Citizens, Scrutiny Officers, and State Administrators
                </p>
              </div>
              <span className="font-mono text-xs font-bold bg-blue-50 text-blue-900 px-3 py-1 rounded-full border border-blue-200">
                {usersList.length} Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">User & Contact</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Designation / Department</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Operational Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList.map(u => (
                    <tr key={u.id} className="hover:bg-blue-50/30 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900">{u.fullName}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{u.email}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{u.phone}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'OFFICER'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700">
                        <div className="font-medium">{u.designation || 'Enterprise Applicant'}</div>
                        {u.departmentId && (
                          <div className="text-[10px] font-mono text-gray-400">{u.departmentId}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUser(u)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            u.isActive
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD STATUTORY RULE */}
      {isRuleModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsRuleModalOpen(false)}
          title="Add Statutory Approval Rule Predicate"
          subtitle="Compile deterministic logic into the single-window approval engine"
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Rule Code (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RULE_SOLAR_NET_METER"
                  value={newRuleData.ruleCode}
                  onChange={e => setNewRuleData({ ...newRuleData, ruleCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Target Approval Code</label>
                <select
                  value={newRuleData.approvalCode}
                  onChange={e => setNewRuleData({ ...newRuleData, approvalCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-bold"
                >
                  <option value="MPCB_CTE">MPCB Consent to Establish (CTE)</option>
                  <option value="DISH_FACT_LIC">DISH Factory License</option>
                  <option value="FIRE_PROV_NOC">Provisional Fire Safety NOC</option>
                  <option value="BOILER_REG">Boiler Registration & Inspection</option>
                  <option value="MSEDCL_HT_CONNECTION">MSEDCL HT Industrial Power</option>
                  <option value="MIDC_BLDG_PLAN">MIDC Building Plan Approval</option>
                  <option value="REVENUE_NA_PERM">Revenue NA Land Conversion</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Rule Title / Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Mandatory HT power clearance for load > 100 kVA"
                value={newRuleData.ruleName}
                onChange={e => setNewRuleData({ ...newRuleData, ruleName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 font-medium"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Rule Matching Predicate
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">Enterprise Field</label>
                  <select
                    value={newRuleData.field}
                    onChange={e => setNewRuleData({ ...newRuleData, field: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs font-bold"
                  >
                    <option value="powerRequirementKva">powerRequirementKva</option>
                    <option value="employeeCount">employeeCount</option>
                    <option value="hasBoiler">hasBoiler</option>
                    <option value="isMidcArea">isMidcArea</option>
                    <option value="pollutionCategory">pollutionCategory</option>
                    <option value="waterRequirementKld">waterRequirementKld</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">Operator</label>
                  <select
                    value={newRuleData.operator}
                    onChange={e => setNewRuleData({ ...newRuleData, operator: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs font-bold"
                  >
                    <option value="GREATER_THAN">GREATER_THAN</option>
                    <option value="GREATER_THAN_OR_EQUAL">GREATER_THAN_OR_EQUAL</option>
                    <option value="EQUALS">EQUALS</option>
                    <option value="IN">IN</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">Threshold / Value</label>
                  <input
                    type="text"
                    required
                    value={newRuleData.value}
                    onChange={e => setNewRuleData({ ...newRuleData, value: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs font-bold font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1">Regulatory Legal Template</label>
              <textarea
                rows={2}
                required
                value={newRuleData.explanationTpl}
                onChange={e => setNewRuleData({ ...newRuleData, explanationTpl: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Compile & Activate Rule
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: APPELLATE AUTHORITY ORDER DESK */}
      {selectedAppeal && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAppeal(null)}
          title={`Appellate Review: ${selectedAppeal.appealNumber}`}
          subtitle={`${selectedAppeal.appellateAuthorityTitle} • Application: ${selectedAppeal.applicationNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-bold">Appellant Enterprise</span>
                  <span className="font-bold text-gray-900">{selectedAppeal.businessName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block font-bold">Respondent Department</span>
                  <span className="font-bold text-gray-900">{selectedAppeal.departmentName}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase block font-bold">Statutory Ground of Appeal</span>
                <span className="font-bold text-amber-800">{selectedAppeal.groundForAppeal}</span>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase block font-bold">Appellant Grievance Statement</span>
                <p className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 leading-relaxed font-medium">
                  "{selectedAppeal.applicantStatement}"
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-gray-800 font-bold">Statutory Disposal Order</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'DIRECTED_CLEARANCE', label: 'Direct Statutory Clearance', color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                  { key: 'UPHELD', label: 'Uphold Department Decision', color: 'border-blue-500 bg-blue-50 text-blue-900' },
                  { key: 'DISMISSED', label: 'Dismiss Appeal as Inadmissible', color: 'border-rose-500 bg-rose-50 text-rose-900' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setAppellateDecision(opt.key as any)}
                    className={`p-3 rounded-xl border text-center font-bold text-xs transition ${
                      appellateDecision === opt.key ? `${opt.color} ring-2 ring-blue-900` : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Appellate Authority Recorded Findings & Directives</label>
                <textarea
                  rows={3}
                  placeholder="Record formal statutory findings under Section 8/9 of Maharashtra Right to Public Services Act..."
                  value={appellateRemarks}
                  onChange={e => setAppellateRemarks(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setSelectedAppeal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDecideAppeal}
                className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Issue Statutory Disposal Order
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};
