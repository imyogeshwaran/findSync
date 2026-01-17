console.log('Loading API module');
// Prefer Vite env at build-time, fallback to window env, then localhost
// Prefer Vite env at build-time, fallback to window env, then proxy path
console.log('API_URL configuration:', {
  importMeta: typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL,
  windowEnv: typeof window !== 'undefined' && window.__API_URL__,
  default: 'http://localhost:3005/api'
});

const API_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof window !== 'undefined' && window.__API_URL__) ||
  'http://localhost:3005/api'
);

console.log('Using API_URL:', API_URL);
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

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    console.log('API response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (networkError) {
    console.error('Network error:', networkError);
    if (networkError.name === 'AbortError') {
      throw new Error('Request timeout. Is the backend running?');
    }
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
export const syncUserToBackend = async (firebaseUser, opts = {}) => {
  try {
    // Allow callers to explicitly provide name/mobile (signup flows) when firebase user object
    // may not yet contain updated profile fields. opts = { name, mobile }
  // Do not send a placeholder name ('User') to the backend — send null/undefined if missing.
  const name = opts.name ?? firebaseUser.displayName ?? firebaseUser.name ?? null;
  const mobile = opts.mobile ?? firebaseUser.phoneNumber ?? firebaseUser.mobile ?? null;

    const response = await apiRequest('/users/sync', {
      method: 'POST',
      body: JSON.stringify({
        firebase_uid: firebaseUser.uid,
        // Only include name/mobile if present (null will be sent as null which backend treats as missing)
        name,
        email: firebaseUser.email,
        mobile,
      }),
    });

    // Store the JWT token if backend provided one
    if (response.token) {
      setAuthToken(response.token);
    }

    // Return the backend user object merged into the firebase user so UI gets authoritative fields
    return response.user ? { ...firebaseUser, ...response.user } : firebaseUser;
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
  
  const token = getAuthToken();
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Check if itemData is FormData (for file uploads)
  const isFormData = itemData instanceof FormData;
  
  if (!isFormData) {
    // Validate required fields for non-FormData
    const requiredFields = ['item_name', 'location', 'phone'];
    const missingFields = requiredFields.filter(field => !itemData[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      throw new Error(`Required fields missing: ${missingFields.join(', ')}`);
    }
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    console.log('Making API request to create item');

    response = await fetch(`${API_URL}/items/missing`, {
      method: 'POST',
      headers,
      body: isFormData ? itemData : JSON.stringify(itemData),
    });

    console.log('API response:', {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (networkError) {
    console.error('Network error:', networkError);
    throw new Error('Cannot reach API. Is the backend running?');
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : null;

  if (!response.ok) {
    const message = (data && (data.error || data.message)) || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }
  
  // Transform response to match frontend expectations
  if (data.item) {
    return {
      ...data,
      item: {
        id: data.item.item_id,
        name: data.item.item_name,
        description: data.item.description,
        location: data.item.location,
        image_url: data.item.image_url,
        category: data.item.category,
        status: data.item.status,
        post_type: data.item.post_type
      }
    };
  }
  return data;
};

export const getAllMissingItems = async () => {
  console.log('getAllMissingItems called');
  try {
    const response = await apiRequest('/items/missing');
    console.log('getAllMissingItems response:', response);
    // Transform the response to match frontend expectations
    if (response.items) {
      return {
        items: response.items.map(item => ({
          id: item.id,
          name: item.title,
          description: item.description,
          location: item.location,
          created_at: item.date,
          image_url: item.image,
          owner_name: item.ownerName,
          phone: item.ownerPhone,
          category: item.category,
          status: item.status,
          post_type: item.post_type
        }))
      };
    }
    return response;
  } catch (error) {
    console.error('getAllMissingItems error:', error);
    throw error;
  }
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

// Contact / Notification APIs
export const createContact = async (payload) => {
  return apiRequest('/contacts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getNotifications = async () => {
  return apiRequest('/contacts');
};

export const getNotificationCount = async () => {
  return apiRequest('/contacts/count');
};

export const getUserConversations = async () => {
  return apiRequest('/contacts/conversations');
};

export const getConversationHistory = async (otherUserId, itemId) => {
  return apiRequest(`/contacts/history?otherUserId=${otherUserId}&itemId=${itemId}`);
};

// Fix post types endpoint
export const fixPostTypes = async () => {
  return apiRequest('/items/fix-post-types');
};
