// Config file for centralizing API endpoints and other environments.
export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api/v1';
