import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockData } from '../data/mockData';
import api from '../services/api';

const RedRelayContext = createContext();

export function RedRelayProvider({ children }) {
  // Current user role: 'hospital' | 'blood_bank' | 'donor' | 'ngo' | 'admin'
  const [role, setRole] = useState('hospital');
  
  // Requests list
  const [requests, setRequests] = useState(() => mockData.initialRequests);
  const [selectedRequestId, setSelectedRequestId] = useState('REQ-2026-1048');

  // Blood bank inventories
  const [bloodBanks, setBloodBanks] = useState(() => mockData.bloodBanks);

  // Donors
  const [donors, setDonors] = useState(() => mockData.donors);

  // NGOs
  const [ngos, setNgos] = useState(() => mockData.ngos);

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

  // Backend connection status
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Toast message state for interactive feedback
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Fetch initial data from backend API
  const syncWithBackend = useCallback(async () => {
    try {
      const [reqRes, banksRes, donorsRes, ngosRes, notifsRes] = await Promise.allSettled([
        api.getRequests(),
        api.getBloodBanks(),
        api.getDonors(),
        api.getNgos(),
        api.getNotifications()
      ]);

      if (reqRes.status === 'fulfilled' && reqRes.value.success) {
        setRequests(reqRes.value.data);
        setIsBackendConnected(true);
      }
      if (banksRes.status === 'fulfilled' && banksRes.value.success) {
        setBloodBanks(banksRes.value.data);
      }
      if (donorsRes.status === 'fulfilled' && donorsRes.value.success) {
        setDonors(donorsRes.value.data);
      }
      if (ngosRes.status === 'fulfilled' && ngosRes.value.success) {
        setNgos(ngosRes.value.data);
      }
      if (notifsRes.status === 'fulfilled' && notifsRes.value.success) {
        setNotifications(notifsRes.value.data);
      }
    } catch (err) {
      console.warn('Backend sync failed, continuing with local store:', err.message);
    }
  }, []);

  useEffect(() => {
    syncWithBackend();

    // Listen to real-time Server-Sent Events (SSE) from backend
    const unsubscribe = api.subscribeToEvents((event) => {
      if (!event || !event.type) return;

      switch (event.type) {
        case 'CONNECTED':
          setIsBackendConnected(true);
          break;

        case 'EMERGENCY_REQUEST_CREATED':
          setRequests((prev) => {
            const exists = prev.some((r) => r.id === event.data.id);
            return exists ? prev : [event.data, ...prev];
          });
          break;

        case 'REQUEST_STATUS_UPDATED':
          setRequests((prev) =>
            prev.map((r) => {
              if (r.id === event.data.requestId) {
                return {
                  ...r,
                  status: event.data.status,
                  unitsFulfilled: event.data.unitsFulfilled !== undefined ? event.data.unitsFulfilled : r.unitsFulfilled,
                  matchedDonorsList: event.data.matchedDonorsList || r.matchedDonorsList
                };
              }
              return r;
            })
          );
          break;

        case 'INVENTORY_UPDATED':
          setBloodBanks((prev) =>
            prev.map((b) =>
              b.id === event.data.bankId
                ? {
                    ...b,
                    inventory: event.data.updatedInventory || b.inventory,
                    reserved: event.data.updatedReserved || b.reserved
                  }
                : b
            )
          );
          break;

        case 'DONOR_RESPONSE':
          setRequests((prev) =>
            prev.map((r) => {
              if (r.id === event.data.requestId) {
                return {
                  ...r,
                  status: event.data.newStatus || r.status,
                  unitsFulfilled: event.data.unitsFulfilled !== undefined ? event.data.unitsFulfilled : r.unitsFulfilled,
                  matchedDonorsList: r.matchedDonorsList?.map((d) =>
                    d.donorId === event.data.donorId ? { ...d, status: event.data.action === 'ACCEPTED' ? 'Accepted' : 'Declined' } : d
                  )
                };
              }
              return r;
            })
          );
          break;

        case 'NEW_NOTIFICATION':
          setNotifications((prev) => [event.data, ...prev]);
          break;

        case 'DEMO_RESET':
          syncWithBackend();
          break;

        default:
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [syncWithBackend]);

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
        summary[bg].threshold += Math.round((bank.threshold || 20) / 8);
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
    if (donor.bloodGroup === reqGroup) score += 25;
    else score += 12;

    if (distanceKm < 3) score += 20;
    else if (distanceKm < 6) score += 14;
    else if (distanceKm < 10) score += 8;
    else score += 3;

    if (donor.available && donor.eligibilityStatus === 'Eligible') score += 15;
    else if (donor.available) score += 5;

    if (reqUrgency === 'Critical') score = Math.min(99, score + 4);

    return {
      score: Math.min(99, Math.max(45, score)),
      eligible: donor.eligibilityStatus === 'Eligible',
      distance: distanceKm
    };
  };

  // Create Emergency Request
  const createEmergencyRequest = async (formData) => {
    const randomSuffix = Math.floor(1050 + Math.random() * 800);
    const newId = `REQ-2026-${randomSuffix}`;

    // Try backend API first
    try {
      const res = await api.createEmergencyRequest({
        ...formData,
        unitsRequired: Number(formData.unitsRequired) || 2,
        requiredByMinutes: Number(formData.requiredByMinutes) || 60
      });
      if (res.success && res.data) {
        setRequests((prev) => [res.data, ...prev]);
        setSelectedRequestId(res.data.id);
        showToast(`Emergency request ${res.data.id} created successfully via Backend API!`, 'success');
        return res.data;
      }
    } catch (err) {
      console.warn('Backend create request failed, falling back to local simulation:', err.message);
    }

    // Local fallback computation
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

    const isPotentialDuplicate = Boolean(formData.patientCaseId && formData.patientCaseId.toLowerCase().includes('duplicate'));
    const similarityScore = isPotentialDuplicate ? 87 : 0;
    const hosp = mockData.hospitals.find((h) => h.id === formData.hospitalId) || mockData.hospitals[0];

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
      patientCaseId: formData.patientCaseId || `PT-${Math.floor(10000 + Math.random() * 90000)}`,
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

    const alertNotif = {
      id: 'NOTIF-' + Date.now(),
      type: computedPriority === 'Critical' ? 'critical' : 'match',
      title: `🚨 ${formData.bloodGroup} Blood Request: ${hosp.name}`,
      message: `${units} units required at ${hosp.area}. Priority score ${priorityScore}%.`,
      time: 'Just now',
      read: false,
      requestId: newId
    };
    setNotifications((prev) => [alertNotif, ...prev]);
    showToast(`Emergency request ${newId} created successfully! Matching engine triggered.`, 'success');

    return newRequest;
  };

  // Update request status
  const updateRequestStatus = async (id, newStatus, fulfillmentCount = null) => {
    try {
      await api.updateRequestStatus(id, newStatus, fulfillmentCount);
    } catch (e) {
      console.warn('Backend updateRequestStatus error:', e);
    }

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
  const updateInventoryUnit = async (bankId, bloodGroup, unitsDiff, isReserved = false) => {
    try {
      await api.updateInventory(bankId, bloodGroup, unitsDiff, isReserved);
    } catch (e) {
      console.warn('Backend updateInventory error:', e);
    }

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
    showToast(`Blood inventory updated for ${bankId}`, 'info');
  };

  // Notify donor simulation
  const notifyDonor = async (donorId, reqId) => {
    try {
      await api.notifyDonor(reqId, donorId);
    } catch (e) {
      console.warn('Backend notifyDonor error:', e);
    }

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
    showToast(`Simulated SMS & Push Alert dispatched to Donor #${donorId}`, 'success');
  };

  // Respond as donor
  const respondAsDonor = async (donorId, reqId, action) => {
    const isAccepted = action === 'ACCEPT';
    try {
      await api.respondAsDonor(donorId, reqId, action);
    } catch (e) {
      console.warn('Backend respondAsDonor error:', e);
    }

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
    showToast(isAccepted ? `Request Accepted! You are coordinated with hospital transport.` : `Request declined.`, isAccepted ? 'success' : 'info');
  };

  // Mark notification read
  const markNotificationRead = async (id) => {
    try {
      await api.markNotificationRead(id);
    } catch (e) {
      console.warn('Backend markNotificationRead error:', e);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
    } catch (e) {
      console.warn('Backend markAllNotificationsRead error:', e);
    }
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

  const executeDemoStep = async (stepNumber) => {
    const stepTarget = Math.max(1, Math.min(12, stepNumber));
    setDemoStepIndex(stepTarget - 1);
    const info = demoSteps[stepTarget - 1];
    setRole(info.targetRole);

    const targetReqId = 'REQ-2026-1048';
    setSelectedRequestId(targetReqId);

    // Call backend demo execution endpoint
    try {
      await api.executeDemoStep(stepTarget);
    } catch (e) {
      console.warn('Backend executeDemoStep error:', e);
    }

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

  const resetDemo = async () => {
    setIsDemoRunning(false);
    setDemoStepIndex(0);
    setRole('hospital');
    try {
      await api.resetDemo();
    } catch (e) {
      console.warn('Backend resetDemo error:', e);
    }
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
    isBackendConnected,
    syncWithBackend,
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
