const getBaseUrl = () => {
  // Check if a custom VITE_API_URL is supplied via Vite environment
  if (import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  const hostname = window.location.hostname;
  
  // If hosted on Render (e.g. salesmanagementcrm-frontend.onrender.com)
  if (hostname.includes('salesmanagementcrm-frontend.onrender.com')) {
    return 'https://salesmanagementcrm-backend.onrender.com/api';
  }
  
  // Dynamic replacement for custom Render/Vercel environments with '-frontend'
  if (hostname.includes('-frontend.')) {
    return `https://${hostname.replace('-frontend.', '-backend.')}/api`;
  }
  
  // Default fallback for development
  return 'http://localhost:5000/api';
};

const BASE_URL = getBaseUrl();

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('crm_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  async get(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Something went wrong');
    }
    return res.json();
  },

  async post(endpoint, body) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Something went wrong');
    }
    return res.json();
  },

  async patch(endpoint, body) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Something went wrong');
    }
    return res.json();
  },

  async delete(endpoint, body) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Something went wrong');
    }
    return res.json();
  },
};
