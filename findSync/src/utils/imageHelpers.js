// Helper function to construct image URLs
export const getImageUrl = (relativeUrl) => {
    if (!relativeUrl) return null;
    
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
    }
    
    // In development, return absolute backend URL to avoid proxy issues
    const isDev = import.meta.env.DEV;
    const normalizedPath = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
    if (isDev) {
        // Backend runs on 3000 in development
        return `http://localhost:3000${normalizedPath}`;
    }
    return normalizedPath;
};