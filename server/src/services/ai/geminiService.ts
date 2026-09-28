import { config } from '../../config';
import {
  ApprovalExplanationRequest,
  ApprovalExplanationResponse,
  DocumentAnalysisResult,
} from './types';
import {
  buildApprovalExplanationPrompt,
  buildDocumentAnalysisPrompt,
  AI_STATUTORY_DISCLAIMER,
  DOCUMENT_VERIFICATION_DISCLAIMER,
} from './prompts';

export class GeminiService {
  private apiKey: string;
  private isEnabled: boolean;
  private explanationCache = new Map<string, { data: ApprovalExplanationResponse; timestamp: number }>();
  private cacheTtlMs = 30 * 60 * 1000; // 30 minutes cache

  constructor() {
    this.apiKey = config.ai.geminiApiKey || process.env.GEMINI_API_KEY || '';
    this.isEnabled = config.ai.enabled && Boolean(this.apiKey.trim());
  }

  public isAvailable(): boolean {
    return this.isEnabled && Boolean(this.apiKey);
  }

  /**
   * Generates a cache key for explanation requests
   */
  private getCacheKey(req: ApprovalExplanationRequest): string {
    const code = req.approval.approvalCode;
    const sector = req.businessProfile.industrySector || '';
    const loc = req.businessProfile.isMidcArea ? 'midc' : 'private';
    const pol = req.businessProfile.pollutionCategory || '';
    return `${code}_${sector}_${loc}_${pol}`;
  }

  /**
   * Calls Gemini REST API to explain an approval
   */
  public async explainApproval(req: ApprovalExplanationRequest): Promise<ApprovalExplanationResponse | null> {
    if (!this.isAvailable()) return null;

    // Check cache first
    const cacheKey = this.getCacheKey(req);
    const cached = this.explanationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }

    const { systemInstruction, userPrompt } = buildApprovalExplanationPrompt(req);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const payload = {
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`[Gemini API] Returned status ${res.status}. Switching to deterministic rule fallback.`);
        return null;
      }

      const json = (await res.json()) as any;
      const textOutput = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) return null;

      const parsed = JSON.parse(textOutput);

      const response: ApprovalExplanationResponse = {
        approvalCode: req.approval.approvalCode,
        approvalName: req.approval.name,
        departmentName: req.approval.departmentName,
        explanation: parsed.explanation || 'Potentially applicable based on statutory criteria.',
        statutoryBasis: req.approval.statutoryAct || 'Maharashtra Industrial Regulations',
        matchedCriteriaHighlights: parsed.matchedCriteriaHighlights || [],
        provider: 'gemini',
        isPreliminary: true,
        disclaimer: AI_STATUTORY_DISCLAIMER,
      };

      // Store in cache
      this.explanationCache.set(cacheKey, { data: response, timestamp: Date.now() });

      return response;
    } catch (err: any) {
      console.warn('[Gemini API] Request failed or timed out. Falling back gracefully:', err.message);
      return null;
    }
  }

  /**
   * Calls Gemini REST API to analyze document OCR text
   */
  public async analyzeDocumentText(
    extractedText: string,
    expectedDocCode: string,
    profileContext?: any
  ): Promise<DocumentAnalysisResult | null> {
    if (!this.isAvailable()) return null;

    const { systemInstruction, userPrompt } = buildDocumentAnalysisPrompt(extractedText, expectedDocCode, profileContext);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const payload = {
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;

      const json = (await res.json()) as any;
      const textOutput = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) return null;

      const parsed = JSON.parse(textOutput);

      return {
        detectedDocumentType: parsed.detectedDocumentType || 'Supporting Statutory Document',
        documentTypeCode: expectedDocCode,
        confidenceScore: parsed.confidenceScore || 85,
        extractedFields: parsed.extractedFields || {},
        verificationStatus: parsed.verificationStatus || 'PRELIMINARY_VERIFIED',
        checks: parsed.checks || [],
        missingElements: parsed.missingElements || [],
        reviewNotes: parsed.reviewNotes || ['Preliminary automated verification completed.'],
        disclaimer: DOCUMENT_VERIFICATION_DISCLAIMER,
      };
    } catch (err: any) {
      console.warn('[Gemini API] Document analysis call failed:', err.message);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
