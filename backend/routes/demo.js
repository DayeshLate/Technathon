import express from 'express';
import store from '../data/store.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

const DEMO_STEPS = [
  { step: 1, title: 'Step 1: Hospital Logs In', description: 'Hospital coordinator opens Red Relay dashboard and selects Hospital role.', targetRole: 'hospital' },
  { step: 2, title: 'Step 2: Emergency Request Initiation', description: 'Hospital coordinator opens Emergency Request creation dialog.', targetRole: 'hospital' },
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

// GET /api/demo/steps - list guided demo steps
router.get('/steps', (req, res) => {
  res.json({ success: true, steps: DEMO_STEPS });
});

// POST /api/demo/execute/:stepNumber - execute specific demo step
router.post('/execute/:stepNumber', (req, res) => {
  const stepNumber = Math.max(1, Math.min(12, parseInt(req.params.stepNumber, 10) || 1));
  const stepInfo = DEMO_STEPS[stepNumber - 1];
  const targetReqId = 'REQ-2026-1048';

  let resultMessage = '';

  switch (stepNumber) {
    case 1:
      resultMessage = 'Step 1: Hospital role active. Ready to initiate emergency protocol.';
      break;
    case 2:
      resultMessage = 'Step 2: Emergency Request modal triggered.';
      break;
    case 3:
      resultMessage = 'Step 3: Blood Group O-, 4 units, Critical priority entered.';
      break;
    case 4:
      store.updateRequest(targetReqId, { status: 'MATCHING' });
      resultMessage = 'Step 4: Real-time state -> SEARCHING FOR BLOOD...';
      break;
    case 5:
      store.updateRequest(targetReqId, { status: 'DONORS_IDENTIFIED' });
      resultMessage = 'Step 5: 8 compatible donors and 3 blood banks matched!';
      break;
    case 6:
      resultMessage = 'Step 6: AI Priority Engine evaluated CRITICAL urgency score: 98/100.';
      break;
    case 7:
      store.updateRequest(targetReqId, { status: 'ALERT_SENT' });
      resultMessage = 'Step 7: Push & SMS broadcast received by Donor #D104.';
      break;
    case 8:
      store.updateRequest(targetReqId, { status: 'BLOOD_BANK_CHECK' });
      resultMessage = 'Step 8: Blood Bank checked: 5 units on standby.';
      break;
    case 9:
      const req9 = store.getRequestById(targetReqId);
      if (req9?.matchedDonorsList) {
        req9.matchedDonorsList = req9.matchedDonorsList.map((d) =>
          d.donorId === 'D104' ? { ...d, status: 'Accepted' } : d
        );
      }
      store.updateRequest(targetReqId, {
        status: 'PARTIALLY_FULFILLED',
        unitsFulfilled: 1,
        matchedDonorsList: req9?.matchedDonorsList
      });
      resultMessage = 'Step 9: Donor #D104 Neha Patil ACCEPTED emergency request!';
      break;
    case 10:
      store.updateBloodBankInventory('BB5', 'O-', -3, true);
      store.updateRequest(targetReqId, {
        status: 'PARTIALLY_FULFILLED',
        unitsFulfilled: 4
      });
      resultMessage = 'Step 10: Blood Bank confirmed 3 units reserved for transport.';
      break;
    case 11:
      store.updateRequest(targetReqId, {
        status: 'FULFILLED',
        unitsFulfilled: 4
      });
      resultMessage = 'Step 11: Request FULFILLED! 4/4 Units secured in 14 minutes.';
      break;
    case 12:
      resultMessage = 'Step 12: Real-time analytics updated. Today fulfilled: 29 requests!';
      break;
  }

  notificationService.sendNotification({
    type: 'info',
    title: stepInfo.title,
    message: resultMessage,
    requestId: targetReqId
  });

  notificationService.broadcast('DEMO_STEP_EXECUTED', {
    step: stepNumber,
    stepInfo,
    message: resultMessage,
    targetReqId
  });

  res.json({
    success: true,
    step: stepNumber,
    stepInfo,
    message: resultMessage
  });
});

// POST /api/demo/reset - reset store back to initial seed data
router.post('/reset', (req, res) => {
  store.reset();
  notificationService.broadcast('DEMO_RESET', { message: 'Database reset to initial state' });
  notificationService.sendNotification({
    type: 'info',
    title: '🔄 System Reset',
    message: 'Demo state and blood database reset to pristine hackathon initial conditions.'
  });

  res.json({
    success: true,
    message: 'System state reset successfully'
  });
});

export default router;
