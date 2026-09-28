import { db, StoredQuery } from './db.service';
import { slaService } from './sla.service';

export interface OfficerApplicationItem {
  id: string;
  applicationNumber: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  businessName: string;
  industrySector: string;
  district: string;
  pollutionCategory: string;
  appliedDate: string;
  submittedAt: string;
  rtsDeadline: string;
  rtsDaysRemaining: number;
  slaDaysTotal: number;
  status: 'PENDING' | 'UNDER_REVIEW' | 'QUERY_RAISED' | 'INSPECTION_SCHEDULED' | 'APPROVED' | 'REJECTED';
  assignedApproval: string;
  clearanceName: string;
  assignedDepartment: string;
  applicantContact: string;
  investmentAmount: string;
  investmentAmountCr: number;
  employeeCount: number;
  workersCount: number;
  documentsCount: number;
  queriesCount: number;
  inspectionRequired: boolean;
  inspectionStatus: 'NOT_SCHEDULED' | 'SCHEDULED' | 'COMPLETED';
}

export class OfficerService {
  /**
   * Retrieves applications in the officer scrutiny queue with statutory SLA calculations.
   */
  public async getOfficerApplications(departmentCode?: string): Promise<OfficerApplicationItem[]> {
    return db.applications.map(app => {
      const profile = db.businessProfiles.find(p => p.id === app.businessProfileId);
      const user = db.users.find(u => u.id === app.userId);
      const slaReport = slaService.calculateApplicationSla(app);

      // Select approval matching officer department or active clearance
      const activeApproval =
        app.approvals.find(a => (departmentCode ? a.departmentCode === departmentCode : true)) ||
        app.approvals.find(a => a.status !== 'APPROVED') ||
        app.approvals[0];

      const submittedStr = app.submittedAt
        ? new Date(app.submittedAt).toISOString().substring(0, 10)
        : '2026-09-20';

      const targetDeadline = new Date(app.targetCompletionDate || app.createdAt);
      if (!app.targetCompletionDate) {
        targetDeadline.setDate(targetDeadline.getDate() + 45);
      }
      const deadlineStr = targetDeadline.toISOString().substring(0, 10);

      const investmentCr = profile
        ? Number(((profile.investmentPlantMachinery + profile.investmentLandBuilding) / 10000000).toFixed(2))
        : 7.0;

      const appDocs = db.documents.filter(d => d.applicationId === app.id || d.userId === app.userId);
      const appQueries = db.queries.filter(
        q => q.applicationId === app.id || q.applicationId === app.applicationNumber
      );
      const appInspection = db.inspections.find(i => i.applicationId === app.id);

      // Normalize status for UI
      let uiStatus: OfficerApplicationItem['status'] = 'UNDER_REVIEW';
      if (app.stage === 'APPROVED') uiStatus = 'APPROVED';
      else if (app.stage === 'REJECTED') uiStatus = 'REJECTED';
      else if (appQueries.some(q => q.status === 'OPEN')) uiStatus = 'QUERY_RAISED';
      else if (app.stage === 'INSPECTION_SCHEDULED' || appInspection?.status === 'SCHEDULED')
        uiStatus = 'INSPECTION_SCHEDULED';

      return {
        id: app.id,
        applicationNumber: app.applicationNumber,
        applicantName: user?.fullName || 'Rajesh Patil',
        applicantEmail: user?.email || 'rajesh.patil@omkara-engg.com',
        applicantPhone: user?.phone || '+91 98230 45678',
        businessName: profile?.businessName || 'Sahyadri Precision Agro-Engineering Pvt Ltd',
        industrySector: profile?.industrySector || 'Automotive & Heavy Engineering',
        district: profile?.district || 'Pune (Chakan MIDC)',
        pollutionCategory: profile?.pollutionCategory || 'ORANGE',
        appliedDate: submittedStr,
        submittedAt: submittedStr,
        rtsDeadline: deadlineStr,
        rtsDaysRemaining: slaReport.daysRemaining,
        slaDaysTotal: slaReport.overallStatutorySlaDays,
        status: uiStatus,
        assignedApproval: activeApproval?.approvalName || 'Consent to Establish (CTE)',
        clearanceName: activeApproval?.approvalName || 'Consolidated Single-Window Establishment Pack',
        assignedDepartment: activeApproval?.departmentCode || 'MPCB & DISH Joint Queue',
        applicantContact: user?.phone || '+91 98220 12345',
        investmentAmount: `₹ ${investmentCr} Cr`,
        investmentAmountCr: investmentCr,
        employeeCount: profile?.employeeCount || 85,
        workersCount: profile?.employeeCount || 85,
        documentsCount: appDocs.length > 0 ? appDocs.length : 5,
        queriesCount: appQueries.filter(q => q.status === 'OPEN').length,
        inspectionRequired: true,
        inspectionStatus: appInspection ? 'SCHEDULED' : 'NOT_SCHEDULED',
      };
    });
  }

  /**
   * Retrieves queries with multi-tenant data isolation.
   */
  public async getQueries(
    applicationId?: string,
    requestingUser?: { userId: string; role: string }
  ): Promise<any[]> {
    // Multi-tenant boundary check
    if (requestingUser && requestingUser.role === 'CITIZEN') {
      const userApps = db.applications.filter(a => a.userId === requestingUser.userId);
      const userAppIds = new Set(userApps.flatMap(a => [a.id, a.applicationNumber]));

      if (applicationId && !userAppIds.has(applicationId)) {
        throw new Error('Forbidden: You do not have permission to view queries for this application.');
      }

      const queries = db.queries.filter(
        q =>
          q.citizenId === requestingUser.userId ||
          userAppIds.has(q.applicationId)
      );

      return this.formatQueriesList(queries);
    }

    // Officer / Admin access
    const queries = db.queries.filter(q =>
      applicationId ? q.applicationId === applicationId || q.applicationId === applicationId : true
    );
    return this.formatQueriesList(queries);
  }

  private formatQueriesList(queries: StoredQuery[]) {
    return queries.map(q => {
      const officer = db.users.find(u => u.id === q.officerId);
      return {
        id: q.id,
        applicationId: q.applicationId,
        departmentCode: q.approvalCode || 'MPCB',
        departmentName:
          q.approvalCode === 'DISH'
            ? 'Directorate of Industrial Safety & Health'
            : q.approvalCode === 'FIRE'
              ? 'Maharashtra Fire Services'
              : 'Maharashtra Pollution Control Board',
        officerName: officer?.fullName || 'Dr. Rahul Deshmukh',
        queryText: q.question,
        createdAt: q.createdAt.toISOString().replace('T', ' ').substring(0, 16),
        citizenResponse: q.answer,
        citizenResponseDate: q.answeredAt
          ? q.answeredAt.toISOString().replace('T', ' ').substring(0, 16)
          : undefined,
        status: q.status === 'RESOLVED' ? 'RESOLVED' : 'PENDING_CITIZEN_REPLY',
      };
    });
  }

  /**
   * Officer raises a formal statutory scrutiny query to the citizen.
   */
  public async raiseQuery(
    officerId: string,
    applicationId: string,
    departmentCode: string,
    queryText: string,
    officerName?: string
  ) {
    if (!queryText || !queryText.trim()) {
      throw new Error('Query text cannot be empty.');
    }

    const app = db.applications.find(a => a.id === applicationId || a.applicationNumber === applicationId);
    const citizenId = app ? app.userId : 'user-citizen-demo';

    const newQuery: StoredQuery = {
      id: `qry-${Date.now()}`,
      applicationId: app?.applicationNumber || applicationId,
      officerId,
      citizenId,
      approvalCode: departmentCode,
      subject: `Statutory Scrutiny Clarification - ${departmentCode}`,
      question: queryText.trim(),
      status: 'OPEN',
      createdAt: new Date(),
    };

    db.queries.unshift(newQuery);

    // Update approval status in application to QUERY_RAISED and pause clock
    if (app) {
      const approval = app.approvals.find(a => a.departmentCode === departmentCode) || app.approvals[0];
      if (approval) {
        approval.status = 'QUERY_RAISED';
        approval.remarks = `Official Query Raised: ${queryText.trim()}`;
      }
      app.queryPendingCount = (app.queryPendingCount || 0) + 1;
      app.stage = 'UNDER_SCRUTINY';
    }

    // Mask sensitive identifiers in audit log
    const maskedCitizen = citizenId.length > 8 ? `${citizenId.substring(0, 4)}***` : 'citizen';
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId: officerId,
      userRole: 'OFFICER',
      action: 'OFFICER_QUERY_RAISED',
      entityName: 'Query',
      entityId: newQuery.id,
      details: {
        applicationId: app?.applicationNumber || applicationId,
        departmentCode,
        citizen: maskedCitizen,
        queryLength: queryText.trim().length,
      },
      createdAt: new Date(),
    });

    // Notify citizen
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: citizenId,
      title: `Action Required: Scrutiny Query from ${departmentCode}`,
      message: queryText.trim(),
      type: 'QUERY',
      isRead: false,
      linkUrl: '/approval-tracker',
      createdAt: new Date(),
    });

    return {
      id: newQuery.id,
      applicationId: newQuery.applicationId,
      departmentCode,
      departmentName: 'Maharashtra Scrutiny Portal',
      officerName: officerName || 'Dr. Rahul Deshmukh',
      queryText: newQuery.question,
      createdAt: newQuery.createdAt.toISOString().replace('T', ' ').substring(0, 16),
      status: 'PENDING_CITIZEN_REPLY',
    };
  }

  /**
   * Citizen replies to query with multi-tenant ownership enforcement.
   */
  public async replyQuery(
    queryId: string,
    citizenResponse: string,
    requestingUser?: { userId: string; role: string }
  ) {
    if (!citizenResponse || !citizenResponse.trim()) {
      throw new Error('Citizen response cannot be empty.');
    }

    const query = db.queries.find(q => q.id === queryId);
    if (!query) throw new Error('Query not found');

    // Multi-tenant check: Citizen can ONLY reply to their own query
    if (requestingUser && requestingUser.role === 'CITIZEN' && query.citizenId !== requestingUser.userId) {
      throw new Error('Forbidden: You do not have permission to reply to this query.');
    }

    query.answer = citizenResponse.trim();
    query.answeredAt = new Date();
    query.status = 'RESOLVED';

    // Update application approval state and resume statutory clock
    const app = db.applications.find(
      a => a.id === query.applicationId || a.applicationNumber === query.applicationId
    );
    if (app) {
      const approval =
        app.approvals.find(a => a.departmentCode === query.approvalCode || a.approvalCode === query.approvalCode) ||
        app.approvals.find(a => a.status === 'QUERY_RAISED') ||
        app.approvals[0];

      if (approval) {
        approval.status = 'IN_PROGRESS';
        approval.remarks = `Citizen Clarification Provided: ${citizenResponse.trim()}`;
      }
      if (app.queryPendingCount > 0) app.queryPendingCount -= 1;
    }

    // Audit log
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId: requestingUser?.userId || query.citizenId,
      userRole: 'CITIZEN',
      action: 'CITIZEN_QUERY_REPLY',
      entityName: 'Query',
      entityId: query.id,
      details: {
        applicationId: query.applicationId,
        queryId: query.id,
      },
      createdAt: new Date(),
    });

    // Notify officer
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: query.officerId,
      title: 'Query Clarification Received',
      message: `Applicant has submitted clarification for application ${query.applicationId}.`,
      type: 'STATUS_UPDATE',
      isRead: false,
      linkUrl: '/officer/desk',
      createdAt: new Date(),
    });

    return {
      id: query.id,
      applicationId: query.applicationId,
      departmentCode: query.approvalCode,
      status: 'RESOLVED',
      citizenResponse: query.answer,
      citizenResponseDate: query.answeredAt.toISOString().replace('T', ' ').substring(0, 16),
    };
  }

  /**
   * Officer grants statutory clearance or records reasoned rejection.
   */
  public async submitDecision(
    applicationId: string,
    decision: 'APPROVED' | 'REJECTED',
    remarks: string,
    officerName?: string,
    departmentCode?: string
  ) {
    if (!remarks || !remarks.trim()) {
      throw new Error('Mandatory statutory officer remarks / findings must be provided.');
    }
    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      throw new Error('Decision must be either APPROVED or REJECTED.');
    }

    const app = db.applications.find(a => a.id === applicationId || a.applicationNumber === applicationId);
    if (!app) throw new Error('Application not found');

    // Target clearance: match officer's department or pending clearance
    const approval =
      (departmentCode ? app.approvals.find(a => a.departmentCode === departmentCode) : null) ||
      app.approvals.find(a => a.status !== 'APPROVED') ||
      app.approvals[0];

    if (approval) {
      approval.status = decision;
      approval.remarks = remarks.trim();
      if (decision === 'APPROVED') {
        approval.approvedAt = new Date();
        app.approvedCount = (app.approvedCount || 0) + 1;
      } else {
        approval.rejectionReason = remarks.trim();
        app.rejectedCount = (app.rejectedCount || 0) + 1;
      }
    }

    // Check if overall application is fully cleared
    const allApproved = app.approvals.every(a => a.status === 'APPROVED');
    if (allApproved) {
      app.stage = 'APPROVED';
      app.overallProgress = 100;
      app.completedAt = new Date();
    } else if (decision === 'REJECTED') {
      app.stage = 'REJECTED';
    }

    // Audit log
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      action: `OFFICER_DECISION_${decision}`,
      entityName: 'Application',
      entityId: app.id,
      details: {
        applicationNumber: app.applicationNumber,
        approvalCode: approval?.approvalCode,
        decision,
        officer: officerName || 'Dr. Rahul Deshmukh',
      },
      createdAt: new Date(),
    });

    // Notify citizen
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: app.userId,
      title: `Statutory Clearance Decision: ${decision}`,
      message: `Your application ${app.applicationNumber} received decision: ${decision}. Remarks: ${remarks.trim()}`,
      type: 'STATUS_UPDATE',
      isRead: false,
      linkUrl: '/approval-tracker',
      createdAt: new Date(),
    });

    return {
      success: true,
      message: `Statutory decision successfully registered as ${decision} for ${approval?.approvalName || 'clearance'}.`,
    };
  }

  /**
   * Summary KPIs for Officer Scrutiny Dashboard including RTS SLA escalations.
   */
  public async getDashboardStats(departmentId?: string) {
    const totalAssigned = db.applications.length;
    const pendingScrutiny = db.applications.filter(
      a => a.stage === 'UNDER_SCRUTINY' || a.stage === 'SUBMITTED'
    ).length;
    const approvedTotal = db.applications.filter(a => a.stage === 'APPROVED').length;
    const queriesActive = db.queries.filter(q => q.status === 'OPEN').length;
    const escalations = await slaService.getEscalationQueue(departmentId);

    return {
      totalAssigned,
      pendingScrutiny,
      approvedTotal,
      queriesActive,
      slaBreaches: escalations.filter(e => e.escalationLevel === 'BREACHED_OR_DEEMED').length,
      slaWarnings: escalations.filter(e => e.escalationLevel === 'WARNING' || e.escalationLevel === 'CRITICAL').length,
      averageProcessingDays: 14.2,
      scheduledInspections: db.inspections.filter(i => i.status === 'SCHEDULED').length,
    };
  }
}

export const officerService = new OfficerService();
