import express from 'express';
import store from '../data/store.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// GET /api/donors - list donors with optional query filters
router.get('/', (req, res) => {
  const { bloodGroup, available, eligibilityStatus } = req.query;
  const donors = store.getDonors({ bloodGroup, available, eligibilityStatus });
  res.json({ success: true, count: donors.length, data: donors });
});

// GET /api/donors/:id - single donor
router.get('/:id', (req, res) => {
  const donor = store.getDonorById(req.params.id);
  if (!donor) {
    return res.status(404).json({ success: false, message: 'Donor not found' });
  }

  // Get active alerts relevant to this donor
  const activeRequests = store.getRequests().filter(
    (r) =>
      r.status !== 'FULFILLED' &&
      r.status !== 'CANCELLED' &&
      r.matchedDonorsList?.some((d) => d.donorId === donor.id)
  );

  res.json({
    success: true,
    data: {
      ...donor,
      activeAlerts: activeRequests
    }
  });
});

// PATCH /api/donors/:id/availability - toggle online / offline availability
router.patch('/:id/availability', (req, res) => {
  const { available } = req.body;
  if (available === undefined) {
    return res.status(400).json({ success: false, message: 'available (boolean) is required' });
  }

  const updatedDonor = store.updateDonor(req.params.id, { available: Boolean(available) });
  if (!updatedDonor) {
    return res.status(404).json({ success: false, message: 'Donor not found' });
  }

  notificationService.broadcast('DONOR_AVAILABILITY_CHANGED', {
    donorId: updatedDonor.id,
    name: updatedDonor.name,
    available: updatedDonor.available
  });

  res.json({
    success: true,
    message: `Donor availability updated to ${updatedDonor.available ? 'Available' : 'Busy'}`,
    data: updatedDonor
  });
});

// POST /api/donors/:id/respond - respond to an emergency request (ACCEPT / DECLINE)
router.post('/:id/respond', (req, res) => {
  const { requestId, action } = req.body; // action: 'ACCEPT' | 'DECLINE'
  const donorId = req.params.id;

  if (!requestId || !action) {
    return res.status(400).json({ success: false, message: 'requestId and action are required' });
  }

  const donor = store.getDonorById(donorId);
  const requestItem = store.getRequestById(requestId);

  if (!donor) {
    return res.status(404).json({ success: false, message: 'Donor not found' });
  }
  if (!requestItem) {
    return res.status(404).json({ success: false, message: 'Request not found' });
  }

  const isAccepted = action.toUpperCase() === 'ACCEPT';

  // Update request donor list
  if (requestItem.matchedDonorsList) {
    const donorEntry = requestItem.matchedDonorsList.find((d) => d.donorId === donorId);
    if (donorEntry) {
      donorEntry.status = isAccepted ? 'Accepted' : 'Declined';
    } else {
      requestItem.matchedDonorsList.push({
        donorId: donor.id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        distance: 2.1,
        availability: 'Available Now',
        matchScore: 95,
        status: isAccepted ? 'Accepted' : 'Declined'
      });
    }
  }

  // Update status if accepted
  let newStatus = requestItem.status;
  let newFulfilled = requestItem.unitsFulfilled;

  if (isAccepted) {
    newStatus = 'ALERT_SENT';
    newFulfilled = Math.min(requestItem.unitsRequired, (requestItem.unitsFulfilled || 0) + 1);
    if (newFulfilled >= requestItem.unitsRequired) {
      newStatus = 'FULFILLED';
    } else if (newFulfilled > 0) {
      newStatus = 'PARTIALLY_FULFILLED';
    }
  }

  store.updateRequest(requestId, {
    status: newStatus,
    unitsFulfilled: newFulfilled,
    matchedDonorsList: requestItem.matchedDonorsList
  });

  // Log action
  store.logAction(
    `Donor:${donor.name}`,
    `EMERGENCY_RESPONSE_${action.toUpperCase()}`,
    `Donor ${donor.name} (${donor.bloodGroup}) ${isAccepted ? 'ACCEPTED' : 'DECLINED'} request ${requestId}`
  );

  // Send notification to hospital & system
  notificationService.sendNotification({
    type: isAccepted ? 'match' : 'info',
    title: isAccepted ? '🩸 Donor Accepted Emergency Alert!' : '⚠️ Donor Declined Alert',
    message: `${donor.name} (${donor.bloodGroup}) has ${isAccepted ? 'accepted' : 'declined'} request ${requestId} at ${requestItem.hospitalName}.`,
    requestId
  });

  // Real-time broadcast
  notificationService.broadcast('DONOR_RESPONSE', {
    donorId: donor.id,
    donorName: donor.name,
    bloodGroup: donor.bloodGroup,
    requestId,
    action: isAccepted ? 'ACCEPTED' : 'DECLINED',
    newStatus,
    unitsFulfilled: newFulfilled
  });

  res.json({
    success: true,
    message: isAccepted
      ? `Request accepted! You are registered for direct transport coordination.`
      : `Request declined.`,
    data: {
      donorId,
      requestId,
      status: isAccepted ? 'Accepted' : 'Declined',
      requestStatus: newStatus
    }
  });
});

export default router;
