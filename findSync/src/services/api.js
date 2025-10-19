const API_URL = 'http://localhost:5000/api';

// Store token in localStorage
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

// Get token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// API request helper with authentication
const apiRequest = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
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
  return apiRequest('/items/missing', {
    method: 'POST',
    body: JSON.stringify(itemData),
  });
};

export const getAllMissingItems = async () => {
  return apiRequest('/items/missing');
};

export const getUserMissingItems = async () => {
  return apiRequest('/items/my-items');
};

export const getMissingItemById = async (id) => {
  return apiRequest(`/items/missing/${id}`);
};

export const updateMissingItem = async (id, itemData) => {
  return apiRequest(`/items/missing/${id}`, {
    method: 'PUT',
    body: JSON.stringify(itemData),
  });
};

export const deleteMissingItem = async (id) => {
  return apiRequest(`/items/missing/${id}`, {
    method: 'DELETE',
  });
};
