import express from 'express';
import store from '../data/store.js';
import { calculateEmergencyPriority } from '../services/priorityService.js';
import { detectDuplicateRequest } from '../services/fraudDetectionService.js';
import { findMatchingDonors, findNearbyBloodBanks } from '../services/matchingService.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// GET /api/requests - list requests with optional query parameters
router.get('/', (req, res) => {
  const { urgency, status, bloodGroup, hospitalId } = req.query;
  const requests = store.getRequests({ urgency, status, bloodGroup, hospitalId });
  res.json({ success: true, count: requests.length, data: requests });
});

// GET /api/requests/:id - single request with real-time matched donors & blood banks
router.get('/:id', (req, res) => {
  const requestItem = store.getRequestById(req.params.id);
  if (!requestItem) {
    return res.status(404).json({ success: false, message: 'Request not found' });
  }

  // Calculate live matching breakdown
  const liveDonors = findMatchingDonors({
    bloodGroup: requestItem.bloodGroup,
    urgency: requestItem.urgency,
    latitude: requestItem.latitude,
    longitude: requestItem.longitude,
    limit: 8
  });

  const nearbyBanks = findNearbyBloodBanks({
    bloodGroup: requestItem.bloodGroup,
    latitude: requestItem.latitude,
    longitude: requestItem.longitude,
    minUnits: 1
  });

  res.json({
    success: true,
    data: {
      ...requestItem,
      liveDonors,
      nearbyBloodBanksList: nearbyBanks
    }
  });
});

// POST /api/requests - create a new emergency request
router.post('/', (req, res) => {
  const {
    hospitalId,
    patientCaseId,
    bloodGroup,
    unitsRequired,
    urgency,
    requiredByMinutes,
    notes
  } = req.body;

  if (!hospitalId || !bloodGroup) {
    return res.status(400).json({
      success: false,
      message: 'hospitalId and bloodGroup are required'
    });
  }

  const hosp = store.getHospitalById(hospitalId) || store.getHospitals()[0];
  const units = Number(unitsRequired) || 2;
  const mins = Number(requiredByMinutes) || 60;
  const reqUrgency = urgency || 'Critical';

  // 1. Calculate Priority using AI Priority Service
  const priorityResult = calculateEmergencyPriority({
    bloodGroup,
    unitsRequired: units,
    urgency: reqUrgency,
    requiredByMinutes: mins
  });

  // 2. Run Duplicate / Fraud Detection
  const fraudCheck = detectDuplicateRequest({
    patientCaseId,
    hospitalId: hosp.id,
    bloodGroup,
    unitsRequired: units
  });

  // 3. Run Smart Donor Matching
  const matchedDonors = findMatchingDonors({
    bloodGroup,
    urgency: reqUrgency,
    latitude: hosp.lat,
    longitude: hosp.lng,
    limit: 8
  });

  const nearbyBanks = findNearbyBloodBanks({
    bloodGroup,
    latitude: hosp.lat,
    longitude: hosp.lng,
    minUnits: 1
  });

  const newId = `REQ-2026-${Math.floor(1050 + Math.random() * 800)}`;
  const now = new Date();

  const newRequest = {
    id: newId,
    hospitalId: hosp.id,
    hospitalName: hosp.name,
    patientCaseId: patientCaseId || `PT-${Math.floor(10000 + Math.random() * 90000)}`,
    bloodGroup,
    unitsRequired: units,
    unitsFulfilled: 0,
    urgency: reqUrgency,
    priority: priorityResult.priority,
    priorityScore: priorityResult.priorityScore,
    priorityReason: priorityResult.priorityReason,
    requiredByMinutes: mins,
    createdAt: now.toISOString(),
    requiredBy: new Date(now.getTime() + mins * 60000).toISOString(),
    location: `${hosp.area}, Mumbai`,
    latitude: hosp.lat,
    longitude: hosp.lng,
    status: 'MATCHING',
    notes: notes || 'Emergency transfusion protocol engaged.',
    isSuspicious: fraudCheck.isSuspicious,
    similarityScore: fraudCheck.similarityScore,
    fraudReason: fraudCheck.fraudReason,
    duplicateOfRequestId: fraudCheck.duplicateOfRequestId,
    compatibleDonorsFound: matchedDonors.length,
    nearbyBloodBanks: nearbyBanks.length,
    availableUnitsNearby: nearbyBanks.reduce((sum, b) => sum + (b.availableUnits || 0), 0),
    nearestDistanceKm: matchedDonors[0]?.distance || (nearbyBanks[0]?.distanceKm || 2.4),
    matchedDonorsList: matchedDonors
  };

  store.createRequest(newRequest);

  // Send Notification
  notificationService.sendNotification({
    type: priorityResult.priority === 'Critical' ? 'critical' : 'match',
    title: `🚨 ${bloodGroup} Blood Request: ${hosp.name}`,
    message: `${units} units required at ${hosp.area}. AI priority score: ${priorityResult.priorityScore}%.`,
    requestId: newId
  });

  // If duplicate flagged, trigger fraud alert notification
  if (fraudCheck.isSuspicious) {
    notificationService.sendNotification({
      type: 'system',
      title: '⚠️ Suspicious Duplicate Flagged',
      message: `${newId} flagged with ${fraudCheck.similarityScore}% similarity to ${fraudCheck.duplicateOfRequestId}.`,
      requestId: newId
    });
  }

  // Broadcast real-time event
  notificationService.broadcast('EMERGENCY_REQUEST_CREATED', newRequest);

  store.logAction(
    `Hospital:${hosp.name}`,
    'CREATE_EMERGENCY_REQUEST',
    `Created ${newId} for ${units} units of ${bloodGroup} (${priorityResult.priority})`
  );

  res.status(201).json({
    success: true,
    message: `Emergency request ${newId} created successfully. AI Matching active.`,
    data: newRequest
  });
});

// PATCH /api/requests/:id/status - update request status & fulfillment count
router.patch('/:id/status', (req, res) => {
  const { status, unitsFulfilled } = req.body;
  const requestId = req.params.id;

  const existing = store.getRequestById(requestId);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Request not found' });
  }

  const updates = {};
  if (status) updates.status = status;
  if (unitsFulfilled !== undefined) {
    updates.unitsFulfilled = Number(unitsFulfilled);
  } else if (status === 'FULFILLED') {
    updates.unitsFulfilled = existing.unitsRequired;
  }

  const updatedReq = store.updateRequest(requestId, updates);

  notificationService.broadcast('REQUEST_STATUS_UPDATED', {
    requestId,
    status: updatedReq.status,
    unitsFulfilled: updatedReq.unitsFulfilled
  });

  if (updatedReq.status === 'FULFILLED') {
    notificationService.sendNotification({
      type: 'match',
      title: '✅ Request Fulfilled!',
      message: `${requestId} at ${updatedReq.hospitalName} has been completely fulfilled!`,
      requestId
    });
  }

  res.json({
    success: true,
    message: `Request ${requestId} status updated to ${updatedReq.status}`,
    data: updatedReq
  });
});

// POST /api/requests/:id/notify-donor - send simulated push/SMS to specific donor
router.post('/:id/notify-donor', (req, res) => {
  const { donorId } = req.body;
  const requestId = req.params.id;

  const requestItem = store.getRequestById(requestId);
  if (!requestItem) {
    return res.status(404).json({ success: false, message: 'Request not found' });
  }

  const donor = store.getDonorById(donorId);
  if (!donor) {
    return res.status(404).json({ success: false, message: 'Donor not found' });
  }

  if (requestItem.matchedDonorsList) {
    const dItem = requestItem.matchedDonorsList.find((d) => d.donorId === donorId);
    if (dItem) dItem.status = 'Notified';
    store.updateRequest(requestId, { matchedDonorsList: requestItem.matchedDonorsList });
  }

  notificationService.sendNotification({
    type: 'match',
    title: '🩸 Emergency Alert Dispatched to Donor',
    message: `Direct SOS sent to ${donor.name} (${donor.bloodGroup}) for ${requestItem.hospitalName}.`,
    requestId
  });

  notificationService.broadcast('DONOR_NOTIFIED', {
    requestId,
    donorId,
    donorName: donor.name
  });

  res.json({
    success: true,
    message: `SMS & Push alert dispatched to ${donor.name} (${donor.phone})`,
    data: { requestId, donorId, status: 'Notified' }
  });
});

// POST /api/requests/:id/notify-all - broadcast alert to all matched donors
router.post('/:id/notify-all', (req, res) => {
  const requestId = req.params.id;
  const requestItem = store.getRequestById(requestId);
  if (!requestItem) {
    return res.status(404).json({ success: false, message: 'Request not found' });
  }

  const count = requestItem.matchedDonorsList?.length || 0;
  if (requestItem.matchedDonorsList) {
    requestItem.matchedDonorsList.forEach((d) => {
      d.status = 'Notified';
    });
    store.updateRequest(requestId, {
      status: 'ALERT_SENT',
      matchedDonorsList: requestItem.matchedDonorsList
    });
  }

  notificationService.sendNotification({
    type: 'critical',
    title: '📢 Mass SOS Broadcast Dispatched',
    message: `Alert transmitted to ${count} compatible donors in proximity to ${requestItem.hospitalName}.`,
    requestId
  });

  notificationService.broadcast('REQUEST_STATUS_UPDATED', {
    requestId,
    status: 'ALERT_SENT',
    matchedDonorsList: requestItem.matchedDonorsList
  });

  res.json({
    success: true,
    message: `Broadcasted emergency alert to ${count} compatible donors.`,
    data: { requestId, notifiedCount: count }
  });
});

export default router;
