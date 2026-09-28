import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', label }) => {
  const norm = status.toUpperCase();

  let colorClasses = 'bg-gray-100 text-gray-700 border-gray-200';
  let dotColor = 'bg-gray-400';

  if (norm === 'APPROVED' || norm === 'PASSED' || norm === 'COMPLIANT' || norm === 'VALID' || norm === 'ELIGIBLE' || norm === 'RESOLVED') {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (norm === 'UNDER_REVIEW' || norm === 'IN_PROGRESS' || norm === 'APPLIED' || norm === 'SCHEDULED' || norm === 'CHECK_REQUIRED') {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
    dotColor = 'bg-blue-500 animate-pulse';
  } else if (norm === 'QUERY_RAISED' || norm === 'WARNING' || norm === 'DUE_SOON' || norm === 'UPCOMING' || norm === 'PENDING_CITIZEN_REPLY') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-300';
    dotColor = 'bg-amber-500';
  } else if (norm === 'REJECTED' || norm === 'FAILED' || norm === 'OVERDUE') {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-300';
    dotColor = 'bg-rose-500';
  } else if (norm === 'PENDING' || norm === 'NOT_STARTED' || norm === 'NOT_SCHEDULED') {
    colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
    dotColor = 'bg-slate-400';
  }

  const sizeClasses =
    size === 'lg'
      ? 'px-3 py-1 text-xs'
      : size === 'md'
      ? 'px-2.5 py-0.5 text-xs'
      : 'px-2 py-0.5 text-[11px]';

  const displayLabel = label || status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-xs tracking-wide uppercase ${colorClasses} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{displayLabel}</span>
    </span>
  );
};
