/**
 * SIH26130 - Reusable Data Normalization Layer
 * 
 * Standardizes text, sector names, business activities, geographic locations,
 * numeric ranges, and boolean values for deterministic rule matching.
 * Preserves both original source values and normalized representations.
 */

export interface NormalizedField<T = any> {
  sourceValue: any;
  normalizedValue: T;
  isProvided: boolean;
  missingNote?: string;
}

export interface NormalizedBusinessProfile {
  businessName: NormalizedField<string>;
  legalEntityType: NormalizedField<string>;
  industrySector: NormalizedField<string>;
  businessActivity: NormalizedField<string>;
  state: NormalizedField<string>;
  district: NormalizedField<string>;
  taluka: NormalizedField<string>;
  isMidcArea: NormalizedField<boolean>;
  midcEstateName: NormalizedField<string | null>;
  landAreaSqm: NormalizedField<number>;
  builtUpAreaSqm: NormalizedField<number>;
  investmentPlantMachinery: NormalizedField<number>;
  investmentLandBuilding: NormalizedField<number>;
  totalCapitalInvestment: NormalizedField<number>;
  employeeCount: NormalizedField<number>;
  powerRequirementKva: NormalizedField<number>;
  waterRequirementKld: NormalizedField<number>;
  waterSource: NormalizedField<string>;
  pollutionCategory: NormalizedField<'RED' | 'ORANGE' | 'GREEN' | 'WHITE' | 'NOT_APPLICABLE'>;
  effluentDischargeKld: NormalizedField<number>;
  hazardousWasteGeneration: NormalizedField<boolean>;
  hasBoiler: NormalizedField<boolean>;
  boilerCapacityTph: NormalizedField<number | null>;
  hasDgSet: NormalizedField<boolean>;
  dgSetCapacityKva: NormalizedField<number | null>;
  gstRegistered: NormalizedField<boolean>;
  msmeRegistered: NormalizedField<boolean>;
  panNumber: NormalizedField<string | null>;
}

// Canonical Sector Map for Maharashtra Industries
const SECTOR_CANONICAL_MAP: Record<string, string> = {
  'food': 'FOOD_PROCESSING',
  'food processing': 'FOOD_PROCESSING',
  'agro': 'FOOD_PROCESSING',
  'agro & food processing': 'FOOD_PROCESSING',
  'agro processing': 'FOOD_PROCESSING',
  'automotive': 'AUTOMOTIVE_ENGINEERING',
  'automobile': 'AUTOMOTIVE_ENGINEERING',
  'auto components': 'AUTOMOTIVE_ENGINEERING',
  'automotive & heavy engineering': 'AUTOMOTIVE_ENGINEERING',
  'heavy engineering': 'AUTOMOTIVE_ENGINEERING',
  'engineering': 'ENGINEERING_GENERAL',
  'general manufacturing': 'MANUFACTURING_GENERAL',
  'manufacturing': 'MANUFACTURING_GENERAL',
  'chemicals': 'CHEMICALS_PHARMA',
  'chemical': 'CHEMICALS_PHARMA',
  'pharmaceuticals': 'CHEMICALS_PHARMA',
  'pharma': 'CHEMICALS_PHARMA',
  'textile': 'TEXTILE_APPAREL',
  'textiles': 'TEXTILE_APPAREL',
  'garments': 'TEXTILE_APPAREL',
  'electronics': 'ELECTRONICS_ESD',
  'electrical': 'ELECTRONICS_ESD',
  'it': 'IT_ITES',
  'software': 'IT_ITES',
  'renewable energy': 'RENEWABLE_ENERGY',
  'solar': 'RENEWABLE_ENERGY',
};

// 36 Districts of Maharashtra
const MAHARASHTRA_DISTRICTS = [
  'Ahmednagar', 'Akola', 'Amravati', 'Chhatrapati Sambhajinagar', 'Beed', 'Bhandara',
  'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon',
  'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded',
  'Nandurbar', 'Nashik', 'Dharashiv', 'Palghar', 'Parbhani', 'Pune', 'Raigad',
  'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha',
  'Washim', 'Yavatmal'
];

export class NormalizationService {
  /**
   * Normalizes text string: trims whitespace, collapses inner spaces, lowercases for matching
   */
  public normalizeText(val: any): string {
    if (val === undefined || val === null) return '';
    return String(val)
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  /**
   * Normalizes boolean values from strings, numbers, or booleans
   */
  public normalizeBoolean(val: any, defaultVal = false): NormalizedField<boolean> {
    if (val === undefined || val === null || val === '') {
      return {
        sourceValue: val,
        normalizedValue: defaultVal,
        isProvided: false,
        missingNote: 'Additional information required: boolean value not specified.',
      };
    }

    if (typeof val === 'boolean') {
      return { sourceValue: val, normalizedValue: val, isProvided: true };
    }

    const str = String(val).trim().toLowerCase();
    const isTrue = str === 'true' || str === 'yes' || str === '1' || str === 'y';
    const isFalse = str === 'false' || str === 'no' || str === '0' || str === 'n';

    if (isTrue || isFalse) {
      return { sourceValue: val, normalizedValue: isTrue, isProvided: true };
    }

    return {
      sourceValue: val,
      normalizedValue: defaultVal,
      isProvided: false,
      missingNote: `Unrecognized boolean value '${val}'. Defaulted to ${defaultVal}.`,
    };
  }

  /**
   * Normalizes numeric values (handles strings, currency symbols, commas)
   */
  public normalizeNumber(val: any, defaultVal = 0): NormalizedField<number> {
    if (val === undefined || val === null || val === '') {
      return {
        sourceValue: val,
        normalizedValue: defaultVal,
        isProvided: false,
        missingNote: 'Additional information required: numeric value not provided.',
      };
    }

    if (typeof val === 'number') {
      return { sourceValue: val, normalizedValue: isNaN(val) ? defaultVal : val, isProvided: !isNaN(val) };
    }

    // Clean currency and punctuation: e.g. "Rs. 1,50,000.00" -> "150000.00"
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);

    if (isNaN(num)) {
      return {
        sourceValue: val,
        normalizedValue: defaultVal,
        isProvided: false,
        missingNote: `Invalid numeric format '${val}'. Defaulted to ${defaultVal}.`,
      };
    }

    return { sourceValue: val, normalizedValue: num, isProvided: true };
  }

  /**
   * Normalizes industry sector to canonical classification
   */
  public normalizeSector(sector: any): NormalizedField<string> {
    const raw = this.normalizeText(sector);
    if (!raw) {
      return {
        sourceValue: sector,
        normalizedValue: 'MANUFACTURING_GENERAL',
        isProvided: false,
        missingNote: 'Sector not provided. Defaulted to General Manufacturing.',
      };
    }

    // Match canonical map
    for (const [key, canonical] of Object.entries(SECTOR_CANONICAL_MAP)) {
      if (raw.includes(key)) {
        return { sourceValue: sector, normalizedValue: canonical, isProvided: true };
      }
    }

    // Fallback: uppercase formatted token
    const fallback = raw.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    return { sourceValue: sector, normalizedValue: fallback, isProvided: true };
  }

  /**
   * Normalizes district name against official 36 Maharashtra districts
   */
  public normalizeDistrict(district: any): NormalizedField<string> {
    const raw = this.normalizeText(district);
    if (!raw) {
      return {
        sourceValue: district,
        normalizedValue: 'Pune',
        isProvided: false,
        missingNote: 'District not specified. Defaulted to Pune.',
      };
    }

    // Alias handling
    if (raw.includes('aurangabad') || raw.includes('sambhajinagar')) {
      return { sourceValue: district, normalizedValue: 'Chhatrapati Sambhajinagar', isProvided: true };
    }
    if (raw.includes('osmanabad') || raw.includes('dharashiv')) {
      return { sourceValue: district, normalizedValue: 'Dharashiv', isProvided: true };
    }
    if (raw.includes('bombay') || raw.includes('mumbai')) {
      return { sourceValue: district, normalizedValue: 'Mumbai Suburban', isProvided: true };
    }

    const found = MAHARASHTRA_DISTRICTS.find(d => d.toLowerCase() === raw);
    if (found) {
      return { sourceValue: district, normalizedValue: found, isProvided: true };
    }

    // Fuzzy partial match
    const partial = MAHARASHTRA_DISTRICTS.find(d => d.toLowerCase().includes(raw) || raw.includes(d.toLowerCase()));
    if (partial) {
      return { sourceValue: district, normalizedValue: partial, isProvided: true };
    }

    return {
      sourceValue: district,
      normalizedValue: district,
      isProvided: true,
      missingNote: `District '${district}' not found in official 36 Maharashtra districts list.`,
    };
  }

  /**
   * Normalizes pollution category into RED, ORANGE, GREEN, WHITE
   */
  public normalizePollutionCategory(cat: any): NormalizedField<'RED' | 'ORANGE' | 'GREEN' | 'WHITE' | 'NOT_APPLICABLE'> {
    const raw = this.normalizeText(cat).toUpperCase();
    if (raw === 'RED' || raw === 'ORANGE' || raw === 'GREEN' || raw === 'WHITE') {
      return { sourceValue: cat, normalizedValue: raw as any, isProvided: true };
    }
    if (raw.includes('RED')) return { sourceValue: cat, normalizedValue: 'RED', isProvided: true };
    if (raw.includes('ORANGE')) return { sourceValue: cat, normalizedValue: 'ORANGE', isProvided: true };
    if (raw.includes('GREEN')) return { sourceValue: cat, normalizedValue: 'GREEN', isProvided: true };
    if (raw.includes('WHITE')) return { sourceValue: cat, normalizedValue: 'WHITE', isProvided: true };

    return {
      sourceValue: cat,
      normalizedValue: 'GREEN',
      isProvided: false,
      missingNote: 'Pollution category not specified or unrecognized. Defaulted to GREEN.',
    };
  }

  /**
   * Normalizes entire business profile for robust matching engine consumption
   */
  public normalizeProfile(raw: any): NormalizedBusinessProfile {
    const plantMachinery = this.normalizeNumber(raw.investmentPlantMachinery || raw.investmentAmount || 0);
    const landBuilding = this.normalizeNumber(raw.investmentLandBuilding || 0);
    const totalCapital = {
      sourceValue: plantMachinery.sourceValue + (landBuilding.sourceValue || 0),
      normalizedValue: plantMachinery.normalizedValue + landBuilding.normalizedValue,
      isProvided: plantMachinery.isProvided || landBuilding.isProvided,
    };

    return {
      businessName: {
        sourceValue: raw.businessName,
        normalizedValue: String(raw.businessName || 'Industrial Enterprise').trim(),
        isProvided: Boolean(raw.businessName),
      },
      legalEntityType: {
        sourceValue: raw.legalEntityType || raw.businessType,
        normalizedValue: String(raw.legalEntityType || raw.businessType || 'PRIVATE_LIMITED').trim().toUpperCase(),
        isProvided: Boolean(raw.legalEntityType || raw.businessType),
      },
      industrySector: this.normalizeSector(raw.industrySector || raw.sector),
      businessActivity: {
        sourceValue: raw.businessActivity || raw.activity,
        normalizedValue: this.normalizeText(raw.businessActivity || raw.activity),
        isProvided: Boolean(raw.businessActivity || raw.activity),
        missingNote: !Boolean(raw.businessActivity || raw.activity) ? 'Business activity not specified.' : undefined,
      },
      state: {
        sourceValue: raw.state || 'Maharashtra',
        normalizedValue: 'Maharashtra',
        isProvided: true,
      },
      district: this.normalizeDistrict(raw.district),
      taluka: {
        sourceValue: raw.taluka,
        normalizedValue: String(raw.taluka || '').trim(),
        isProvided: Boolean(raw.taluka),
      },
      isMidcArea: this.normalizeBoolean(raw.isMidcArea, false),
      midcEstateName: {
        sourceValue: raw.midcEstateName,
        normalizedValue: raw.midcEstateName ? String(raw.midcEstateName).trim() : null,
        isProvided: Boolean(raw.midcEstateName),
      },
      landAreaSqm: this.normalizeNumber(raw.landAreaSqm, 0),
      builtUpAreaSqm: this.normalizeNumber(raw.builtUpAreaSqm, 0),
      investmentPlantMachinery: plantMachinery,
      investmentLandBuilding: landBuilding,
      totalCapitalInvestment: totalCapital,
      employeeCount: this.normalizeNumber(raw.employeeCount, 1),
      powerRequirementKva: this.normalizeNumber(raw.powerRequirementKva, 0),
      waterRequirementKld: this.normalizeNumber(raw.waterRequirementKld || raw.waterUsageKld, 0),
      waterSource: {
        sourceValue: raw.waterSource,
        normalizedValue: this.normalizeText(raw.waterSource),
        isProvided: Boolean(raw.waterSource),
      },
      pollutionCategory: this.normalizePollutionCategory(raw.pollutionCategory),
      effluentDischargeKld: this.normalizeNumber(raw.effluentDischargeKld, 0),
      hazardousWasteGeneration: this.normalizeBoolean(raw.hazardousWasteGeneration, false),
      hasBoiler: this.normalizeBoolean(raw.hasBoiler, false),
      boilerCapacityTph: {
        sourceValue: raw.boilerCapacityTph,
        normalizedValue: raw.hasBoiler ? this.normalizeNumber(raw.boilerCapacityTph, 1).normalizedValue : null,
        isProvided: Boolean(raw.boilerCapacityTph),
      },
      hasDgSet: this.normalizeBoolean(raw.hasDgSet, false),
      dgSetCapacityKva: {
        sourceValue: raw.dgSetCapacityKva,
        normalizedValue: raw.hasDgSet ? this.normalizeNumber(raw.dgSetCapacityKva, 100).normalizedValue : null,
        isProvided: Boolean(raw.dgSetCapacityKva),
      },
      gstRegistered: this.normalizeBoolean(raw.gstRegistered, false),
      msmeRegistered: this.normalizeBoolean(raw.msmeRegistered, false),
      panNumber: {
        sourceValue: raw.panNumber,
        normalizedValue: raw.panNumber ? String(raw.panNumber).trim().toUpperCase() : null,
        isProvided: Boolean(raw.panNumber),
      },
    };
  }

  /**
   * Flattens normalized profile to an evaluation context dictionary for condition evaluator
   */
  public toEvaluationContext(profile: NormalizedBusinessProfile): Record<string, any> {
    return {
      sector: profile.industrySector.normalizedValue,
      industrySector: profile.industrySector.normalizedValue,
      businessActivity: profile.businessActivity.normalizedValue,
      state: profile.state.normalizedValue,
      district: profile.district.normalizedValue,
      isMidcArea: profile.isMidcArea.normalizedValue,
      midcEstateName: profile.midcEstateName.normalizedValue,
      landAreaSqm: profile.landAreaSqm.normalizedValue,
      builtUpAreaSqm: profile.builtUpAreaSqm.normalizedValue,
      investmentPlantMachinery: profile.investmentPlantMachinery.normalizedValue,
      investmentLandBuilding: profile.investmentLandBuilding.normalizedValue,
      totalCapitalInvestment: profile.totalCapitalInvestment.normalizedValue,
      employeeCount: profile.employeeCount.normalizedValue,
      powerRequirementKva: profile.powerRequirementKva.normalizedValue,
      waterRequirementKld: profile.waterRequirementKld.normalizedValue,
      waterSource: profile.waterSource.normalizedValue.toUpperCase(),
      pollutionCategory: profile.pollutionCategory.normalizedValue,
      effluentDischargeKld: profile.effluentDischargeKld.normalizedValue,
      hazardousWasteGeneration: profile.hazardousWasteGeneration.normalizedValue,
      hasBoiler: profile.hasBoiler.normalizedValue,
      boilerCapacityTph: profile.boilerCapacityTph.normalizedValue,
      hasDgSet: profile.hasDgSet.normalizedValue,
      dgSetCapacityKva: profile.dgSetCapacityKva.normalizedValue,
      gstRegistered: profile.gstRegistered.normalizedValue,
      msmeRegistered: profile.msmeRegistered.normalizedValue,
      panNumber: profile.panNumber.normalizedValue,
    };
  }
}

export const normalizationService = new NormalizationService();
