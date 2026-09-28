import React, { useState } from 'react';
import { aiService, AIExplanationResult } from '../../services/ai.service';
import { Sparkles, AlertCircle, ChevronDown, ChevronUp, ShieldCheck, RefreshCw } from 'lucide-react';

interface AIApprovalExplanationCardProps {
  approval: any;
  businessProfile?: any;
  matchingConditions?: string[];
  initialExpanded?: boolean;
}

export const AIApprovalExplanationCard: React.FC<AIApprovalExplanationCardProps> = ({
  approval,
  businessProfile,
  matchingConditions = [],
  initialExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AIExplanationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchExplanation = async () => {
    if (data) {
      setExpanded(!expanded);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await aiService.getApprovalExplanation({
        businessProfile: businessProfile || {
          industryType: 'Manufacturing & Engineering',
          scale: 'Medium',
          zoneType: 'MIDC Industrial Area',
        },
        approval: {
          code: approval.approvalCode || approval.code,
          name: approval.name,
          department: approval.departmentName || approval.department,
          statutoryAct: approval.statutoryAct,
        },
        matchingConditions: matchingConditions.length > 0
          ? matchingConditions
          : approval.matchingCriteriaSummary || [approval.reason || 'Configured sector/scale rule match'],
      });
      setData(result);
      setExpanded(true);
    } catch (err: any) {
      setError('AI assistant is momentarily unreachable. Deterministic matching rule remains in effect.');
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 border border-indigo-100 bg-linear-to-r from-indigo-50/60 to-purple-50/30 rounded-xl overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={() => {
          if (!data && !loading) {
            handleFetchExplanation();
          } else {
            setExpanded(!expanded);
          }
        }}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-indigo-100/40 transition"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-3 h-3 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-indigo-950">
            AI Regulatory Assistant Explanation
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
            Advisory Only
          </span>
        </div>
        <div className="flex items-center gap-2 text-indigo-700 text-xs font-medium">
          {loading ? (
            <span className="flex items-center gap-1.5 text-xs text-indigo-600">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </span>
          ) : (
            <>
              <span className="text-[11px] hidden sm:inline">
                {expanded ? 'Collapse' : 'Explain Match Reason'}
              </span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-1 text-xs border-t border-indigo-100/80 space-y-2.5">
          {error ? (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold">{error}</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  The deterministic rule engine match above is verified and legally governing.
                </p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Main AI Explanation Paragraph */}
              <div className="bg-white/80 p-3 rounded-lg border border-indigo-100 text-gray-700 leading-relaxed shadow-xs">
                <p className="font-medium text-slate-800">{data.explanation}</p>
              </div>

              {/* Key Trigger Factors & Basis */}
              {data.keyTriggerFactors && data.keyTriggerFactors.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Rule Conditions Matched in Dataset:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.keyTriggerFactors.map((factor, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-md text-[11px] font-medium"
                      >
                        <ShieldCheck className="w-3 h-3 text-indigo-600" />
                        <span>{factor}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Provider Badge and Legal Notice */}
              <div className="pt-2 border-t border-indigo-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5 text-slate-500 italic">
                  <AlertCircle className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>{data.statutoryPrecedenceDisclaimer}</span>
                </div>
                <div className="shrink-0 font-mono font-semibold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Engine: {data.provider === 'gemini' ? 'Gemini AI + Rule Engine' : 'Deterministic Rule Engine Failsafe'}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
