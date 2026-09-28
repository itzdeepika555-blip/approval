import { db, StoredInspection } from './db.service';

export interface InspectionSlotView {
  id: string;
  departmentCode: string;
  departmentName: string;
  inspectionType: 'JOINT_COMMON_INSPECTION' | 'INDIVIDUAL';
  type: 'JOINT_COMMON_INSPECTION' | 'INDIVIDUAL';
  purpose: string;
  status: 'SCHEDULED' | 'PENDING_SCHEDULING' | 'COMPLETED' | 'CANCELLED' | 'AVAILABLE';
  date?: string;
  scheduledDate?: string;
  timeSlot?: string;
  inspectorName?: string;
  leadOfficer?: string;
  inspectorContact?: string;
  location: string;
  address: string;
  isJoint: boolean;
  departments: string[];
  participatingDepartments: string[];
}

export class InspectionService {
  /**
   * Retrieves inspection slots harmonized for both frontend and backend consumers.
   */
  public async getInspectionSlots(userId?: string, role?: string): Promise<InspectionSlotView[]> {
    const slots: InspectionSlotView[] = [
      {
        id: 'slot-joint-01',
        departmentCode: 'JOINT_PORTAL',
        departmentName: 'Joint Common Inspection Team (MPCB + DISH + Fire)',
        inspectionType: 'JOINT_COMMON_INSPECTION',
        type: 'JOINT_COMMON_INSPECTION',
        purpose: 'Combined inspection of machinery layout, effluent plant, and fire safety systems.',
        status: 'SCHEDULED',
        date: '2026-10-04',
        scheduledDate: '2026-10-04',
        timeSlot: '10:30 AM - 01:30 PM',
        inspectorName: 'Dr. S. K. Deshmukh (Lead Joint Inspector)',
        leadOfficer: 'Dr. S. K. Deshmukh (Lead Joint Inspector)',
        inspectorContact: '+91 98220 54321',
        location: 'Plot No. E-42/1, Chakan MIDC Phase II, Pune 410501',
        address: 'Plot No. E-42/1, Chakan MIDC Phase II, Pune 410501',
        isJoint: true,
        departments: ['DISH (Safety)', 'MPCB (Environment)', 'Maharashtra Fire Services', 'Directorate of Steam Boilers'],
        participatingDepartments: ['MPCB', 'DISH', 'FIRE', 'BOILER'],
      },
      {
        id: 'slot-boiler-02',
        departmentCode: 'BOILER',
        departmentName: 'Directorate of Steam Boilers',
        inspectionType: 'INDIVIDUAL',
        type: 'INDIVIDUAL',
        purpose: 'Hydraulic testing of steam drum and piping integrity under Indian Boilers Act.',
        status: 'AVAILABLE',
        date: '2026-10-12',
        scheduledDate: '2026-10-12',
        timeSlot: '11:00 AM - 02:00 PM',
        inspectorName: 'Shri V. P. Shinde (Boiler Inspector)',
        leadOfficer: 'Shri V. P. Shinde (Boiler Inspector)',
        inspectorContact: '+91 98220 88776',
        location: 'Plot No. E-42/1, Chakan MIDC Phase II, Pune 410501',
        address: 'Plot No. E-42/1, Chakan MIDC Phase II, Pune 410501',
        isJoint: false,
        departments: ['Directorate of Steam Boilers'],
        participatingDepartments: ['BOILER'],
      },
      {
        id: 'slot-cei-03',
        departmentCode: 'CEI',
        departmentName: 'Chief Electrical Inspectorate',
        inspectionType: 'INDIVIDUAL',
        type: 'INDIVIDUAL',
        purpose: 'DG Set Single Line Diagram and earthing resistance manifold audit.',
        status: 'AVAILABLE',
        date: '2026-10-08',
        scheduledDate: '2026-10-08',
        timeSlot: '02:30 PM - 05:30 PM',
        inspectorName: 'Shri R. K. Shinde (Electrical Inspector)',
        leadOfficer: 'Shri R. K. Shinde (Electrical Inspector)',
        inspectorContact: '+91 98220 33445',
        location: 'Plot No. E-42/1, Chakan MIDC Phase II, Pune 410501',
        address: 'Plot No. E-42/1, Chakan MIDC Phase II, Pune 410501',
        isJoint: false,
        departments: ['Chief Electrical Inspectorate (DG & Substation)'],
        participatingDepartments: ['CEI'],
      },
    ];

    // Synchronize with any dynamically booked inspections in db.inspections
    const activeStored = db.inspections.filter(i => i.status === 'SCHEDULED');
    if (activeStored.length > 0) {
      for (const rec of activeStored) {
        const match = slots.find(s => s.id === rec.id || s.inspectionType === rec.inspectionType);
        if (match) {
          match.date = rec.scheduledDate;
          match.scheduledDate = rec.scheduledDate;
          match.timeSlot = rec.timeSlot;
          match.status = 'SCHEDULED';
          if (rec.location) {
            match.location = rec.location;
            match.address = rec.location;
          }
          if (rec.leadOfficerName) {
            match.inspectorName = rec.leadOfficerName;
            match.leadOfficer = rec.leadOfficerName;
          }
        }
      }
    }

    return slots;
  }

  /**
   * Book a common joint inspection slot with multi-department synchronization,
   * conflict detection, and ownership validation.
   */
  public async bookSlot(
    userId: string,
    slotId: string,
    preferredDate: string,
    timeSlot: string,
    applicationId?: string
  ): Promise<InspectionSlotView> {
    // 1. Input validation
    if (!slotId || typeof slotId !== 'string') {
      throw new Error('Valid slotId is required.');
    }
    if (!preferredDate || !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      throw new Error('Invalid preferredDate format. Expected YYYY-MM-DD.');
    }
    if (!timeSlot || typeof timeSlot !== 'string') {
      throw new Error('Valid timeSlot is required.');
    }

    // Verify date is not in past
    const selectedTime = new Date(`${preferredDate}T00:00:00Z`).getTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedTime < today.getTime()) {
      throw new Error('Preferred inspection date cannot be in the past.');
    }

    // 2. Application ownership check
    let app = db.applications.find(a => (applicationId ? a.id === applicationId || a.applicationNumber === applicationId : a.userId === userId));
    if (!app) {
      // Fallback to first demo application if none registered for user yet
      app = db.applications[0];
    }
    if (app && app.userId !== userId && userId !== 'user-officer-mpcb' && userId !== 'user-admin') {
      throw new Error('Forbidden: You do not have permission to schedule inspection for this application.');
    }

    // 3. Concurrency and conflict detection
    const conflict = db.inspections.find(
      i =>
        i.scheduledDate === preferredDate &&
        i.timeSlot === timeSlot &&
        i.status === 'SCHEDULED' &&
        i.id !== slotId
    );
    if (conflict) {
      throw new Error(`Scheduling conflict: An inspection is already confirmed for ${preferredDate} (${timeSlot}). Please choose an alternate slot.`);
    }

    // 4. Retrieve slots and update selected slot
    const slots = await this.getInspectionSlots(userId);
    const slot = slots.find(s => s.id === slotId) || slots[0];

    slot.date = preferredDate;
    slot.scheduledDate = preferredDate;
    slot.timeSlot = timeSlot;
    slot.status = 'SCHEDULED';

    // 5. Synchronize participating departments on the application
    if (app) {
      app.stage = 'INSPECTION_SCHEDULED';
      for (const dept of slot.participatingDepartments) {
        const appr = app.approvals.find(a => a.departmentCode === dept);
        if (appr && appr.status !== 'APPROVED') {
          appr.status = 'IN_PROGRESS';
          appr.remarks = `Synchronized Joint Common Inspection scheduled for ${preferredDate} (${timeSlot})`;
        }
      }
    }

    // 6. Record or update inspection in database store
    const existingIndex = db.inspections.findIndex(i => i.id === slot.id || i.applicationId === app?.id);
    const storedRecord: StoredInspection = {
      id: slot.id.startsWith('slot-') ? `insp-${Date.now()}` : slot.id,
      applicationId: app ? app.id : 'app-demo-sahyadri',
      inspectionType: slot.isJoint ? 'JOINT_COMMON_INSPECTION' : 'INDIVIDUAL',
      status: 'SCHEDULED',
      scheduledDate: preferredDate,
      timeSlot,
      location: slot.location,
      participatingDepartments: slot.participatingDepartments,
      leadOfficerName: slot.leadOfficer || 'Dr. S. K. Deshmukh',
      notes: `Synchronized Joint Common Inspection booked for ${slot.purpose}`,
      createdAt: new Date(),
    };

    if (existingIndex >= 0) {
      db.inspections[existingIndex] = storedRecord;
    } else {
      db.inspections.push(storedRecord);
    }

    // 7. Audit Log with masked details
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId,
      userRole: 'CITIZEN',
      action: 'JOINT_INSPECTION_SCHEDULED',
      entityName: 'Inspection',
      entityId: storedRecord.id,
      details: {
        applicationNumber: app ? app.applicationNumber : 'MH-IND-APP',
        scheduledDate: preferredDate,
        timeSlot,
        departments: slot.participatingDepartments,
      },
      createdAt: new Date(),
    });

    // 8. Create citizen notification
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: app ? app.userId : userId,
      title: 'Joint Common Inspection Confirmed',
      message: `Multi-department site inspection synchronized for ${preferredDate} (${timeSlot}) with ${slot.participatingDepartments.join(', ')}.`,
      type: 'INSPECTION',
      isRead: false,
      linkUrl: '/inspection-scheduler',
      createdAt: new Date(),
    });

    return slot;
  }
}

export const inspectionService = new InspectionService();
