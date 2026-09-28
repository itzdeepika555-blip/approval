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
    try {
      return await request<AppealItem>('/appeals', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newAppeal: AppealItem = {
        id: `appeal-${Date.now()}`,
        appealNumber: `MH-RTS-APP-${year}-${randomSuffix}`,
        applicationId: payload.applicationId,
        applicationNumber: 'MH-IND-2026-89421',
        businessName: 'Omkara Precision Engineering Pvt Ltd',
        citizenName: 'Rajesh Patil',
        citizenContact: '+91 98230 45678',
        departmentCode: payload.departmentCode,
        departmentName: payload.departmentCode === 'MPCB' ? 'Pollution Control Board' : 'Industrial Safety',
        appellateAuthority: payload.appellateAuthority,
        appellateAuthorityTitle:
          payload.appellateAuthority === 'FIRST_APPELLATE'
            ? 'First Appellate Authority: Joint Director of Industries (Pune Region)'
            : 'Second Appellate Authority: Principal Secretary (Industries), Govt. of Maharashtra',
        groundForAppeal: payload.groundForAppeal,
        applicantStatement: payload.applicantStatement,
        status: 'PENDING',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      return newAppeal;
    }
  },

  /**
   * Get all appeals (filtered by citizen or viewed by officer/admin)
   */
  async getAppeals(applicationId?: string): Promise<AppealItem[]> {
    try {
      return await request<AppealItem[]>(`/appeals${applicationId ? `?applicationId=${applicationId}` : ''}`);
    } catch {
      return [
        {
          id: 'appeal-1',
          appealNumber: 'MH-RTS-APP-2026-0042',
          applicationId: 'app-mh-89240',
          applicationNumber: 'MH-IND-2026-89240',
          businessName: 'Zenith Fine Chemicals & API Pvt Ltd',
          citizenName: 'Amitabh Sen',
          citizenContact: '+91 98190 77665',
          departmentCode: 'MPCB',
          departmentName: 'Maharashtra Pollution Control Board',
          appellateAuthority: 'FIRST_APPELLATE',
          appellateAuthorityTitle: 'First Appellate Authority: Joint Director of Industries (Pune Region)',
          groundForAppeal: 'SLA_BREACH',
          applicantStatement: 'MPCB CTE clearance delayed beyond 45 days statutory guarantee without justified stop-clock note.',
          status: 'HEARING_SCHEDULED',
          hearingDate: '2026-10-10',
          createdAt: '2026-09-22 11:30',
        },
        {
          id: 'appeal-2',
          appealNumber: 'MH-RTS-APP-2026-0038',
          applicationId: 'app-mh-89390',
          applicationNumber: 'MH-IND-2026-89390',
          businessName: 'Sahyadri Agro Processing & Cold Chain LLP',
          citizenName: 'Sunita Deshmukh',
          citizenContact: '+91 98221 99112',
          departmentCode: 'DISH',
          departmentName: 'Directorate of Industrial Safety & Health',
          appellateAuthority: 'FIRST_APPELLATE',
          appellateAuthorityTitle: 'First Appellate Authority: Joint Director of Industries (Pune Region)',
          groundForAppeal: 'UNREASONABLE_QUERY',
          applicantStatement: 'Repeated query raised on already certified factory layout blueprints.',
          status: 'DIRECTED_CLEARANCE',
          officerRemarks: 'Blueprints verified conforming to NBC 2016. Immediate statutory clearance directed within 48 hours.',
          createdAt: '2026-09-15 14:20',
          decidedAt: '2026-09-20 16:00',
          decidedBy: 'Joint Director of Industries (Pune Region)',
        },
      ];
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
    return await request<AppealItem>(`/appeals/${appealId}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, remarks }),
    });
  },
};
