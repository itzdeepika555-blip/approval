/**
 * Mock data has been eliminated in favor of real PostgreSQL database models.
 * Master statutory approvals, departments, rules, and schemes are served live from PostgreSQL.
 */

import {
  User,
  BusinessProfileData,
  ApplicableApproval,
  DocumentItem,
  InspectionSlot,
  SchemeItem,
  ComplianceItem,
  RenewalItem,
  DepartmentQuery,
  OfficerApplication,
  NotificationItem,
} from '../types';

export const DEMO_USERS: Record<string, { user: User; token: string; password: string }> = {};

export const INITIAL_BUSINESS_PROFILE: BusinessProfileData = {
  businessName: '',
  businessType: 'PRIVATE_LIMITED',
  industrySector: '',
  businessActivity: '',
  state: 'Maharashtra',
  district: '',
  taluka: '',
  location: '',
  isMidcArea: false,
  midcEstateName: '',
  surveyPlotNumber: '',
  investmentPlantMachinery: 0,
  investmentLandBuilding: 0,
  annualTurnover: 0,
  employeeCount: 0,
  landAreaSqm: 0,
  builtUpAreaSqm: 0,
  productionCapacity: '',
  productionUnit: '',
  pollutionCategory: 'GREEN',
  effluentDischargeKld: 0,
  hazardousWasteGeneration: false,
  waterUsageKld: 0,
  waterSource: '',
  powerRequirementKva: 0,
  hasBoiler: false,
  boilerCapacityTph: 0,
  hasDgSet: false,
  dgSetCapacityKva: 0,
  gstRegistered: false,
  gstin: '',
  msmeRegistered: false,
  udyamNumber: '',
};

export const INITIAL_APPLICABLE_APPROVALS: ApplicableApproval[] = [];
export const INITIAL_DOCUMENTS: DocumentItem[] = [];
export const INITIAL_INSPECTION_SLOTS: InspectionSlot[] = [];
export const INITIAL_SCHEMES: SchemeItem[] = [];
export const INITIAL_COMPLIANCES: ComplianceItem[] = [];
export const INITIAL_RENEWALS: RenewalItem[] = [];
export const INITIAL_QUERIES: DepartmentQuery[] = [];
export const INITIAL_OFFICER_APPLICATIONS: OfficerApplication[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
