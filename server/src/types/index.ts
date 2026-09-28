import { Request } from 'express';

export type UserRole = 'CITIZEN' | 'OFFICER' | 'ADMIN';

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName?: string;
  departmentId?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}

export interface BusinessProfileAssessmentInput {
  businessName: string;
  legalEntityType: string;
  industrySector: string;
  nicCode?: string;
  businessActivity: string;
  district: string;
  taluka: string;
  pinCode: string;
  isMidcArea: boolean;
  midcEstateName?: string;
  landAreaSqm: number;
  builtUpAreaSqm: number;
  investmentPlantMachinery: number;
  investmentLandBuilding: number;
  annualTurnover?: number;
  employeeCount: number;
  productionCapacity?: string;
  productionUnit?: string;
  powerRequirementKva: number;
  waterRequirementKld: number;
  waterSource?: string;
  pollutionCategory: 'RED' | 'ORANGE' | 'GREEN' | 'WHITE' | 'NOT_APPLICABLE';
  effluentDischargeKld?: number;
  hazardousWasteGeneration?: boolean;
  hasBoiler?: boolean;
  boilerCapacityTph?: number;
  hasDgSet?: boolean;
  dgSetCapacityKva?: number;
  gstRegistered?: boolean;
  gstin?: string;
  msmeRegistered?: boolean;
  udyamNumber?: string;
}
