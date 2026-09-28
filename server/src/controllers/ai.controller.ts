import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai/aiService';

export class AiController {
  /**
   * User-friendly statutory approval explanation
   * POST /api/ai/approval-explanation
   */
  public async explainApproval(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessProfile, approval, matchingConditions } = req.body;

      if (!approval || !approval.approvalCode) {
        return res.status(400).json({
          success: false,
          message: 'Input validation failed: approval object with approvalCode is required.',
          errorCode: 'INVALID_APPROVAL_INPUT',
        });
      }

      const explanation = await aiService.explainApproval({
        businessProfile: businessProfile || {},
        approval,
        matchingConditions: matchingConditions || [],
      });

      res.status(200).json({
        success: true,
        data: explanation,
      });
    } catch (err: any) {
      console.warn('[AI Controller] Exception caught. Providing deterministic fallback:', err.message);
      // Failsafe: Never crash or fail the app if AI encounters an unexpected issue
      res.status(200).json({
        success: true,
        data: {
          approvalCode: req.body?.approval?.approvalCode || 'STATUTORY_CLEARANCE',
          approvalName: req.body?.approval?.name || 'Statutory Clearance',
          departmentName: req.body?.approval?.departmentName || 'Competent Authority',
          explanation: 'Potentially applicable based on the configured criteria under Maharashtra industrial regulations.',
          statutoryBasis: req.body?.approval?.statutoryAct || 'Government of Maharashtra Regulations',
          matchedCriteriaHighlights: ['Identified based on industrial parameters in the application'],
          provider: 'rule_fallback',
          isPreliminary: true,
          disclaimer: 'Potentially applicable based on the configured criteria under Maharashtra industrial regulations.',
        },
      });
    }
  }
}

export const aiController = new AiController();
