import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockData } from '../data/mockData';

const RedRelayContext = createContext();

export function RedRelayProvider({ children }) {
  // Current user role: 'hospital' | 'blood_bank' | 'donor' | 'ngo' | 'admin'
  const [role, setRole] = useState('hospital');
  
  // Requests list
  const [requests, setRequests] = useState(() => {
    return mockData.initialRequests;
  });

  const [selectedRequestId, setSelectedRequestId] = useState('REQ-2026-1048');

  // Blood bank inventories
  const [bloodBanks, setBloodBanks] = useState(() => {
    return mockData.bloodBanks;
  });

  // Donors
  const [donors, setDonors] = useState(() => {
    return mockData.donors;
  });

  // NGOs
  const [ngos, setNgos] = useState(() => {
    return mockData.ngos;
  });

  // Notifications
  const [notifications, setNotifications] = useState([
    {
      id: 'NOTIF-1',
      type: 'critical',
      title: '🚨 Critical Emergency Alert',
      message: 'O- blood required immediately at Lilavati Hospital (REQ-2026-1048). 42 mins remaining.',
      time: 'Just now',
      read: false,
      requestId: 'REQ-2026-1048'
    },
    {
      id: 'NOTIF-2',
      type: 'match',
      title: '🩸 Donor Match Identified',
      message: 'You are compatible with emergency request 2.1 km away in Bandra West.',
      time: '2 mins ago',
      read: false,
      requestId: 'REQ-2026-1048'
    },
    {
      id: 'NOTIF-3',
      type: 'bank',
      title: '🏥 Blood Bank Alert',
      message: 'O- inventory reached critical threshold (5 units left) across Central Mumbai.',
      time: '14 mins ago',
      read: true,
      requestId: null
    },
    {
      id: 'NOTIF-4',
      type: 'system',
      title: '⚠️ Suspicious Duplicate Flagged',
      message: 'REQ-2026-1042 flagged with 87% similarity to REQ-2026-1040.',
      time: '25 mins ago',
      read: true,
      requestId: 'REQ-2026-1042'
    }
  ]);

  // Toast message state for interactive feedback
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Helper: Aggregate inventory across all banks
  const getInventoryAggregates = () => {
    const summary = {};
    mockData.bloodGroups.forEach((bg) => {
      summary[bg] = { available: 0, reserved: 0, threshold: 0 };
    });
    bloodBanks.forEach((bank) => {
      mockData.bloodGroups.forEach((bg) => {
        summary[bg].available += bank.inventory[bg] || 0;
        summary[bg].reserved += bank.reserved[bg] || 0;
        summary[bg].threshold += Math.round(bank.threshold / 8);
      });
    });
    return summary;
  };

  // AI Matching score calculation
  const calculateDonorMatch = (donor, reqGroup, reqUrgency, reqLat, reqLng) => {
    const compatibleList = mockData.compatibility[reqGroup] || [];
    const isCompat = compatibleList.includes(donor.bloodGroup);
    if (!isCompat) return { score: 0, eligible: false, distance: 999 };

    // Distance calculation (rough km approximation)
    const dLat = (donor.latitude - reqLat) * 111;
    const dLng = (donor.longitude - reqLng) * 105;
    const distanceKm = Math.max(0.8, Number(Math.sqrt(dLat * dLat + dLng * dLng).toFixed(1)));

    // Score factors
    let score = 50;
    // Exact blood group bonus
    if (donor.bloodGroup === reqGroup) score += 25;
    else score += 12;

    // Distance factor (max 20)
    if (distanceKm < 3) score += 20;
    else if (distanceKm < 6) score += 14;
    else if (distanceKm < 10) score += 8;
    else score += 3;

    // Availability & eligibility
    if (donor.available && donor.eligibilityStatus === 'Eligible') score += 15;
    else if (donor.available) score += 5;

    // Urgency multiplier
    if (reqUrgency === 'Critical') score = Math.min(99, score + 4);

    return {
      score: Math.min(99, Math.max(45, score)),
      eligible: donor.eligibilityStatus === 'Eligible',
      distance: distanceKm
    };
  };

  // Create Emergency Request
  const createEmergencyRequest = (formData) => {
    const randomSuffix = Math.floor(1050 + Math.random() * 800);
    const newId = REQ-2026-;

    // Priority computation
    let computedPriority = 'Normal';
    let priorityScore = 65;
    let priorityReason = 'Standard clinical priority.';

    const mins = Number(formData.requiredByMinutes) || 60;
    const units = Number(formData.unitsRequired) || 2;

    if (formData.urgency === 'Critical' || mins <= 60 || (formData.bloodGroup === 'O-' && units >= 3)) {
      computedPriority = 'Critical';
      priorityScore = 96;
      priorityReason = 'High priority because required time is less than 1 hour and available inventory is low.';
    } else if (formData.urgency === 'High' || mins <= 120 || units >= 4) {
      computedPriority = 'High';
      priorityScore = 82;
      priorityReason = 'Elevated priority based on unit demand and response window.';
    }

    // Check duplicate simulation
    const isPotentialDuplicate = formData.patientCaseId && formData.patientCaseId.toLowerCase().includes('duplicate');
    const similarityScore = isPotentialDuplicate ? 87 : 0;

    // Find hospital details
    const hosp = mockData.hospitals.find((h) => h.id === formData.hospitalId) || mockData.hospitals[0];

    // Find compatible donors
    const matchedDonors = donors
      .map((d) => {
        const matchRes = calculateDonorMatch(d, formData.bloodGroup, formData.urgency, hosp.lat, hosp.lng);
        return {
          donorId: d.id,
          name: d.name,
          bloodGroup: d.bloodGroup,
          distance: matchRes.distance,
          availability: d.available ? 'Available Now' : 'Busy',
          eligibility: d.eligibilityStatus,
          matchScore: matchRes.score,
          status: 'Identified'
        };
      })
      .filter((m) => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8);

    const newRequest = {
      id: newId,
      hospitalId: hosp.id,
      hospitalName: hosp.name,
      patientCaseId: formData.patientCaseId || PT-,
      bloodGroup: formData.bloodGroup,
      unitsRequired: units,
      unitsFulfilled: 0,
      urgency: formData.urgency,
      priority: computedPriority,
      priorityScore,
      priorityReason,
      requiredByMinutes: mins,
      createdAt: new Date().toISOString(),
      requiredBy: new Date(Date.now() + mins * 60000).toISOString(),
      location: hosp.area + ', Mumbai',
      latitude: hosp.lat,
      longitude: hosp.lng,
      status: 'MATCHING',
      notes: formData.notes || 'Emergency transfusion request.',
      isSuspicious: isPotentialDuplicate,
      similarityScore,
      fraudReason: isPotentialDuplicate ? 'High lexical and clinical match with active emergency in adjacent facility.' : null,
      compatibleDonorsFound: matchedDonors.length,
      nearbyBloodBanks: 3,
      availableUnitsNearby: 5,
      nearestDistanceKm: matchedDonors[0]?.distance || 2.4,
      matchedDonorsList: matchedDonors
    };

    setRequests((prev) => [newRequest, ...prev]);
    setSelectedRequestId(newId);

    // Add alert notification
    const alertNotif = {
      id: 'NOTIF-' + Date.now(),
      type: computedPriority === 'Critical' ? 'critical' : 'match',
      title: 🚨  Blood Request: ,
      message: ${units} units required at . Priority score %.,
      time: 'Just now',
      read: false,
      requestId: newId
    };
    setNotifications((prev) => [alertNotif, ...prev]);
    showToast(Emergency request  created successfully! Matching engine triggered., 'success');

    return newRequest;
  };

  // Update request status
  const updateRequestStatus = (id, newStatus, fulfillmentCount = null) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id === id) {
          return {
            ...req,
            status: newStatus,
            unitsFulfilled: fulfillmentCount !== null ? fulfillmentCount : (newStatus === 'FULFILLED' ? req.unitsRequired : req.unitsFulfilled)
          };
        }
        return req;
      })
    );
  };

  // Update blood bank inventory
  const updateInventoryUnit = (bankId, bloodGroup, unitsDiff, isReserved = false) => {
    setBloodBanks((prev) =>
      prev.map((bank) => {
        if (bank.id === bankId) {
          const currentInv = bank.inventory[bloodGroup] || 0;
          const currentRes = bank.reserved[bloodGroup] || 0;
          return {
            ...bank,
            inventory: {
              ...bank.inventory,
              [bloodGroup]: Math.max(0, currentInv + (isReserved ? 0 : unitsDiff))
            },
            reserved: {
              ...bank.reserved,
              [bloodGroup]: Math.max(0, currentRes + (isReserved ? unitsDiff : 0))
            }
          };
        }
        return bank;
      })
    );
    showToast(Blood inventory updated for , 'info');
  };

  // Notify donor simulation
  const notifyDonor = (donorId, reqId) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id === reqId && req.matchedDonorsList) {
          return {
            ...req,
            matchedDonorsList: req.matchedDonorsList.map((d) =>
              d.donorId === donorId ? { ...d, status: 'Notified' } : d
            )
          };
        }
        return req;
      })
    );
    showToast(Simulated SMS & Push Alert dispatched to Donor #, 'success');
  };

  // Respond as donor
  const respondAsDonor = (donorId, reqId, action) => {
    const isAccepted = action === 'ACCEPT';
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id === reqId && req.matchedDonorsList) {
          return {
            ...req,
            status: isAccepted ? 'ALERT_SENT' : req.status,
            matchedDonorsList: req.matchedDonorsList.map((d) =>
              d.donorId === donorId ? { ...d, status: isAccepted ? 'Accepted' : 'Declined' } : d
            )
          };
        }
        return req;
      })
    );
    showToast(isAccepted ? Request Accepted! You are coordinated with hospital transport. : Request declined., isAccepted ? 'success' : 'info');
  };

  // Mark notification read
  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'info');
  };

  // ==============================================================
  // HACKATHON 12-STEP GUIDED DEMO CONTROLLER
  // ==============================================================
  const demoSteps = [
    { step: 1, title: 'Step 1: Hospital Logs In', description: 'Hospital coordinator opens Red Relay dashboard and selects Hospital role.', targetRole: 'hospital' },
    { step: 2, title: 'Step 2: Emergency Request Initiation', description: 'Hospital coordinator clicks + Create Emergency Request button.', targetRole: 'hospital' },
    { step: 3, title: 'Step 3: Clinical Parameters Entered', description: 'Blood Group: O-, Units: 4, Urgency: Critical, Time Remaining: 42 min.', targetRole: 'hospital' },
    { step: 4, title: 'Step 4: Smart Search Engine Triggered', description: 'System status updates to Searching for compatible blood...', targetRole: 'hospital' },
    { step: 5, title: 'Step 5: Smart Matching Identifies Targets', description: 'AI Engine locates 8 compatible donors and 3 nearby blood banks in Bandra-Parel corridor.', targetRole: 'hospital' },
    { step: 6, title: 'Step 6: Priority Engine Classifies CRITICAL', description: 'AI flags Critical priority: required time < 1h and citywide O- inventory in shortage.', targetRole: 'admin' },
    { step: 7, title: 'Step 7: Real-Time Donor Broadcast Dispatched', description: 'Push notification sent to matched O- donors within 5km radius.', targetRole: 'donor' },
    { step: 8, title: 'Step 8: Blood Bank Inventory Verified', description: 'Rotary Blood Bank & Red Cross verify 5 reserve units available on standby.', targetRole: 'blood_bank' },
    { step: 9, title: 'Step 9: Donor #D104 (Neha Patil) Accepts', description: 'Top matched donor accepts notification and commits 1 unit.', targetRole: 'donor' },
    { step: 10, title: 'Step 10: Blood Bank Confirms 3 Units', description: 'Blood bank confirms & reserves remaining 3 units for dispatch.', targetRole: 'blood_bank' },
    { step: 11, title: 'Step 11: End-to-End Status Transition', description: 'SEARCHING → MATCHED → ALERT SENT → BLOOD CONFIRMED → FULFILLED.', targetRole: 'hospital' },
    { step: 12, title: 'Step 12: Real-time Analytics Update', description: 'Live counters increment: requests fulfilled today (29), response time recorded (8 min).', targetRole: 'admin' }
  ];

  const [demoStepIndex, setDemoStepIndex] = useState(0);
  const [isDemoRunning, setIsDemoRunning] = useState(false);

  const executeDemoStep = (stepNumber) => {
    const stepTarget = Math.max(1, Math.min(12, stepNumber));
    setDemoStepIndex(stepTarget - 1);
    const info = demoSteps[stepTarget - 1];
    setRole(info.targetRole);

    const targetReqId = 'REQ-2026-1048';
    setSelectedRequestId(targetReqId);

    if (stepTarget === 1) {
      setRole('hospital');
      showToast('Step 1: Hospital role active. Ready to initiate emergency protocol.', 'info');
    } else if (stepTarget === 2) {
      setRole('hospital');
      showToast('Step 2: Emergency Request modal triggered.', 'info');
    } else if (stepTarget === 3) {
      setRole('hospital');
      showToast('Step 3: Blood Group O-, 4 units, Critical priority entered.', 'info');
    } else if (stepTarget === 4) {
      updateRequestStatus(targetReqId, 'MATCHING');
      showToast('Step 4: Real-time state -> SEARCHING FOR BLOOD...', 'info');
    } else if (stepTarget === 5) {
      updateRequestStatus(targetReqId, 'DONORS_IDENTIFIED');
      showToast('Step 5: 8 compatible donors and 3 blood banks matched!', 'success');
    } else if (stepTarget === 6) {
      setRole('admin');
      showToast('Step 6: AI Priority Engine evaluated CRITICAL urgency score: 98/100.', 'warning');
    } else if (stepTarget === 7) {
      setRole('donor');
      updateRequestStatus(targetReqId, 'ALERT_SENT');
      showToast('Step 7: Push & SMS broadcast received by Donor #D104.', 'info');
    } else if (stepTarget === 8) {
      setRole('blood_bank');
      updateRequestStatus(targetReqId, 'BLOOD_BANK_CHECK');
      showToast('Step 8: Blood Bank checked: 5 units on standby.', 'info');
    } else if (stepTarget === 9) {
      setRole('donor');
      respondAsDonor('D104', targetReqId, 'ACCEPT');
      updateRequestStatus(targetReqId, 'PARTIALLY_FULFILLED', 1);
      showToast('Step 9: Donor #D104 Neha Patil ACCEPTED emergency request!', 'success');
    } else if (stepTarget === 10) {
      setRole('blood_bank');
      updateInventoryUnit('BB5', 'O-', -3, true);
      updateRequestStatus(targetReqId, 'PARTIALLY_FULFILLED', 4);
      showToast('Step 10: Blood Bank confirmed 3 units reserved for transport.', 'success');
    } else if (stepTarget === 11) {
      setRole('hospital');
      updateRequestStatus(targetReqId, 'FULFILLED', 4);
      showToast('Step 11: Request FULFILLED! 4/4 Units secured in 14 minutes.', 'success');
    } else if (stepTarget === 12) {
      setRole('admin');
      showToast('Step 12: Real-time analytics updated. Today fulfilled: 29 requests!', 'success');
    }
  };

  const advanceDemo = () => {
    const next = demoStepIndex + 2;
    if (next <= 12) {
      executeDemoStep(next);
    } else {
      executeDemoStep(1);
    }
  };

  const resetDemo = () => {
    setIsDemoRunning(false);
    setDemoStepIndex(0);
    setRole('hospital');
    setRequests(mockData.initialRequests);
    setBloodBanks(mockData.bloodBanks);
    setSelectedRequestId('REQ-2026-1048');
    showToast('Demo state reset to initial conditions.', 'info');
  };

  // Value export
  const value = {
    role,
    setRole,
    requests,
    selectedRequestId,
    setSelectedRequestId,
    bloodBanks,
    donors,
    ngos,
    notifications,
    toast,
    showToast,
    getInventoryAggregates,
    createEmergencyRequest,
    updateRequestStatus,
    updateInventoryUnit,
    notifyDonor,
    respondAsDonor,
    markNotificationRead,
    markAllNotificationsRead,
    demoSteps,
    demoStepIndex,
    isDemoRunning,
    setIsDemoRunning,
    executeDemoStep,
    advanceDemo,
    resetDemo,
    aiInsights: mockData.aiInsights,
    historicalAnalytics: mockData.historicalAnalytics
  };

  return (
    <RedRelayContext.Provider value={value}>
      {children}
    </RedRelayContext.Provider>
  );
}

export function useRedRelay() {
  const context = useContext(RedRelayContext);
  if (!context) {
    throw new Error('useRedRelay must be used within a RedRelayProvider');
  }
  return context;
}
