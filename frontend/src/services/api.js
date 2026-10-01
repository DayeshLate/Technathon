const API_BASE = '/api';

/**
 * Universal fetch wrapper with error handling and fallback support
 */
async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `API Error: ${res.statusText}`);
    }
    return data;
  } catch (err) {
    console.warn(`[API] Call to ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const api = {
  // --- Health & Database ---
  checkHealth: () => request('/health'),
  getDatabaseStatus: () => request('/database/status'),
  getDatabaseTables: () => request('/database/tables'),
  seedDatabase: () => request('/database/seed', { method: 'POST' }),

  // --- Hospitals ---
  getHospitals: () => request('/hospitals'),
  getHospital: (id) => request(`/hospitals/${id}`),

  // --- Blood Banks & Inventory ---
  getBloodBanks: () => request('/blood-banks'),
  getInventoryAggregates: () => request('/blood-banks/inventory/aggregates'),
  getBloodBank: (id) => request(`/blood-banks/${id}`),
  updateInventory: (bankId, bloodGroup, unitsDiff, isReserved = false) =>
    request(`/blood-banks/${bankId}/inventory`, {
      method: 'PATCH',
      body: JSON.stringify({ bloodGroup, unitsDiff, isReserved })
    }),
  reserveUnits: (bankId, bloodGroup, units, requestId) =>
    request(`/blood-banks/${bankId}/reserve`, {
      method: 'POST',
      body: JSON.stringify({ bloodGroup, units, requestId })
    }),

  // --- Donors ---
  getDonors: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/donors${qs ? `?${qs}` : ''}`);
  },
  getDonor: (id) => request(`/donors/${id}`),
  toggleDonorAvailability: (id, available) =>
    request(`/donors/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ available })
    }),
  respondAsDonor: (donorId, requestId, action) =>
    request(`/donors/${donorId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ requestId, action })
    }),

  // --- Emergency Requests ---
  getRequests: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/requests${qs ? `?${qs}` : ''}`);
  },
  getRequest: (id) => request(`/requests/${id}`),
  createEmergencyRequest: (formData) =>
    request('/requests', {
      method: 'POST',
      body: JSON.stringify(formData)
    }),
  updateRequestStatus: (id, status, unitsFulfilled) =>
    request(`/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, unitsFulfilled })
    }),
  notifyDonor: (requestId, donorId) =>
    request(`/requests/${requestId}/notify-donor`, {
      method: 'POST',
      body: JSON.stringify({ donorId })
    }),
  notifyAllDonors: (requestId) =>
    request(`/requests/${requestId}/notify-all`, {
      method: 'POST'
    }),

  // --- Smart Matching & AI ---
  findDonors: (params) =>
    request('/matching/find-donors', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  findNearbyBanks: (params) =>
    request('/matching/nearby-banks', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  getCompatibility: () => request('/matching/compatibility'),
  checkDuplicateFraud: (reqData) =>
    request('/fraud/check', {
      method: 'POST',
      body: JSON.stringify(reqData)
    }),

  // --- NGOs ---
  getNgos: () => request('/ngos'),
  registerForCamp: (ngoId, data) =>
    request(`/ngos/${ngoId}/register-donor`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // --- Analytics ---
  getAnalyticsOverview: () => request('/analytics/overview'),
  getAiInsights: () => request('/analytics/insights'),
  getHistoricalAnalytics: () => request('/analytics/historical'),

  // --- Notifications ---
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) =>
    request(`/notifications/${id}/read`, {
      method: 'PATCH'
    }),
  markAllNotificationsRead: () =>
    request('/notifications/read-all', {
      method: 'POST'
    }),

  // --- Guided Hackathon Demo ---
  getDemoSteps: () => request('/demo/steps'),
  executeDemoStep: (stepNumber) =>
    request(`/demo/execute/${stepNumber}`, {
      method: 'POST'
    }),
  resetDemo: () =>
    request('/demo/reset', {
      method: 'POST'
    }),

  // --- Real-Time Server-Sent Events (SSE) ---
  subscribeToEvents: (onMessage, onError) => {
    let eventSource;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (onMessage) onMessage(payload);
        } catch (err) {
          console.error('SSE JSON parse error:', err);
        }
      };
      eventSource.onerror = (err) => {
        if (onError) onError(err);
      };
    } catch (e) {
      console.warn('Could not initialize EventSource:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }
};

export default api;
