import { query } from './connection.js';
import { mockData } from '../data/mockData.js';

export async function seedDatabase() {
  console.log('🔄 Checking & seeding BloodBank MySQL tables...');

  try {
    // 1. Compatibility
    for (const [bg, list] of Object.entries(mockData.compatibility)) {
      await query(
        `INSERT INTO blood_compatibility (blood_group, can_receive_from_json)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE can_receive_from_json = VALUES(can_receive_from_json)`,
        [bg, JSON.stringify(list)]
      );
    }

    // 2. Hospitals
    for (const h of mockData.hospitals) {
      await query(
        `INSERT INTO hospitals (id, name, area, lat, lng, contact, emergency_units_needed, type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           area = VALUES(area),
           lat = VALUES(lat),
           lng = VALUES(lng),
           contact = VALUES(contact),
           emergency_units_needed = VALUES(emergency_units_needed),
           type = VALUES(type)`,
        [h.id, h.name, h.area, h.lat, h.lng, h.contact, h.emergencyUnitsNeeded || 0, h.type || 'General']
      );
    }

    // 3. Blood Banks & Inventory
    for (const b of mockData.bloodBanks) {
      await query(
        `INSERT INTO blood_banks (id, name, area, lat, lng, contact, address, threshold)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           area = VALUES(area),
           lat = VALUES(lat),
           lng = VALUES(lng),
           contact = VALUES(contact),
           address = VALUES(address),
           threshold = VALUES(threshold)`,
        [b.id, b.name, b.area, b.lat, b.lng, b.contact, b.address, b.threshold || 20]
      );

      // Inventory
      for (const [bg, units] of Object.entries(b.inventory || {})) {
        const reservedUnits = b.reserved?.[bg] || 0;
        await query(
          `INSERT INTO blood_bank_inventory (bank_id, blood_group, available_units, reserved_units)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             available_units = VALUES(available_units),
             reserved_units = VALUES(reserved_units)`,
          [b.id, bg, units, reservedUnits]
        );
      }
    }

    // 4. Donors
    for (const d of mockData.donors) {
      await query(
        `INSERT INTO donors (id, name, blood_group, area, latitude, longitude, phone, email, available, eligibility_status, last_donation_date, total_donations, badge)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           blood_group = VALUES(blood_group),
           area = VALUES(area),
           latitude = VALUES(latitude),
           longitude = VALUES(longitude),
           phone = VALUES(phone),
           email = VALUES(email),
           available = VALUES(available),
           eligibility_status = VALUES(eligibility_status),
           last_donation_date = VALUES(last_donation_date),
           total_donations = VALUES(total_donations),
           badge = VALUES(badge)`,
        [
          d.id,
          d.name,
          d.bloodGroup,
          d.area,
          d.latitude,
          d.longitude,
          d.phone,
          d.email,
          d.available ? 1 : 0,
          d.eligibilityStatus || 'Eligible',
          d.lastDonationDate || '',
          d.totalDonations || 0,
          d.badge || 'Donor'
        ]
      );
    }

    // 5. Emergency Requests
    for (const r of mockData.initialRequests || []) {
      await query(
        `INSERT INTO emergency_requests (
          id, patient_case_id, hospital_id, hospital_name, area, latitude, longitude,
          blood_group, units_required, units_fulfilled, urgency, status,
          required_by_minutes, priority_score, notes, matched_donors_json, duplicate_flag, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          units_fulfilled = VALUES(units_fulfilled)`,
        [
          r.id,
          r.patientCaseId || null,
          r.hospitalId,
          r.hospitalName,
          r.area,
          r.latitude,
          r.longitude,
          r.bloodGroup,
          r.unitsRequired || 1,
          r.unitsFulfilled || 0,
          r.urgency || 'Critical',
          r.status || 'MATCHING',
          r.requiredByMinutes || 60,
          r.priorityScore || 50,
          r.notes || '',
          JSON.stringify(r.matchedDonorsList || []),
          r.duplicateFlag ? 1 : 0,
          r.createdAt || new Date().toISOString()
        ]
      );
    }

    // 6. NGOs
    for (const ngo of mockData.ngos || []) {
      await query(
        `INSERT INTO ngos (id, name, area, contact, description, camps_json, registered_volunteers_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           area = VALUES(area),
           contact = VALUES(contact),
           description = VALUES(description),
           camps_json = VALUES(camps_json),
           registered_volunteers_json = VALUES(registered_volunteers_json)`,
        [
          ngo.id,
          ngo.name,
          ngo.area,
          ngo.contact,
          ngo.description,
          JSON.stringify(ngo.camps || []),
          JSON.stringify(ngo.registeredVolunteers || [])
        ]
      );
    }

    // 7. Initial Notifications
    const initialNotifs = [
      {
        id: 'NOTIF-1',
        type: 'critical',
        title: '🚨 Critical Emergency Alert',
        message: 'O- blood required immediately at Lilavati Hospital (REQ-2026-1048). 42 mins remaining.',
        time: 'Just now',
        read: 0,
        requestId: 'REQ-2026-1048',
        createdAt: new Date().toISOString()
      },
      {
        id: 'NOTIF-2',
        type: 'match',
        title: '🩸 Donor Match Identified',
        message: 'Compatible donors found within 2.1 km in Bandra West for Lilavati Hospital.',
        time: '2 mins ago',
        read: 0,
        requestId: 'REQ-2026-1048',
        createdAt: new Date(Date.now() - 120000).toISOString()
      },
      {
        id: 'NOTIF-3',
        type: 'bank',
        title: '🏥 Blood Bank Alert',
        message: 'O- inventory reached critical threshold (5 units left) across Central Mumbai.',
        time: '14 mins ago',
        read: 1,
        requestId: null,
        createdAt: new Date(Date.now() - 840000).toISOString()
      },
      {
        id: 'NOTIF-4',
        type: 'system',
        title: '⚠️ Suspicious Duplicate Flagged',
        message: 'REQ-2026-1042 flagged with 87% similarity to REQ-2026-1040.',
        time: '25 mins ago',
        read: 1,
        requestId: 'REQ-2026-1042',
        createdAt: new Date(Date.now() - 1500000).toISOString()
      }
    ];

    for (const n of initialNotifs) {
      await query(
        `INSERT INTO notifications (id, type, title, message, time, is_read, request_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title)`,
        [n.id, n.type, n.title, n.message, n.time, n.read, n.requestId, n.createdAt]
      );
    }

    // 8. AI Insights & Analytics Metadata
    if (mockData.aiInsights) {
      await query(
        `INSERT INTO system_metadata (meta_key, meta_value)
         VALUES ('ai_insights', ?)
         ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)`,
        [JSON.stringify(mockData.aiInsights)]
      );
    }

    if (mockData.historicalAnalytics) {
      await query(
        `INSERT INTO system_metadata (meta_key, meta_value)
         VALUES ('historical_analytics', ?)
         ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)`,
        [JSON.stringify(mockData.historicalAnalytics)]
      );
    }

    console.log('✅ MySQL BloodBank database seeding complete!');
    return true;
  } catch (err) {
    console.error('❌ Error during MySQL database seeding:', err.message);
    throw err;
  }
}

export default seedDatabase;
