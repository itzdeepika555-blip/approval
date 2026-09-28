import React from 'react';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SLAProgressProps {
  maxDays: number;
  daysRemaining: number;
  showDetails?: boolean;
}

export const SLAProgress: React.FC<SLAProgressProps> = ({
  maxDays,
  daysRemaining,
  showDetails = true,
}) => {
  const elapsed = Math.max(0, maxDays - daysRemaining);
  const percentage = Math.min(100, Math.round((elapsed / maxDays) * 100));

  let barColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let statusText = 'Within Statutory SLA';
  let Icon = ShieldCheck;

  if (daysRemaining <= 5 && daysRemaining > 0) {
    barColor = 'bg-rose-500';
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    statusText = 'SLA Critical (< 5 Days)';
    Icon = AlertTriangle;
  } else if (daysRemaining <= 15 && daysRemaining > 0) {
    barColor = 'bg-amber-500';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    statusText = 'SLA Approaching';
    Icon = Clock;
  } else if (daysRemaining <= 0) {
    barColor = 'bg-emerald-600';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    statusText = 'Completed / Cleared';
    Icon = ShieldCheck;
  }

  return (
    <div className="w-full">
      {showDetails && (
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <div className="flex items-center gap-1.5 text-gray-700">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>
              <strong className="text-gray-900">{daysRemaining}</strong> days remaining of {maxDays}d statutory SLA
            </span>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor}`}>
            <Icon className="w-3 h-3" />
            {statusText}
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showDetails && (
        <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
          <span>Day 0 (Filing)</span>
          <span>{percentage}% time elapsed</span>
          <span>Day {maxDays} (Statutory Limit)</span>
        </div>
      )}
    </div>
  );
};
