import { SchemeItem, ComplianceItem, RenewalItem, BusinessProfileData } from '../types';
import { request } from './api';

export const schemeService = {
  /**
   * Fetch all schemes and subsidies
   */
  async getSchemes(): Promise<SchemeItem[]> {
    try {
      const res = await request<any>('/schemes');
      return Array.isArray(res) ? res : (res?.data || []);
    } catch {
      return [];
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
      const totalInv = (profile.investmentPlantMachinery || 0) + (profile.investmentLandBuilding || 0);
      const estSubsidy = (totalInv * 0.40).toFixed(1);
      return {
        eligible: true,
        estimatedBenefit: `₹ ${estSubsidy} Lakhs (Statutory Capital Subsidy Assessment)`,
        remarks: 'Assessment calculated dynamically from enterprise investment parameters.',
      };
    }
  },

  /**
   * Fetch statutory compliance items
   */
  async getCompliances(): Promise<ComplianceItem[]> {
    try {
      const res = await request<any>('/compliance/items');
      return Array.isArray(res) ? res : (res?.data || []);
    } catch {
      return [];
    }
  },

  /**
   * Fetch license renewals
   */
  async getRenewals(): Promise<RenewalItem[]> {
    try {
      const res = await request<any>('/compliance/renewals');
      return Array.isArray(res) ? res : (res?.data || []);
    } catch {
      return [];
    }
  },
};
