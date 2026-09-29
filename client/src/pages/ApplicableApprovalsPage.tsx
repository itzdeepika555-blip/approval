import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplication } from '../context/ApplicationContext';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { WorkflowProgressIndicator } from '../components/common/WorkflowProgressIndicator';
import { WorkflowNavigationFooter } from '../components/common/WorkflowNavigationFooter';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { ApplicableApproval } from '../types';
import { AIApprovalExplanationCard } from '../components/common/AIApprovalExplanationCard';
import {
  Search,
  FileText,
  Clock,
  ArrowRight,
  Info,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const ApplicableApprovalsPage: React.FC = () => {
  const { approvals, profile } = useApplication();
  const navigate = useNavigate();

  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeApprovalModal, setActiveApprovalModal] = useState<ApplicableApproval | null>(null);

  const departmentsList = Array.from(new Set(approvals.map(a => a.departmentCode)));

  const filteredApprovals = approvals.filter(item => {
    if (selectedStage !== 'ALL' && item.stage !== selectedStage) return false;
    if (selectedDept !== 'ALL' && item.departmentCode !== selectedDept) return false;
    if (
      searchQuery.trim() &&
      !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.approvalCode.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.departmentName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <DashboardLayout
      title="Applicable Statutory Approvals"
      subtitle="Authorized approvals, clearances, and NOCs required under Maharashtra statutory acts"
      breadcrumbs={[
        { label: 'Citizen Dashboard', href: '/dashboard' },
        { label: 'Smart Assessment', href: '/start-assessment' },
        { label: 'Applicable Approvals' },
      ]}
      actions={
        <button
          onClick={() => navigate('/document-checklist')}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-2 transform hover:-translate-y-0.5"
        >
          <span>Proceed to Document Checklist</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      }
    >
      {/* Horizontal Progress Indicator for Citizen Workflow */}
      <WorkflowProgressIndicator currentStep="assessment" substepTitle="Statutory Approvals Catalog" />

      {/* Information Banner */}
      <div className="bg-white rounded-2xl border border-blue-200 p-4 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">
              Statutory Approval Engine • Governed by Maharashtra Right to Public Services (RTS) Act 2015
            </div>
            <p className="text-[11px] text-gray-500">
              Clearances shown are determined by statutory rules matching your Business Profile parameters.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg self-start sm:self-auto flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Deterministic Rule Engine Active</span>
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search approvals by name, department, or statutory code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Stage Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Stage:</span>
            <select
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">All Stages ({approvals.length})</option>
              <option value="PRE_ESTABLISHMENT">Pre-Establishment</option>
              <option value="PRE_OPERATION">Pre-Operation</option>
              <option value="OPERATIONAL">Operational</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-medium">Dept:</span>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departmentsList.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-4 mb-8">
        {filteredApprovals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">No Approvals Match Filter Criteria</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-md mx-auto">
              No statutory clearances matched your current search or stage filters. Reset filters to view all applicable approvals.
            </p>
            <button
              onClick={() => { setSelectedStage('ALL'); setSelectedDept('ALL'); setSearchQuery(''); }}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredApprovals.map((item) => (
            <div
              key={item.id || item.approvalCode}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-blue-400 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 font-black text-xs flex items-center justify-center shrink-0 border border-blue-100">
                    {item.departmentCode}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-900">
                        {item.stage.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {item.approvalCode}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      {item.name}
                    </h3>
                    {item.nameMarathi && (
                      <span className="text-xs text-gray-500 font-medium">
                        ({item.nameMarathi})
                      </span>
                    )}
                    <div className="text-xs text-blue-900 font-semibold mt-0.5">
                      {item.departmentName} • <span className="text-gray-500">{item.statutoryAct}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-start lg:self-center shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Statutory SLA</div>
                    <div className="text-sm font-extrabold text-gray-900 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{item.statutoryTimelineDays} Days</span>
                    </div>
                  </div>
                  <StatusBadge status={item.status} size="md" />
                </div>
              </div>

              {/* Why It May Be Required (Statutory Trigger) */}
              <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Why It May Be Applicable (Statutory Trigger Rationale)
                    </span>
                    <p className="text-gray-700 leading-relaxed bg-amber-50/40 p-3 rounded-xl border border-amber-200/50">
                      {item.reason}
                    </p>
                  </div>

                  {/* Matching Criteria Badges if present */}
                  {item.matchingCriteriaSummary && item.matchingCriteriaSummary.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Matching Criteria Evaluated
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.matchingCriteriaSummary.map((crit, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{crit}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Required Documents Tags */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Required Documents Checklist ({item.requiredDocuments.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.requiredDocuments.map((doc, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[11px] bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                        >
                          <FileText className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[280px]">{doc}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI Assistance Regulatory Explanation */}
                  <AIApprovalExplanationCard
                    approval={item}
                    businessProfile={profile}
                    matchingConditions={item.matchingCriteriaSummary}
                  />
                </div>

                {/* Metadata Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Validity:</span>
                      <span className="font-semibold text-gray-800">
                        {item.validityMonths ? `${item.validityMonths / 12} Years (${item.validityMonths} Mo)` : 'Permanent / Co-terminus'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Renewal Mandate:</span>
                      <span className="font-semibold text-gray-800">{item.renewalRequired ? 'Yes (Periodic)' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estimated Statutory Fee:</span>
                      <span className="font-bold text-blue-900">{item.feeEstimate || 'As per norms'}</span>
                    </div>
                    {item.officialPortalLink && (
                      <div className="pt-2 border-t border-slate-200">
                        <a
                          href={item.officialPortalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-bold text-xs"
                        >
                          <span>Official Department Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveApprovalModal(item)}
                    className="mt-4 w-full py-2 bg-white hover:bg-blue-50 text-blue-800 font-bold rounded-lg border border-blue-200 text-xs transition"
                  >
                    View Statutory Guidelines
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal with Statutory Guidelines */}
      {activeApprovalModal && (
        <Modal
          isOpen={true}
          onClose={() => setActiveApprovalModal(null)}
          title={activeApprovalModal.name}
          subtitle={`${activeApprovalModal.departmentName} • ${activeApprovalModal.approvalCode}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              {activeApprovalModal.officialPortalLink ? (
                <a
                  href={activeApprovalModal.officialPortalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-blue-200"
                >
                  <span>Open Official Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : <div />}
              <button
                onClick={() => setActiveApprovalModal(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
              >
                Close Guidelines
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200">
              <span className="font-bold text-blue-900 block mb-1">Governing Act:</span>
              <p className="text-blue-800">{activeApprovalModal.statutoryAct}</p>
            </div>

            <div>
              <span className="font-bold text-gray-800 block mb-1">Regulatory Trigger Rationale:</span>
              <p className="text-gray-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                {activeApprovalModal.reason}
              </p>
            </div>

            {activeApprovalModal.matchingCriteriaSummary && activeApprovalModal.matchingCriteriaSummary.length > 0 && (
              <div>
                <span className="font-bold text-gray-800 block mb-1.5">Matched Statutory Rule Conditions:</span>
                <ul className="space-y-1">
                  {activeApprovalModal.matchingCriteriaSummary.map((crit, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{crit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <span className="font-bold text-gray-800 block mb-2">Mandatory Documents to Prepare:</span>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {activeApprovalModal.requiredDocuments.map((doc, idx) => (
                  <li key={idx} className="font-medium">{doc}</li>
                ))}
              </ul>
            </div>

            <AIApprovalExplanationCard
              approval={activeApprovalModal}
              businessProfile={profile}
              matchingConditions={activeApprovalModal.matchingCriteriaSummary}
              initialExpanded={true}
            />

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Maharashtra RTS SLA</span>
                <span className="font-bold text-amber-700 text-sm">{activeApprovalModal.statutoryTimelineDays} Calendar Days</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Statutory Fee</span>
                <span className="font-bold text-gray-900 text-sm">{activeApprovalModal.feeEstimate}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Workflow Navigation Footer: Back to Assessment & Continue to Document Checklist */}
      <WorkflowNavigationFooter
        backUrl="/start-assessment"
        backLabel="Back to Assessment"
        continueUrl="/document-checklist"
        continueLabel="Continue to Document Checklist"
        title="Step 2 of 4: Clearance Assessment"
        helperText={`Assemble and verify required statutory blueprints, reports, and NOC drawings for all ${filteredApprovals.length} clearances.`}
      />
    </DashboardLayout>
  );
};
