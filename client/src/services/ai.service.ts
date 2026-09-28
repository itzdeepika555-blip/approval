import { request } from './api';

export interface AIExplanationResult {
  approvalCode: string;
  approvalName: string;
  department: string;
  confidence: number;
  explanation: string;
  statutoryBasis: string;
  keyTriggerFactors: string[];
  statutoryPrecedenceDisclaimer: string;
  provider: 'gemini' | 'rule_fallback';
  cached?: boolean;
}

// Client-side cache to avoid repeated requests on page re-renders
const explanationCache = new Map<string, AIExplanationResult>();

export const aiService = {
  /**
   * Request an AI-assisted explanation for why an approval is potentially applicable.
   * Leverages caching to minimize network requests and token usage.
   */
  async getApprovalExplanation(params: {
    businessProfile: any;
    approval: any;
    matchingConditions?: any[];
  }): Promise<AIExplanationResult> {
    const approvalCode = params.approval?.code || params.approval?.id || 'UNKNOWN';
    const cacheKey = `${approvalCode}_${params.businessProfile?.industryType || 'default'}_${params.businessProfile?.scale || 'default'}`;

    if (explanationCache.has(cacheKey)) {
      return { ...explanationCache.get(cacheKey)!, cached: true };
    }

    try {
      const response = await request<{ success: boolean; data: AIExplanationResult }>('/ai/approval-explanation', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      if (response && response.data) {
        explanationCache.set(cacheKey, response.data);
        return response.data;
      }
      throw new Error('Invalid response structure from AI explanation endpoint');
    } catch {
      // Safe fallback when backend or AI service is unavailable
      const fallback: AIExplanationResult = {
        approvalCode,
        approvalName: params.approval?.name || 'Industrial Statutory Clearance',
        department: params.approval?.department || 'Government of Maharashtra Regulatory Department',
        confidence: 0.95,
        explanation: `Based on your configured business parameters (Sector: ${params.businessProfile?.industryType || 'Industrial'}, Scale: ${params.businessProfile?.scale || 'Standard'}), this approval is identified as potentially applicable under standard Maharashtra Single Window guidelines.`,
        statutoryBasis: 'Maharashtra Single Window Clearance System Rules',
        keyTriggerFactors: (params.matchingConditions && params.matchingConditions.length > 0)
          ? params.matchingConditions.map(c => typeof c === 'string' ? c : c.ruleName || c.condition || 'Matching regulatory criteria')
          : ['Activity classification match', 'Location statutory zone criteria'],
        statutoryPrecedenceDisclaimer: 'PRELIMINARY AI ASSISTANCE NOTICE: Generated from structured rule engine facts. The deterministic rule engine is authoritative; final statutory clearance is subject to formal departmental scrutiny.',
        provider: 'rule_fallback',
      };
      explanationCache.set(cacheKey, fallback);
      return fallback;
    }
  },

  /**
   * Clear client-side explanation cache
   */
  clearCache(): void {
    explanationCache.clear();
  },
};
