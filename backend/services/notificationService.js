import store from '../data/store.js';

class NotificationService {
  constructor() {
    this.sseClients = new Set();
  }

  /**
   * Registers a new SSE client connection
   */
  addClient(res) {
    this.sseClients.add(res);

    // Initial greeting event
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Red Relay Real-Time Feed Active', timestamp: new Date().toISOString() })}\n\n`);

    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  /**
   * Broadcasts an event to all connected SSE clients
   */
  broadcast(eventType, payload) {
    const message = {
      type: eventType,
      data: payload,
      timestamp: new Date().toISOString()
    };
    const sseData = `data: ${JSON.stringify(message)}\n\n`;

    for (const client of this.sseClients) {
      try {
        client.write(sseData);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }

  /**
   * Dispatches a notification, stores it, and broadcasts it in real-time
   */
  sendNotification({ type = 'info', title, message, requestId = null }) {
    const notif = store.addNotification({
      type,
      title,
      message,
      requestId
    });

    this.broadcast('NEW_NOTIFICATION', notif);
    return notif;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
