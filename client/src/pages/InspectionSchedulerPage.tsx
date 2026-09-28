import React, { useState, useEffect } from 'react';
import { inspectionService } from '../services/inspection.service';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { StatusBadge } from '../components/common/StatusBadge';
import { InspectionSlot } from '../types';
import {
  CalendarDays,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  Download,
  FileCheck2,
  Calendar,
} from 'lucide-react';

export const InspectionSchedulerPage: React.FC = () => {
  const [slots, setSlots] = useState<InspectionSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-10-04');
  const [selectedSlotTime, setSelectedSlotTime] = useState('10:30 AM - 01:30 PM');
  const [bookingSuccessToast, setBookingSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    inspectionService.getInspectionSlots().then(setSlots);
  }, []);

  const scheduledInspection = slots.find(s => s.status === 'SCHEDULED');

  const handleBookSlot = async (slotId: string) => {
    await inspectionService.scheduleSlot(slotId, selectedDate, selectedSlotTime);
    const updated = await inspectionService.getInspectionSlots();
    setSlots(updated);
    setBookingSuccessToast(`Joint Common Inspection booked for ${selectedDate} (${selectedSlotTime})!`);
    setTimeout(() => setBookingSuccessToast(null), 4000);
  };

  const handleDownloadNotice = () => {
    alert('Downloading Joint Inspection Order Notice (Form JI-4)...');
  };

  return (
    <DashboardLayout
      title="Common Joint Inspection Scheduler"
      subtitle="Unified single-visit on-site inspection eliminating redundant departmental scrutinies"
      breadcrumbs={[
        { label: 'Citizen Dashboard', href: '/dashboard' },
        { label: 'Inspection Scheduler' },
      ]}
      actions={
        scheduledInspection && (
          <button
            onClick={handleDownloadNotice}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Download Joint Inspection Order</span>
          </button>
        )
      }
    >
      {/* Information Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 mb-8 shadow-sm border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
            <Users className="w-4 h-4" />
            <span>Joint Inspection Mandate • Government of Maharashtra</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white">
            Single Unified On-Site Inspection Desk
          </h2>
          <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
            Under Ease of Doing Business mandates, inspectors from DISH, MPCB, and Maharashtra Fire Services visit your industrial premises concurrently on the same scheduled date, eliminating multiple factory shutdowns.
          </p>
        </div>

        <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/20 text-center shrink-0">
          <span className="text-[10px] text-amber-300 uppercase font-bold block">Visits Required</span>
          <span className="text-xl font-black text-white">1 Joint Visit</span>
          <span className="text-[10px] text-blue-200 block mt-0.5">Instead of 3 Separate Visits</span>
        </div>
      </div>

      {bookingSuccessToast && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bookingSuccessToast}</span>
        </div>
      )}

      {/* Grid: Scheduled Inspection Details & Slot Booking Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Active Scheduled Inspection Card */}
        <div className="lg:col-span-2 space-y-6">
          {scheduledInspection ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-gray-200">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Confirmed Appointment
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900 mt-0.5">
                    Joint Common Site Inspection
                  </h3>
                </div>
                <StatusBadge status={scheduledInspection.status} size="md" />
              </div>

              {/* Date, Time & Location Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                  <div className="flex items-center gap-2 text-blue-900 font-bold mb-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Inspection Date</span>
                  </div>
                  <div className="text-sm font-extrabold text-blue-950 font-mono">
                    {scheduledInspection.date}
                  </div>
                  <div className="text-[10px] text-blue-700 mt-0.5">Confirmed slot</div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold mb-1">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Time Window</span>
                  </div>
                  <div className="text-sm font-extrabold text-amber-950 font-mono">
                    {scheduledInspection.timeSlot}
                  </div>
                  <div className="text-[10px] text-amber-800 mt-0.5">3-Hour Joint Window</div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold mb-1">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Lead Officer</span>
                  </div>
                  <div className="text-xs font-extrabold text-emerald-950 truncate">
                    {scheduledInspection.leadOfficer || 'Joint Scrutiny Lead'}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">MPCB / DISH Officer</div>
                </div>
              </div>

              {/* Participating Departments */}
              <div className="mb-6">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Joint Participating Authorities (Synchronized Visit)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {scheduledInspection.departments.map((dept, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center gap-2 text-xs font-bold text-gray-800"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{dept}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandatory Checklist for Inspection Day */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blue-700" />
                  <span>On-Site Readiness Checklist for Joint Inspectorate</span>
                </h4>
                <div className="space-y-2 text-xs text-gray-700">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Approved Factory Architectural Layout Blueprints (Scale 1:100 printed copies)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Effluent Treatment Plant (ETP) piping schematic & flow measurement meter</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Fire safety hose reel operational pressure test & static water tank access</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Chartered Electrical Engineer Earthing Pit resistance test log</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">No Inspection Currently Scheduled</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                Select an available slot from the calendar to book your joint common inspection.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Slot Selection & Calendar UI */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-700" />
              <span>Select Joint Inspection Slot</span>
            </h3>

            {/* Date Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1" htmlFor="dateSelect">
                Proposed Inspection Date
              </label>
              <input
                id="dateSelect"
                type="date"
                min="2026-10-01"
                max="2026-11-30"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-gray-50 font-bold focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Time Slot Radio Options */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Available Time Windows
              </label>
              <div className="space-y-2">
                {[
                  { slot: '10:30 AM - 01:30 PM', label: 'Morning Slot (Recommended)' },
                  { slot: '02:30 PM - 05:30 PM', label: 'Afternoon Slot' },
                ].map(item => (
                  <label
                    key={item.slot}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition text-xs ${
                      selectedSlotTime === item.slot
                        ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-900'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="slotTime"
                        value={item.slot}
                        checked={selectedSlotTime === item.slot}
                        onChange={() => setSelectedSlotTime(item.slot)}
                        className="text-blue-600"
                      />
                      <span>{item.slot}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-normal">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Available Department Slots List */}
            <div className="space-y-3 mb-6">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Available Slot Queues
              </span>
              {slots.map(s => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-gray-900 font-mono">{s.date} • {s.timeSlot}</div>
                    <div className="text-[10px] text-gray-500">{s.departments.join(', ')}</div>
                  </div>
                  {s.status === 'AVAILABLE' ? (
                    <button
                      type="button"
                      onClick={() => handleBookSlot(s.id)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-xs"
                    >
                      Book Slot
                    </button>
                  ) : (
                    <StatusBadge status={s.status} size="sm" />
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-snug">
              <strong>Notice:</strong> Once booked, the joint inspection order is automatically dispatched to the Pune District Inspectorate Hub.
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
