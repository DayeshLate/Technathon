import express from 'express';
import store from '../data/store.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// GET /api/blood-banks - list blood banks
router.get('/', (req, res) => {
  const bloodBanks = store.getBloodBanks();
  res.json({ success: true, count: bloodBanks.length, data: bloodBanks });
});

// GET /api/blood-banks/inventory/aggregates - citywide totals and shortages
router.get('/inventory/aggregates', (req, res) => {
  const aggregates = store.getInventoryAggregates();
  const criticalGroups = [];

  for (const [bg, data] of Object.entries(aggregates)) {
    if (data.available < 25) {
      criticalGroups.push({ bloodGroup: bg, available: data.available, threshold: 25 });
    }
  }

  const totalUnits = Object.values(aggregates).reduce((sum, item) => sum + item.available, 0);

  res.json({
    success: true,
    data: {
      aggregates,
      totalUnits,
      criticalGroups,
      isShortage: criticalGroups.length > 0
    }
  });
});

// GET /api/blood-banks/:id - single blood bank
router.get('/:id', (req, res) => {
  const bank = store.getBloodBankById(req.params.id);
  if (!bank) {
    return res.status(404).json({ success: false, message: 'Blood bank not found' });
  }
  res.json({ success: true, data: bank });
});

// PATCH /api/blood-banks/:id/inventory - update inventory units
router.patch('/:id/inventory', (req, res) => {
  const { bloodGroup, unitsDiff, isReserved } = req.body;

  if (!bloodGroup || unitsDiff === undefined) {
    return res.status(400).json({ success: false, message: 'bloodGroup and unitsDiff are required' });
  }

  const updatedBank = store.updateBloodBankInventory(
    req.params.id,
    bloodGroup,
    Number(unitsDiff),
    Boolean(isReserved)
  );

  if (!updatedBank) {
    return res.status(404).json({ success: false, message: 'Blood bank not found' });
  }

  // Broadcast real-time inventory update
  notificationService.broadcast('INVENTORY_UPDATED', {
    bankId: updatedBank.id,
    bankName: updatedBank.name,
    bloodGroup,
    unitsDiff,
    isReserved,
    updatedInventory: updatedBank.inventory,
    updatedReserved: updatedBank.reserved
  });

  store.logAction(
    'BloodBankCoordinator',
    'INVENTORY_UPDATE',
    `Updated ${bloodGroup} by ${unitsDiff} (isReserved: ${isReserved}) at ${updatedBank.name}`
  );

  res.json({
    success: true,
    message: `Inventory updated for ${updatedBank.name}`,
    data: updatedBank
  });
});

// POST /api/blood-banks/:id/reserve - reserve units for emergency request
router.post('/:id/reserve', (req, res) => {
  const { bloodGroup, units, requestId } = req.body;

  if (!bloodGroup || !units) {
    return res.status(400).json({ success: false, message: 'bloodGroup and units are required' });
  }

  const bank = store.getBloodBankById(req.params.id);
  if (!bank) {
    return res.status(404).json({ success: false, message: 'Blood bank not found' });
  }

  const available = bank.inventory[bloodGroup] || 0;
  if (available < Number(units)) {
    return res.status(400).json({
      success: false,
      message: `Insufficient stock at ${bank.name}. Requested: ${units}, Available: ${available}`
    });
  }

  const updatedBank = store.updateBloodBankInventory(req.params.id, bloodGroup, Number(units), true);

  if (requestId) {
    const reqItem = store.getRequestById(requestId);
    if (reqItem) {
      const newFulfilled = Math.min(reqItem.unitsRequired, reqItem.unitsFulfilled + Number(units));
      const newStatus = newFulfilled >= reqItem.unitsRequired ? 'FULFILLED' : 'PARTIALLY_FULFILLED';
      store.updateRequest(requestId, {
        unitsFulfilled: newFulfilled,
        status: newStatus
      });
      notificationService.broadcast('REQUEST_STATUS_UPDATED', {
        requestId,
        status: newStatus,
        unitsFulfilled: newFulfilled
      });
    }
  }

  notificationService.sendNotification({
    type: 'bank',
    title: '🩸 Blood Bank Units Reserved',
    message: `${units} units of ${bloodGroup} reserved at ${bank.name} for emergency transfer.`,
    requestId
  });

  res.json({
    success: true,
    message: `Successfully reserved ${units} units of ${bloodGroup}`,
    data: updatedBank
  });
});

export default router;
