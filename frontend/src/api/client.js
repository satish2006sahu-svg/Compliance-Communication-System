const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Clear token if expired or unauthorized
      if (!endpoint.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-expired'));
      }
    }

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const errorMsg = data.detail || data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  getMe: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),

  // System
  getSystemStatus: () => apiRequest('/system/status'),
  updateSystemConfig: (data) => apiRequest('/system/config', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Admin
  loadSampleSeed: () => apiRequest('/admin/load-sample-seed', {
    method: 'POST'
  }),
  scrapeUrl: (url) => apiRequest('/admin/scrape', {
    method: 'POST',
    body: JSON.stringify({ url })
  }),
  generateAnnouncement: (docId) => apiRequest(`/admin/documents/${docId}/generate-announcement`, {
    method: 'POST'
  }),
  generateFaqs: (announcementId) => apiRequest(`/admin/announcements/${announcementId}/generate-faqs`, {
    method: 'POST'
  }),
  updateAnnouncement: (announcementId, data) => apiRequest(`/admin/announcements/${announcementId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  publishAnnouncement: (announcementId) => apiRequest(`/admin/announcements/${announcementId}/publish`, {
    method: 'POST'
  }),
  listDocuments: () => apiRequest('/admin/documents'),
  getDocumentDetail: (docId) => apiRequest(`/admin/documents/${docId}`),

  // Employee
  getEmployeeDashboard: () => apiRequest('/employee/dashboard'),
  getPublishedAnnouncement: (id) => apiRequest(`/employee/announcements/${id}`),
  sendChatMessage: (query, conversationId = 'default') => apiRequest('/employee/chat', {
    method: 'POST',
    body: JSON.stringify({ query, conversation_id: conversationId })
  }),
  getChatHistory: () => apiRequest('/employee/chat/history'),
};
