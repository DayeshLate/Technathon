import express from 'express';
import store from '../data/store.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// GET /api/ngos - list NGOs and donation drives
router.get('/', (req, res) => {
  const ngos = store.getNgos();
  res.json({ success: true, count: ngos.length, data: ngos });
});

// GET /api/ngos/:id - single NGO
router.get('/:id', (req, res) => {
  const ngo = store.getNgoById(req.params.id);
  if (!ngo) {
    return res.status(404).json({ success: false, message: 'NGO not found' });
  }
  res.json({ success: true, data: ngo });
});

// POST /api/ngos/:id/register-donor - register donor for upcoming blood camp
router.post('/:id/register-donor', (req, res) => {
  const { donorId, donorName, bloodGroup, campDate } = req.body;

  if (!donorName || !bloodGroup) {
    return res.status(400).json({ success: false, message: 'donorName and bloodGroup are required' });
  }

  const result = store.registerDonorToNgo(req.params.id, {
    donorId: donorId || `D-${Date.now()}`,
    donorName,
    bloodGroup,
    campDate
  });

  if (!result) {
    return res.status(404).json({ success: false, message: 'NGO not found' });
  }

  notificationService.sendNotification({
    type: 'match',
    title: '🤝 Blood Donation Camp Registration',
    message: `${donorName} registered for blood drive at ${result.ngo.name}.`
  });

  res.status(201).json({
    success: true,
    message: `Registered successfully for ${result.ngo.name} blood camp!`,
    data: result.registration
  });
});

export default router;
