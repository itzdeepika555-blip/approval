import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplication } from '../context/ApplicationContext';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { DocumentItem } from '../types';
import { documentService } from '../services/document.service';
import {
  Download,
  Eye,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Search,
  UploadCloud,
} from 'lucide-react';

export const DocumentWalletPage: React.FC = () => {
  const { documents } = useApplication();
  const navigate = useNavigate();

  const [walletList, setWalletList] = useState<DocumentItem[]>([]);
  const [, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'NEEDS_REVIEW' | 'EXPIRED'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<DocumentItem | null>(null);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Load live wallet documents
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const liveDocs = await documentService.getWalletDocuments();
        if (isMounted) {
          if (liveDocs && liveDocs.length > 0) {
            setWalletList(liveDocs);
          } else {
            setWalletList(documents.filter(d => d.uploaded && d.isWalletItem));
          }
        }
      } catch {
        if (isMounted) {
          setWalletList(documents.filter(d => d.uploaded && d.isWalletItem));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [documents]);

  const filteredDocs = walletList.filter(d => {
    // Tab filter
    if (filter === 'VERIFIED') {
      const isVer = d.verificationStatus === 'PASSED' || (d as any).status === 'VERIFIED' || (d as any).verificationStatus === 'PRELIMINARY_VERIFIED';
      if (!isVer) return false;
    } else if (filter === 'PENDING') {
      const isPend = d.verificationStatus === 'PENDING' || (d as any).status === 'PENDING';
      if (!isPend) return false;
    } else if (filter === 'NEEDS_REVIEW') {
      const isReview = d.verificationStatus === 'WARNING' || (d as any).verificationStatus === 'NEEDS_REVIEW';
      if (!isReview) return false;
    } else if (filter === 'EXPIRED') {
      const isExp = (d as any).status === 'EXPIRED' || (d.expiryDate && new Date(d.expiryDate) < new Date());
      if (!isExp) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (d.title && d.title.toLowerCase().includes(q)) ||
        (d.code && d.code.toLowerCase().includes(q)) ||
        (d.category && d.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDownload = (doc: DocumentItem) => {
    setDownloadSuccessToast(`Downloading encrypted copy of "${doc.fileName || doc.title}"...`);
    setTimeout(() => setDownloadSuccessToast(null), 3000);
  };

  return (
    <DashboardLayout
      title="Verified Document Wallet"
      subtitle="Encrypted industrial document vault preventing redundant re-uploads across departments"
      breadcrumbs={[
        { label: 'Citizen Dashboard', href: '/dashboard' },
        { label: 'Document Checklist', href: '/document-checklist' },
        { label: 'Document Wallet' },
      ]}
      actions={
        <button
          onClick={() => navigate('/document-verification')}
          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
        >
          <UploadCloud className="w-4 h-4 text-amber-400" />
          <span>Add New Document</span>
        </button>
      }
    >
      {downloadSuccessToast && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccessToast}</span>
        </div>
      )}

      {/* Information Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-5 mb-6 shadow-sm border border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Single-Window Document Reusability</span>
          </div>
          <h2 className="text-base font-extrabold text-white">
            Pre-Verified Industrial Vault ({walletList.length} Active Documents)
          </h2>
          <p className="text-xs text-emerald-100/90 mt-0.5 max-w-2xl">
            Documents verified in this wallet are permanently accessible to all statutory scrutinizing departments (MPCB, DISH, Fire, MIDC) without requiring repetitive physical submissions.
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-mono font-bold bg-emerald-800/80 px-3 py-1 rounded-lg border border-emerald-600 text-emerald-200">
            256-Bit Encrypted Vault
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {[
          { key: 'ALL', label: 'All Documents' },
          { key: 'VERIFIED', label: 'Verified' },
          { key: 'PENDING', label: 'Pending' },
          { key: 'NEEDS_REVIEW', label: 'Needs Review' },
          { key: 'EXPIRED', label: 'Expired' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search wallet documents by title, category, or statutory reference..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none text-gray-800"
        />
      </div>

      {/* Documents Table View */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Document Name & Code</th>
                <th className="px-4 py-3.5">Type & Category</th>
                <th className="px-4 py-3.5">Upload Date</th>
                <th className="px-4 py-3.5">Verification Status</th>
                <th className="px-4 py-3.5">Expiry / Validity</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-blue-50/40 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-gray-900 line-clamp-1">{doc.title}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                          {doc.fileName || doc.code} {doc.fileSize ? `(${doc.fileSize})` : ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                      {doc.category}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-gray-600 font-mono text-[11px]">
                    {doc.uploadedAt || '2026-09-20'}
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge status={doc.verificationStatus} />
                    {doc.confidenceScore && (
                      <div className="text-[10px] text-emerald-700 font-bold mt-1">
                        {doc.confidenceScore}% AI Confidence
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-gray-700 font-medium">
                    {doc.expiryDate ? (
                      <span className="text-[11px] font-mono">{doc.expiryDate}</span>
                    ) : (
                      <span className="text-[11px] text-gray-500 italic">Project Lifetime</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewDoc(doc)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 text-blue-800 transition"
                        title="Preview Document Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-100 text-emerald-800 transition"
                        title="Download Encrypted Document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Preview Modal */}
      {selectedPreviewDoc && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPreviewDoc(null)}
          title={selectedPreviewDoc.title}
          subtitle={`Verified Document Vault • ${selectedPreviewDoc.code}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => handleDownload(selectedPreviewDoc)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Document</span>
              </button>
              <button
                onClick={() => setSelectedPreviewDoc(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
              >
                Close Preview
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Simulated Document Preview Box */}
            <div className="p-6 rounded-2xl bg-slate-100 border border-slate-300 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 text-blue-800 flex items-center justify-center mx-auto mb-2 shadow-xs">
                <FileText className="w-8 h-8" />
              </div>
              <div className="font-extrabold text-sm text-gray-900">{selectedPreviewDoc.fileName}</div>
              <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                Size: {selectedPreviewDoc.fileSize} • Uploaded: {selectedPreviewDoc.uploadedAt}
              </div>
              <div className="mt-3 inline-block">
                <StatusBadge status={selectedPreviewDoc.verificationStatus} size="md" />
              </div>
            </div>

            {/* Extracted Metadata */}
            {selectedPreviewDoc.extractedData && (
              <div>
                <h5 className="font-bold text-gray-900 mb-2 uppercase tracking-wider text-[11px]">
                  Verified Metadata Tags (OCR Scanned)
                </h5>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-1.5 font-mono">
                  {Object.entries(selectedPreviewDoc.extractedData).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-500 text-[11px] font-sans">{k}:</span>
                      <span className="font-bold text-gray-800 text-[11px]">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};
