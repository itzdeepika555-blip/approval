import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ApplicationProvider } from './context/ApplicationContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

// 17 Comprehensive Module Pages
import { HomePage } from './pages/HomePage';
import { SignupPage } from './pages/SignupPage';
import { LoginPage } from './pages/LoginPage';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { BusinessProfilePage } from './pages/BusinessProfilePage';
import { SmartAssessmentPage } from './pages/SmartAssessmentPage';
import { ApplicableApprovalsPage } from './pages/ApplicableApprovalsPage';
import { DocumentChecklistPage } from './pages/DocumentChecklistPage';
import { AIDocumentVerificationPage } from './pages/AIDocumentVerificationPage';
import { DocumentWalletPage } from './pages/DocumentWalletPage';
import { ApplicationReviewPage } from './pages/ApplicationReviewPage';
import { ParallelDepartmentPage } from './pages/ParallelDepartmentPage';
import { ApprovalTrackerSLAPage } from './pages/ApprovalTrackerSLAPage';
import { InspectionSchedulerPage } from './pages/InspectionSchedulerPage';
import { SchemesIncentivesPage } from './pages/SchemesIncentivesPage';
import { ComplianceRenewalPage } from './pages/ComplianceRenewalPage';
import { OfficerDashboardPage } from './pages/OfficerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';


export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ApplicationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/schemes" element={<SchemesIncentivesPage />} />

            {/* Strictly Protected Citizen Routes - Login & Role Enforced */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <CitizenDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business-profile"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <BusinessProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/start-assessment"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <SmartAssessmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applicable-approvals"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <ApplicableApprovalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/document-checklist"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <DocumentChecklistPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <DocumentWalletPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/application/review"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <ApplicationReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/compliance-renewals"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <ComplianceRenewalPage />
                </ProtectedRoute>
              }
            />

            {/* Shared Authenticated Routes (Citizen / Officer / Admin) */}
            <Route
              path="/document-verification"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN', 'OFFICER', 'ADMIN']}>
                  <AIDocumentVerificationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/application/tracking"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN', 'OFFICER', 'ADMIN']}>
                  <ParallelDepartmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sla-tracker"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN', 'OFFICER', 'ADMIN']}>
                  <ApprovalTrackerSLAPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspections"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN', 'OFFICER', 'ADMIN']}>
                  <InspectionSchedulerPage />
                </ProtectedRoute>
              }
            />

            {/* Officer & Admin Protected Routes */}
            <Route
              path="/officer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']}>
                  <OfficerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ApplicationProvider>
    </AuthProvider>
  );
};

export default App;
