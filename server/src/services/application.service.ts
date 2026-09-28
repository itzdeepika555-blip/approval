import { db, StoredApplication, StoredApplicationApproval } from './db.service';

export class ApplicationService {
  /**
   * Helper to format Prisma Application to StoredApplication
   */
  private formatApplication(app: any): StoredApplication {
    const approvals: StoredApplicationApproval[] = (app.applicationApprovals || []).map((aa: any) => ({
      id: aa.id,
      applicationId: aa.applicationId,
      approvalId: aa.approvalId,
      approvalCode: aa.approval?.approvalCode || 'CLEARANCE',
      approvalName: aa.approval?.name || 'Statutory Approval',
      departmentCode: aa.department?.code || aa.approval?.department?.code || 'DEPT',
      status: aa.status as any,
      statutorySlaDays: aa.approval?.statutoryTimelineDays || 30,
      targetCompletionDate: aa.slaDeadline || undefined,
      appliedDate: aa.appliedAt || undefined,
      approvedAt: aa.approvedDate || undefined,
      remarks: aa.remarks || undefined,
    }));

    return {
      id: app.id,
      userId: app.userId,
      businessProfileId: app.businessProfileId,
      applicationNumber: app.applicationNumber,
      stage: app.stage as any,
      overallProgress: app.overallProgress || 0,
      projectStage: app.projectStage as any,
      totalApprovalsCount: app.totalApprovalsCount || approvals.length,
      approvedCount: app.approvedCount || 0,
      rejectedCount: app.rejectedCount || 0,
      queryPendingCount: app.queryPendingCount || 0,
      submittedAt: app.submittedAt || undefined,
      targetCompletionDate: app.targetCompletionDate || undefined,
      completedAt: app.completedAt || undefined,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      approvals,
    };
  }

  /**
   * List applications (filtered by user if citizen) from PostgreSQL
   */
  public async getApplications(userId?: string, role?: string): Promise<StoredApplication[]> {
    const whereClause: any = {};
    if (role === 'CITIZEN' && userId) {
      whereClause.userId = userId;
    }

    const apps = await db.prisma.application.findMany({
      where: whereClause,
      include: {
        applicationApprovals: {
          include: {
            approval: { include: { department: true } },
            department: true,
          },
        },
        businessProfile: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return apps.map(a => this.formatApplication(a));
  }

  /**
   * Get single application by ID or applicationNumber from PostgreSQL
   */
  public async getApplicationById(id: string): Promise<StoredApplication | null> {
    const app = await db.prisma.application.findFirst({
      where: {
        OR: [{ id }, { applicationNumber: id }],
      },
      include: {
        applicationApprovals: {
          include: {
            approval: { include: { department: true } },
            department: true,
          },
        },
        businessProfile: true,
        user: true,
      },
    });

    if (!app) return null;
    return this.formatApplication(app);
  }

  /**
   * Submit consolidated application across all parallel departments into PostgreSQL
   */
  public async submitApplication(userId: string, payload: any): Promise<StoredApplication> {
    const appNumber = `MH-${new Date().getFullYear()}-IND-${Math.floor(10000 + Math.random() * 90000)}`;

    // 1. Ensure a valid business profile exists in PostgreSQL
    let userProfile = await db.prisma.businessProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!userProfile) {
      // Auto-create a base business profile for the applicant if not yet created
      userProfile = await db.prisma.businessProfile.create({
        data: {
          userId,
          businessName: payload.businessName || 'Industrial Enterprise',
          legalEntityType: 'PRIVATE_LIMITED',
          industrySector: payload.industrySector || 'General Manufacturing',
          businessActivity: 'Industrial operations and manufacturing',
          district: payload.district || 'Pune',
          taluka: 'Haveli',
          pinCode: '411001',
          isMidcArea: Boolean(payload.isMidcArea),
          landAreaSqm: 1000,
          builtUpAreaSqm: 500,
          investmentPlantMachinery: 10000000,
          investmentLandBuilding: 5000000,
          employeeCount: 15,
          powerRequirementKva: 50,
          waterRequirementKld: 10,
          pollutionCategory: 'ORANGE',
          effluentDischargeKld: 2,
          hazardousWasteGeneration: false,
          hasBoiler: false,
          hasDgSet: false,
          status: 'ACTIVE',
        },
      });
    }

    // 2. Fetch master approvals to link
    const allMasterApprovals = await db.prisma.approval.findMany({
      where: { isActive: true },
      include: { department: true },
    });

    let requestedItems = payload.approvals || [];
    if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
      // Select baseline approvals (CTE + Factory License) if none requested
      requestedItems = allMasterApprovals.slice(0, 2);
    }

    const targetCompletion = new Date();
    targetCompletion.setDate(targetCompletion.getDate() + 45); // Standard Maharashtra 45-day RTS cap

    // 3. Create the parent Application in PostgreSQL
    const newApp = await db.prisma.application.create({
      data: {
        userId,
        businessProfileId: userProfile.id,
        applicationNumber: appNumber,
        stage: 'SUBMITTED',
        overallProgress: 15,
        projectStage: 'PRE_ESTABLISHMENT',
        totalApprovalsCount: requestedItems.length,
        approvedCount: 0,
        rejectedCount: 0,
        queryPendingCount: 0,
        submittedAt: new Date(),
        targetCompletionDate: targetCompletion,
      },
    });

    // 4. Create child ApplicationApproval and ApplicationDepartment records
    const deptsSeen = new Set<string>();

    for (const req of requestedItems) {
      const match = allMasterApprovals.find(
        a => a.approvalCode === req.approvalCode || a.id === req.id || a.approvalCode === req.code
      ) || allMasterApprovals[0];

      if (!match) continue;

      const slaDays = match.statutoryTimelineDays || 30;
      const slaDeadline = new Date();
      slaDeadline.setDate(slaDeadline.getDate() + slaDays);

      try {
        await db.prisma.applicationApproval.create({
          data: {
            applicationId: newApp.id,
            approvalId: match.id,
            departmentId: match.departmentId,
            status: 'IN_PROGRESS',
            triggerReason: req.triggerReason || 'Statutory requirement identified during evaluation',
            slaDeadline,
            appliedAt: new Date(),
            remarks: 'Application under active departmental scrutiny',
          },
        });
      } catch {}

      if (!deptsSeen.has(match.departmentId)) {
        deptsSeen.add(match.departmentId);
        try {
          await db.prisma.applicationDepartment.create({
            data: {
              applicationId: newApp.id,
              departmentId: match.departmentId,
              overallStatus: 'IN_PROGRESS',
              slaDueDate: slaDeadline,
            },
          });
        } catch {}
      }
    }

    // 5. Create Notification in PostgreSQL
    try {
      await db.prisma.notification.create({
        data: {
          userId,
          title: 'Application Submitted Successfully',
          message: `Your industrial single-window application ${appNumber} has been dispatched to ${deptsSeen.size} departments.`,
          type: 'STATUS_UPDATE',
          isRead: false,
          linkUrl: '/approval-tracker',
        },
      });
    } catch {}

    // 6. Create Audit Log in PostgreSQL
    try {
      await db.prisma.auditLog.create({
        data: {
          userId,
          action: 'APPLICATION_SUBMITTED',
          entityName: 'Application',
          entityId: newApp.id,
          detailsJson: { applicationNumber: appNumber, approvalsCount: requestedItems.length },
        },
      });
    } catch {}

    // 7. Return complete application from PostgreSQL
    return (await this.getApplicationById(newApp.id))!;
  }

  /**
   * Update existing application in PostgreSQL
   */
  public async updateApplication(id: string, updates: Partial<StoredApplication>): Promise<StoredApplication | null> {
    const existing = await db.prisma.application.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
    });

    if (!existing) return null;

    const dataToUpdate: any = {};
    if (updates.stage) dataToUpdate.stage = updates.stage as any;
    if (updates.overallProgress !== undefined) dataToUpdate.overallProgress = updates.overallProgress;
    if (updates.approvedCount !== undefined) dataToUpdate.approvedCount = updates.approvedCount;
    if (updates.rejectedCount !== undefined) dataToUpdate.rejectedCount = updates.rejectedCount;
    if (updates.queryPendingCount !== undefined) dataToUpdate.queryPendingCount = updates.queryPendingCount;
    if (updates.completedAt) dataToUpdate.completedAt = updates.completedAt;

    await db.prisma.application.update({
      where: { id: existing.id },
      data: dataToUpdate,
    });

    return await this.getApplicationById(existing.id);
  }
}

export const applicationService = new ApplicationService();
