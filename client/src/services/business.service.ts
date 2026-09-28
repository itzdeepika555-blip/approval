import { BusinessProfileData } from '../types';
import { request } from './api';

export const EMPTY_BUSINESS_PROFILE: BusinessProfileData = {
  businessName: '',
  businessType: 'PRIVATE_LIMITED',
  industrySector: '',
  businessActivity: '',
  state: 'Maharashtra',
  district: '',
  taluka: '',
  location: '',
  isMidcArea: false,
  midcEstateName: '',
  surveyPlotNumber: '',
  investmentPlantMachinery: 0,
  investmentLandBuilding: 0,
  annualTurnover: 0,
  employeeCount: 0,
  landAreaSqm: 0,
  builtUpAreaSqm: 0,
  productionCapacity: '',
  productionUnit: '',
  pollutionCategory: 'GREEN',
  effluentDischargeKld: 0,
  hazardousWasteGeneration: false,
  waterUsageKld: 0,
  waterSource: '',
  powerRequirementKva: 0,
  hasBoiler: false,
  boilerCapacityTph: 0,
  hasDgSet: false,
  dgSetCapacityKva: 0,
  gstRegistered: false,
  gstin: '',
  msmeRegistered: false,
  udyamNumber: '',
};

export const businessService = {
  /**
   * Fetch current active business profile from PostgreSQL
   */
  async getProfile(): Promise<BusinessProfileData> {
    try {
      const res = await request<any>('/business/profile');
      if (res && res.businessName) {
        return {
          businessName: res.businessName || '',
          businessType: res.legalEntityType || res.businessType || 'PRIVATE_LIMITED',
          industrySector: res.industrySector || '',
          businessActivity: res.businessActivity || '',
          state: 'Maharashtra',
          district: res.district || '',
          taluka: res.taluka || '',
          location: res.midcEstateName || res.district || '',
          isMidcArea: Boolean(res.isMidcArea),
          midcEstateName: res.midcEstateName || '',
          surveyPlotNumber: res.surveyPlotNumber || '',
          investmentPlantMachinery: Number(res.investmentPlantMachinery || 0),
          investmentLandBuilding: Number(res.investmentLandBuilding || 0),
          annualTurnover: Number(res.annualTurnover || 0),
          employeeCount: Number(res.employeeCount || 0),
          landAreaSqm: Number(res.landAreaSqm || 0),
          builtUpAreaSqm: Number(res.builtUpAreaSqm || 0),
          productionCapacity: res.productionCapacity || '',
          productionUnit: res.productionUnit || '',
          pollutionCategory: res.pollutionCategory || 'GREEN',
          effluentDischargeKld: Number(res.effluentDischargeKld || 0),
          hazardousWasteGeneration: Boolean(res.hazardousWasteGeneration),
          waterUsageKld: Number(res.waterRequirementKld || res.waterUsageKld || 0),
          waterSource: res.waterSource || '',
          powerRequirementKva: Number(res.powerRequirementKva || 0),
          hasBoiler: Boolean(res.hasBoiler),
          boilerCapacityTph: Number(res.boilerCapacityTph || 0),
          hasDgSet: Boolean(res.hasDgSet),
          dgSetCapacityKva: Number(res.dgSetCapacityKva || 0),
          gstRegistered: Boolean(res.gstRegistered),
          gstin: res.gstin || '',
          msmeRegistered: Boolean(res.msmeRegistered),
          udyamNumber: res.udyamNumber || '',
        };
      }
    } catch {
      // User has no saved profile yet
    }
    const saved = localStorage.getItem('maha_business_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch { }
    }
    return EMPTY_BUSINESS_PROFILE;
  },

  /**
   * Save or update business profile data in PostgreSQL
   */
  async saveProfile(profile: BusinessProfileData): Promise<BusinessProfileData> {
    await request<any>('/business/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    });

    localStorage.setItem('maha_business_profile', JSON.stringify(profile));
    return profile;
  },
};
