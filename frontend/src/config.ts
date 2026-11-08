// Config file for centralizing API endpoints and other environments.
export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api/v1';

// Optional shared key sent as `X-API-Key`. NOTE: anything in a Vite bundle is public,
// so this only deters casual abuse of a demo backend; it is not real authentication.
const API_KEY = (import.meta.env.VITE_API_KEY as string) || '';

/** fetch() wrapper for backend calls that attaches the API key header when configured. */
export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  if (!API_KEY) return fetch(input, init);
  const headers = new Headers(init.headers);
  headers.set('X-API-Key', API_KEY);
  return fetch(input, { ...init, headers });
}
