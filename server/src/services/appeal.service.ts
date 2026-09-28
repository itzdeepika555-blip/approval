import { db, StoredAppeal } from './db.service';
import { adminService } from './admin.service';

export interface AppealViewItem {
  id: string;
  appealNumber: string;
  applicationId: string;
  applicationNumber: string;
  businessName: string;
  citizenName: string;
  citizenContact: string;
  departmentCode: string;
  departmentName: string;
  appellateAuthority: 'FIRST_APPELLATE' | 'SECOND_APPELLATE';
  appellateAuthorityTitle: string;
  groundForAppeal: 'SLA_BREACH' | 'REJECTION_WITHOUT_REASON' | 'UNREASONABLE_QUERY' | 'CORRUPTION_HARASSMENT' | 'OTHER';
  applicantStatement: string;
  status: 'PENDING' | 'HEARING_SCHEDULED' | 'UPHELD' | 'DIRECTED_CLEARANCE' | 'DISMISSED';
  officerRemarks?: string;
  hearingDate?: string;
  orderDocumentUrl?: string;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export class AppealService {
  /**
   * Citizen files a statutory grievance appeal under Maharashtra Right to Public Services Act 2015.
   */
  public async fileAppeal(
    citizenId: string,
    payload: {
      applicationId: string;
      departmentCode: string;
      appellateAuthority: 'FIRST_APPELLATE' | 'SECOND_APPELLATE';
      groundForAppeal: 'SLA_BREACH' | 'REJECTION_WITHOUT_REASON' | 'UNREASONABLE_QUERY' | 'CORRUPTION_HARASSMENT' | 'OTHER';
      applicantStatement: string;
    }
  ): Promise<AppealViewItem> {
    const validGrounds = ['SLA_BREACH', 'REJECTION_WITHOUT_REASON', 'UNREASONABLE_QUERY', 'CORRUPTION_HARASSMENT', 'OTHER'];
    if (!validGrounds.includes(payload.groundForAppeal)) {
      throw new Error(`Invalid ground for appeal. Must be one of: ${validGrounds.join(', ')}.`);
    }

    if (!payload.applicantStatement || payload.applicantStatement.trim().length < 10) {
      throw new Error('Applicant grievance statement must contain at least 10 characters explaining statutory grounds.');
    }

    // 1. Verify application exists and citizen owns it (Multi-tenant check)
    let app = db.applications.find(
      a => a.id === payload.applicationId || a.applicationNumber === payload.applicationId
    );
    if (!app && db.isPostgresConnected) {
      try {
        const dbApp = await db.prisma.application.findFirst({
          where: { OR: [{ id: payload.applicationId }, { applicationNumber: payload.applicationId }] },
          include: { businessProfile: true },
        });
        if (dbApp) {
          app = {
            id: dbApp.id,
            userId: dbApp.userId,
            businessProfileId: dbApp.businessProfileId,
            applicationNumber: dbApp.applicationNumber,
            stage: dbApp.stage as any,
            overallProgress: dbApp.overallProgress,
            projectStage: dbApp.projectStage as any,
            totalApprovalsCount: dbApp.totalApprovalsCount,
            approvedCount: dbApp.approvedCount,
            rejectedCount: dbApp.rejectedCount,
            queryPendingCount: dbApp.queryPendingCount,
            createdAt: dbApp.createdAt,
            updatedAt: dbApp.updatedAt,
            approvals: [],
          };
          db.applications.push(app);
        }
      } catch (err) {
        console.warn('[AppealService.fileAppeal] PostgreSQL application lookup error:', err);
      }
    }

    if (!app) {
      throw new Error(`Application '${payload.applicationId}' not found.`);
    }

    if (app.userId !== citizenId && citizenId !== 'user-officer-mpcb' && citizenId !== 'user-admin') {
      throw new Error('Forbidden: You can only file statutory appeals for your own applications.');
    }

    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const appealNumber = `MH-RTS-APP-${year}-${randomSuffix}`;

    const newAppeal: StoredAppeal = {
      id: `appeal-${Date.now()}`,
      appealNumber,
      applicationId: app.id,
      citizenId,
      departmentCode: payload.departmentCode || 'MPCB',
      appellateAuthority: payload.appellateAuthority || 'FIRST_APPELLATE',
      groundForAppeal: payload.groundForAppeal,
      applicantStatement: payload.applicantStatement.trim(),
      status: 'PENDING',
      createdAt: new Date(),
    };

    if (db.isPostgresConnected) {
      try {
        const [appExists, userExists] = await Promise.all([
          db.prisma.application.findUnique({ where: { id: app.id }, select: { id: true } }),
          db.prisma.user.findUnique({ where: { id: citizenId }, select: { id: true } }),
        ]);
        if (appExists && userExists) {
          const createdPrisma = await db.prisma.appeal.create({
            data: {
              appealNumber,
              applicationId: app.id,
              citizenId,
              departmentCode: payload.departmentCode || 'MPCB',
              appellateAuthority: payload.appellateAuthority || 'FIRST_APPELLATE',
              groundForAppeal: payload.groundForAppeal,
              applicantStatement: payload.applicantStatement.trim(),
              status: 'PENDING',
            },
          });
          newAppeal.id = createdPrisma.id;
        }
      } catch (err) {
        console.warn('[AppealService.fileAppeal] PostgreSQL persist error, falling back to memory store:', err);
      }
    }

    db.appeals.unshift(newAppeal);

    // 2. Audit Trail (Persisted to memory and PostgreSQL)
    await adminService.logAuditEvent({
      userId: citizenId,
      userRole: 'CITIZEN',
      action: 'STATUTORY_APPEAL_FILED',
      entityName: 'Appeal',
      entityId: newAppeal.id,
      details: {
        appealNumber,
        applicationNumber: app.applicationNumber,
        authority: newAppeal.appellateAuthority,
        ground: newAppeal.groundForAppeal,
      },
    });

    // 3. Citizen Notification
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: citizenId,
      title: 'Statutory Appeal Registered',
      message: `Your appeal ${appealNumber} has been docketed with the ${newAppeal.appellateAuthority === 'FIRST_APPELLATE'
          ? 'First Appellate Authority (Joint Director of Industries)'
          : 'Second Appellate Authority (Principal Secretary Industries)'
        }.`,
      type: 'STATUS_UPDATE',
      isRead: false,
      linkUrl: '/sla-tracker',
      createdAt: new Date(),
    });

    return this.mapToViewItem(newAppeal);
  }

  /**
   * Retrieves appeals list with strict multi-tenant boundary.
   */
  public async getAppeals(
    requestingUser?: { userId: string; role: string },
    applicationId?: string
  ): Promise<AppealViewItem[]> {
    if (db.isPostgresConnected) {
      try {
        const where: any = {};
        if (requestingUser && requestingUser.role === 'CITIZEN') {
          where.citizenId = requestingUser.userId;
        }
        if (applicationId) {
          where.applicationId = applicationId;
        }
        const dbAppeals = await db.prisma.appeal.findMany({
          where,
          include: {
            application: {
              include: { businessProfile: true },
            },
            citizen: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        return dbAppeals.map(a => this.mapPrismaToViewItem(a));
      } catch (err) {
        console.warn('[AppealService.getAppeals] PostgreSQL query error:', err);
      }
    }

    return [];
  }

  /**
   * Retrieves a single appeal by ID with tenant boundary check
   */
  public async getAppealById(
    appealId: string,
    requestingUser?: { userId: string; role: string }
  ): Promise<AppealViewItem> {
    if (db.isPostgresConnected) {
      try {
        const a = await db.prisma.appeal.findFirst({
          where: {
            OR: [{ id: appealId }, { appealNumber: appealId }],
          },
          include: {
            application: {
              include: { businessProfile: true },
            },
            citizen: true,
          },
        });
        if (a) {
          if (requestingUser && requestingUser.role === 'CITIZEN' && a.citizenId !== requestingUser.userId) {
            throw new Error('Forbidden: You do not have permission to access this appeal filing.');
          }
          return this.mapPrismaToViewItem(a);
        }
      } catch (err: any) {
        if (err.message && err.message.startsWith('Forbidden')) throw err;
        console.warn('[AppealService.getAppealById] PostgreSQL query error, falling back to memory store:', err);
      }
    }

    const appeal = db.appeals.find(a => a.id === appealId || a.appealNumber === appealId);
    if (!appeal) throw new Error(`Statutory appeal '${appealId}' not found.`);

    if (requestingUser && requestingUser.role === 'CITIZEN' && appeal.citizenId !== requestingUser.userId) {
      throw new Error('Forbidden: You do not have permission to access this appeal filing.');
    }

    return this.mapToViewItem(appeal);
  }

  /**
   * Appellate Authority issues a binding statutory disposal order.
   */
  public async decideAppeal(
    officerId: string,
    officerName: string,
    appealId: string,
    decision: 'UPHELD' | 'DIRECTED_CLEARANCE' | 'DISMISSED',
    remarks: string
  ): Promise<AppealViewItem> {
    const validDecisions = ['UPHELD', 'DIRECTED_CLEARANCE', 'DISMISSED'];
    if (!validDecisions.includes(decision)) {
      throw new Error(`Invalid appellate decision. Must be one of: ${validDecisions.join(', ')}.`);
    }

    if (!remarks || !remarks.trim()) {
      throw new Error('Mandatory statutory appellate reasoning / findings must be provided.');
    }

    const appeal = db.appeals.find(a => a.id === appealId || a.appealNumber === appealId);
    if (!appeal && !db.isPostgresConnected) throw new Error(`Appeal with ID '${appealId}' not found.`);

    const decidedAt = new Date();
    const decidedBy = officerName || 'Appellate Authority';

    if (db.isPostgresConnected) {
      try {
        await db.prisma.appeal.updateMany({
          where: {
            OR: [{ id: appealId }, { appealNumber: appealId }],
          },
          data: {
            status: decision,
            officerRemarks: remarks.trim(),
            decidedAt,
            decidedBy,
          },
        });

        if (decision === 'DIRECTED_CLEARANCE' && appeal) {
          const appRecord = await db.prisma.application.findFirst({
            where: {
              OR: [{ id: appeal.applicationId }, { applicationNumber: appeal.applicationId }],
            },
            include: { applicationApprovals: { include: { approval: { include: { department: true } } } } },
          });

          if (appRecord) {
            const targetAppr = appRecord.applicationApprovals.find(
              aa => aa.approval.department.code === appeal.departmentCode
            ) || appRecord.applicationApprovals[0];

            if (targetAppr) {
              await db.prisma.applicationApproval.update({
                where: { id: targetAppr.id },
                data: {
                  status: 'APPROVED',
                  approvedDate: new Date(),
                  remarks: `Cleared by Appellate Order (${appeal.appealNumber}): ${remarks.trim()}`,
                },
              });

              await db.prisma.application.update({
                where: { id: appRecord.id },
                data: {
                  approvedCount: { increment: 1 },
                },
              });
            }
          }
        }
      } catch (err) {
        console.warn('[AppealService.decideAppeal] PostgreSQL update error:', err);
      }
    }

    if (appeal) {
      appeal.status = decision;
      appeal.officerRemarks = remarks.trim();
      appeal.decidedAt = decidedAt;
      appeal.decidedBy = decidedBy;

      // If clearance was directed, update parent application approval in memory
      const app = db.applications.find(a => a.id === appeal.applicationId);
      if (app && decision === 'DIRECTED_CLEARANCE') {
        const appr = app.approvals.find(a => a.departmentCode === appeal.departmentCode) || app.approvals[0];
        if (appr) {
          appr.status = 'APPROVED';
          appr.approvedAt = new Date();
          appr.remarks = `Cleared by Appellate Order (${appeal.appealNumber}): ${remarks.trim()}`;
          app.approvedCount = (app.approvedCount || 0) + 1;
        }
      }

      // Audit Log
      await adminService.logAuditEvent({
        userId: officerId,
        userRole: 'OFFICER',
        action: `APPELLATE_ORDER_${decision}`,
        entityName: 'Appeal',
        entityId: appeal.id,
        details: {
          appealNumber: appeal.appealNumber,
          decision,
          appellateOfficer: officerName,
        },
      });

      // Notify citizen
      db.notifications.push({
        id: `notif-${Date.now()}`,
        userId: appeal.citizenId,
        title: `Appellate Order Issued: ${decision}`,
        message: `The Appellate Authority has disposed appeal ${appeal.appealNumber} with order: ${decision}. Findings: ${remarks.trim()}`,
        type: 'STATUS_UPDATE',
        isRead: false,
        linkUrl: '/sla-tracker',
        createdAt: new Date(),
      });

      return this.mapToViewItem(appeal);
    }

    throw new Error(`Appeal with ID '${appealId}' not found.`);
  }

  private mapPrismaToViewItem(a: any): AppealViewItem {
    const profile = a.application?.businessProfile;
    const user = a.citizen;

    return {
      id: a.id,
      appealNumber: a.appealNumber,
      applicationId: a.applicationId,
      applicationNumber: a.application?.applicationNumber || 'MH-IND-APP',
      businessName: profile?.businessName || 'Sahyadri Precision Agro-Engineering Pvt Ltd',
      citizenName: user?.fullName || 'Rajesh Patil',
      citizenContact: user?.phone || '+91 98220 12345',
      departmentCode: a.departmentCode,
      departmentName:
        a.departmentCode === 'MPCB'
          ? 'Maharashtra Pollution Control Board'
          : a.departmentCode === 'DISH'
            ? 'Directorate of Industrial Safety & Health'
            : a.departmentCode === 'FIRE'
              ? 'Maharashtra Fire Services'
              : 'Maharashtra Single Window Inspectorate',
      appellateAuthority: a.appellateAuthority,
      appellateAuthorityTitle:
        a.appellateAuthority === 'FIRST_APPELLATE'
          ? 'First Appellate Authority: Joint Director of Industries (Regional Head)'
          : 'Second Appellate Authority: Principal Secretary (Industries), Govt. of Maharashtra',
      groundForAppeal: a.groundForAppeal,
      applicantStatement: a.applicantStatement,
      status: a.status,
      officerRemarks: a.officerRemarks || undefined,
      hearingDate: a.hearingDate ? (typeof a.hearingDate === 'string' ? a.hearingDate : a.hearingDate.toISOString()) : undefined,
      orderDocumentUrl: a.orderDocumentUrl || undefined,
      createdAt: a.createdAt ? (typeof a.createdAt === 'string' ? a.createdAt : a.createdAt.toISOString().replace('T', ' ').substring(0, 16)) : '',
      decidedAt: a.decidedAt ? (typeof a.decidedAt === 'string' ? a.decidedAt : a.decidedAt.toISOString().replace('T', ' ').substring(0, 16)) : undefined,
      decidedBy: a.decidedBy || undefined,
    };
  }

  private mapToViewItem(a: StoredAppeal): AppealViewItem {
    const app = db.applications.find(app => app.id === a.applicationId);
    const profile = app ? db.businessProfiles.find(p => p.id === app.businessProfileId) : null;
    const user = db.users.find(u => u.id === a.citizenId);

    return {
      id: a.id,
      appealNumber: a.appealNumber,
      applicationId: a.applicationId,
      applicationNumber: app ? app.applicationNumber : 'MH-IND-APP',
      businessName: profile?.businessName || 'Sahyadri Precision Agro-Engineering Pvt Ltd',
      citizenName: user?.fullName || 'Rajesh Patil',
      citizenContact: user?.phone || '+91 98220 12345',
      departmentCode: a.departmentCode,
      departmentName:
        a.departmentCode === 'MPCB'
          ? 'Maharashtra Pollution Control Board'
          : a.departmentCode === 'DISH'
            ? 'Directorate of Industrial Safety & Health'
            : a.departmentCode === 'FIRE'
              ? 'Maharashtra Fire Services'
              : 'Maharashtra Single Window Inspectorate',
      appellateAuthority: a.appellateAuthority,
      appellateAuthorityTitle:
        a.appellateAuthority === 'FIRST_APPELLATE'
          ? 'First Appellate Authority: Joint Director of Industries (Regional Head)'
          : 'Second Appellate Authority: Principal Secretary (Industries), Govt. of Maharashtra',
      groundForAppeal: a.groundForAppeal,
      applicantStatement: a.applicantStatement,
      status: a.status,
      officerRemarks: a.officerRemarks,
      hearingDate: a.hearingDate,
      orderDocumentUrl: a.orderDocumentUrl,
      createdAt: a.createdAt.toISOString().replace('T', ' ').substring(0, 16),
      decidedAt: a.decidedAt ? a.decidedAt.toISOString().replace('T', ' ').substring(0, 16) : undefined,
      decidedBy: a.decidedBy,
    };
  }
}

export const appealService = new AppealService();
