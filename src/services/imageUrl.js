// Image URL Configuration
const isDev = import.meta.env.DEV;
const BASE_HOST = isDev ? 'http://localhost:5000' : (process.env.VITE_API_HOST || 'http://127.0.0.1:5000');

export const getImageUrl = (relativePath) => {
  if (!relativePath) return null;
  
  // If it's already a full URL, return as is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // Otherwise construct full URL from backend host
  return `${BASE_HOST}${relativePath}`;
};