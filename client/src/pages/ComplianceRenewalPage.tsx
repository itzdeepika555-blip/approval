import React, { useState, useEffect } from 'react';
import { schemeService } from '../services/scheme.service';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import { ComplianceItem, RenewalItem } from '../types';
import {
  ClockAlert,
  Bell,
  CheckCircle2,
  FileText,
  Send,
} from 'lucide-react';

export const ComplianceRenewalPage: React.FC = () => {
  const [compliances, setCompliances] = useState<ComplianceItem[]>([]);
  const [renewals, setRenewals] = useState<RenewalItem[]>([]);
  const [renewalToast, setRenewalToast] = useState<string | null>(null);

  useEffect(() => {
    schemeService.getCompliances().then(setCompliances);
    schemeService.getRenewals().then(setRenewals);
  }, []);

  const handleApplyRenewal = (item: RenewalItem) => {
    setRenewalToast(`Renewal application draft initiated for ${item.approvalName} (${item.licenseNumber})!`);
    setTimeout(() => setRenewalToast(null), 3500);
  };

  const handleTestReminder = (title: string) => {
    setRenewalToast(`Automated SMS & WhatsApp statutory reminder dispatched for "${title}"!`);
    setTimeout(() => setRenewalToast(null), 3500);
  };

  return (
    <DashboardLayout
      title="Compliance & Renewal Manager"
      subtitle="Post-establishment statutory renewals, periodic returns, and automated reminder alerts"
      breadcrumbs={[
        { label: 'Citizen Dashboard', href: '/dashboard' },
        { label: 'Compliance & Renewals' },
      ]}
    >
      {renewalToast && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{renewalToast}</span>
        </div>
      )}

      {/* Expiry Alert Highlight Banner */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <ClockAlert className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-0.5">
              Statutory Expiry Approaching
            </div>
            <h3 className="text-base font-extrabold text-amber-950">
              Boiler Fitness Certificate & Fire NOC Form B Due Soon
            </h3>
            <p className="text-xs text-amber-900/80 mt-1 max-w-2xl">
              Licenses nearing expiration can be renewed via fast-track single-window renewal without resubmitting initial establishment clearances.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleTestReminder('All Upcoming Renewals')}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          <Bell className="w-4 h-4" />
          <span>Trigger Reminder Alert</span>
        </button>
      </div>

      {/* 1. Active Approvals & License Renewals */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900">
              Active Approvals & License Renewal Deadlines
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Monitor validity periods and file renewals within the 60-day window
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-blue-50 text-blue-900 px-3 py-1 rounded-full border border-blue-200">
            {renewals.length} Monitored Licenses
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Approval Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">License Number</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Days Remaining</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {renewals.map(item => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition">
                  <td className="px-4 py-3.5 font-bold text-gray-900">{item.approvalName}</td>
                  <td className="px-4 py-3.5 text-gray-600">{item.department}</td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-blue-900 font-bold">
                    {item.licenseNumber}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-gray-700">{item.expiryDate}</td>
                  <td className="px-4 py-3.5 font-bold font-mono">
                    <span
                      className={
                        item.daysRemaining <= 30
                          ? 'text-rose-600'
                          : item.daysRemaining <= 60
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }
                    >
                      {item.daysRemaining} Days
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleApplyRenewal(item)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition shadow-2xs"
                    >
                      Apply Renewal
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Periodic Statutory Compliance Calendar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900">
              Statutory Periodic Returns Calendar
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Annual returns, hazardous waste filings, and environmental statements
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
            Auto-Reminders Active (SMS + Email)
          </span>
        </div>

        <div className="space-y-3">
          {compliances.map(comp => (
            <div
              key={comp.id}
              className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/40"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{comp.title}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Governing Act: <span className="text-gray-700 font-medium">{comp.statutoryRule}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 mt-1">
                    <span className="font-semibold text-blue-900 font-mono">Frequency: {comp.frequency}</span>
                    <span>•</span>
                    <span className="font-semibold text-gray-800 font-mono">Next Due: {comp.nextDueDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                <div className="text-right text-[11px]">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Reminder Status</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {comp.reminderStatus === 'SENT' ? 'Sent (SMS/Mail)' : 'Pending'}
                  </span>
                </div>
                <StatusBadge status={comp.status} size="sm" />
                <button
                  type="button"
                  onClick={() => handleTestReminder(comp.title)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                  title="Dispatch Test Notification"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
