import express from 'express';
import store from '../data/store.js';
import { detectDuplicateRequest } from '../services/fraudDetectionService.js';

const router = express.Router();

// GET /api/fraud/flagged - list all flagged or suspicious requests
router.get('/flagged', (req, res) => {
  const flagged = store.getRequests().filter((r) => r.isSuspicious);
  res.json({
    success: true,
    count: flagged.length,
    data: flagged
  });
});

// POST /api/fraud/check - test a request payload for duplicate patterns
router.post('/check', (req, res) => {
  const result = detectDuplicateRequest(req.body);
  res.json({
    success: true,
    data: result
  });
});

export default router;
