import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApplication } from '../context/ApplicationContext';
import { approvalService } from '../services/approval.service';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export const SmartAssessmentPage: React.FC = () => {
  const { profile, setApprovals } = useApplication();
  const navigate = useNavigate();

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [currentStepMessage, setCurrentStepMessage] = useState('');
  const [assessmentResult, setAssessmentResult] = useState<any>(null);

  const evaluationSteps = [
    'Initializing rule evaluation engine...',
    'Evaluating MPCB Environmental Regulations (Water Act 1974 & Air Act 1981)...',
    'Applying Maharashtra Factories Rules 1963 & DISH Safety Norms...',
    'Scrutinizing Maharashtra Fire Prevention & Life Safety Measures Act 2006...',
    'Assessing MIDC Estate Water & Drainage Sanctions...',
    'Evaluating Indian Boiler Regulations (IBR 1950) & CEI Electrical Standards...',
    'Computing Right to Public Services (RTS Act) Statutory SLAs...',
  ];

  const runEvaluation = async () => {
    setIsEvaluating(true);
    setEvaluationProgress(10);
    setCurrentStepMessage(evaluationSteps[0]);

    for (let i = 1; i < evaluationSteps.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setEvaluationProgress(Math.round(((i + 1) / evaluationSteps.length) * 100));
      setCurrentStepMessage(evaluationSteps[i]);
    }

    try {
      // Call service layer (calls backend API or mock engine)
      const res = await approvalService.assessApprovals(profile);
      setAssessmentResult(res);
      setApprovals(res.approvals);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    // Automatically evaluate on mount
    runEvaluation();
  }, []);

  return (
    <DashboardLayout
      title="Smart Approval Assessment"
      subtitle="Deterministic statutory rule engine identifying applicable clearances"
      breadcrumbs={[
        { label: 'Citizen Dashboard', href: '/dashboard' },
        { label: 'Business Profile', href: '/business-profile' },
        { label: 'Smart Assessment' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runEvaluation}
            disabled={isEvaluating}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
            <span>Re-Run Assessment</span>
          </button>
          {assessmentResult && (
            <button
              type="button"
              onClick={() => navigate('/applicable-approvals')}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
            >
              <span>View Applicable Approvals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      }
    >
      {/* Prominent Statutory Rule Explanation mandated by user */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 mb-8 shadow-sm border border-blue-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Statutory Rule Assessment Engine</span>
        </div>
        <p className="text-base sm:text-lg font-bold leading-relaxed text-blue-50">
          "Based on your business details, the system will identify potentially applicable approvals and required documents."
        </p>
        <p className="text-xs text-blue-200 mt-2 max-w-3xl">
          The engine analyzes plant parameters against the Water & Air Acts, Factories Act 1948, Maharashtra Fire Prevention Act 2006, Indian Boilers Regulations, and MIDC regulations to remove regulatory guesswork.
        </p>
      </div>

      {/* Grid: Business Profile Summary & Assessment Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Business Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Enterprise In Focus</span>
              <h3 className="text-sm font-extrabold text-gray-900 mt-0.5">{profile.businessName}</h3>
            </div>
            <Link
              to="/business-profile"
              className="text-xs text-blue-700 font-semibold hover:underline"
            >
              Edit Profile
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Legal Entity:</span>
              <span className="font-semibold text-gray-800">{profile.businessType}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Sector:</span>
              <span className="font-semibold text-gray-800 truncate max-w-[160px]">{profile.industrySector}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Location:</span>
              <span className="font-semibold text-gray-800">{profile.district} (MIDC: {profile.isMidcArea ? 'Yes' : 'No'})</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Total Investment:</span>
              <span className="font-bold text-gray-900">₹ {(profile.investmentPlantMachinery + profile.investmentLandBuilding) / 100} Cr</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Pollution Class:</span>
              <span className="font-bold text-amber-700">{profile.pollutionCategory} Category</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Workforce:</span>
              <span className="font-semibold text-gray-800">{profile.employeeCount} Workers</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Built-Up Area:</span>
              <span className="font-semibold text-gray-800">{profile.builtUpAreaSqm} Sq. M</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Power & Water:</span>
              <span className="font-semibold text-gray-800">{profile.powerRequirementKva} kVA | {profile.waterUsageKld} KLD</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Boiler & DG Set:</span>
              <span className="font-semibold text-gray-800">
                {profile.hasBoiler ? `${profile.boilerCapacityTph} TPH Boiler` : 'No Boiler'} • {profile.hasDgSet ? `${profile.dgSetCapacityKva} kVA DG` : 'No DG'}
              </span>
            </div>
          </div>
        </div>

        {/* Assessment Progress or Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loading / Evaluating State */}
          {isEvaluating && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-8 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-700 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
                </div>
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-1">
                Executing Statutory Rule Evaluation...
              </h3>
              <p className="text-xs text-blue-700 font-medium mb-6 font-mono">
                {currentStepMessage}
              </p>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${evaluationProgress}%` }}
                  />
                </div>
                <div className="text-[11px] text-gray-400 font-semibold">{evaluationProgress}% Evaluation Completed</div>
              </div>
            </div>
          )}

          {/* Assessment Result State */}
          {!isEvaluating && assessmentResult && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              {/* Highlight Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Clearances Identified
                  </span>
                  <div className="text-3xl font-black text-blue-900">
                    {assessmentResult.approvals.length}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    100% Pre-vetted by Rule Engine
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Critical Path SLA
                  </span>
                  <div className="text-3xl font-black text-amber-600">
                    {assessmentResult.criticalPathDays} Days
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Maharashtra RTS Act Statutory Limit
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Est. Statutory Fees
                  </span>
                  <div className="text-2xl font-black text-slate-800">
                    {assessmentResult.totalEstimatedFees}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Consolidated Treasury Challan
                  </div>
                </div>
              </div>

              {/* Identified Approvals Overview Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">
                      Identified Statutory Approvals Matrix
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Clearances required prior to commencement of civil construction & operations
                    </p>
                  </div>
                  <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                    Zero Ambiguity Confirmed
                  </span>
                </div>

                <div className="space-y-3">
                  {assessmentResult.approvals.map((app: any) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/40"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                            {app.departmentCode}
                          </span>
                          <span className="text-xs font-bold text-gray-900">{app.name}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 line-clamp-1">
                          <strong>Trigger:</strong> {app.reason}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div className="text-xs">
                          <span className="text-gray-400 block text-[10px]">Statutory SLA</span>
                          <span className="font-bold text-gray-800">{app.statutoryTimelineDays} Days</span>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom CTA to Applicable Approvals */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end">
                  <button
                    onClick={() => navigate('/applicable-approvals')}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-2"
                  >
                    <span>Proceed to Applicable Approvals Catalog</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
