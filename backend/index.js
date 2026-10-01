import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import store from './data/store.js';
import notificationService from './services/notificationService.js';

import hospitalsRouter from './routes/hospitals.js';
import bloodBanksRouter from './routes/bloodBanks.js';
import donorsRouter from './routes/donors.js';
import requestsRouter from './routes/requests.js';
import matchingRouter from './routes/matching.js';
import fraudRouter from './routes/fraud.js';
import ngosRouter from './routes/ngos.js';
import analyticsRouter from './routes/analytics.js';
import notificationsRouter from './routes/notifications.js';
import demoRouter from './routes/demo.js';
import databaseRouter from './routes/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/api/events')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Real-Time Server-Sent Events (SSE) Endpoint
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  notificationService.addClient(res);
});

// Mount Routes
app.use('/api/hospitals', hospitalsRouter);
app.use('/api/blood-banks', bloodBanksRouter);
app.use('/api/donors', donorsRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/matching', matchingRouter);
app.use('/api/fraud', fraudRouter);
app.use('/api/ngos', ngosRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/demo', demoRouter);
app.use('/api/database', databaseRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    mysql: {
      connected: store.mysqlConnected,
      database: process.env.DB_NAME || 'BloodBank',
      engine: 'MySQL 8.0'
    },
    database: {
      hospitals: store.getHospitals().length,
      bloodBanks: store.getBloodBanks().length,
      donors: store.getDonors().length,
      activeRequests: store.getRequests().filter((r) => r.status !== 'FULFILLED').length,
      notifications: store.getNotifications().length
    },
    version: '1.0.0'
  });
});

// Interactive API Documentation / Directory
app.get('/api/docs', (req, res) => {
  res.json({
    platform: 'Red Relay Emergency Blood Network API',
    version: '1.0.0',
    description: 'Autonomous Real-Time Blood Matching & Dispatch Engine for Technathon 2026',
    baseUrl: `http://localhost:${PORT}/api`,
    sseRealtimeFeed: `http://localhost:${PORT}/api/events`,
    endpoints: {
      health: {
        'GET /api/health': 'Server health check and database statistics'
      },
      requests: {
        'GET /api/requests': 'List emergency requests (query: urgency, status, bloodGroup, hospitalId)',
        'GET /api/requests/:id': 'Get specific request with real-time matched donors & nearby blood banks',
        'POST /api/requests': 'Create emergency request with AI priority triage, fraud detection & auto-matching',
        'PATCH /api/requests/:id/status': 'Update request status (MATCHING, ALERT_SENT, FULFILLED, etc.)',
        'POST /api/requests/:id/notify-donor': 'Dispatch direct SMS/Push alert to a specific donor',
        'POST /api/requests/:id/notify-all': 'Broadcast emergency alert to all matched donors'
      },
      matching: {
        'GET /api/matching/compatibility': 'ABO and Rh blood group compatibility matrix',
        'POST /api/matching/find-donors': 'Run AI donor matching algorithm for custom group & coordinates',
        'POST /api/matching/nearby-banks': 'Find nearest blood banks with stock and distance calculation'
      },
      bloodBanks: {
        'GET /api/blood-banks': 'List all blood banks with live inventory breakdown',
        'GET /api/blood-banks/inventory/aggregates': 'Citywide total blood units, shortages & threshold alerts',
        'GET /api/blood-banks/:id': 'Blood bank details and contact',
        'PATCH /api/blood-banks/:id/inventory': 'Update inventory units or reserved units',
        'POST /api/blood-banks/:id/reserve': 'Reserve blood units for a specific emergency request'
      },
      donors: {
        'GET /api/donors': 'List donors (query: bloodGroup, available, eligibilityStatus)',
        'GET /api/donors/:id': 'Donor profile and active emergency alerts',
        'PATCH /api/donors/:id/availability': 'Toggle donor live availability (true/false)',
        'POST /api/donors/:id/respond': 'Accept or decline emergency request (action: ACCEPT | DECLINE)'
      },
      hospitals: {
        'GET /api/hospitals': 'List registered hospitals with coordinates and emergency demand',
        'GET /api/hospitals/:id': 'Hospital details and active emergency requests'
      },
      fraud: {
        'GET /api/fraud/flagged': 'List all requests flagged as suspicious or duplicate',
        'POST /api/fraud/check': 'Run AI duplicate detection heuristic on request payload'
      },
      ngos: {
        'GET /api/ngos': 'List NGOs and upcoming community blood donation camps',
        'GET /api/ngos/:id': 'NGO details and camp schedule',
        'POST /api/ngos/:id/register-donor': 'Register volunteer or donor for donation drive'
      },
      analytics: {
        'GET /api/analytics/overview': 'Live KPIs: active emergencies, stock, online donors, response time',
        'GET /api/analytics/insights': 'AI operational insights & shortage warnings',
        'GET /api/analytics/historical': 'Historical logs and dispatch records'
      },
      notifications: {
        'GET /api/notifications': 'List notifications with unread count',
        'POST /api/notifications': 'Create custom notification',
        'PATCH /api/notifications/:id/read': 'Mark notification as read',
        'POST /api/notifications/read-all': 'Mark all notifications as read'
      },
      demo: {
        'GET /api/demo/steps': 'List the 12-step guided hackathon walkthrough steps',
        'POST /api/demo/execute/:stepNumber': 'Execute a specific demo step and update live state',
        'POST /api/demo/reset': 'Reset database to pristine initial state'
      }
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Red Relay Blood Platform API',
    status: 'running',
    docs: '/api/docs',
    health: '/api/health'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.path} not found. Visit /api/docs for API reference.`
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🩸 RED RELAY BACKEND SERVER ONLINE`);
  console.log(`🚀 API Base URL:       http://localhost:${PORT}/api`);
  console.log(`📡 Real-Time SSE Feed: http://localhost:${PORT}/api/events`);
  console.log(`🗄️ MySQL Database:     mysql://root@localhost:3306/BloodBank`);
  console.log(`📊 DB Status Endpoint: http://localhost:${PORT}/api/database/status`);
  console.log(`📋 API Documentation:  http://localhost:${PORT}/api/docs`);
  console.log(`❤️ Health Check:       http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});

export default app;
