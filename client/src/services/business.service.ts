import { BusinessProfileData } from '../types';
import { request } from './api';
import { INITIAL_BUSINESS_PROFILE } from '../mock/mockData';

export const businessService = {
  /**
   * Fetch current active business profile
   */
  async getProfile(): Promise<BusinessProfileData> {
    try {
      return await request<BusinessProfileData>('/business/profile');
    } catch {
      const saved = localStorage.getItem('maha_business_profile');
      if (saved) {
        return JSON.parse(saved);
      }
      return INITIAL_BUSINESS_PROFILE;
    }
  },

  /**
   * Save or update business profile data
   */
  async saveProfile(profile: BusinessProfileData): Promise<BusinessProfileData> {
    try {
      return await request<BusinessProfileData>('/business/profile', {
        method: 'POST',
        body: JSON.stringify(profile),
      });
    } catch {
      localStorage.setItem('maha_business_profile', JSON.stringify(profile));
      return profile;
    }
  },
};
