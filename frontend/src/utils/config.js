// Centralized environment configuration
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Strips any trailing slashes or /api so API_BASE_URL is always 'https://domain.com'
export const API_BASE_URL = rawUrl.trim().replace(/\/+$/, '').replace(/\/api$/, '');

// Fully qualified API endpoint root: 'https://domain.com/api'
export const API_URL = `${API_BASE_URL}/api`;
