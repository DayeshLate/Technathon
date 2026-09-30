import express from 'express';
import store from '../data/store.js';
import { findMatchingDonors, findNearbyBloodBanks, calculateDonorMatch } from '../services/matchingService.js';

const router = express.Router();

// GET /api/matching/compatibility - get blood group compatibility matrix
router.get('/compatibility', (req, res) => {
  res.json({
    success: true,
    data: {
      bloodGroups: store.data.bloodGroups,
      compatibility: store.data.compatibility
    }
  });
});

// POST /api/matching/find-donors - on-demand donor matching query
router.post('/find-donors', (req, res) => {
  const { bloodGroup, urgency, latitude, longitude, limit } = req.body;

  if (!bloodGroup) {
    return res.status(400).json({ success: false, message: 'bloodGroup is required' });
  }

  const lat = Number(latitude) || 19.0514;
  const lng = Number(longitude) || 72.8295;

  const matched = findMatchingDonors({
    bloodGroup,
    urgency: urgency || 'Critical',
    latitude: lat,
    longitude: lng,
    limit: limit ? Number(limit) : 10
  });

  res.json({
    success: true,
    count: matched.length,
    data: matched
  });
});

// POST /api/matching/nearby-banks - on-demand nearby blood banks with stock
router.post('/nearby-banks', (req, res) => {
  const { bloodGroup, latitude, longitude, minUnits } = req.body;

  if (!bloodGroup) {
    return res.status(400).json({ success: false, message: 'bloodGroup is required' });
  }

  const lat = Number(latitude) || 19.0514;
  const lng = Number(longitude) || 72.8295;

  const banks = findNearbyBloodBanks({
    bloodGroup,
    latitude: lat,
    longitude: lng,
    minUnits: minUnits ? Number(minUnits) : 1
  });

  res.json({
    success: true,
    count: banks.length,
    data: banks
  });
});

export default router;
