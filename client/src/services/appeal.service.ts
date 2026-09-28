import { AppealItem } from '../types';
import { request } from './api';

export const appealService = {
  /**
   * File a statutory appeal under Maharashtra Right to Public Services Act 2015
   */
  async fileAppeal(payload: {
    applicationId: string;
    departmentCode: string;
    appellateAuthority: 'FIRST_APPELLATE' | 'SECOND_APPELLATE';
    groundForAppeal: 'SLA_BREACH' | 'REJECTION_WITHOUT_REASON' | 'UNREASONABLE_QUERY' | 'CORRUPTION_HARASSMENT' | 'OTHER';
    applicantStatement: string;
  }): Promise<AppealItem> {
    const res = await request<any>('/appeals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.data || res;
  },

  /**
   * Get all appeals (filtered by citizen or viewed by officer/admin)
   */
  async getAppeals(applicationId?: string): Promise<AppealItem[]> {
    try {
      const res = await request<any>(`/appeals${applicationId ? `?applicationId=${applicationId}` : ''}`);
      return Array.isArray(res) ? res : (res?.data || []);
    } catch {
      return [];
    }
  },

  /**
   * Appellate decision / disposal order
   */
  async decideAppeal(
    appealId: string,
    decision: 'UPHELD' | 'DIRECTED_CLEARANCE' | 'DISMISSED',
    remarks: string
  ): Promise<AppealItem> {
    const res = await request<any>(`/appeals/${appealId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, remarks }),
    });
    return res?.data || res;
  },
};
