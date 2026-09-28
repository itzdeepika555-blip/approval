import { InspectionSlot } from '../types';
import { request } from './api';
import { INITIAL_INSPECTION_SLOTS } from '../mock/mockData';

export const inspectionService = {
  /**
   * Fetch common joint inspection schedule and available slots
   */
  async getInspectionSlots(): Promise<InspectionSlot[]> {
    try {
      return await request<InspectionSlot[]>('/inspections/slots');
    } catch {
      const stored = localStorage.getItem('maha_inspection_slots');
      if (stored) {
        return JSON.parse(stored);
      }
      return INITIAL_INSPECTION_SLOTS;
    }
  },

  /**
   * Book or schedule a common joint inspection slot
   */
  async scheduleSlot(slotId: string, preferredDate: string, timeSlot: string): Promise<InspectionSlot> {
    try {
      return await request<InspectionSlot>('/inspections/book', {
        method: 'POST',
        body: JSON.stringify({ slotId, preferredDate, timeSlot }),
      });
    } catch {
      const slots = await this.getInspectionSlots();
      const updated = slots.map(s => {
        if (s.id === slotId) {
          return {
            ...s,
            date: preferredDate,
            timeSlot,
            status: 'SCHEDULED' as const,
          };
        }
        return s;
      });
      localStorage.setItem('maha_inspection_slots', JSON.stringify(updated));
      return updated.find(s => s.id === slotId)!;
    }
  },
};
