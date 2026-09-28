import { z } from 'zod';

export const businessProfileSchema = z.object({
  id: z.string().optional(),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  legalEntityType: z.string().optional(),
  businessType: z.string().optional(),
  industrySector: z.string().min(2, 'Industry sector is required'),
  nicCode: z.string().optional().nullable(),
  businessActivity: z.string().min(3, 'Business activity description is required'),
  
  // Location
  district: z.string().min(2, 'District is required'),
  taluka: z.string().min(2, 'Taluka is required'),
  pinCode: z.string().optional().default('400001'),
  location: z.string().optional(),
  isMidcArea: z.boolean().default(false),
  midcEstateName: z.string().optional().nullable(),
  surveyPlotNumber: z.string().optional().nullable(),
  
  // Land & Investment
  landAreaSqm: z.number().nonnegative().optional().default(0),
  builtUpAreaSqm: z.number().nonnegative().optional().default(0),
  investmentPlantMachinery: z.number().nonnegative().optional().default(0),
  investmentLandBuilding: z.number().nonnegative().optional().default(0),
  annualTurnover: z.number().nonnegative().optional().nullable(),
  employeeCount: z.number().int().nonnegative().optional().default(1),
  femaleEmployeeCount: z.number().int().nonnegative().optional().nullable(),
  
  // Production & Utilities
  productionCapacity: z.string().optional().nullable(),
  productionUnit: z.string().optional().nullable(),
  powerRequirementKva: z.number().nonnegative().optional().default(0),
  waterRequirementKld: z.number().nonnegative().optional().default(0),
  waterUsageKld: z.number().nonnegative().optional().default(0),
  waterSource: z.string().optional().nullable(),
  
  // Environmental & Safety
  pollutionCategory: z.enum(['RED', 'ORANGE', 'GREEN', 'WHITE', 'NOT_APPLICABLE']).optional().default('GREEN'),
  effluentDischargeKld: z.number().nonnegative().optional().default(0),
  hazardousWasteGeneration: z.boolean().optional().default(false),
  hasBoiler: z.boolean().optional().default(false),
  boilerCapacityTph: z.number().nonnegative().optional().nullable(),
  hasDgSet: z.boolean().optional().default(false),
  dgSetCapacityKva: z.number().nonnegative().optional().nullable(),
  
  // Statutory Identifiers
  gstRegistered: z.boolean().optional().default(false),
  gstin: z.string().optional().nullable(),
  msmeRegistered: z.boolean().optional().default(false),
  udyamNumber: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
});

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;
