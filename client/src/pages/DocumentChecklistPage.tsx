import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplication } from '../context/ApplicationContext';
import { documentService, MissingDocumentReport } from '../services/document.service';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { WorkflowProgressIndicator } from '../components/common/WorkflowProgressIndicator';
import { WorkflowNavigationFooter } from '../components/common/WorkflowNavigationFooter';
import { StatusBadge } from '../components/common/StatusBadge';
import { DocumentItem } from '../types';
import {
  Upload,
  FolderLock,
  ScanEye,
  FileText,
  Clock,
  Search,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Loader2,
  Check,
} from 'lucide-react';

export const DocumentChecklistPage: React.FC = () => {
  const { documents, updateDocument, isSubmitted, activeSubmission } = useApplication();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'ACTION_NEEDED'>('ALL');
  const [search, setSearch] = useState('');
  const [missingReport, setMissingReport] = useState<MissingDocumentReport | null>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [validationBlockedMsg, setValidationBlockedMsg] = useState<string | null>(null);
  const [unverifiedList, setUnverifiedList] = useState<DocumentItem[]>([]);

  // Hidden file input refs
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const report = await documentService.getMissingDocuments();
        if (isMounted && report) {
          setMissingReport(report);
        }
      } catch (err) {
        console.warn('Failed to load missing document report:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const counts = {
    total: documents.length,
    uploaded: documents.filter(d => d.uploaded).length,
    pending: documents.filter(d => !d.uploaded).length,
    verified: documents.filter(d => d.verificationStatus === 'PASSED').length,
    actionNeeded: documents.filter(d => d.verificationStatus === 'WARNING' || d.verificationStatus === 'FAILED').length,
  };

  const filteredDocs = documents.filter(doc => {
    if (activeTab === 'PENDING' && doc.uploaded) return false;
    if (activeTab === 'UPLOADED' && !doc.uploaded) return false;
    if (activeTab === 'VERIFIED' && doc.verificationStatus !== 'PASSED') return false;
    if (activeTab === 'ACTION_NEEDED' && doc.verificationStatus !== 'WARNING' && doc.verificationStatus !== 'FAILED') return false;
    if (search.trim() && !doc.title.toLowerCase().includes(search.toLowerCase()) && !doc.code.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleFileUpload = async (doc: DocumentItem, file: File) => {
    if (isSubmitted) return;
    setUploadingDocId(doc.id);
    try {
      const updated = await documentService.uploadAndVerifyChecklistDocument(doc, file);
      updateDocument(updated);

      // Clear any validation warning if all now verified
      setUnverifiedList(prev => prev.filter(d => d.id !== doc.id && d.code !== doc.code));
      if (validationBlockedMsg && unverifiedList.length <= 1) {
        setValidationBlockedMsg(null);
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleQuickVerify = async (doc: DocumentItem) => {
    if (isSubmitted) return;
    setUploadingDocId(doc.id);
    try {
      const updated = await documentService.quickVerifyDocument(doc);
      updateDocument(updated);

      setUnverifiedList(prev => prev.filter(d => d.id !== doc.id && d.code !== doc.code));
      if (validationBlockedMsg && unverifiedList.length <= 1) {
        setValidationBlockedMsg(null);
      }
    } catch (err) {
      console.error('Quick verification failed:', err);
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleVerifyAllRequired = async () => {
    if (isSubmitted) return;
    const requiredPending = documents.filter(d => d.isMandatory && (!d.uploaded || d.verificationStatus !== 'PASSED'));
    for (const doc of requiredPending) {
      setUploadingDocId(doc.id);
      const updated = await documentService.quickVerifyDocument(doc);
      updateDocument(updated);
    }
    setUploadingDocId(null);
    setUnverifiedList([]);
    setValidationBlockedMsg(null);
  };

  const handleContinue = () => {
    if (isSubmitted) {
      navigate('/application/review');
      return;
    }

    // STRICT VALIDATION: ALL required documents must be uploaded AND verified successfully (PASSED)
    const unverified = documents.filter(
      d => d.isMandatory && (!d.uploaded || d.verificationStatus !== 'PASSED')
    );

    if (unverified.length > 0) {
      setUnverifiedList(unverified);
      setValidationBlockedMsg(
        `Navigation Blocked: All ${unverified.length} required statutory document(s) must be uploaded and verified before proceeding to Review & Submit.`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationBlockedMsg(null);
    setUnverifiedList([]);
    navigate('/application/review');
  };

  const pendingMandatoryCount = documents.filter(d => d.isMandatory && (!d.uploaded || d.verificationStatus !== 'PASSED')).length;

  return (
    <DashboardLayout
      title="Required Document Checklist"
      subtitle="Statutory document portfolio required for consolidated clearance scrutiny"
      breadcrumbs={[
        { label: 'Citizen Dashboard', href: '/dashboard' },
        { label: 'Applicable Approvals', href: '/applicable-approvals' },
        { label: 'Document Checklist' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          {!isSubmitted && pendingMandatoryCount > 0 && (
            <button
              onClick={handleVerifyAllRequired}
              disabled={uploadingDocId !== null}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-emerald-200" />
              <span>Verify All Mandatory</span>
            </button>
          )}
          <button
            onClick={() => navigate('/document-verification')}
            className="px-4 py-2 bg-blue-900 text-white hover:bg-blue-800 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <ScanEye className="w-4 h-4 text-amber-400" />
            <span>AI Verification Desk</span>
          </button>
          <button
            onClick={() => navigate('/wallet')}
            className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <FolderLock className="w-4 h-4" />
            <span>Document Wallet</span>
          </button>
        </div>
      }
    >
      {/* Horizontal Progress Indicator for Citizen Workflow */}
      <WorkflowProgressIndicator currentStep="documents" />

      {/* Application Locked Notice (Submission Lock) */}
      {isSubmitted && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 shadow-xs flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold shrink-0">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                Application Submitted & Documents Locked (Read-Only Mode)
              </h4>
              <p className="text-[11px] text-blue-800">
                This application has been formally submitted under the Maharashtra Right to Public Services Act. Documents cannot be added, replaced, or deleted during departmental scrutiny.
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-3 py-1 bg-white border border-blue-200 text-blue-900 rounded-xl shrink-0">
            {activeSubmission?.applicationNumber || 'MHA-APP-LOCKED'}
          </span>
        </div>
      )}

      {/* Validation Blocked Alert Banner */}
      {validationBlockedMsg && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-5 mb-6 shadow-md animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">
                {validationBlockedMsg}
              </h4>
              <p className="text-[11px] text-rose-800 mt-1">
                Maharashtra single window compliance requires 100% of mandatory statutory documents to pass automated pre-verification before forwarding to department scrutiny desks.
              </p>

              {/* List of offending unverified documents */}
              <div className="mt-3 space-y-2">
                <span className="text-[11px] font-bold text-rose-900 block">Pending Verification ({unverifiedList.length}):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {unverifiedList.map(doc => (
                    <div
                      key={doc.id}
                      className="p-2.5 bg-white rounded-xl border border-rose-200 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="truncate">
                        <span className="text-xs font-bold text-gray-900 block truncate">{doc.title}</span>
                        <span className="text-[10px] text-rose-700 font-mono">
                          {doc.uploaded ? `Status: ${doc.verificationStatus}` : 'Awaiting Upload'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickVerify(doc)}
                        disabled={uploadingDocId === doc.id}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {uploadingDocId === doc.id ? 'Verifying...' : 'Verify Now'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Missing Document Detection Banner (Rule Engine & Checklist Integration) */}
      {missingReport && missingReport.totalMissing > 0 && !validationBlockedMsg && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 mb-6 shadow-xs animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                <AlertTriangle className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                  Missing Statutory Documents Detected ({missingReport.totalMissing} Missing of {missingReport.totalRequired})
                </h4>
                <p className="text-[11px] text-amber-800">
                  Based on matched statutory approvals, all mandatory documents must be uploaded and verified before consolidated submission.
                </p>
              </div>
            </div>
            <div className="font-mono text-xs font-bold px-3 py-1 bg-white border border-amber-300 text-amber-900 rounded-xl self-start sm:self-auto">
              Portfolio Readiness: {missingReport.completionPercentage}%
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {missingReport.missingDocuments.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-200 shadow-xs"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="text-rose-600 font-bold shrink-0">⚠</span>
                  <div className="truncate">
                    <span className="font-bold text-slate-900 truncate block">{m.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {m.code} {m.department ? `• ${m.department}` : ''}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/document-verification?docCode=${m.code}`)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[11px] font-bold shrink-0 transition cursor-pointer"
                >
                  Upload & Verify
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Counters Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            activeTab === 'ALL' ? 'bg-blue-900 text-white border-blue-900 shadow-md' : 'bg-white border-gray-200 hover:border-blue-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${activeTab === 'ALL' ? 'text-blue-200' : 'text-gray-400'}`}>
            Total Required
          </span>
          <div className="text-2xl font-black mt-0.5">{counts.total}</div>
          <div className={`text-[11px] mt-0.5 ${activeTab === 'ALL' ? 'text-blue-200' : 'text-gray-500'}`}>All Clearances</div>
        </button>

        <button
          onClick={() => setActiveTab('UPLOADED')}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            activeTab === 'UPLOADED' ? 'bg-blue-900 text-white border-blue-900 shadow-md' : 'bg-white border-gray-200 hover:border-blue-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${activeTab === 'UPLOADED' ? 'text-blue-200' : 'text-gray-400'}`}>
            Uploaded
          </span>
          <div className="text-2xl font-black mt-0.5 text-blue-600">{counts.uploaded}</div>
          <div className={`text-[11px] mt-0.5 ${activeTab === 'UPLOADED' ? 'text-blue-200' : 'text-gray-500'}`}>In Portal Storage</div>
        </button>

        <button
          onClick={() => setActiveTab('PENDING')}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            activeTab === 'PENDING' ? 'bg-blue-900 text-white border-blue-900 shadow-md' : 'bg-white border-gray-200 hover:border-blue-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${activeTab === 'PENDING' ? 'text-blue-200' : 'text-gray-400'}`}>
            Pending
          </span>
          <div className="text-2xl font-black mt-0.5 text-amber-600">{counts.pending}</div>
          <div className={`text-[11px] mt-0.5 ${activeTab === 'PENDING' ? 'text-blue-200' : 'text-gray-500'}`}>Awaiting Upload</div>
        </button>

        <button
          onClick={() => setActiveTab('VERIFIED')}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            activeTab === 'VERIFIED' ? 'bg-blue-900 text-white border-blue-900 shadow-md' : 'bg-white border-gray-200 hover:border-blue-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${activeTab === 'VERIFIED' ? 'text-blue-200' : 'text-gray-400'}`}>
            Verified
          </span>
          <div className="text-2xl font-black mt-0.5 text-emerald-600">{counts.verified}</div>
          <div className={`text-[11px] mt-0.5 ${activeTab === 'VERIFIED' ? 'text-blue-200' : 'text-gray-500'}`}>Pre-Check Passed</div>
        </button>

        <button
          onClick={() => setActiveTab('ACTION_NEEDED')}
          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
            activeTab === 'ACTION_NEEDED' ? 'bg-blue-900 text-white border-blue-900 shadow-md' : 'bg-white border-gray-200 hover:border-blue-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${activeTab === 'ACTION_NEEDED' ? 'text-blue-200' : 'text-gray-400'}`}>
            Action Needed
          </span>
          <div className="text-2xl font-black mt-0.5 text-rose-600">{counts.actionNeeded}</div>
          <div className={`text-[11px] mt-0.5 ${activeTab === 'ACTION_NEEDED' ? 'text-blue-200' : 'text-gray-500'}`}>Warning / Rejected</div>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter documents by title, keyword, or document code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none text-gray-800"
        />
      </div>

      {/* Document Items List */}
      <div className="space-y-4 mb-8">
        {filteredDocs.map(doc => {
          const isDocUploading = uploadingDocId === doc.id;
          const isDocVerified = doc.uploaded && doc.verificationStatus === 'PASSED';

          return (
            <div
              key={doc.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                !isDocVerified && doc.isMandatory ? 'border-amber-200 hover:border-amber-300' : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isDocVerified
                      ? 'bg-emerald-50 text-emerald-700'
                      : doc.uploaded
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {isDocVerified ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {doc.code}
                    </span>
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">
                      {doc.category}
                    </span>
                    {doc.isMandatory ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                        Mandatory
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        Optional
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-extrabold text-gray-900">{doc.title}</h3>

                  {doc.uploaded ? (
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 mt-1 font-mono">
                      <span className="text-blue-900 font-bold">{doc.fileName}</span>
                      <span>•</span>
                      <span>{doc.fileSize || '380 KB'}</span>
                      <span>•</span>
                      <span>Uploaded: {doc.uploadedAt || 'Recorded'}</span>
                      {doc.confidenceScore && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">
                            AI Confidence: {doc.confidenceScore}%
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-700 mt-1 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Document pending upload. Required before final statutory submission.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                <StatusBadge status={doc.verificationStatus} size="md" />

                {/* Hidden File Input for this Document */}
                <input
                  type="file"
                  ref={el => { fileInputRefs.current[doc.id] = el; }}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(doc, file);
                    }
                  }}
                />

                {!isSubmitted && (
                  <div className="flex items-center gap-1.5">
                    {/* Direct Upload button */}
                    <button
                      type="button"
                      disabled={isDocUploading}
                      onClick={() => fileInputRefs.current[doc.id]?.click()}
                      className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isDocUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{doc.uploaded ? 'Replace' : 'Upload'}</span>
                    </button>

                    {/* Quick Verify button if not yet PASSED */}
                    {!isDocVerified && (
                      <button
                        type="button"
                        disabled={isDocUploading}
                        onClick={() => handleQuickVerify(doc)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Run automated pre-verification check"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Pre-Verify</span>
                      </button>
                    )}

                    {/* Wallet shortcut */}
                    {doc.uploaded && (
                      <button
                        type="button"
                        onClick={() => navigate('/wallet')}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <FolderLock className="w-3.5 h-3.5" />
                        <span>Wallet</span>
                      </button>
                    )}
                  </div>
                )}

                {isSubmitted && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-gray-400" />
                    <span>Locked</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Workflow Navigation Footer: Back to Approvals & Continue to Review & Submit */}
      <WorkflowNavigationFooter
        backUrl="/applicable-approvals"
        backLabel="Back to Approvals"
        continueUrl="/application/review"
        continueLabel="Continue to Review & Submit"
        onContinue={handleContinue}
        title="Step 3 of 4: Statutory Documents"
        helperText={
          isSubmitted
            ? "Application locked. Proceed to view submission receipt."
            : pendingMandatoryCount > 0
            ? `${pendingMandatoryCount} mandatory document(s) must be uploaded & verified before continuing.`
            : `All ${counts.verified} mandatory documents verified. Ready for final review.`
        }
        extraActions={
          <button
            type="button"
            onClick={() => navigate('/document-verification')}
            className="px-4 py-2.5 bg-blue-850 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 border border-blue-700 cursor-pointer"
          >
            <ScanEye className="w-4 h-4 text-amber-400" />
            <span>AI Verification Tool</span>
          </button>
        }
      />
    </DashboardLayout>
  );
};
