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

    const formattedDocs = (app.documents || []).map((d: any) => ({
      id: d.id,
      userId: d.userId,
      applicationId: d.applicationId,
      documentType: d.documentTypeCode,
      title: d.documentName,
      fileName: d.fileName,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      fileUrl: d.fileUrl,
      verificationStatus: d.verifications?.[0]?.verificationStatus || (d.isVerified ? 'PASSED' : 'PENDING'),
      confidenceScore: d.verifications?.[0]?.confidenceScore ? Number(d.verifications[0].confidenceScore) : undefined,
      uploadedAt: d.createdAt,
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
      businessProfile: app.businessProfile,
      documents: formattedDocs,
      user: app.user ? {
        id: app.user.id,
        fullName: app.user.fullName,
        email: app.user.email,
        phone: app.user.phone,
      } : undefined,
    } as any;
  }

  /**
   * List applications (filtered by user if citizen) from PostgreSQL
   */
  public async getApplications(userId?: string, role?: string): Promise<StoredApplication[]> {
    const whereClause: any = {};
    if (role !== 'OFFICER' && role !== 'ADMIN') {
      if (!userId) return [];
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
        documents: {
          include: {
            verifications: {
              orderBy: { checkedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apps.map(a => this.formatApplication(a));
  }

  /**
   * Get single application by ID or applicationNumber from PostgreSQL with strict IDOR ownership check
   */
  public async getApplicationById(id: string, userId?: string, role?: string): Promise<StoredApplication | null> {
    const where: any = {
      OR: [{ id }, { applicationNumber: id }],
    };

    if (role !== 'OFFICER' && role !== 'ADMIN') {
      if (!userId) return null;
      where.userId = userId;
    }

    const app = await db.prisma.application.findFirst({
      where,
      include: {
        applicationApprovals: {
          include: {
            approval: { include: { department: true } },
            department: true,
          },
        },
        businessProfile: true,
        user: true,
        documents: {
          include: {
            verifications: {
              orderBy: { checkedAt: 'desc' },
              take: 1,
            },
          },
        },
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

    const bp = payload.businessProfile || {};

    // 1. Ensure a valid business profile exists in PostgreSQL and sync with submitted form data
    let userProfile = await db.prisma.businessProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!userProfile) {
      userProfile = await db.prisma.businessProfile.create({
        data: {
          userId,
          businessName: bp.businessName || payload.businessName || 'Industrial Enterprise',
          legalEntityType: bp.legalEntityType || 'PRIVATE_LIMITED',
          industrySector: bp.industrySector || payload.industrySector || 'General Manufacturing',
          businessActivity: bp.businessActivity || 'Industrial operations and manufacturing',
          district: bp.district || payload.district || 'Pune',
          taluka: bp.taluka || 'Haveli',
          pinCode: bp.pinCode || '411001',
          isMidcArea: Boolean(bp.isMidcArea ?? payload.isMidcArea),
          midcEstateName: bp.midcEstateName || null,
          surveyPlotNumber: bp.surveyPlotNumber || null,
          landAreaSqm: bp.landAreaSqm ? Number(bp.landAreaSqm) : 1000,
          builtUpAreaSqm: bp.builtUpAreaSqm ? Number(bp.builtUpAreaSqm) : 500,
          investmentPlantMachinery: bp.investmentPlantMachinery ? Number(bp.investmentPlantMachinery) : 10000000,
          investmentLandBuilding: bp.investmentLandBuilding ? Number(bp.investmentLandBuilding) : 5000000,
          employeeCount: bp.employeeCount ? Number(bp.employeeCount) : 15,
          powerRequirementKva: bp.powerRequirementKva ? Number(bp.powerRequirementKva) : 50,
          waterRequirementKld: bp.waterUsageKld ? Number(bp.waterUsageKld) : 10,
          pollutionCategory: bp.pollutionCategory || 'ORANGE',
          effluentDischargeKld: bp.effluentDischargeKld ? Number(bp.effluentDischargeKld) : 2,
          hazardousWasteGeneration: Boolean(bp.hazardousWasteGeneration),
          hasBoiler: Boolean(bp.hasBoiler),
          hasDgSet: Boolean(bp.hasDgSet),
          status: 'ACTIVE',
        },
      });
    } else if (Object.keys(bp).length > 0) {
      // Sync latest profile details submitted with application
      userProfile = await db.prisma.businessProfile.update({
        where: { id: userProfile.id },
        data: {
          businessName: bp.businessName || userProfile.businessName,
          industrySector: bp.industrySector || userProfile.industrySector,
          district: bp.district || userProfile.district,
          taluka: bp.taluka || userProfile.taluka,
          pinCode: bp.pinCode || userProfile.pinCode,
          isMidcArea: bp.isMidcArea !== undefined ? Boolean(bp.isMidcArea) : userProfile.isMidcArea,
          midcEstateName: bp.midcEstateName || userProfile.midcEstateName,
          surveyPlotNumber: bp.surveyPlotNumber || userProfile.surveyPlotNumber,
          landAreaSqm: bp.landAreaSqm ? Number(bp.landAreaSqm) : userProfile.landAreaSqm,
          builtUpAreaSqm: bp.builtUpAreaSqm ? Number(bp.builtUpAreaSqm) : userProfile.builtUpAreaSqm,
          investmentPlantMachinery: bp.investmentPlantMachinery ? Number(bp.investmentPlantMachinery) : userProfile.investmentPlantMachinery,
          investmentLandBuilding: bp.investmentLandBuilding ? Number(bp.investmentLandBuilding) : userProfile.investmentLandBuilding,
          employeeCount: bp.employeeCount ? Number(bp.employeeCount) : userProfile.employeeCount,
          powerRequirementKva: bp.powerRequirementKva ? Number(bp.powerRequirementKva) : userProfile.powerRequirementKva,
          waterRequirementKld: bp.waterUsageKld ? Number(bp.waterUsageKld) : userProfile.waterRequirementKld,
          pollutionCategory: bp.pollutionCategory || userProfile.pollutionCategory,
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

    // 4. Link unlinked documents uploaded by this user to the newly created application
    try {
      await db.prisma.document.updateMany({
        where: {
          userId,
          applicationId: null,
        },
        data: {
          applicationId: newApp.id,
        },
      });

      if (Array.isArray(payload.documentIds) && payload.documentIds.length > 0) {
        await db.prisma.document.updateMany({
          where: {
            id: { in: payload.documentIds },
            userId,
          },
          data: {
            applicationId: newApp.id,
          },
        });
      }
    } catch (err) {
      console.warn('[ApplicationService] Error linking documents to application:', err);
    }

    // 5. Create child ApplicationApproval and ApplicationDepartment records
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

    // 6. Create Notification in PostgreSQL
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

    // 7. Create Audit Log in PostgreSQL
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

    // 8. Return complete application from PostgreSQL
    return (await this.getApplicationById(newApp.id, userId, 'CITIZEN'))!;
  }

  /**
   * Update existing application in PostgreSQL with tenant authorization
   */
  public async updateApplication(
    id: string,
    updates: Partial<StoredApplication>,
    userId?: string,
    role?: string
  ): Promise<StoredApplication | null> {
    const where: any = { OR: [{ id }, { applicationNumber: id }] };
    if (role !== 'OFFICER' && role !== 'ADMIN') {
      if (!userId) return null;
      where.userId = userId;
    }

    const existing = await db.prisma.application.findFirst({
      where,
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

    return await this.getApplicationById(existing.id, userId, role);
  }
}

export const applicationService = new ApplicationService();
