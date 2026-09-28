import { Router } from 'express';
import { authenticateToken, requireRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { documentUpload } from '../middlewares/upload.middleware';
import { signupSchema, loginSchema } from '../validators/auth.validator';
import { businessProfileSchema } from '../validators/businessProfile.validator';

import { authController } from '../controllers/auth.controller';
import { businessProfileController } from '../controllers/businessProfile.controller';
import { approvalController } from '../controllers/approval.controller';
import { assessmentController } from '../controllers/assessment.controller';
import { applicationController } from '../controllers/application.controller';
import { documentController } from '../controllers/document.controller';
import { inspectionController } from '../controllers/inspection.controller';
import { officerController } from '../controllers/officer.controller';
import { schemeController } from '../controllers/scheme.controller';
import { notificationController } from '../controllers/notification.controller';
import { aiController } from '../controllers/ai.controller';
import { adminController } from '../controllers/admin.controller';
import { appealController } from '../controllers/appeal.controller';
import { complianceController } from '../controllers/compliance.controller';
import { dossierController } from '../controllers/dossier.controller';

const router = Router();


// ==========================================
// 1. HEALTH & SYSTEM META
// ==========================================
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SIH26130 Industrial Approval Navigator API',
    state: 'Maharashtra',
    version: '1.0.0',
  });
});

router.get('/meta/system-info', (req, res) => {
  res.json({
    project: 'Industrial Approval, Compliance and Government Support Navigator',
    sihProblemId: 'SIH26130',
    state: 'Government of Maharashtra',
    nodalAgency: 'Maharashtra State Innovation Society',
    security: {
      auth: 'JWT with Refresh Tokens',
      rbac: ['CITIZEN', 'OFFICER', 'ADMIN'],
      protection: 'CORS, Helmet, Rate Limiter, Zod Schema Validation',
    },
  });
});

// ==========================================
// 2. AUTHENTICATION (CITIZEN, OFFICER, ADMIN)
// ==========================================
router.post('/auth/signup', validateRequest(signupSchema), authController.signup);
router.post('/auth/register', validateRequest(signupSchema), authController.signup);
router.post('/auth/login', validateRequest(loginSchema), authController.login);
router.get('/auth/me', authenticateToken, authController.getMe);

// ==========================================
// 3. BUSINESS PROFILES
// ==========================================
router.get('/business-profiles/me', authenticateToken, businessProfileController.getProfile);
router.get('/business/profile', authenticateToken, businessProfileController.getProfile);
router.post('/business-profiles', authenticateToken, validateRequest(businessProfileSchema), businessProfileController.saveProfile);
router.post('/business/profile', authenticateToken, validateRequest(businessProfileSchema), businessProfileController.saveProfile);
router.put('/business-profiles/me', authenticateToken, validateRequest(businessProfileSchema), businessProfileController.saveProfile);

// ==========================================
// 4. SMART APPROVAL ASSESSMENT & RULE ENGINE
// ==========================================
router.post('/assessment', assessmentController.assess);
router.post('/assessments/evaluate', assessmentController.assess);
router.post('/approvals/assess', assessmentController.assess);

// Master Catalogs
router.get('/departments', approvalController.getDepartments);
router.get('/approvals', approvalController.getApprovals);
router.get('/approvals/departments', approvalController.getDepartmentClearances);

// ==========================================
// 5. AI ASSISTANCE & EXPLANATION (PHASE 5)
// ==========================================
router.post('/ai/approval-explanation', aiController.explainApproval);

// ==========================================
// 6. APPLICATIONS & WORKFLOW
// ==========================================
router.get('/applications', authenticateToken, applicationController.getApplications);
router.get('/applications/:id/sla', authenticateToken, officerController.getApplicationSla);
router.get('/applications/:id', authenticateToken, applicationController.getApplicationById);
router.get('/applications/:id/approvals', authenticateToken, assessmentController.getApplicationApprovals);
router.post('/applications', authenticateToken, applicationController.submitApplication);
router.post('/applications/submit', authenticateToken, applicationController.submitApplication);
router.post('/applications/:id/submit', authenticateToken, applicationController.submitApplication);
router.put('/applications/:id', authenticateToken, applicationController.updateApplication);

// ==========================================
// 7. DOCUMENTS & PRELIMINARY VERIFICATION (PHASE 5)
// ==========================================
router.get('/documents/checklist', authenticateToken, documentController.getChecklist);
router.get('/documents/wallet', authenticateToken, documentController.getWallet);
router.get('/documents/missing', authenticateToken, documentController.getMissingDocuments);
router.get('/documents', authenticateToken, documentController.getDocuments);
router.get('/documents/:id', authenticateToken, documentController.getDocumentById);
router.delete('/documents/:id', authenticateToken, documentController.deleteDocument);
router.post(
  '/documents',
  authenticateToken,
  (req, res, next) => {
    // Graceful multer wrapping to handle both multipart and JSON payloads
    documentUpload.single('file')(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  documentController.upload
);
router.post('/documents/:id/verify', authenticateToken, documentController.verifyDocument);
router.post('/documents/ai-verify', authenticateToken, documentController.verifyWithAI);

// ==========================================
// 8. INSPECTION SCHEDULER
// ==========================================
router.get('/inspections/slots', authenticateToken, inspectionController.getSlots);
router.get('/inspections', authenticateToken, inspectionController.getSlots);
router.post('/inspections/book', authenticateToken, inspectionController.bookSlot);

// ==========================================
// 9. OFFICER WORKFLOW (RBAC: OFFICER, ADMIN)
// ==========================================
router.get('/officer/dashboard', authenticateToken, requireRoles('OFFICER', 'ADMIN'), officerController.getDashboardStats);
router.get('/officer/applications', authenticateToken, requireRoles('OFFICER', 'ADMIN'), officerController.getApplications);
router.get('/officer/escalations', authenticateToken, requireRoles('OFFICER', 'ADMIN'), officerController.getEscalations);
router.get('/officer/queries', authenticateToken, officerController.getQueries);
router.post('/officer/query', authenticateToken, requireRoles('OFFICER', 'ADMIN'), officerController.raiseQuery);
router.post('/officer/queries/:id/reply', authenticateToken, officerController.replyQuery);
router.post('/officer/applications/:id/decision', authenticateToken, requireRoles('OFFICER', 'ADMIN'), officerController.submitDecision);

// ==========================================
// 10. SCHEMES, COMPLIANCE & RENEWALS
// ==========================================
router.get('/schemes', schemeController.getSchemes);
router.post('/schemes/match', schemeController.matchSchemes);
router.post('/schemes/:id/eligibility', schemeController.checkEligibility);
router.get('/compliance/items', authenticateToken, schemeController.getCompliances);
router.get('/compliances', authenticateToken, schemeController.getCompliances);
router.get('/compliance/renewals', authenticateToken, schemeController.getRenewals);
router.get('/renewals/items', authenticateToken, schemeController.getRenewals);
router.get('/renewals', authenticateToken, schemeController.getRenewals);

// ==========================================
// 11. NOTIFICATIONS, AUDIT & ADMIN GOVERNANCE (PHASE 7)
// ==========================================
router.get('/notifications', authenticateToken, notificationController.getNotifications);
router.patch('/notifications/:id/read', authenticateToken, notificationController.markAsRead);
router.get('/admin/analytics', authenticateToken, requireRoles('ADMIN'), adminController.getAnalytics);
router.get('/admin/users', authenticateToken, requireRoles('ADMIN'), adminController.getUsers);
router.patch('/admin/users/:id/status', authenticateToken, requireRoles('ADMIN'), adminController.toggleUserStatus);
router.get('/admin/audit-logs', authenticateToken, requireRoles('ADMIN'), adminController.getAuditLogs);
router.get('/admin/rules', authenticateToken, requireRoles('ADMIN'), adminController.getRules);
router.post('/admin/rules', authenticateToken, requireRoles('ADMIN'), adminController.createRule);
router.put('/admin/rules/:id', authenticateToken, requireRoles('ADMIN'), adminController.updateRule);
router.get('/admin/approval-dataset/stats', authenticateToken, requireRoles('ADMIN'), assessmentController.getDatasetStats);
router.post('/admin/approval-dataset/import', authenticateToken, requireRoles('ADMIN'), assessmentController.triggerDatasetImport);

// ==========================================
// 12. STATUTORY APPEALS & GRIEVANCE REDRESSAL (MAHARASHTRA RTS ACT 2015 - PHASE 7)
// ==========================================
router.post('/appeals', authenticateToken, appealController.fileAppeal);
router.get('/appeals', authenticateToken, appealController.getAppeals);
router.get('/appeals/:id', authenticateToken, appealController.getAppealById);
router.post('/appeals/:id/decide', authenticateToken, requireRoles('OFFICER', 'ADMIN'), appealController.decideAppeal);

export default router;
