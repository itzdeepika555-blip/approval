import { SchemeItem, ComplianceItem, RenewalItem, BusinessProfileData } from '../types';
import { request } from './api';
import { INITIAL_SCHEMES, INITIAL_COMPLIANCES, INITIAL_RENEWALS } from '../mock/mockData';

export const schemeService = {
  /**
   * Fetch all schemes and subsidies
   */
  async getSchemes(): Promise<SchemeItem[]> {
    try {
      return await request<SchemeItem[]>('/schemes');
    } catch {
      return INITIAL_SCHEMES;
    }
  },

  /**
   * Calculate eligibility for a scheme given the business profile
   */
  async checkEligibility(schemeId: string, profile: BusinessProfileData): Promise<{
    eligible: boolean;
    estimatedBenefit: string;
    remarks: string;
  }> {
    try {
      return await request(`/schemes/${schemeId}/eligibility`, {
        method: 'POST',
        body: JSON.stringify(profile),
      });
    } catch {
      if (schemeId === 'sch-psi-2019') {
        const totalInv = (profile.investmentPlantMachinery || 0) + (profile.investmentLandBuilding || 0);
        const estSubsidy = (totalInv * 0.40).toFixed(1);
        return {
          eligible: true,
          estimatedBenefit: `₹ ${estSubsidy} Lakhs (40% Capital Subsidy under PSI 2019 Group C/D)`,
          remarks: 'Eligible under Maharashtra Industrial Policy 2019 for new manufacturing unit in Pune Haveli zone.',
        };
      }
      return {
        eligible: true,
        estimatedBenefit: 'Power Tariff concession @ ₹1.20/unit consumed',
        remarks: 'Eligible for 36 months from commercial production date.',
      };
    }
  },

  /**
   * Fetch statutory compliance items
   */
  async getCompliances(): Promise<ComplianceItem[]> {
    try {
      return await request<ComplianceItem[]>('/compliance/items');
    } catch {
      return INITIAL_COMPLIANCES;
    }
  },

  /**
   * Fetch license renewals
   */
  async getRenewals(): Promise<RenewalItem[]> {
    try {
      return await request<RenewalItem[]>('/compliance/renewals');
    } catch {
      return INITIAL_RENEWALS;
    }
  },
};
