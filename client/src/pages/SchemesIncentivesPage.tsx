import React, { useState, useEffect } from 'react';
import { useApplication } from '../context/ApplicationContext';
import { schemeService } from '../services/scheme.service';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { SchemeItem } from '../types';
import {
  Award,
  Search,
  CheckCircle2,
  FileText,
  Sparkles,
} from 'lucide-react';

export const SchemesIncentivesPage: React.FC = () => {
  const { profile } = useApplication();
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeEligibilityModal, setActiveEligibilityModal] = useState<{
    scheme: SchemeItem;
    result: any;
  } | null>(null);

  useEffect(() => {
    schemeService.getSchemes().then(setSchemes);
  }, []);

  const filteredSchemes = schemes.filter(s => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.benefits.toLowerCase().includes(q) && !s.department.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleCheckEligibility = async (scheme: SchemeItem) => {
    const res = await schemeService.checkEligibility(scheme.id, profile);
    setActiveEligibilityModal({ scheme, result: res });
  };

  return (
    <DashboardLayout
      title="Industrial Schemes & Subsidies"
      subtitle="Maharashtra Package Scheme of Incentives (PSI 2019/2024) & Industrial Subsidies"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Citizen Dashboard', href: '/dashboard' },
        { label: 'Schemes & Incentives' },
      ]}
    >
      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search schemes by name, financial benefit, or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 font-semibold">Total Schemes:</span>
          <span className="font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            {schemes.length} Schemes Available
          </span>
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="space-y-6 mb-8">
        {filteredSchemes.map(scheme => (
          <div
            key={scheme.id}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:border-blue-300 hover:shadow-md transition"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {scheme.code}
                    </span>
                    {scheme.subsidyPercentage && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Up to {scheme.subsidyPercentage}% Subsidy
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900">{scheme.name}</h3>
                  <div className="text-xs text-gray-500 mt-0.5 font-medium">{scheme.department}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
                <StatusBadge status={scheme.status} size="md" />
                <button
                  type="button"
                  onClick={() => handleCheckEligibility(scheme)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Check Unit Eligibility</span>
                </button>
              </div>
            </div>

            {/* Scheme Details Grid */}
            <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="md:col-span-2 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Key Financial Benefits & Incentives
                  </span>
                  <p className="text-gray-800 font-medium bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/60 leading-relaxed">
                    {scheme.benefits}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Required Evidentiary Documents
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {scheme.requiredDocuments.map((doc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                      >
                        <FileText className="w-3 h-3 text-purple-600" />
                        <span>{doc}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Eligibility Criteria Sidebox */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Eligible Sectors & Zones
                </span>
                <div>
                  <div className="text-[11px] text-gray-500 font-semibold mb-1">Sectors:</div>
                  <div className="text-gray-800 font-bold">{scheme.eligibleSectors.join(', ')}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 font-semibold mb-1">Districts / Taluka Zones:</div>
                  <div className="text-gray-800 font-bold">{scheme.eligibleDistricts.join(', ')}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Eligibility Modal */}
      {activeEligibilityModal && (
        <Modal
          isOpen={true}
          onClose={() => setActiveEligibilityModal(null)}
          title={`Eligibility Assessment: ${activeEligibilityModal.scheme.name}`}
          subtitle={`Calculated against active profile for ${profile.businessName}`}
          maxWidth="lg"
          footer={
            <button
              onClick={() => setActiveEligibilityModal(null)}
              className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
            >
              Close
            </button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
              <div className="flex items-center gap-2 font-black text-sm mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Unit Confirmed Eligible!</span>
              </div>
              <p className="text-xs text-emerald-800 font-medium">
                {activeEligibilityModal.result.remarks}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Estimated Financial Grant
              </span>
              <div className="text-xl font-black text-blue-900">
                {activeEligibilityModal.result.estimatedBenefit}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Subject to commercial production certificate and MPCB consent compliance.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};
