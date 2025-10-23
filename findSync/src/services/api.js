// API URL Configuration
// Use environment variable when available, otherwise default to the backend server used by project
const BASE_HOST = (typeof process !== 'undefined' && process.env && process.env.VITE_API_HOST) ? process.env.VITE_API_HOST : 'http://127.0.0.1:5000';
const API_URL = `${BASE_HOST}/api`;

// Auth Token Management
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const getAuthToken = () => localStorage.getItem('authToken');

// API Request Helper
const apiRequest = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      mode: 'cors'
    });

    if (!response.ok) {
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json().catch(() => ({})) : null;
      throw new Error(data?.error || data?.message || `${response.status} ${response.statusText}`);
    }

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error('Network Error:', error);
      throw new Error(`Cannot reach API server at ${BASE_HOST}. Please ensure the backend server is running.`);
    }
    console.error('API Error:', error);
    throw error;
  }
};

// User API calls
export const syncUserToBackend = async (firebaseUser) => {
  try {
    const response = await apiRequest('/users/sync', {
      method: 'POST',
      body: JSON.stringify({
        firebase_uid: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email,
      }),
    });

    // Store the JWT token
    if (response.token) {
      setAuthToken(response.token);
    }

    return response;
  } catch (error) {
    console.error('Error syncing user:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  return apiRequest('/users/profile');
};

// Item API calls
export const createMissingItem = async (itemData) => {
  const response = await apiRequest('/items/missing', {
    method: 'POST',
    body: JSON.stringify(itemData),
  });
  
  // Transform response to match frontend expectations
  if (response.item) {
    return {
      ...response,
      item: {
        id: response.item.item_id,
        name: response.item.item_name,
        description: response.item.description,
        location: response.item.location,
        image_url: response.item.image_url,
        category: response.item.category,
        status: response.item.status,
        post_type: response.item.post_type
      }
    };
  }
  return response;
};

// Items API Endpoints
export const getAllItems = async (type = null, status = 'open') => {
  // Using the /items/missing endpoint as it's the correct endpoint in our backend
  return apiRequest('/items/missing');
};

export const getItemById = async (id) => {
  return apiRequest(`/items/${id}`);
};

export const createItem = async (formData) => {
  const token = getAuthToken();
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/items/missing`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || data?.message || `${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const updateItemStatus = async (itemId, status) => {
  return apiRequest(`/items/${itemId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
};

// Backwards-compatible aliases for older frontend imports
export const getAllMissingItems = async () => {
  return apiRequest('/items/missing');
};

export const getMissingItemById = async (id) => {
  return getItemById(id);
};

export const getUserMissingItems = async () => {
  // If there is an authenticated endpoint for user's items, call it; otherwise fall back to filtering by user via API
  try {
    return apiRequest('/items/my-items');
  } catch (err) {
    // fallback: request items and let frontend filter if necessary
    const res = await getAllItems();
    return res;
  }
};
