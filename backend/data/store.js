import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mockData } from './mockData.js';
import { query, testConnection } from '../db/connection.js';
import { seedDatabase } from '../db/seedDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

class Store {
  constructor() {
    this.mysqlConnected = false;
    this.data = this.loadInitialFallback();
    // Initialize MySQL asynchronously
    this.initMySQL();
  }

  loadInitialFallback() {
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
      aiInsights: JSON.parse(JSON.stringify(mockData.aiInsights || {})),
      historicalAnalytics: JSON.parse(JSON.stringify(mockData.historicalAnalytics || [])),
      auditLog: []
    };
  }

  async initMySQL() {
    try {
      const conn = await testConnection();
      if (!conn.connected) {
        console.warn('⚠️ MySQL connection failed, using local in-memory/JSON store:', conn.error);
        this.mysqlConnected = false;
        return;
      }

      this.mysqlConnected = true;
      console.log(`✅ Connected to MySQL database "${conn.activeDatabase}" on ${conn.host}`);

      // Check if tables have records
      const [hospCount] = await query('SELECT count(*) as count FROM hospitals');
      if (!hospCount || hospCount.count === 0) {
        console.log('🌱 Database tables are empty. Running initial seed...');
        await seedDatabase();
      }

      // Sync data from MySQL
      await this.syncFromMySQL();
    } catch (err) {
      console.error('❌ Failed initializing MySQL:', err.message);
      this.mysqlConnected = false;
    }
  }

  async syncFromMySQL() {
    try {
      // 1. Hospitals
      const hospitals = await query('SELECT * FROM hospitals ORDER BY id ASC');
      if (hospitals && hospitals.length > 0) {
        this.data.hospitals = hospitals.map((h) => ({
          id: h.id,
          name: h.name,
          area: h.area,
          lat: Number(h.lat),
          lng: Number(h.lng),
          contact: h.contact,
          emergencyUnitsNeeded: h.emergency_units_needed || 0,
          type: h.type
        }));
      }

      // 2. Blood Banks & Inventory
      const banks = await query('SELECT * FROM blood_banks ORDER BY id ASC');
      const inventories = await query('SELECT * FROM blood_bank_inventory');

      if (banks && banks.length > 0) {
        this.data.bloodBanks = banks.map((b) => {
          const bankInventories = inventories.filter((i) => i.bank_id === b.id);
          const inventory = {};
          const reserved = {};

          this.data.bloodGroups.forEach((bg) => {
            const rec = bankInventories.find((i) => i.blood_group === bg);
            inventory[bg] = rec ? rec.available_units : 0;
            reserved[bg] = rec ? rec.reserved_units : 0;
          });

          return {
            id: b.id,
            name: b.name,
            area: b.area,
            lat: Number(b.lat),
            lng: Number(b.lng),
            contact: b.contact,
            address: b.address,
            threshold: b.threshold,
            inventory,
            reserved
          };
        });
      }

      // 3. Donors
      const donors = await query('SELECT * FROM donors ORDER BY id ASC');
      if (donors && donors.length > 0) {
        this.data.donors = donors.map((d) => ({
          id: d.id,
          name: d.name,
          bloodGroup: d.blood_group,
          area: d.area,
          latitude: Number(d.latitude),
          longitude: Number(d.longitude),
          phone: d.phone,
          email: d.email,
          available: Boolean(d.available),
          eligibilityStatus: d.eligibility_status,
          lastDonationDate: d.last_donation_date,
          totalDonations: d.total_donations,
          badge: d.badge
        }));
      }

      // 4. Emergency Requests
      const requests = await query('SELECT * FROM emergency_requests ORDER BY created_at DESC');
      if (requests) {
        this.data.requests = requests.map((r) => {
          let matchedDonors = [];
          try {
            matchedDonors = typeof r.matched_donors_json === 'string'
              ? JSON.parse(r.matched_donors_json)
              : (r.matched_donors_json || []);
          } catch (e) {
            matchedDonors = [];
          }

          return {
            id: r.id,
            patientCaseId: r.patient_case_id,
            hospitalId: r.hospital_id,
            hospitalName: r.hospital_name,
            area: r.area,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            bloodGroup: r.blood_group,
            unitsRequired: Number(r.units_required),
            unitsFulfilled: Number(r.units_fulfilled || 0),
            urgency: r.urgency,
            status: r.status,
            requiredByMinutes: Number(r.required_by_minutes),
            priorityScore: Number(r.priority_score),
            notes: r.notes || '',
            matchedDonorsList: matchedDonors,
            duplicateFlag: Boolean(r.duplicate_flag),
            createdAt: r.created_at
          };
        });
      }

      // 5. NGOs
      const ngos = await query('SELECT * FROM ngos ORDER BY id ASC');
      if (ngos && ngos.length > 0) {
        this.data.ngos = ngos.map((n) => {
          let camps = [];
          let volunteers = [];
          try {
            camps = typeof n.camps_json === 'string' ? JSON.parse(n.camps_json) : (n.camps_json || []);
            volunteers = typeof n.registered_volunteers_json === 'string' ? JSON.parse(n.registered_volunteers_json) : (n.registered_volunteers_json || []);
          } catch (e) {
            // fallback
          }
          return {
            id: n.id,
            name: n.name,
            area: n.area,
            contact: n.contact,
            description: n.description,
            camps,
            registeredVolunteers: volunteers
          };
        });
      }

      // 6. Notifications
      const notifs = await query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
      if (notifs && notifs.length > 0) {
        this.data.notifications = notifs.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          time: n.time,
          read: Boolean(n.is_read),
          requestId: n.request_id,
          createdAt: n.created_at
        }));
      }

      // 7. System Metadata (AI insights, analytics)
      const meta = await query('SELECT * FROM system_metadata');
      if (meta) {
        for (const item of meta) {
          if (item.meta_key === 'ai_insights') {
            try {
              this.data.aiInsights = JSON.parse(item.meta_value);
            } catch (e) {}
          } else if (item.meta_key === 'historical_analytics') {
            try {
              this.data.historicalAnalytics = JSON.parse(item.meta_value);
            } catch (e) {}
          }
        }
      }

      // Save local backup file
      this.saveLocal();
      console.log('🔄 Synchronized data state from MySQL BloodBank database.');
    } catch (err) {
      console.error('Failed to sync from MySQL:', err.message);
    }
  }

  saveLocal() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save to database.json:', err.message);
    }
  }

  save() {
    this.saveLocal();
  }

  async reset() {
    if (this.mysqlConnected) {
      try {
        await seedDatabase();
        await this.syncFromMySQL();
        return this.data;
      } catch (err) {
        console.error('MySQL reset error:', err.message);
      }
    }
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
      if (unitsDiff > 0 && bank.inventory[bloodGroup] >= unitsDiff) {
        bank.inventory[bloodGroup] -= unitsDiff;
      }
    } else {
      bank.inventory[bloodGroup] = Math.max(0, bank.inventory[bloodGroup] + unitsDiff);
    }

    this.save();

    // Async persist to MySQL
    if (this.mysqlConnected) {
      query(
        `INSERT INTO blood_bank_inventory (bank_id, blood_group, available_units, reserved_units)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           available_units = VALUES(available_units),
           reserved_units = VALUES(reserved_units)`,
        [bankId, bloodGroup, bank.inventory[bloodGroup], bank.reserved[bloodGroup]]
      ).catch((err) => console.error('MySQL inventory update failed:', err.message));
    }

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

    // Async persist to MySQL
    if (this.mysqlConnected) {
      const availableVal = donor.available !== undefined ? (donor.available ? 1 : 0) : null;
      query(
        `UPDATE donors SET
           available = COALESCE(?, available),
           eligibility_status = COALESCE(?, eligibility_status),
           total_donations = COALESCE(?, total_donations),
           last_donation_date = COALESCE(?, last_donation_date)
         WHERE id = ?`,
        [
          availableVal,
          donor.eligibilityStatus || null,
          donor.totalDonations !== undefined ? donor.totalDonations : null,
          donor.lastDonationDate || null,
          id
        ]
      ).catch((err) => console.error('MySQL donor update failed:', err.message));
    }

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

    // Async persist to MySQL
    if (this.mysqlConnected) {
      query(
        `UPDATE ngos SET
           camps_json = ?,
           registered_volunteers_json = ?
         WHERE id = ?`,
        [
          JSON.stringify(ngo.camps || []),
          JSON.stringify(ngo.registeredVolunteers || []),
          ngoId
        ]
      ).catch((err) => console.error('MySQL NGO volunteer update failed:', err.message));
    }

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

    // Async persist to MySQL
    if (this.mysqlConnected) {
      query(
        `INSERT INTO emergency_requests (
          id, patient_case_id, hospital_id, hospital_name, area, latitude, longitude,
          blood_group, units_required, units_fulfilled, urgency, status,
          required_by_minutes, priority_score, notes, matched_donors_json, duplicate_flag, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newReq.id,
          newReq.patientCaseId || null,
          newReq.hospitalId || null,
          newReq.hospitalName || null,
          newReq.area || null,
          newReq.latitude || null,
          newReq.longitude || null,
          newReq.bloodGroup,
          newReq.unitsRequired || 1,
          newReq.unitsFulfilled || 0,
          newReq.urgency || 'Critical',
          newReq.status || 'MATCHING',
          newReq.requiredByMinutes || 60,
          newReq.priorityScore || 50,
          newReq.notes || '',
          JSON.stringify(newReq.matchedDonorsList || []),
          newReq.duplicateFlag ? 1 : 0,
          newReq.createdAt || new Date().toISOString()
        ]
      ).catch((err) => console.error('MySQL insert emergency_request failed:', err.message));
    }

    return newReq;
  }

  updateRequest(id, updates) {
    const req = this.getRequestById(id);
    if (!req) return null;
    Object.assign(req, updates);
    this.save();

    // Async persist to MySQL
    if (this.mysqlConnected) {
      query(
        `UPDATE emergency_requests SET
           status = COALESCE(?, status),
           units_fulfilled = COALESCE(?, units_fulfilled),
           matched_donors_json = COALESCE(?, matched_donors_json),
           priority_score = COALESCE(?, priority_score),
           notes = COALESCE(?, notes)
         WHERE id = ?`,
        [
          updates.status || null,
          updates.unitsFulfilled !== undefined ? updates.unitsFulfilled : null,
          updates.matchedDonorsList ? JSON.stringify(updates.matchedDonorsList) : null,
          updates.priorityScore !== undefined ? updates.priorityScore : null,
          updates.notes !== undefined ? updates.notes : null,
          id
        ]
      ).catch((err) => console.error('MySQL update emergency_request failed:', err.message));
    }

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

    // Async persist to MySQL
    if (this.mysqlConnected) {
      query(
        `INSERT INTO notifications (id, type, title, message, time, is_read, request_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fullNotif.id,
          fullNotif.type,
          fullNotif.title,
          fullNotif.message,
          fullNotif.time,
          fullNotif.read ? 1 : 0,
          fullNotif.requestId || null,
          fullNotif.createdAt
        ]
      ).catch((err) => console.error('MySQL notification insert failed:', err.message));
    }

    return fullNotif;
  }

  markNotificationRead(id) {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.save();

      if (this.mysqlConnected) {
        query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id])
          .catch((err) => console.error('MySQL notification mark read failed:', err.message));
      }
    }
    return notif;
  }

  markAllNotificationsRead() {
    this.data.notifications.forEach((n) => {
      n.read = true;
    });
    this.save();

    if (this.mysqlConnected) {
      query('UPDATE notifications SET is_read = 1')
        .catch((err) => console.error('MySQL mark all read failed:', err.message));
    }

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

    if (this.mysqlConnected) {
      query(
        `INSERT INTO audit_logs (id, actor, action, details, timestamp)
         VALUES (?, ?, ?, ?, ?)`,
        [entry.id, entry.actor, entry.action, entry.details, entry.timestamp]
      ).catch((err) => console.error('MySQL audit log insert failed:', err.message));
    }

    return entry;
  }
}

export const store = new Store();
export default store;
