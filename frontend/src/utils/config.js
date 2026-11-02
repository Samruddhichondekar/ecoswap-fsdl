// Centralized environment configuration
const resolveApiUrl = () => {
    // 1. Explicit environment variable takes precedence
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // 2. In browser on localhost or loopback, connect to local backend (port 5050)
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:5050';
    }
    // 3. Fallback to production Render cloud service
    return 'https://ecoswap-fsdl.onrender.com';
};

const rawUrl = resolveApiUrl();

// Strips any trailing slashes or /api so API_BASE_URL is always 'https://domain.com'
export const API_BASE_URL = rawUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');

// Fully qualified API endpoint root: 'https://domain.com/api'
export const API_URL = `${API_BASE_URL}/api`;
