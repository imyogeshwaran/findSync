// Prefer Vite env at build-time, fallback to window env, then localhost
// Prefer Vite env at build-time, fallback to window env, then proxy path
const API_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof window !== 'undefined' && window.__API_URL__) ||
  '/api'
);
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

  let response;
  try {
    console.log('Making API request:', {
      url: `${API_URL}${url}`,
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.parse(options.body) : undefined
    });

    response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
    });

    console.log('API response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (networkError) {
    console.error('Network error:', networkError);
    // Surface concise error for offline/dev without backend
    throw new Error('Cannot reach API. Is the backend running?');
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : null;

  if (!response.ok) {
    const message = (data && (data.error || data.message)) || `${response.status} ${response.statusText}`;
    throw new Error(message);
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
  console.log('Creating missing item with data:', itemData);
  
  // Validate required fields before making request
  const requiredFields = ['item_name', 'location', 'phone'];
  const missingFields = requiredFields.filter(field => !itemData[field]);
  
  if (missingFields.length > 0) {
    console.error('Missing required fields:', missingFields);
    throw new Error(`Required fields missing: ${missingFields.join(', ')}`);
  }

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

export const getAllMissingItems = async () => {
  const response = await apiRequest('/items/missing');
  // Transform the response to match frontend expectations
  if (response.items) {
    return {
      items: response.items.map(item => ({
        id: item.item_id,
        name: item.item_name,
        description: item.description,
        location: item.location,
        created_at: item.posted_at,
        image_url: item.image_url,
        owner_name: item.owner_name,
        phone: item.owner_phone,
        category: item.category,
        status: item.status,
        post_type: item.post_type
      }))
    };
  }
  return response;
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
