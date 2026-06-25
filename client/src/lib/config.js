/**
 * Client runtime configuration, sourced from Vite env vars (VITE_*).
 * In dev, requests are proxied to the backend via vite.config.js, so the
 * defaults below work without a .env file.
 */
export const config = Object.freeze({
  apiBaseUrl: import.meta.env.VITE_API_URL || '/api/v1',
  socketUrl: import.meta.env.VITE_SOCKET_URL || '',
  appName: 'TaskControl',
});

export default config;
