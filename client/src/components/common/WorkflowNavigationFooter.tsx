import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

interface WorkflowNavigationFooterProps {
  onBack?: () => void;
  backUrl?: string;
  backLabel?: string;
  onContinue?: () => void;
  continueUrl?: string;
  continueLabel?: string;
  continueType?: 'button' | 'submit';
  isContinueDisabled?: boolean;
  isLoading?: boolean;
  helperText?: string;
  title?: string;
  extraActions?: React.ReactNode;
}

export const WorkflowNavigationFooter: React.FC<WorkflowNavigationFooterProps> = ({
  onBack,
  backUrl,
  backLabel = 'Back',
  onContinue,
  continueUrl,
  continueLabel = 'Continue',
  continueType = 'button',
  isContinueDisabled = false,
  isLoading = false,
  helperText,
  title,
  extraActions,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else if (continueUrl) {
      navigate(continueUrl);
    }
  };

  return (
    <div className="mt-8 pt-5 border-t border-slate-200">
      <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left side: Back Button & Context Info */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </button>

          {(title || helperText) && (
            <div className="hidden sm:block">
              {title && (
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  {title}
                </div>
              )}
              {helperText && (
                <p className="text-[11px] text-slate-300 line-clamp-1 max-w-md">
                  {helperText}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right side: Extra Actions + Continue Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {extraActions && (
            <div className="flex items-center gap-2">
              {extraActions}
            </div>
          )}

          <button
            type={continueType}
            onClick={continueType === 'button' ? handleContinue : undefined}
            disabled={isContinueDisabled || isLoading}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 transform active:scale-98 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{continueLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
