import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BusinessProfileData,
  ApplicableApproval,
  DocumentItem,
  ApplicationSubmission,
  NotificationItem,
} from '../types';
import { businessService } from '../services/business.service';
import { approvalService } from '../services/approval.service';
import { documentService } from '../services/document.service';
import { INITIAL_BUSINESS_PROFILE, INITIAL_APPLICABLE_APPROVALS, INITIAL_DOCUMENTS, INITIAL_NOTIFICATIONS } from '../mock/mockData';

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
  const [profile, setProfile] = useState<BusinessProfileData>(INITIAL_BUSINESS_PROFILE);
  const [approvals, setApprovals] = useState<ApplicableApproval[]>(INITIAL_APPLICABLE_APPROVALS);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [activeSubmission, setActiveSubmission] = useState<ApplicationSubmission | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    try {
      const p = await businessService.getProfile();
      setProfile(p);
      const apps = await approvalService.getApplicableApprovals();
      setApprovals(apps);
      const docs = await documentService.getDocumentChecklist();
      setDocuments(docs);

      const savedSub = localStorage.getItem('maha_active_application');
      if (savedSub) {
        setActiveSubmission(JSON.parse(savedSub));
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
