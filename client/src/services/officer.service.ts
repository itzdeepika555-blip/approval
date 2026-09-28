import { OfficerApplication, DepartmentQuery } from '../types';
import { request } from './api';
import { INITIAL_OFFICER_APPLICATIONS, INITIAL_QUERIES } from '../mock/mockData';

export const officerService = {
  /**
   * Fetch applications for officer scrutiny queue
   */
  async getApplications(): Promise<OfficerApplication[]> {
    try {
      return await request<OfficerApplication[]>('/officer/applications');
    } catch {
      const stored = localStorage.getItem('maha_officer_apps');
      if (stored) {
        return JSON.parse(stored);
      }
      return INITIAL_OFFICER_APPLICATIONS;
    }
  },

  /**
   * Fetch queries for an application
   */
  async getQueries(applicationId?: string): Promise<DepartmentQuery[]> {
    try {
      return await request<DepartmentQuery[]>(`/officer/queries${applicationId ? `?appId=${applicationId}` : ''}`);
    } catch {
      const stored = localStorage.getItem('maha_queries');
      if (stored) {
        const list: DepartmentQuery[] = JSON.parse(stored);
        return applicationId ? list.filter(q => q.applicationId === applicationId) : list;
      }
      return INITIAL_QUERIES;
    }
  },

  /**
   * Officer raises a query to citizen
   */
  async raiseQuery(applicationId: string, departmentCode: string, queryText: string, officerName: string): Promise<DepartmentQuery> {
    try {
      return await request<DepartmentQuery>('/officer/query', {
        method: 'POST',
        body: JSON.stringify({ applicationId, departmentCode, queryText }),
      });
    } catch {
      const newQuery: DepartmentQuery = {
        id: `qry-${Date.now()}`,
        applicationId,
        departmentCode,
        departmentName: departmentCode === 'MPCB' ? 'Pollution Control Board' : 'Industrial Safety',
        officerName,
        queryText,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'PENDING_CITIZEN_REPLY',
      };
      const queries = await this.getQueries();
      const updated = [newQuery, ...queries];
      localStorage.setItem('maha_queries', JSON.stringify(updated));
      return newQuery;
    }
  },

  /**
   * Citizen submits reply to a query
   */
  async replyQuery(queryId: string, citizenResponse: string): Promise<DepartmentQuery> {
    try {
      return await request<DepartmentQuery>(`/officer/queries/${queryId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ citizenResponse }),
      });
    } catch {
      const queries = await this.getQueries();
      const updated = queries.map(q => {
        if (q.id === queryId) {
          return {
            ...q,
            citizenResponse,
            citizenResponseDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
            status: 'RESOLVED' as const,
          };
        }
        return q;
      });
      localStorage.setItem('maha_queries', JSON.stringify(updated));
      return updated.find(q => q.id === queryId)!;
    }
  },

  /**
   * Officer decision: Grant Approval or Reject
   */
  async submitDecision(
    applicationId: string,
    decision: 'APPROVED' | 'REJECTED',
    remarks: string,
    officerName: string
  ): Promise<void> {
    try {
      await request(`/officer/applications/${applicationId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, remarks, officerName }),
      });
    } catch {
      const apps = await this.getApplications();
      const updated = apps.map(app => {
        if (app.id === applicationId || app.applicationNumber === applicationId) {
          return {
            ...app,
            status: decision,
          };
        }
        return app;
      });
      localStorage.setItem('maha_officer_apps', JSON.stringify(updated));
    }
  },
};
