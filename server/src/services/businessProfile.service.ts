import { db, StoredBusinessProfile } from './db.service';
import { BusinessProfileInput } from '../validators/businessProfile.validator';

export class BusinessProfileService {
  /**
   * Helper to map Prisma record to application object format
   */
  private mapPrismaToProfile(p: any): StoredBusinessProfile {
    return {
      id: p.id,
      userId: p.userId,
      businessName: p.businessName,
      legalEntityType: p.legalEntityType,
      industrySector: p.industrySector,
      nicCode: p.nicCode || undefined,
      businessActivity: p.businessActivity,
      district: p.district,
      taluka: p.taluka,
      pinCode: p.pinCode,
      isMidcArea: Boolean(p.isMidcArea),
      midcEstateName: p.midcEstateName || undefined,
      surveyPlotNumber: p.surveyPlotNumber || undefined,
      landAreaSqm: Number(p.landAreaSqm || 0),
      builtUpAreaSqm: Number(p.builtUpAreaSqm || 0),
      investmentPlantMachinery: Number(p.investmentPlantMachinery || 0),
      investmentLandBuilding: Number(p.investmentLandBuilding || 0),
      annualTurnover: p.annualTurnover ? Number(p.annualTurnover) : undefined,
      employeeCount: Number(p.employeeCount || 1),
      femaleEmployeeCount: p.femaleEmployeeCount ? Number(p.femaleEmployeeCount) : undefined,
      productionCapacity: p.productionCapacity || undefined,
      productionUnit: p.productionUnit || undefined,
      powerRequirementKva: Number(p.powerRequirementKva || 0),
      waterRequirementKld: Number(p.waterRequirementKld || 0),
      waterSource: p.waterSource || undefined,
      pollutionCategory: p.pollutionCategory as any,
      effluentDischargeKld: Number(p.effluentDischargeKld || 0),
      hazardousWasteGeneration: Boolean(p.hazardousWasteGeneration),
      hasBoiler: Boolean(p.hasBoiler),
      boilerCapacityTph: p.boilerCapacityTph ? Number(p.boilerCapacityTph) : undefined,
      hasDgSet: Boolean(p.hasDgSet),
      dgSetCapacityKva: p.dgSetCapacityKva ? Number(p.dgSetCapacityKva) : undefined,
      gstRegistered: Boolean(p.gstRegistered),
      gstin: p.gstin || undefined,
      msmeRegistered: Boolean(p.msmeRegistered),
      udyamNumber: p.udyamNumber || undefined,
      panNumber: p.panNumber || undefined,
      status: p.status || 'ACTIVE',
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  /**
   * Retrieves profile for a specific user ID from PostgreSQL
   */
  public async getProfileByUserId(userId: string): Promise<StoredBusinessProfile | null> {
    const profile = await db.prisma.businessProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (!profile) return null;
    return this.mapPrismaToProfile(profile);
  }

  /**
   * Creates or updates business profile for the user in PostgreSQL
   */
  public async saveProfile(userId: string, input: BusinessProfileInput): Promise<StoredBusinessProfile> {
    const legalType = input.legalEntityType || input.businessType || 'PRIVATE_LIMITED';
    const waterKld = input.waterRequirementKld ?? input.waterUsageKld ?? 0;
    const pin = input.pinCode || '400001';

    const existing = await db.prisma.businessProfile.findFirst({
      where: { userId },
    });

    const dataToSave: any = {
      businessName: input.businessName,
      legalEntityType: legalType as any,
      industrySector: input.industrySector,
      nicCode: input.nicCode || null,
      businessActivity: input.businessActivity,
      district: input.district,
      taluka: input.taluka,
      pinCode: pin,
      isMidcArea: Boolean(input.isMidcArea),
      midcEstateName: input.midcEstateName || null,
      surveyPlotNumber: input.surveyPlotNumber || null,
      landAreaSqm: Number(input.landAreaSqm || 0),
      builtUpAreaSqm: Number(input.builtUpAreaSqm || 0),
      investmentPlantMachinery: Number(input.investmentPlantMachinery || 0),
      investmentLandBuilding: Number(input.investmentLandBuilding || 0),
      annualTurnover: input.annualTurnover ? Number(input.annualTurnover) : null,
      employeeCount: Number(input.employeeCount || 1),
      femaleEmployeeCount: input.femaleEmployeeCount ? Number(input.femaleEmployeeCount) : 0,
      productionCapacity: input.productionCapacity || null,
      productionUnit: input.productionUnit || null,
      powerRequirementKva: Number(input.powerRequirementKva || 0),
      waterRequirementKld: Number(waterKld),
      waterSource: input.waterSource || null,
      pollutionCategory: (input.pollutionCategory as any) || 'GREEN',
      effluentDischargeKld: Number(input.effluentDischargeKld || 0),
      hazardousWasteGeneration: Boolean(input.hazardousWasteGeneration),
      hasBoiler: Boolean(input.hasBoiler),
      boilerCapacityTph: input.boilerCapacityTph ? Number(input.boilerCapacityTph) : null,
      hasDgSet: Boolean(input.hasDgSet),
      dgSetCapacityKva: input.dgSetCapacityKva ? Number(input.dgSetCapacityKva) : null,
      gstRegistered: Boolean(input.gstRegistered),
      gstin: input.gstin || null,
      msmeRegistered: Boolean(input.msmeRegistered),
      udyamNumber: input.udyamNumber || null,
      panNumber: input.panNumber || null,
      status: 'ACTIVE',
    };

    let savedRecord: any;

    if (existing) {
      savedRecord = await db.prisma.businessProfile.update({
        where: { id: existing.id },
        data: dataToSave,
      });

      try {
        await db.prisma.auditLog.create({
          data: {
            userId,
            action: 'BUSINESS_PROFILE_UPDATED',
            entityName: 'BusinessProfile',
            entityId: savedRecord.id,
            detailsJson: { businessName: savedRecord.businessName },
          },
        });
      } catch {}
    } else {
      savedRecord = await db.prisma.businessProfile.create({
        data: {
          ...dataToSave,
          userId,
        },
      });

      try {
        await db.prisma.auditLog.create({
          data: {
            userId,
            action: 'BUSINESS_PROFILE_CREATED',
            entityName: 'BusinessProfile',
            entityId: savedRecord.id,
            detailsJson: { businessName: savedRecord.businessName },
          },
        });
      } catch {}
    }

    return this.mapPrismaToProfile(savedRecord);
  }
}

export const businessProfileService = new BusinessProfileService();
