import { db, StoredBusinessProfile } from './db.service';
import { BusinessProfileInput } from '../validators/businessProfile.validator';

export class BusinessProfileService {
  /**
   * Retrieves profile for a specific user ID
   */
  public async getProfileByUserId(userId: string): Promise<StoredBusinessProfile | null> {
    const profile = db.businessProfiles.find(p => p.userId === userId);
    return profile || null;
  }

  /**
   * Creates or updates business profile for the user
   */
  public async saveProfile(userId: string, input: BusinessProfileInput): Promise<StoredBusinessProfile> {
    const existingIndex = db.businessProfiles.findIndex(p => p.userId === userId);

    const legalType = input.legalEntityType || input.businessType || 'PRIVATE_LIMITED';
    const waterKld = input.waterRequirementKld ?? input.waterUsageKld ?? 0;
    const pin = input.pinCode || '400001';

    if (existingIndex >= 0) {
      const existing = db.businessProfiles[existingIndex];
      const updated: StoredBusinessProfile = {
        ...existing,
        businessName: input.businessName,
        legalEntityType: legalType,
        industrySector: input.industrySector,
        nicCode: input.nicCode || undefined,
        businessActivity: input.businessActivity,
        district: input.district,
        taluka: input.taluka,
        pinCode: pin,
        isMidcArea: Boolean(input.isMidcArea),
        midcEstateName: input.midcEstateName || undefined,
        surveyPlotNumber: input.surveyPlotNumber || undefined,
        landAreaSqm: Number(input.landAreaSqm || 0),
        builtUpAreaSqm: Number(input.builtUpAreaSqm || 0),
        investmentPlantMachinery: Number(input.investmentPlantMachinery || 0),
        investmentLandBuilding: Number(input.investmentLandBuilding || 0),
        annualTurnover: input.annualTurnover ? Number(input.annualTurnover) : undefined,
        employeeCount: Number(input.employeeCount || 1),
        femaleEmployeeCount: input.femaleEmployeeCount ? Number(input.femaleEmployeeCount) : undefined,
        productionCapacity: input.productionCapacity || undefined,
        productionUnit: input.productionUnit || undefined,
        powerRequirementKva: Number(input.powerRequirementKva || 0),
        waterRequirementKld: Number(waterKld),
        waterSource: input.waterSource || undefined,
        pollutionCategory: (input.pollutionCategory as any) || 'GREEN',
        effluentDischargeKld: Number(input.effluentDischargeKld || 0),
        hazardousWasteGeneration: Boolean(input.hazardousWasteGeneration),
        hasBoiler: Boolean(input.hasBoiler),
        boilerCapacityTph: input.boilerCapacityTph ? Number(input.boilerCapacityTph) : undefined,
        hasDgSet: Boolean(input.hasDgSet),
        dgSetCapacityKva: input.dgSetCapacityKva ? Number(input.dgSetCapacityKva) : undefined,
        gstRegistered: Boolean(input.gstRegistered),
        gstin: input.gstin || undefined,
        msmeRegistered: Boolean(input.msmeRegistered),
        udyamNumber: input.udyamNumber || undefined,
        panNumber: input.panNumber || undefined,
        updatedAt: new Date(),
      };

      db.businessProfiles[existingIndex] = updated;

      // Audit Log
      db.auditLogs.push({
        id: `audit-${Date.now()}`,
        userId,
        action: 'BUSINESS_PROFILE_UPDATED',
        entityName: 'BusinessProfile',
        entityId: updated.id,
        createdAt: new Date(),
      });

      return updated;
    }

    // New profile creation
    const newProfile: StoredBusinessProfile = {
      id: `profile-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      businessName: input.businessName,
      legalEntityType: legalType,
      industrySector: input.industrySector,
      nicCode: input.nicCode || undefined,
      businessActivity: input.businessActivity,
      district: input.district,
      taluka: input.taluka,
      pinCode: pin,
      isMidcArea: Boolean(input.isMidcArea),
      midcEstateName: input.midcEstateName || undefined,
      surveyPlotNumber: input.surveyPlotNumber || undefined,
      landAreaSqm: Number(input.landAreaSqm || 0),
      builtUpAreaSqm: Number(input.builtUpAreaSqm || 0),
      investmentPlantMachinery: Number(input.investmentPlantMachinery || 0),
      investmentLandBuilding: Number(input.investmentLandBuilding || 0),
      annualTurnover: input.annualTurnover ? Number(input.annualTurnover) : undefined,
      employeeCount: Number(input.employeeCount || 1),
      femaleEmployeeCount: input.femaleEmployeeCount ? Number(input.femaleEmployeeCount) : undefined,
      productionCapacity: input.productionCapacity || undefined,
      productionUnit: input.productionUnit || undefined,
      powerRequirementKva: Number(input.powerRequirementKva || 0),
      waterRequirementKld: Number(waterKld),
      waterSource: input.waterSource || undefined,
      pollutionCategory: (input.pollutionCategory as any) || 'GREEN',
      effluentDischargeKld: Number(input.effluentDischargeKld || 0),
      hazardousWasteGeneration: Boolean(input.hazardousWasteGeneration),
      hasBoiler: Boolean(input.hasBoiler),
      boilerCapacityTph: input.boilerCapacityTph ? Number(input.boilerCapacityTph) : undefined,
      hasDgSet: Boolean(input.hasDgSet),
      dgSetCapacityKva: input.dgSetCapacityKva ? Number(input.dgSetCapacityKva) : undefined,
      gstRegistered: Boolean(input.gstRegistered),
      gstin: input.gstin || undefined,
      msmeRegistered: Boolean(input.msmeRegistered),
      udyamNumber: input.udyamNumber || undefined,
      panNumber: input.panNumber || undefined,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.businessProfiles.push(newProfile);

    // Audit Log
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId,
      action: 'BUSINESS_PROFILE_CREATED',
      entityName: 'BusinessProfile',
      entityId: newProfile.id,
      createdAt: new Date(),
    });

    return newProfile;
  }
}

export const businessProfileService = new BusinessProfileService();
