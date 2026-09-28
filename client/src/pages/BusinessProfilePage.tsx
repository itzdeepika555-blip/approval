import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplication } from '../context/ApplicationContext';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { BusinessProfileData, LegalEntityType, PollutionCategory } from '../types';
import {
  Building2,
  MapPin,
  Coins,
  Zap,
  Flame,
  Save,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const BusinessProfilePage: React.FC = () => {
  const { profile, saveProfile } = useApplication();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<BusinessProfileData>({ ...profile });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const districtsOfMaharashtra = [
    'Pune',
    'Thane',
    'Mumbai Suburban',
    'Mumbai City',
    'Raigad',
    'Nashik',
    'Aurangabad (Chhatrapati Sambhajinagar)',
    'Nagpur',
    'Solapur',
    'Kolhapur',
    'Ahmednagar',
    'Satara',
    'Palghar',
    'Amravati',
    'Nanded',
    'Jalgaon',
    'Chandrapur',
  ];

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.businessName.trim()) errs.businessName = 'Enterprise name is required';
    if (!formData.industrySector.trim()) errs.industrySector = 'Industry sector is required';
    if (!formData.businessActivity.trim()) errs.businessActivity = 'Detailed business activity is required';
    if (!formData.district) errs.district = 'Select industrial district';
    if (!formData.location.trim()) errs.location = 'Location or taluka name is required';

    if (formData.investmentPlantMachinery < 0 || isNaN(formData.investmentPlantMachinery)) {
      errs.investmentPlantMachinery = 'Valid investment amount in Plant & Machinery is required';
    }
    if (formData.investmentLandBuilding < 0 || isNaN(formData.investmentLandBuilding)) {
      errs.investmentLandBuilding = 'Valid investment amount in Land & Building is required';
    }
    if (formData.employeeCount <= 0 || isNaN(formData.employeeCount)) {
      errs.employeeCount = 'Employee count must be at least 1';
    }
    if (formData.landAreaSqm <= 0 || isNaN(formData.landAreaSqm)) {
      errs.landAreaSqm = 'Land area in sq. meters is required';
    }
    if (formData.builtUpAreaSqm <= 0 || isNaN(formData.builtUpAreaSqm)) {
      errs.builtUpAreaSqm = 'Built-up area is required';
    }
    if (formData.builtUpAreaSqm > formData.landAreaSqm) {
      errs.builtUpAreaSqm = 'Built-up area cannot exceed total land area';
    }
    if (!formData.productionCapacity.trim()) {
      errs.productionCapacity = 'Specify planned production capacity';
    }
    if (formData.powerRequirementKva < 0 || isNaN(formData.powerRequirementKva)) {
      errs.powerRequirementKva = 'Sanctioned power load is required';
    }
    if (formData.waterUsageKld < 0 || isNaN(formData.waterUsageKld)) {
      errs.waterUsageKld = 'Water requirement (KLD) is required';
    }

    if (formData.hasBoiler && (!formData.boilerCapacityTph || formData.boilerCapacityTph <= 0)) {
      errs.boilerCapacityTph = 'Please specify steam boiler capacity in TPH';
    }
    if (formData.hasDgSet && (!formData.dgSetCapacityKva || formData.dgSetCapacityKva <= 0)) {
      errs.dgSetCapacityKva = 'Please specify DG set rating in kVA';
    }

    if (formData.gstRegistered && formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin)) {
      errs.gstin = 'Invalid GSTIN format (e.g. 27AAFCO8492L1Z8)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    await saveProfile(formData);
    setIsSaving(false);
    setSaveFeedback('Business Profile draft saved successfully!');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    await saveProfile(formData);
    setIsSaving(false);

    // Flow: Citizen Dashboard -> Start New Application -> Business Profile -> Smart Assessment
    navigate('/start-assessment');
  };

  return (
    <DashboardLayout
      title="Industrial Business Profile"
      subtitle="Comprehensive data capture for dynamic statutory rule assessment"
      breadcrumbs={[
        { label: 'Citizen Dashboard', href: '/dashboard' },
        { label: 'Business Profile' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
          >
            <span>Proceed to Assessment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      }
    >
      {saveFeedback && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold mb-1">Please review the highlighted fields before proceeding:</div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              {Object.values(errors).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Entity & Industrial Activity */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-gray-100 text-blue-900 font-bold text-sm uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>1. Enterprise Identity & Activity Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="businessName">
                Registered Enterprise / Business Name *
              </label>
              <input
                id="businessName"
                type="text"
                value={formData.businessName}
                onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition ${
                  errors.businessName ? 'border-rose-400' : 'border-gray-300 focus:border-blue-600'
                }`}
              />
              {errors.businessName && <p className="text-[11px] text-rose-600 mt-1">{errors.businessName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="businessType">
                Constitution / Entity Type *
              </label>
              <select
                id="businessType"
                value={formData.businessType}
                onChange={e => setFormData({ ...formData, businessType: e.target.value as LegalEntityType })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              >
                <option value="PROPRIETORSHIP">Proprietorship</option>
                <option value="PARTNERSHIP">Partnership Firm</option>
                <option value="LLP">Limited Liability Partnership (LLP)</option>
                <option value="PRIVATE_LIMITED">Private Limited Company</option>
                <option value="PUBLIC_LIMITED">Public Limited Company</option>
                <option value="OTHER">Other / Joint Venture</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="industrySector">
                Industrial Sector *
              </label>
              <input
                id="industrySector"
                type="text"
                placeholder="e.g. Automobile, Chemicals, Textile, Engineering"
                value={formData.industrySector}
                onChange={e => setFormData({ ...formData, industrySector: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition ${
                  errors.industrySector ? 'border-rose-400' : 'border-gray-300 focus:border-blue-600'
                }`}
              />
              {errors.industrySector && <p className="text-[11px] text-rose-600 mt-1">{errors.industrySector}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="businessActivity">
                Specific Manufacturing / Business Activity *
              </label>
              <input
                id="businessActivity"
                type="text"
                placeholder="e.g. Manufacturing of CNC machined engine brackets & auto chassis"
                value={formData.businessActivity}
                onChange={e => setFormData({ ...formData, businessActivity: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition ${
                  errors.businessActivity ? 'border-rose-400' : 'border-gray-300 focus:border-blue-600'
                }`}
              />
              {errors.businessActivity && <p className="text-[11px] text-rose-600 mt-1">{errors.businessActivity}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Location & Industrial Zoning */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-gray-100 text-blue-900 font-bold text-sm uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>2. Location & Industrial Zone (Maharashtra)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
              <input
                type="text"
                value="Maharashtra"
                disabled
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-gray-100 text-gray-500 font-semibold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="district">
                District *
              </label>
              <select
                id="district"
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              >
                <option value="">-- Select Maharashtra District --</option>
                {districtsOfMaharashtra.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.district && <p className="text-[11px] text-rose-600 mt-1">{errors.district}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="taluka">
                Taluka / Tehsil *
              </label>
              <input
                id="taluka"
                type="text"
                placeholder="e.g. Haveli, Khed, Panvel, Thane"
                value={formData.taluka}
                onChange={e => setFormData({ ...formData, taluka: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="location">
                Exact Location / Industrial Address *
              </label>
              <input
                id="location"
                type="text"
                placeholder="e.g. Chakan Industrial Area, Sector 10"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-gray-50 focus:bg-white focus:outline-none transition ${
                  errors.location ? 'border-rose-400' : 'border-gray-300 focus:border-blue-600'
                }`}
              />
              {errors.location && <p className="text-[11px] text-rose-600 mt-1">{errors.location}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">MIDC Industrial Area?</label>
              <div className="flex items-center gap-4 text-xs font-medium">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isMidc"
                    checked={formData.isMidcArea === true}
                    onChange={() => setFormData({ ...formData, isMidcArea: true })}
                    className="text-blue-600"
                  />
                  <span>Yes (Inside MIDC Estate)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isMidc"
                    checked={formData.isMidcArea === false}
                    onChange={() => setFormData({ ...formData, isMidcArea: false })}
                    className="text-blue-600"
                  />
                  <span>No (Private / Non-MIDC)</span>
                </label>
              </div>
            </div>

            {formData.isMidcArea && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="midcEstateName">
                    MIDC Industrial Estate Name
                  </label>
                  <input
                    id="midcEstateName"
                    type="text"
                    placeholder="e.g. Chakan Phase II, Butibori, Waluj"
                    value={formData.midcEstateName || ''}
                    onChange={e => setFormData({ ...formData, midcEstateName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="surveyPlotNumber">
                    Allotted Plot Number / Survey Number
                  </label>
                  <input
                    id="surveyPlotNumber"
                    type="text"
                    placeholder="e.g. Plot No. E-42/1"
                    value={formData.surveyPlotNumber || ''}
                    onChange={e => setFormData({ ...formData, surveyPlotNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 3: Investment, Scale & Workforce */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-gray-100 text-blue-900 font-bold text-sm uppercase tracking-wider">
            <Coins className="w-4 h-4 text-blue-600" />
            <span>3. Capital Investment, Scale & Workforce</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="investPlant">
                Investment in Plant & Machinery (₹ in Lakhs) *
              </label>
              <input
                id="investPlant"
                type="number"
                min="0"
                step="0.01"
                value={formData.investmentPlantMachinery || ''}
                onChange={e => setFormData({ ...formData, investmentPlantMachinery: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              />
              {errors.investmentPlantMachinery && <p className="text-[11px] text-rose-600 mt-1">{errors.investmentPlantMachinery}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="investLand">
                Investment in Land & Building (₹ in Lakhs) *
              </label>
              <input
                id="investLand"
                type="number"
                min="0"
                step="0.01"
                value={formData.investmentLandBuilding || ''}
                onChange={e => setFormData({ ...formData, investmentLandBuilding: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              />
              {errors.investmentLandBuilding && <p className="text-[11px] text-rose-600 mt-1">{errors.investmentLandBuilding}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="employeeCount">
                Total Direct & Contractual Employees *
              </label>
              <input
                id="employeeCount"
                type="number"
                min="1"
                value={formData.employeeCount || ''}
                onChange={e => setFormData({ ...formData, employeeCount: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              />
              {errors.employeeCount && <p className="text-[11px] text-rose-600 mt-1">{errors.employeeCount}</p>}
              <p className="text-[10px] text-gray-400 mt-0.5">Triggers DISH Factory Rules when ≥ 10 workers with power</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="landArea">
                Total Plot / Land Area (Sq. Meters) *
              </label>
              <input
                id="landArea"
                type="number"
                min="1"
                value={formData.landAreaSqm || ''}
                onChange={e => setFormData({ ...formData, landAreaSqm: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              />
              {errors.landAreaSqm && <p className="text-[11px] text-rose-600 mt-1">{errors.landAreaSqm}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="builtUpArea">
                Proposed Built-up / Factory Shed Area (Sq. Meters) *
              </label>
              <input
                id="builtUpArea"
                type="number"
                min="1"
                value={formData.builtUpAreaSqm || ''}
                onChange={e => setFormData({ ...formData, builtUpAreaSqm: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              />
              {errors.builtUpAreaSqm && <p className="text-[11px] text-rose-600 mt-1">{errors.builtUpAreaSqm}</p>}
              <p className="text-[10px] text-gray-400 mt-0.5">Triggers Fire Safety NOC when built-up &gt; 500 sq.m</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="productionCapacity">
                Monthly Production Capacity & Unit *
              </label>
              <div className="flex gap-2">
                <input
                  id="productionCapacity"
                  type="text"
                  placeholder="e.g. 50,000"
                  value={formData.productionCapacity}
                  onChange={e => setFormData({ ...formData, productionCapacity: e.target.value })}
                  className="w-2/3 px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
                />
                <input
                  type="text"
                  placeholder="Units/Mo"
                  value={formData.productionUnit}
                  onChange={e => setFormData({ ...formData, productionUnit: e.target.value })}
                  className="w-1/3 px-2 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
                />
              </div>
              {errors.productionCapacity && <p className="text-[11px] text-rose-600 mt-1">{errors.productionCapacity}</p>}
            </div>
          </div>
        </div>

        {/* Section 4: Utilities, Steam & Power */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-gray-100 text-blue-900 font-bold text-sm uppercase tracking-wider">
            <Zap className="w-4 h-4 text-blue-600" />
            <span>4. Utilities, Steam & Power Requirements</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="powerReq">
                Sanctioned Power Load (kVA / HP) *
              </label>
              <input
                id="powerReq"
                type="number"
                min="0"
                value={formData.powerRequirementKva || ''}
                onChange={e => setFormData({ ...formData, powerRequirementKva: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              />
              {errors.powerRequirementKva && <p className="text-[11px] text-rose-600 mt-1">{errors.powerRequirementKva}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="waterUsage">
                Daily Water Consumption (KLD) *
              </label>
              <input
                id="waterUsage"
                type="number"
                min="0"
                step="0.1"
                value={formData.waterUsageKld || ''}
                onChange={e => setFormData({ ...formData, waterUsageKld: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              />
              {errors.waterUsageKld && <p className="text-[11px] text-rose-600 mt-1">{errors.waterUsageKld}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="waterSource">
                Primary Water Source
              </label>
              <select
                id="waterSource"
                value={formData.waterSource}
                onChange={e => setFormData({ ...formData, waterSource: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              >
                <option value="MIDC Industrial Piped Supply">MIDC Industrial Piped Supply</option>
                <option value="Municipal Corporation / Nagar Parishad">Municipal Corporation</option>
                <option value="Groundwater / Borewell">Groundwater / Borewell (CGWA Regd)</option>
                <option value="River / Irrigation Tap-off">River / Irrigation Tap-off</option>
              </select>
            </div>

            {/* Boiler Questions */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 mb-2">Industrial Steam Boiler?</label>
              <div className="flex items-center gap-4 text-xs font-medium mb-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="hasBoiler"
                    checked={formData.hasBoiler === true}
                    onChange={() => setFormData({ ...formData, hasBoiler: true })}
                  />
                  <span>Yes (Installed)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="hasBoiler"
                    checked={formData.hasBoiler === false}
                    onChange={() => setFormData({ ...formData, hasBoiler: false })}
                  />
                  <span>No</span>
                </label>
              </div>

              {formData.hasBoiler && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Steam Capacity (Tonnes Per Hour - TPH) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 1.5 TPH"
                    value={formData.boilerCapacityTph || ''}
                    onChange={e => setFormData({ ...formData, boilerCapacityTph: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  />
                  {errors.boilerCapacityTph && <p className="text-[10px] text-rose-600 mt-1">{errors.boilerCapacityTph}</p>}
                </div>
              )}
            </div>

            {/* DG Set Questions */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 mb-2">Diesel Generator (DG Set)?</label>
              <div className="flex items-center gap-4 text-xs font-medium mb-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="hasDgSet"
                    checked={formData.hasDgSet === true}
                    onChange={() => setFormData({ ...formData, hasDgSet: true })}
                  />
                  <span>Yes (Backup Power)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="hasDgSet"
                    checked={formData.hasDgSet === false}
                    onChange={() => setFormData({ ...formData, hasDgSet: false })}
                  />
                  <span>No</span>
                </label>
              </div>

              {formData.hasDgSet && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    DG Rating (kVA) *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 250 kVA"
                    value={formData.dgSetCapacityKva || ''}
                    onChange={e => setFormData({ ...formData, dgSetCapacityKva: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  />
                  {errors.dgSetCapacityKva && <p className="text-[10px] text-rose-600 mt-1">{errors.dgSetCapacityKva}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: Pollution & Environmental Categorization */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-gray-100 text-blue-900 font-bold text-sm uppercase tracking-wider">
            <Flame className="w-4 h-4 text-blue-600" />
            <span>5. Environmental & Pollution Categorization (MPCB)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="pollutionCat">
                MPCB Pollution Category *
              </label>
              <select
                id="pollutionCat"
                value={formData.pollutionCategory}
                onChange={e => setFormData({ ...formData, pollutionCategory: e.target.value as PollutionCategory })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 font-bold transition"
              >
                <option value="RED" className="text-rose-700 font-bold">RED (Pollution Index ≥ 60 - Heavy Scrutiny)</option>
                <option value="ORANGE" className="text-amber-700 font-bold">ORANGE (Pollution Index 41 to 59 - Medium)</option>
                <option value="GREEN" className="text-emerald-700 font-bold">GREEN (Pollution Index 21 to 40 - Light)</option>
                <option value="WHITE" className="text-gray-700 font-bold">WHITE (Pollution Index ≤ 20 - Non-Polluting)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="effluent">
                Industrial Effluent Discharge (KLD) *
              </label>
              <input
                id="effluent"
                type="number"
                min="0"
                step="0.1"
                value={formData.effluentDischargeKld || ''}
                onChange={e => setFormData({ ...formData, effluentDischargeKld: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-600 transition"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">&gt; 0 KLD mandates Effluent Treatment Plant (ETP)</p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 mb-2">
                Generates Hazardous Waste?
              </label>
              <div className="flex items-center gap-4 text-xs font-medium">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="hasHazWaste"
                    checked={formData.hazardousWasteGeneration === true}
                    onChange={() => setFormData({ ...formData, hazardousWasteGeneration: true })}
                  />
                  <span>Yes (Used Oil, Sludge, Chemical)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="hasHazWaste"
                    checked={formData.hazardousWasteGeneration === false}
                    onChange={() => setFormData({ ...formData, hazardousWasteGeneration: false })}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Tax & MSME Registrations */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-gray-100 text-blue-900 font-bold text-sm uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>6. Statutory Registrations (GST & MSME)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-gray-800">GST Registration Status</label>
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.gstRegistered}
                    onChange={e => setFormData({ ...formData, gstRegistered: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Registered for GST</span>
                </label>
              </div>
              {formData.gstRegistered && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1" htmlFor="gstin">
                    15-Digit GSTIN (Maharashtra State Code 27)
                  </label>
                  <input
                    id="gstin"
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 27AAFCO8492L1Z8"
                    value={formData.gstin || ''}
                    onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 uppercase font-mono"
                  />
                  {errors.gstin && <p className="text-[10px] text-rose-600 mt-1">{errors.gstin}</p>}
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-gray-800">MSME Udyam Registration</label>
                <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.msmeRegistered}
                    onChange={e => setFormData({ ...formData, msmeRegistered: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Udyam Registered</span>
                </label>
              </div>
              {formData.msmeRegistered && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1" htmlFor="udyamNumber">
                    Udyam Registration Number
                  </label>
                  <input
                    id="udyamNumber"
                    type="text"
                    placeholder="e.g. UDYAM-MH-26-0049182"
                    value={formData.udyamNumber || ''}
                    onChange={e => setFormData({ ...formData, udyamNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 uppercase font-mono"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Submit CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl">
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Ready for Dynamic Assessment</div>
            <p className="text-xs text-gray-300 mt-0.5">
              Profile details will feed the statutory rule evaluation engine to generate applicable approvals.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
            >
              Save Draft
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 transform hover:scale-102"
            >
              <span>Submit & Evaluate Approvals</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
};
