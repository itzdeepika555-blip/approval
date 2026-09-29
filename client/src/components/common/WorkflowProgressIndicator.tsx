import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

export type WorkflowStepId = 'profile' | 'assessment' | 'documents' | 'review';

interface WorkflowProgressIndicatorProps {
  currentStep: WorkflowStepId;
  substepTitle?: string;
}

interface StepConfig {
  id: WorkflowStepId;
  stepNumber: number;
  label: string;
  shortLabel: string;
  description: string;
  route: string;
}

const STEPS: StepConfig[] = [
  {
    id: 'profile',
    stepNumber: 1,
    label: 'Business Profile',
    shortLabel: 'Profile',
    description: 'Enterprise & Unit Details',
    route: '/business-profile',
  },
  {
    id: 'assessment',
    stepNumber: 2,
    label: 'Approval Assessment',
    shortLabel: 'Assessment',
    description: 'Statutory Clearance Engine',
    route: '/start-assessment',
  },
  {
    id: 'documents',
    stepNumber: 3,
    label: 'Documents',
    shortLabel: 'Documents',
    description: 'Statutory Checklist & Portfolio',
    route: '/document-checklist',
  },
  {
    id: 'review',
    stepNumber: 4,
    label: 'Review & Submit',
    shortLabel: 'Review',
    description: 'Final Consolidated Filing',
    route: '/application/review',
  },
];

const STEP_ORDER: Record<WorkflowStepId, number> = {
  profile: 1,
  assessment: 2,
  documents: 3,
  review: 4,
};

export const WorkflowProgressIndicator: React.FC<WorkflowProgressIndicatorProps> = ({
  currentStep,
  substepTitle,
}) => {
  const navigate = useNavigate();
  const currentStepNum = STEP_ORDER[currentStep] || 1;

  const handleStepClick = (step: StepConfig) => {
    // Only allow navigation to completed steps or current step
    if (step.stepNumber < currentStepNum) {
      navigate(step.route);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 mb-6">
      {/* Mobile Stepper Header (< 640px) */}
      <div className="sm:hidden mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-blue-900 text-white text-[11px] font-extrabold uppercase tracking-wide">
              Step {currentStepNum} of 4
            </span>
            <span className="text-xs font-bold text-slate-800">
              {STEPS.find(s => s.id === currentStep)?.label}
            </span>
          </div>
          {substepTitle && (
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {substepTitle}
            </span>
          )}
        </div>
        {/* Mobile Mini Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-900 to-blue-700 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStepNum / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop & Tablet Horizontal Stepper (>= 640px) */}
      <div className="hidden sm:flex items-center justify-between relative">
        {STEPS.map((step, index) => {
          const isCompleted = step.stepNumber < currentStepNum;
          const isCurrent = step.stepNumber === currentStepNum;

          return (
            <React.Fragment key={step.id}>
              {/* Step Node */}
              <div
                onClick={() => handleStepClick(step)}
                className={`flex items-center gap-3 transition ${
                  isCompleted
                    ? 'cursor-pointer group'
                    : isCurrent
                    ? 'cursor-default'
                    : 'cursor-not-allowed opacity-60'
                }`}
                title={
                  isCompleted
                    ? `Click to return to ${step.label}`
                    : isCurrent
                    ? `Current Step: ${step.label}`
                    : `Upcoming Step: ${step.label}`
                }
              >
                {/* Step Circle Indicator */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-200 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs group-hover:scale-105 group-hover:bg-emerald-700'
                      : isCurrent
                      ? 'bg-blue-950 text-white ring-4 ring-blue-100 shadow-md'
                      : 'bg-slate-100 text-slate-400 border border-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
                  ) : (
                    <span className="text-xs sm:text-sm">{step.stepNumber}</span>
                  )}
                </div>

                {/* Step Text Info */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs sm:text-sm tracking-tight transition ${
                        isCompleted
                          ? 'font-bold text-slate-800 group-hover:text-blue-900'
                          : isCurrent
                          ? 'font-extrabold text-blue-950'
                          : 'font-medium text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded hidden lg:inline">
                        Done
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] text-blue-800 font-extrabold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60 hidden lg:inline">
                        Current
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] hidden md:block leading-tight ${
                      isCurrent
                        ? 'text-blue-800 font-medium'
                        : isCompleted
                        ? 'text-slate-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.description}
                  </span>
                </div>
              </div>

              {/* Connecting Divider / Arrow */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-4 flex items-center">
                  <div
                    className={`h-0.5 w-full rounded-full transition-all duration-300 ${
                      step.stepNumber < currentStepNum
                        ? 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
