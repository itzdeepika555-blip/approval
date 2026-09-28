import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BusinessProfileData,
  ApplicableApproval,
  DocumentItem,
  ApplicationSubmission,
  NotificationItem,
} from '../types';
import { businessService, EMPTY_BUSINESS_PROFILE } from '../services/business.service';
import { approvalService } from '../services/approval.service';
import { documentService } from '../services/document.service';
import { request } from '../services/api';

interface ApplicationContextType {
  profile: BusinessProfileData;
  setProfile: (profile: BusinessProfileData) => void;
  saveProfile: (profile: BusinessProfileData) => Promise<void>;
  approvals: ApplicableApproval[];
  setApprovals: (approvals: ApplicableApproval[]) => void;
  documents: DocumentItem[];
  setDocuments: (docs: DocumentItem[]) => void;
  activeSubmission: ApplicationSubmission | null;
  submitApplication: () => Promise<ApplicationSubmission>;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<BusinessProfileData>(EMPTY_BUSINESS_PROFILE);
  const [approvals, setApprovals] = useState<ApplicableApproval[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<ApplicationSubmission | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    try {
      // 1. Fetch live business profile for current user from PostgreSQL
      const p = await businessService.getProfile();
      if (p) setProfile(p);

      // 2. Fetch live applications for current user from PostgreSQL
      try {
        const appsRes = await request<any>('/applications');
        const appsList = Array.isArray(appsRes) ? appsRes : (appsRes?.data || []);
        if (appsList.length > 0) {
          const latest = appsList[0];
          setActiveSubmission({
            id: latest.id,
            applicationNumber: latest.applicationNumber,
            overallStatus: latest.status || 'UNDER_REVIEW',
            status: latest.status || 'UNDER_REVIEW',
            submittedAt: latest.submittedAt || latest.createdAt,
            totalFee: latest.totalFee || 0,
            approvals: latest.approvals || [],
            documents: latest.documents || [],
            businessProfile: latest.businessProfile || p,
            rtsMaxDays: 45,
            rtsDaysElapsed: 0,
            rtsDaysRemaining: 45,
          });
        } else {
          setActiveSubmission(null);
        }
      } catch {
        const savedSub = localStorage.getItem('maha_active_application');
        if (savedSub) {
          setActiveSubmission(JSON.parse(savedSub));
        } else {
          setActiveSubmission(null);
        }
      }

      // 3. Fetch applicable approvals or department catalog
      try {
        const apps = await approvalService.getApplicableApprovals();
        setApprovals(apps || []);
      } catch {
        setApprovals([]);
      }

      // 4. Fetch live documents
      try {
        const docs = await documentService.getDocumentChecklist();
        setDocuments(docs || []);
      } catch {
        setDocuments([]);
      }

      // 5. Fetch live notifications
      try {
        const notifRes = await request<any>('/notifications');
        const notifs = Array.isArray(notifRes) ? notifRes : (notifRes?.data || []);
        setNotifications(notifs);
      } catch {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error refreshing application data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const saveProfile = async (newProfile: BusinessProfileData) => {
    await businessService.saveProfile(newProfile);
    setProfile(newProfile);
  };

  const submitApplication = async () => {
    const res = await approvalService.submitConsolidatedApplication({
      businessProfile: profile,
      approvals,
      documents,
    });
    setActiveSubmission(res);
    return res;
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <ApplicationContext.Provider
      value={{
        profile,
        setProfile,
        saveProfile,
        approvals,
        setApprovals,
        documents,
        setDocuments,
        activeSubmission,
        submitApplication,
        notifications,
        markNotificationRead,
        loading,
        refreshData,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplication = () => {
  const ctx = useContext(ApplicationContext);
  if (!ctx) {
    throw new Error('useApplication must be used within an ApplicationProvider');
  }
  return ctx;
};
