import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mockData } from './mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

class Store {
  constructor() {
    this.data = this.loadInitialData();
  }

  loadInitialData() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (err) {
      console.warn('Could not read existing database.json, initializing from seed mockData:', err.message);
    }
    return this.getSeedData();
  }

  getSeedData() {
    return {
      bloodGroups: [...mockData.bloodGroups],
      compatibility: { ...mockData.compatibility },
      hospitals: JSON.parse(JSON.stringify(mockData.hospitals)),
      bloodBanks: JSON.parse(JSON.stringify(mockData.bloodBanks)),
      donors: JSON.parse(JSON.stringify(mockData.donors)),
      ngos: JSON.parse(JSON.stringify(mockData.ngos)),
      requests: JSON.parse(JSON.stringify(mockData.initialRequests)),
      notifications: [
        {
          id: 'NOTIF-1',
          type: 'critical',
          title: '🚨 Critical Emergency Alert',
          message: 'O- blood required immediately at Lilavati Hospital (REQ-2026-1048). 42 mins remaining.',
          time: 'Just now',
          read: false,
          requestId: 'REQ-2026-1048',
          createdAt: new Date().toISOString()
        },
        {
          id: 'NOTIF-2',
          type: 'match',
          title: '🩸 Donor Match Identified',
          message: 'Compatible donors found within 2.1 km in Bandra West for Lilavati Hospital.',
          time: '2 mins ago',
          read: false,
          requestId: 'REQ-2026-1048',
          createdAt: new Date(Date.now() - 120000).toISOString()
        },
        {
          id: 'NOTIF-3',
          type: 'bank',
          title: '🏥 Blood Bank Alert',
          message: 'O- inventory reached critical threshold (5 units left) across Central Mumbai.',
          time: '14 mins ago',
          read: true,
          requestId: null,
          createdAt: new Date(Date.now() - 840000).toISOString()
        },
        {
          id: 'NOTIF-4',
          type: 'system',
          title: '⚠️ Suspicious Duplicate Flagged',
          message: 'REQ-2026-1042 flagged with 87% similarity to REQ-2026-1040.',
          time: '25 mins ago',
          read: true,
          requestId: 'REQ-2026-1042',
          createdAt: new Date(Date.now() - 1500000).toISOString()
        }
      ],
      aiInsights: JSON.parse(JSON.stringify(mockData.aiInsights || [])),
      historicalAnalytics: JSON.parse(JSON.stringify(mockData.historicalAnalytics || [])),
      auditLog: []
    };
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save to database.json:', err.message);
    }
  }

  reset() {
    this.data = this.getSeedData();
    this.save();
    return this.data;
  }

  // --- Hospitals ---
  getHospitals() {
    return this.data.hospitals;
  }

  getHospitalById(id) {
    return this.data.hospitals.find((h) => h.id === id);
  }

  // --- Blood Banks ---
  getBloodBanks() {
    return this.data.bloodBanks;
  }

  getBloodBankById(id) {
    return this.data.bloodBanks.find((b) => b.id === id);
  }

  updateBloodBankInventory(bankId, bloodGroup, unitsDiff, isReserved = false) {
    const bank = this.getBloodBankById(bankId);
    if (!bank) return null;

    if (!bank.inventory[bloodGroup]) bank.inventory[bloodGroup] = 0;
    if (!bank.reserved[bloodGroup]) bank.reserved[bloodGroup] = 0;

    if (isReserved) {
      bank.reserved[bloodGroup] = Math.max(0, bank.reserved[bloodGroup] + unitsDiff);
      // If reserving from available inventory, decrease available inventory accordingly
      if (unitsDiff > 0 && bank.inventory[bloodGroup] >= unitsDiff) {
        bank.inventory[bloodGroup] -= unitsDiff;
      }
    } else {
      bank.inventory[bloodGroup] = Math.max(0, bank.inventory[bloodGroup] + unitsDiff);
    }

    this.save();
    return bank;
  }

  getInventoryAggregates() {
    const summary = {};
    this.data.bloodGroups.forEach((bg) => {
      summary[bg] = { available: 0, reserved: 0, threshold: 0 };
    });

    this.data.bloodBanks.forEach((bank) => {
      this.data.bloodGroups.forEach((bg) => {
        summary[bg].available += bank.inventory[bg] || 0;
        summary[bg].reserved += bank.reserved[bg] || 0;
        summary[bg].threshold += Math.round((bank.threshold || 20) / 8);
      });
    });

    return summary;
  }

  // --- Donors ---
  getDonors(filter = {}) {
    let list = this.data.donors;
    if (filter.bloodGroup) {
      list = list.filter((d) => d.bloodGroup.toUpperCase() === filter.bloodGroup.toUpperCase());
    }
    if (filter.available !== undefined) {
      const isAvail = String(filter.available) === 'true';
      list = list.filter((d) => d.available === isAvail);
    }
    if (filter.eligibilityStatus) {
      list = list.filter((d) => d.eligibilityStatus.toLowerCase() === filter.eligibilityStatus.toLowerCase());
    }
    return list;
  }

  getDonorById(id) {
    return this.data.donors.find((d) => d.id === id);
  }

  updateDonor(id, updates) {
    const donor = this.getDonorById(id);
    if (!donor) return null;
    Object.assign(donor, updates);
    this.save();
    return donor;
  }

  // --- NGOs ---
  getNgos() {
    return this.data.ngos;
  }

  getNgoById(id) {
    return this.data.ngos.find((n) => n.id === id);
  }

  registerDonorToNgo(ngoId, { donorId, donorName, bloodGroup, campDate }) {
    const ngo = this.getNgoById(ngoId);
    if (!ngo) return null;
    if (!ngo.registeredVolunteers) ngo.registeredVolunteers = [];
    
    const registration = {
      id: 'VOL-' + Date.now(),
      donorId,
      donorName,
      bloodGroup,
      campDate: campDate || ngo.camps?.[0]?.date || 'Upcoming',
      registeredAt: new Date().toISOString()
    };
    ngo.registeredVolunteers.push(registration);
    if (ngo.camps && ngo.camps[0]) {
      ngo.camps[0].volunteersRegistered = (ngo.camps[0].volunteersRegistered || 0) + 1;
    }
    this.save();
    return { ngo, registration };
  }

  // --- Requests ---
  getRequests(filter = {}) {
    let list = this.data.requests;
    if (filter.urgency) {
      list = list.filter((r) => r.urgency.toLowerCase() === filter.urgency.toLowerCase());
    }
    if (filter.status) {
      list = list.filter((r) => r.status.toUpperCase() === filter.status.toUpperCase());
    }
    if (filter.bloodGroup) {
      list = list.filter((r) => r.bloodGroup.toUpperCase() === filter.bloodGroup.toUpperCase());
    }
    if (filter.hospitalId) {
      list = list.filter((r) => r.hospitalId === filter.hospitalId);
    }
    return list;
  }

  getRequestById(id) {
    return this.data.requests.find((r) => r.id === id);
  }

  createRequest(newReq) {
    this.data.requests.unshift(newReq);
    this.save();
    return newReq;
  }

  updateRequest(id, updates) {
    const req = this.getRequestById(id);
    if (!req) return null;
    Object.assign(req, updates);
    this.save();
    return req;
  }

  // --- Notifications ---
  getNotifications() {
    return this.data.notifications;
  }

  addNotification(notif) {
    const fullNotif = {
      id: notif.id || 'NOTIF-' + Date.now(),
      type: notif.type || 'info',
      title: notif.title || 'Notification',
      message: notif.message || '',
      time: 'Just now',
      read: false,
      requestId: notif.requestId || null,
      createdAt: new Date().toISOString(),
      ...notif
    };
    this.data.notifications.unshift(fullNotif);
    this.save();
    return fullNotif;
  }

  markNotificationRead(id) {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.save();
    }
    return notif;
  }

  markAllNotificationsRead() {
    this.data.notifications.forEach((n) => {
      n.read = true;
    });
    this.save();
    return true;
  }

  // --- Audit Log ---
  logAction(actor, action, details) {
    const entry = {
      id: 'AUDIT-' + Date.now(),
      actor,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.auditLog.unshift(entry);
    if (this.data.auditLog.length > 500) {
      this.data.auditLog.pop();
    }
    this.save();
    return entry;
  }
}

export const store = new Store();
export default store;
