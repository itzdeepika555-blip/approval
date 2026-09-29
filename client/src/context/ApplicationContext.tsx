import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BusinessProfileData,
  ApplicableApproval,
  DocumentItem,
  ApplicationSubmission,
  NotificationItem,
} from '../types';
import { useAuth } from './AuthContext';
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
  updateDocument: (doc: DocumentItem) => void;
  activeSubmission: ApplicationSubmission | null;
  submissions: ApplicationSubmission[];
  isSubmitted: boolean;
  setActiveSubmission: (sub: ApplicationSubmission | null) => void;
  submitApplication: () => Promise<ApplicationSubmission>;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<BusinessProfileData>(EMPTY_BUSINESS_PROFILE);
  const [approvals, setApprovals] = useState<ApplicableApproval[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<ApplicationSubmission | null>(null);
  const [submissions, setSubmissions] = useState<ApplicationSubmission[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isSubmitted = Boolean(activeSubmission);

  const refreshData = async () => {
    if (!user || !isAuthenticated) {
      setProfile(EMPTY_BUSINESS_PROFILE);
      setApprovals([]);
      setDocuments([]);
      setActiveSubmission(null);
      setSubmissions([]);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch live business profile for current user from PostgreSQL
      let p: BusinessProfileData | null = null;
      try {
        p = await businessService.getProfile();
        if (p) {
          setProfile(p);
        } else {
          setProfile(EMPTY_BUSINESS_PROFILE);
        }
      } catch {
        setProfile(EMPTY_BUSINESS_PROFILE);
      }

      // 2. Fetch live applications belonging exclusively to current user from PostgreSQL
      try {
        const appsRes = await request<any>('/applications');
        const appsList = Array.isArray(appsRes) ? appsRes : (appsRes?.data || []);
        if (appsList.length > 0) {
          const formattedSubmissions: ApplicationSubmission[] = appsList.map((app: any) => ({
            id: app.id,
            applicationNumber: app.applicationNumber,
            overallStatus: app.status || app.stage || 'UNDER_REVIEW',
            status: app.status || app.stage || 'UNDER_REVIEW',
            submittedAt: app.submittedAt || app.createdAt,
            totalFee: app.totalFee || 0,
            approvals: app.approvals || [],
            documents: app.documents || [],
            businessProfile: app.businessProfile || p,
            rtsMaxDays: 45,
            rtsDaysElapsed: 0,
            rtsDaysRemaining: 45,
          }));

          setSubmissions(formattedSubmissions);
          setActiveSubmission(formattedSubmissions[0]);
          localStorage.setItem(`maha_active_application_${user.id}`, JSON.stringify(formattedSubmissions[0]));
        } else {
          // Strictly clear submissions when current authenticated user has no applications in DB
          setActiveSubmission(null);
          setSubmissions([]);
          localStorage.removeItem(`maha_active_application_${user.id}`);
        }
      } catch {
        // In case of network interruption, only read user-scoped cache
        const savedSub = localStorage.getItem(`maha_active_application_${user.id}`);
        if (savedSub) {
          const parsed = JSON.parse(savedSub);
          setActiveSubmission(parsed);
          setSubmissions([parsed]);
        } else {
          setActiveSubmission(null);
          setSubmissions([]);
        }
      }

      // 3. Fetch applicable approvals or department catalog
      try {
        const apps = await approvalService.getApplicableApprovals();
        setApprovals(apps || []);
      } catch {
        setApprovals([]);
      }

      // 4. Fetch live documents for current user
      try {
        const docs = await documentService.getDocumentChecklist();
        setDocuments(docs || []);
      } catch {
        setDocuments([]);
      }

      // 5. Fetch live notifications for current user
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
  }, [user?.id, isAuthenticated]);

  const saveProfile = async (newProfile: BusinessProfileData) => {
    // Application submission lock: do not allow editing profile after submission
    if (activeSubmission) {
      console.warn('Application already submitted: business profile is locked in read-only mode.');
      return;
    }
    await businessService.saveProfile(newProfile);
    setProfile(newProfile);
  };

  const handleSetDocuments = (docs: DocumentItem[]) => {
    // If submitted, block altering or deleting submitted documents
    if (activeSubmission) {
      console.warn('Application already submitted: documents are locked.');
      return;
    }
    setDocuments(docs);
    if (user?.id) {
      localStorage.setItem(`maha_documents_${user.id}`, JSON.stringify(docs));
    }
  };

  const updateDocument = (doc: DocumentItem) => {
    if (activeSubmission) {
      console.warn('Application already submitted: documents are locked.');
      return;
    }
    setDocuments(prev => {
      const idx = prev.findIndex(d => d.id === doc.id || d.code === doc.code);
      let updated: DocumentItem[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = { ...updated[idx], ...doc };
      } else {
        updated = [...prev, doc];
      }
      if (user?.id) {
        localStorage.setItem(`maha_documents_${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const submitApplication = async () => {
    if (!user) {
      throw new Error('Authentication required to submit application.');
    }
    // Application submission lock: prevent resubmission of same application
    if (activeSubmission) {
      throw new Error('This application has already been submitted and cannot be resubmitted.');
    }

    // Document Checklist & Verification Check:
    // ALL required (isMandatory) documents must be uploaded AND verified successfully (PASSED)
    const mandatoryDocs = documents.filter(d => d.isMandatory);
    const unuploaded = mandatoryDocs.filter(d => !d.uploaded);
    const unverified = mandatoryDocs.filter(d => d.uploaded && d.verificationStatus !== 'PASSED');

    if (unuploaded.length > 0 || unverified.length > 0) {
      const missingList = [
        ...unuploaded.map(d => `${d.title} (Not Uploaded)`),
        ...unverified.map(d => `${d.title} (Verification: ${d.verificationStatus || 'PENDING'})`),
      ];
      throw new Error(
        `Application submission blocked: All mandatory documents must be uploaded and verified (PASSED) before submission:\n• ${missingList.join('\n• ')}`
      );
    }

    const res = await approvalService.submitConsolidatedApplication({
      businessProfile: profile,
      approvals,
      documents,
    });

    setActiveSubmission(res);
    setSubmissions(prev => [res, ...prev.filter(s => s.id !== res.id)]);
    localStorage.setItem(`maha_active_application_${user.id}`, JSON.stringify(res));

    // Also lock documents and profile snapshot in user-scoped localStorage for persistence
    localStorage.setItem(`maha_submitted_profile_${user.id}`, JSON.stringify(profile));
    localStorage.setItem(`maha_submitted_documents_${user.id}`, JSON.stringify(documents));

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
        setDocuments: handleSetDocuments,
        updateDocument,
        activeSubmission,
        submissions,
        isSubmitted,
        setActiveSubmission,
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
