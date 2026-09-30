import express from 'express';
import store from '../data/store.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// GET /api/notifications - get all notifications
router.get('/', (req, res) => {
  const notifications = store.getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;
  res.json({
    success: true,
    unreadCount,
    count: notifications.length,
    data: notifications
  });
});

// POST /api/notifications - create custom notification
router.post('/', (req, res) => {
  const { type, title, message, requestId } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'title and message are required' });
  }

  const notif = notificationService.sendNotification({ type, title, message, requestId });
  res.status(201).json({ success: true, data: notif });
});

// PATCH /api/notifications/:id/read - mark single notification as read
router.patch('/:id/read', (req, res) => {
  const notif = store.markNotificationRead(req.params.id);
  if (!notif) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  res.json({ success: true, data: notif });
});

// POST /api/notifications/read-all - mark all as read
router.post('/read-all', (req, res) => {
  store.markAllNotificationsRead();
  res.json({ success: true, message: 'All notifications marked as read' });
});

export default router;
