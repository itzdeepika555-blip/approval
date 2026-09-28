import {
  StateAnalyticsData,
  AuditLogItem,
  AdminRuleItem,
  AdminUserItem,
} from '../types';
import { request } from './api';

export const adminService = {
  /**
   * Fetch State-Level Executive Analytics & Department Performance Rankings
   */
  async getStateAnalytics(): Promise<StateAnalyticsData> {
    try {
      const res = await request<any>('/admin/analytics');
      if (res && res.stateSummary) {
        return res;
      }
      return {
        stateSummary: {
          totalApplicationsReceived: 0,
          totalIndustrialInvestmentCr: 0,
          totalEmploymentGenerated: 0,
          overallSlaCompliancePercentage: 100,
          totalStatutoryClearancesIssued: 0,
          activeEscalationsCount: 0,
          totalAppealsFiled: 0,
          resolvedAppealsCount: 0,
        },
        departmentRankings: [],
        districtHeatmap: [],
      };
    } catch {
      return {
        stateSummary: {
          totalApplicationsReceived: 0,
          totalIndustrialInvestmentCr: 0,
          totalEmploymentGenerated: 0,
          overallSlaCompliancePercentage: 100,
          totalStatutoryClearancesIssued: 0,
          activeEscalationsCount: 0,
          totalAppealsFiled: 0,
          resolvedAppealsCount: 0,
        },
        departmentRankings: [],
        districtHeatmap: [],
      };
    }
  },

  /**
   * Fetch registered users
   */
  async getUsers(roleFilter?: string): Promise<AdminUserItem[]> {
    try {
      const res = await request<any>(`/admin/users${roleFilter ? `?role=${roleFilter}` : ''}`);
      return Array.isArray(res) ? res : (res?.data || []);
    } catch {
      return [];
    }
  },

  /**
   * Toggle user active status
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    await request(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  /**
   * Fetch regulatory audit logs
   */
  async getAuditLogs(filters?: {
    action?: string;
    entityName?: string;
    userRole?: string;
    limit?: number;
  }): Promise<AuditLogItem[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.action) params.append('action', filters.action);
      if (filters?.entityName) params.append('entityName', filters.entityName);
      if (filters?.userRole) params.append('userRole', filters.userRole);
      if (filters?.limit) params.append('limit', String(filters.limit));
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await request<any>(`/admin/audit-logs${queryString}`);
      return Array.isArray(res) ? res : (res?.data || []);
    } catch {
      return [];
    }
  },

  /**
   * Fetch all master statutory rules
   */
  async getRules(): Promise<AdminRuleItem[]> {
    try {
      const res = await request<any>('/admin/rules');
      return Array.isArray(res) ? res : (res?.data || []);
    } catch {
      return [];
    }
  },

  /**
   * Create a new master statutory rule
   */
  async createRule(rule: {
    ruleCode: string;
    ruleName: string;
    approvalCode: string;
    conditionsJson: any;
    explanationTpl: string;
    priority?: number;
  }): Promise<AdminRuleItem> {
    const res = await request<any>('/admin/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
    return res?.data || res;
  },

  /**
   * Trigger dataset reload / import
   */
  async triggerDatasetImport(): Promise<any> {
    return await request('/admin/approval-dataset/import', {
      method: 'POST',
    });
  },
};
