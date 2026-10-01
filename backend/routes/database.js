import express from 'express';
import { query, testConnection } from '../db/connection.js';
import { seedDatabase } from '../db/seedDb.js';
import store from '../data/store.js';

const router = express.Router();

// GET /api/database/status - Real-time MySQL connection & statistics
router.get('/status', async (req, res) => {
  try {
    const connStatus = await testConnection();

    if (!connStatus.connected) {
      return res.status(503).json({
        success: false,
        connected: false,
        message: 'Cannot connect to MySQL database',
        error: connStatus.error,
        config: {
          host: process.env.DB_HOST || 'localhost',
          database: process.env.DB_NAME || 'BloodBank',
          user: process.env.DB_USER || 'root'
        }
      });
    }

    // Fetch table stats
    const [hospitalsCount] = await query('SELECT COUNT(*) as count FROM hospitals');
    const [bloodBanksCount] = await query('SELECT COUNT(*) as count FROM blood_banks');
    const [inventoryCount] = await query('SELECT COUNT(*) as count FROM blood_bank_inventory');
    const [donorsCount] = await query('SELECT COUNT(*) as count FROM donors');
    const [requestsCount] = await query('SELECT COUNT(*) as count FROM emergency_requests');
    const [ngosCount] = await query('SELECT COUNT(*) as count FROM ngos');
    const [notifsCount] = await query('SELECT COUNT(*) as count FROM notifications');
    const [auditCount] = await query('SELECT COUNT(*) as count FROM audit_logs');

    // Total blood units across inventory
    const [unitsSum] = await query('SELECT SUM(available_units) as totalAvailable, SUM(reserved_units) as totalReserved FROM blood_bank_inventory');

    res.json({
      success: true,
      connected: true,
      database: connStatus.activeDatabase,
      engine: 'MySQL 8.0.43 (Community Server)',
      host: connStatus.host,
      user: connStatus.user,
      tables: {
        hospitals: hospitalsCount.count,
        blood_banks: bloodBanksCount.count,
        blood_bank_inventory: inventoryCount.count,
        donors: donorsCount.count,
        emergency_requests: requestsCount.count,
        ngos: ngosCount.count,
        notifications: notifsCount.count,
        audit_logs: auditCount.count
      },
      bloodStock: {
        totalAvailableUnits: Number(unitsSum.totalAvailable) || 0,
        totalReservedUnits: Number(unitsSum.totalReserved) || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to inspect MySQL database status',
      error: err.message
    });
  }
});

// POST /api/database/seed - Force re-seed database
router.post('/seed', async (req, res) => {
  try {
    await seedDatabase();
    await store.syncFromMySQL();
    res.json({
      success: true,
      message: 'BloodBank MySQL database successfully seeded and reloaded.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to re-seed database',
      error: err.message
    });
  }
});

// GET /api/database/tables - Inspect table names and row counts
router.get('/tables', async (req, res) => {
  try {
    const tables = await query('SHOW TABLES');
    res.json({
      success: true,
      database: process.env.DB_NAME || 'BloodBank',
      tables: tables.map((t) => Object.values(t)[0])
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
