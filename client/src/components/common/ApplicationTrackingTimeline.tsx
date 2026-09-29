import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
  ShieldCheck,
  Building2,
  CalendarDays,
  XCircle,
} from 'lucide-react';

interface ApplicationTrackingTimelineProps {
  status: string;
  submittedAt?: string;
  inspectionRequired?: boolean;
  hasQueries?: boolean;
  compact?: boolean;
}

interface TimelineStage {
  id: string;
  label: string;
  sublabel: string;
  state: 'COMPLETED' | 'CURRENT' | 'PENDING' | 'WARNING' | 'FAILED';
  date?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ApplicationTrackingTimeline: React.FC<ApplicationTrackingTimelineProps> = ({
  status,
  submittedAt,
  inspectionRequired = true,
  hasQueries = false,
  compact = false,
}) => {
  const normStatus = (status || 'SUBMITTED').toUpperCase();
  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Recorded';

  // Determine stage progression
  const isApproved = normStatus === 'APPROVED';
  const isRejected = normStatus === 'REJECTED';
  const isQueryRaised = normStatus === 'QUERY_RAISED' || hasQueries;
  const isInspectionScheduled = normStatus === 'INSPECTION_SCHEDULED' || normStatus === 'SCHEDULED';
  const isUnderReview = normStatus === 'UNDER_REVIEW' || normStatus === 'SUBMITTED' || normStatus === 'APPLIED';

  // Stage states
  const stage1State = 'COMPLETED'; // Application Submitted is always completed for submitted apps
  const stage2State = 'COMPLETED'; // Documents Verified is completed prior to submission
  
  let stage3State: 'COMPLETED' | 'CURRENT' | 'PENDING' = 'CURRENT';
  if (isApproved || isInspectionScheduled) {
    stage3State = 'COMPLETED';
  } else if (isRejected) {
    stage3State = 'COMPLETED';
  }

  let stage4State: 'COMPLETED' | 'CURRENT' | 'PENDING' = 'PENDING';
  if (isApproved) {
    stage4State = 'COMPLETED';
  } else if (isInspectionScheduled) {
    stage4State = 'CURRENT';
  }

  let stage5State: 'COMPLETED' | 'WARNING' | 'PENDING' = 'PENDING';
  if (isQueryRaised) {
    stage5State = 'WARNING';
  } else if (isApproved) {
    stage5State = 'COMPLETED';
  }

  let stage6State: 'COMPLETED' | 'FAILED' | 'PENDING' = 'PENDING';
  if (isApproved) {
    stage6State = 'COMPLETED';
  } else if (isRejected) {
    stage6State = 'FAILED';
  }

  const stages: TimelineStage[] = [
    {
      id: 'submitted',
      label: 'Application Submitted',
      sublabel: 'Consolidated filing lodged with statutory reference',
      state: stage1State,
      date: formattedDate,
      icon: FileCheck2,
    },
    {
      id: 'documents_verified',
      label: 'Documents Verified',
      sublabel: 'All required blueprints, DPR & NOCs pre-verified',
      state: stage2State,
      icon: ShieldCheck,
    },
    {
      id: 'department_review',
      label: 'Under Department Review',
      sublabel: 'Synchronous parallel scrutiny (MPCB, DISH, Fire, MIDC)',
      state: stage3State,
      icon: Building2,
    },
    ...(inspectionRequired
      ? [
          {
            id: 'inspection',
            label: 'Site Inspection',
            sublabel:
              stage4State === 'COMPLETED'
                ? 'Joint inspection conducted'
                : stage4State === 'CURRENT'
                ? 'Joint common inspection scheduled'
                : 'Subject to scrutiny schedule',
            state: stage4State,
            icon: CalendarDays,
          },
        ]
      : []),
    {
      id: 'query',
      label: isQueryRaised ? 'Department Query Raised' : 'Query Resolution',
      sublabel: isQueryRaised
        ? 'Clarification requested by department officer'
        : 'No outstanding statutory queries',
      state: stage5State,
      icon: AlertCircle,
    },
    {
      id: 'decision',
      label: isRejected ? 'Application Rejected' : 'Statutory Approval Order',
      sublabel: isApproved
        ? 'Clearance certificates issued under RTS Act'
        : isRejected
        ? 'Rejected with statutory grounds'
        : 'Awaiting final order within 45-day RTS timeline',
      state: stage6State,
      icon: isRejected ? XCircle : CheckCircle2,
    },
  ];

  return (
    <div className="w-full">
      {/* Header info */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-700" />
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Statutory Processing Timeline
          </span>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
            isApproved
              ? 'bg-emerald-100 text-emerald-800'
              : isRejected
              ? 'bg-rose-100 text-rose-800'
              : isQueryRaised
              ? 'bg-amber-100 text-amber-800 animate-pulse'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {isApproved
            ? 'FINAL APPROVAL ISSUED'
            : isRejected
            ? 'SCRUTINY REJECTED'
            : isQueryRaised
            ? 'ACTION NEEDED: QUERY'
            : isUnderReview
            ? 'ACTIVE SCRUTINY'
            : normStatus}
        </span>
      </div>

      {/* Vertical / Step timeline */}
      <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {stages.map((stage) => {
          const isDone = stage.state === 'COMPLETED';
          const isCurrent = stage.state === 'CURRENT';
          const isWarn = stage.state === 'WARNING';
          const isFail = stage.state === 'FAILED';
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="relative flex items-start gap-3.5 group">
              {/* Node indicator */}
              <div
                className={`absolute -left-6 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] z-10 transition-all ${
                  isDone
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-blue-900 text-white ring-4 ring-blue-100 shadow-sm animate-pulse'
                    : isWarn
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 shadow-sm animate-bounce'
                    : isFail
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                ) : isFail ? (
                  <XCircle className="w-3.5 h-3.5 text-white" />
                ) : isWarn ? (
                  <span>!</span>
                ) : (
                  <Icon className="w-3 h-3" />
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs ${
                      isDone
                        ? 'font-bold text-gray-900'
                        : isCurrent
                        ? 'font-extrabold text-blue-900'
                        : isWarn
                        ? 'font-extrabold text-amber-700'
                        : isFail
                        ? 'font-extrabold text-rose-700'
                        : 'font-medium text-gray-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                  {stage.date && (
                    <span className="text-[10px] text-gray-400 font-mono shrink-0">
                      {stage.date}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[9px] font-bold uppercase bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded shrink-0">
                      Current
                    </span>
                  )}
                  {isDone && !compact && (
                    <span className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded shrink-0">
                      Done
                    </span>
                  )}
                </div>
                {!compact && (
                  <p
                    className={`text-[11px] mt-0.5 leading-snug ${
                      isDone
                        ? 'text-gray-600'
                        : isCurrent
                        ? 'text-blue-800 font-medium'
                        : isWarn
                        ? 'text-amber-800 font-semibold'
                        : 'text-gray-400'
                    }`}
                  >
                    {stage.sublabel}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
