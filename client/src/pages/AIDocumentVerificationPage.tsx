import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApplication } from '../context/ApplicationContext';
import { documentService } from '../services/document.service';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ScanEye,
  UploadCloud,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FolderLock,
  Info,
  RefreshCw,
} from 'lucide-react';

export const AIDocumentVerificationPage: React.FC = () => {
  const { documents, setDocuments } = useApplication();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('docCode') || 'FACTORY-BLUEPRINT';

  const [selectedDocCode, setSelectedDocCode] = useState(initialCode);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [savedToWallet, setSavedToWallet] = useState(false);

  const documentTypes = [
    { code: 'PAN', name: 'PAN Card / Entity Tax Identification' },
    { code: 'GST_CERTIFICATE', name: 'GST Registration Certificate' },
    { code: 'IDENTITY_PROOF', name: 'Aadhaar / Authorized Signatory Identity Proof' },
    { code: 'ADDRESS_PROOF', name: 'Registered Office Address Proof / Utility Bill' },
    { code: 'LAND_DOCUMENT', name: 'MIDC Land Possession Letter & Lease Deed Agreement' },
    { code: 'PROJECT_REPORT', name: 'Detailed Project Report (DPR) & Effluent Treatment Scheme' },
    { code: 'FACTORY_PLAN', name: 'Factory Architectural Layout & Machinery Blueprint (Scale 1:100)' },
    { code: 'OTHER', name: 'Other Supporting Statutory Document' },
  ];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setFileError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setFileError('Invalid file format. Please upload PDF, JPG, or PNG files only.');
      return;
    }
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      setFileError('File size exceeds the 10MB limit. Please compress or optimize the document.');
      return;
    }
    setSelectedFile(file);
    setVerificationResult(null);
    setSavedToWallet(false);
  };

  const startVerification = async () => {
    if (!selectedFile) return;

    setIsVerifying(true);
    setVerificationProgress(15);
    setProgressStage('Encrypting and uploading document to secure sandbox...');

    await new Promise(r => setTimeout(r, 400));
    setVerificationProgress(45);
    setProgressStage('Executing Optical Character Recognition (OCR) & blueprint vector analysis...');

    await new Promise(r => setTimeout(r, 500));
    setVerificationProgress(75);
    setProgressStage('Extracting statutory entity details, dates, stamps & engineer seals...');

    await new Promise(r => setTimeout(r, 400));
    setVerificationProgress(95);
    setProgressStage('Cross-validating extracted metadata against Maharashtra regulatory rules...');

    try {
      const result = await documentService.verifyDocumentWithAI(selectedFile, selectedDocCode);
      setVerificationResult(result);
    } catch (err: any) {
      setFileError(err.message || 'Verification service error.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveToWallet = async () => {
    if (!selectedFile || !verificationResult) return;

    try {
      await documentService.uploadDocument(selectedFile, {
        documentType: selectedDocCode,
        code: selectedDocCode,
        name: selectedFile.name,
      });
    } catch (err) {
      console.warn('Backend upload notice:', err);
    }

    const matchedDoc = documents.find(d => d.code === selectedDocCode);
    const updatedDoc = {
      id: matchedDoc?.id || `doc-${Date.now()}`,
      code: selectedDocCode,
      title: documentTypes.find(d => d.code === selectedDocCode)?.name || selectedDocCode,
      category: matchedDoc?.category || 'Technical Verification',
      isMandatory: true,
      uploaded: true,
      fileName: selectedFile.name,
      fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      verificationStatus: verificationResult.status,
      confidenceScore: verificationResult.confidenceScore,
      extractedData: verificationResult.extractedFields,
      isWalletItem: true,
    };

    await documentService.saveDocument(updatedDoc);
    const updatedDocsList = documents.map(d => (d.code === selectedDocCode ? updatedDoc : d));
    setDocuments(updatedDocsList);
    setSavedToWallet(true);
  };

  return (
    <DashboardLayout
      title="Preliminary Automated Document Verification"
      subtitle="Automated optical scan, field classification & pre-submission compliance inspector"
      breadcrumbs={[
        { label: 'Citizen Dashboard', href: '/dashboard' },
        { label: 'Document Checklist', href: '/document-checklist' },
        { label: 'Document Verification' },
      ]}
      actions={
        <button
          onClick={() => navigate('/wallet')}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
        >
          <FolderLock className="w-4 h-4" />
          <span>Open Document Wallet</span>
        </button>
      }
    >
      {/* Statutory Disclaimer - Mandated requirement */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-6 shadow-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-bold">Statutory Legal Disclaimer:</strong> The AI Document Verification module acts strictly as a pre-submission applicant assistant to detect legibility, missing mandatory pages, and layout format errors. 
          It does not constitute final legal sanction. Final statutory verification is conducted exclusively by designated departmental officers under the <strong>Maharashtra Right to Public Services Act 2015</strong>.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column: Document Type Selector & Upload Box */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-700" />
              <span>Select Document Type to Verify</span>
            </h3>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="docTypeSelect">
                Statutory Document Category
              </label>
              <select
                id="docTypeSelect"
                value={selectedDocCode}
                onChange={e => {
                  setSelectedDocCode(e.target.value);
                  setSelectedFile(null);
                  setVerificationResult(null);
                  setSavedToWallet(false);
                }}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 font-semibold transition"
              >
                {documentTypes.map(d => (
                  <option key={d.code} value={d.code}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/50'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-gray-300 hover:border-blue-400 bg-gray-50/50'
              }`}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInput}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <UploadCloud className="w-7 h-7" />
              </div>

              {selectedFile ? (
                <div>
                  <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full inline-block mb-1">
                    File Ready for AI Inspection
                  </span>
                  <div className="text-sm font-extrabold text-gray-900 mt-1">{selectedFile.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Type: {selectedFile.type || 'Document'}
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setVerificationResult(null);
                    }}
                    className="text-xs text-rose-600 underline font-semibold mt-3 inline-block"
                  >
                    Remove & choose another file
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-gray-800 mb-1">
                    Drag and drop your statutory file here, or browse
                  </div>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mb-3">
                    Supports high-resolution vector <strong>PDF</strong>, or <strong>JPG / PNG</strong> blueprints. Maximum file size: <strong>10 MB</strong>.
                  </p>
                  <span className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition inline-block">
                    Select File From Computer
                  </span>
                </div>
              )}
            </div>

            {fileError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Run AI Verification Button */}
            {selectedFile && !isVerifying && !verificationResult && (
              <button
                type="button"
                onClick={startVerification}
                className="mt-6 w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 transform active:scale-98"
              >
                <ScanEye className="w-4 h-4" />
                <span>Start AI Optical Scan & Rule Verification</span>
              </button>
            )}

            {/* Verification Progress Bar */}
            {isVerifying && (
              <div className="mt-6 p-6 rounded-2xl bg-slate-900 text-white shadow-lg animate-in fade-in">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Pre-Check In Progress...</span>
                  </div>
                  <span className="font-mono text-xs font-bold">{verificationProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${verificationProgress}%` }}
                  />
                </div>
                <p className="text-xs text-blue-200 font-mono">{progressStage}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Extraction & Compliance Results */}
        <div className="space-y-6">
          {verificationResult ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                <h4 className="text-sm font-extrabold text-gray-900">Preliminary Automated Document Verification Report</h4>
                <StatusBadge status={verificationResult.status} size="md" />
              </div>

              {/* Confidence Score Dial */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center mb-5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  AI Confidence Index
                </span>
                <div className="text-3xl font-black text-blue-900 mt-1">
                  {verificationResult.confidenceScore}%
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Statutory pattern match with standard Maharashtra templates
                </div>
              </div>

              {/* Validation Checks */}
              <div className="mb-5 space-y-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Validation Parameters
                </span>
                {verificationResult.validationChecks?.map((chk: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 text-xs flex items-start gap-2"
                  >
                    {chk.status === 'PASS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : chk.status === 'WARN' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-gray-900">{chk.check}</div>
                      <div className="text-[11px] text-gray-600">{chk.note}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Extracted Metadata Fields */}
              {Object.keys(verificationResult.extractedFields).length > 0 && (
                <div className="mb-6">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    OCR Extracted Key Fields
                  </span>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs font-mono">
                    {Object.entries(verificationResult.extractedFields).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-500 text-[11px] font-sans">{k}:</span>
                        <span className="font-bold text-gray-800 text-[11px]">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save to Wallet Button */}
              {savedToWallet ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Document securely saved to Wallet!</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveToWallet}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <FolderLock className="w-4 h-4" />
                  <span>Save to Verified Document Wallet</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-3">
                <ScanEye className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Awaiting Upload</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Select a document and run the AI scanner to view OCR text extractions, blueprint compliance, and confidence score.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
