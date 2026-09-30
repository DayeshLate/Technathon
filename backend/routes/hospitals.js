import express from 'express';
import store from '../data/store.js';

const router = express.Router();

// GET /api/hospitals - list all hospitals
router.get('/', (req, res) => {
  const hospitals = store.getHospitals();
  res.json({ success: true, count: hospitals.length, data: hospitals });
});

// GET /api/hospitals/:id - get single hospital with active emergency requests
router.get('/:id', (req, res) => {
  const hospital = store.getHospitalById(req.params.id);
  if (!hospital) {
    return res.status(404).json({ success: false, message: 'Hospital not found' });
  }

  const activeRequests = store.getRequests().filter(
    (r) => r.hospitalId === hospital.id && r.status !== 'FULFILLED' && r.status !== 'CANCELLED'
  );

  res.json({
    success: true,
    data: {
      ...hospital,
      activeEmergencyRequests: activeRequests
    }
  });
});

export default router;
