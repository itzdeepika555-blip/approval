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
      return await request<StateAnalyticsData>('/admin/analytics');
    } catch {
      return {
        stateSummary: {
          totalApplicationsReceived: 142,
          totalIndustrialInvestmentCr: 890.5,
          totalEmploymentGenerated: 12450,
          overallSlaCompliancePercentage: 94.8,
          totalStatutoryClearancesIssued: 420,
          activeEscalationsCount: 3,
          totalAppealsFiled: 6,
          resolvedAppealsCount: 4,
        },
        departmentRankings: [
          {
            departmentCode: 'MPCB',
            departmentName: 'Maharashtra Pollution Control Board',
            totalApplications: 142,
            approvedCount: 98,
            rejectedCount: 4,
            pendingCount: 40,
            deemedApprovalsTriggered: 1,
            slaComplianceRate: 97.2,
            averageProcessingDays: 18.2,
            activeQueriesCount: 8,
          },
          {
            departmentCode: 'DISH',
            departmentName: 'Directorate of Industrial Safety & Health',
            totalApplications: 110,
            approvedCount: 85,
            rejectedCount: 2,
            pendingCount: 23,
            deemedApprovalsTriggered: 0,
            slaComplianceRate: 98.2,
            averageProcessingDays: 14.5,
            activeQueriesCount: 3,
          },
          {
            departmentCode: 'FIRE',
            departmentName: 'Maharashtra Fire Services',
            totalApplications: 95,
            approvedCount: 80,
            rejectedCount: 1,
            pendingCount: 14,
            deemedApprovalsTriggered: 0,
            slaComplianceRate: 98.9,
            averageProcessingDays: 9.8,
            activeQueriesCount: 2,
          },
          {
            departmentCode: 'MIDC',
            departmentName: 'Maharashtra Industrial Development Corp',
            totalApplications: 88,
            approvedCount: 72,
            rejectedCount: 3,
            pendingCount: 13,
            deemedApprovalsTriggered: 1,
            slaComplianceRate: 95.5,
            averageProcessingDays: 13.6,
            activeQueriesCount: 4,
          },
          {
            departmentCode: 'CEI',
            departmentName: 'Chief Electrical Inspectorate',
            totalApplications: 64,
            approvedCount: 50,
            rejectedCount: 2,
            pendingCount: 12,
            deemedApprovalsTriggered: 0,
            slaComplianceRate: 96.8,
            averageProcessingDays: 11.2,
            activeQueriesCount: 1,
          },
          {
            departmentCode: 'BOILER',
            departmentName: 'Directorate of Steam Boilers',
            totalApplications: 38,
            approvedCount: 30,
            rejectedCount: 1,
            pendingCount: 7,
            deemedApprovalsTriggered: 1,
            slaComplianceRate: 92.1,
            averageProcessingDays: 16.4,
            activeQueriesCount: 2,
          },
        ],
        districtHeatmap: [
          { district: 'Pune (Chakan & Ranjangaon)', applicationsCount: 42, investmentAmountCr: 320.5, complianceScore: 96.2 },
          { district: 'Thane & Navi Mumbai', applicationsCount: 28, investmentAmountCr: 215.0, complianceScore: 94.8 },
          { district: 'Raigad (Taloja & Roha)', applicationsCount: 19, investmentAmountCr: 185.2, complianceScore: 91.5 },
          { district: 'Aurangabad (Shendra DMIC)', applicationsCount: 15, investmentAmountCr: 140.0, complianceScore: 95.0 },
          { district: 'Nagpur (Butibori & MIHAN)', applicationsCount: 12, investmentAmountCr: 98.4, complianceScore: 93.4 },
          { district: 'Nashik (Ambad & Satpur)', applicationsCount: 11, investmentAmountCr: 88.0, complianceScore: 97.1 },
        ],
      };
    }
  },

  /**
   * Fetch registered users
   */
  async getUsers(roleFilter?: string): Promise<AdminUserItem[]> {
    try {
      return await request<AdminUserItem[]>(`/admin/users${roleFilter ? `?role=${roleFilter}` : ''}`);
    } catch {
      return [
        {
          id: 'user-admin',
          email: 'admin@maharashtra.gov.in',
          fullName: 'Smt. Radhika Patil, IAS',
          phone: '+91 98220 99001',
          role: 'ADMIN',
          isActive: true,
          designation: 'Development Commissioner (Industries)',
          createdAt: '2026-01-01',
        },
        {
          id: 'user-officer-mpcb',
          email: 'officer@mpcb.gov.in',
          fullName: 'Dr. Rahul Deshmukh',
          phone: '+91 98220 54321',
          role: 'OFFICER',
          isActive: true,
          departmentId: 'dept-mpcb',
          designation: 'Sub-Regional Officer (MPCB Pune)',
          createdAt: '2026-01-05',
        },
        {
          id: 'user-citizen-demo',
          email: 'rajesh.patil@omkara-engg.com',
          fullName: 'Rajesh Patil',
          phone: '+91 98230 45678',
          role: 'CITIZEN',
          isActive: true,
          designation: 'Managing Director, Omkara Precision Engineering',
          createdAt: '2026-01-20',
        },
      ];
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
      return await request<AuditLogItem[]>(`/admin/audit-logs${queryString}`);
    } catch {
      return [
        {
          id: 'audit-01',
          userId: 'user-admin',
          userRole: 'ADMIN',
          action: 'STATUTORY_RULE_CREATED',
          entityName: 'Rule',
          entityId: 'RULE-SOLAR-08',
          details: { ruleCode: 'RULE_ROOFTOP_SOLAR', approvalCode: 'MSEDCL_NET_METER' },
          ipAddress: '103.21.124.5',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'audit-02',
          userId: 'user-officer-mpcb',
          userRole: 'OFFICER',
          action: 'OFFICER_DECISION_APPROVED',
          entityName: 'Application',
          entityId: 'MH-IND-2026-89421',
          details: { decision: 'APPROVED', approvalCode: 'MPCB_CTE' },
          ipAddress: '103.21.124.18',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'audit-03',
          userId: 'user-citizen-demo',
          userRole: 'CITIZEN',
          action: 'APPLICATION_SUBMITTED',
          entityName: 'Application',
          entityId: 'MH-IND-2026-89421',
          details: { totalApprovals: 5 },
          ipAddress: '115.112.44.2',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
    }
  },

  /**
   * Fetch all master statutory rules
   */
  async getRules(): Promise<AdminRuleItem[]> {
    try {
      return await request<AdminRuleItem[]>('/admin/rules');
    } catch {
      return [
        {
          id: 'rule-mpcb-cte',
          approvalCode: 'MPCB_CTE',
          ruleCode: 'RULE_MPCB_CTE_ORANGE_RED',
          ruleName: 'Mandatory CTE for Red and Orange Pollution Categories',
          priority: 10,
          conditionsJson: {
            field: 'pollutionCategory',
            operator: 'IN',
            value: ['RED', 'ORANGE'],
          },
          explanationTpl: 'Your unit belongs to {pollutionCategory} category under Water and Air Acts, mandating CTE.',
        },
        {
          id: 'rule-dish-fact',
          approvalCode: 'DISH_FACT_LIC',
          ruleCode: 'RULE_DISH_FACTORY_WORKERS',
          ruleName: 'Factories Act Threshold: >= 10 Workers with Power',
          priority: 20,
          conditionsJson: {
            and: [
              { field: 'employeeCount', operator: 'GREATER_THAN_OR_EQUAL', value: 10 },
              { field: 'powerRequirementKva', operator: 'GREATER_THAN', value: 0 },
            ],
          },
          explanationTpl: 'Employs {employeeCount} workers with electric power, fulfilling statutory Section 2(m)(i) definition.',
        },
        {
          id: 'rule-boiler',
          approvalCode: 'BOILER_REG',
          ruleCode: 'RULE_BOILER_REGISTRATION',
          ruleName: 'Indian Boilers Act 1923 Registration',
          priority: 30,
          conditionsJson: {
            field: 'hasBoiler',
            operator: 'EQUALS',
            value: true,
          },
          explanationTpl: 'Steam generation vessel on premises requires Indian Boiler Regulations inspection and registration.',
        },
      ];
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
    return await request<AdminRuleItem>('/admin/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
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
