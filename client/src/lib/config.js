/**
 * Client runtime configuration, sourced from Vite env vars (VITE_*).
 * In dev, requests are proxied to the backend via vite.config.js, so the
 * defaults below work without a .env file.
 */
const apiBaseUrl = import.meta.env.VITE_API_URL || '/api/v1';
const socketUrl = import.meta.env.VITE_SOCKET_URL || '';

// Origin that serves /uploads. In the split-domain deploy the API lives on its
// own host (e.g. api.taskat.site), so the relative "/uploads/.." paths the API
// returns must be resolved against that origin — not the SPA's. Same-origin
// deploys leave both VITE_* vars empty, so this stays '' and the browser
// resolves upload paths against the current page as before.
const assetBaseUrl =
  socketUrl || (apiBaseUrl.startsWith('http') ? new URL(apiBaseUrl).origin : '');

export const config = Object.freeze({
  apiBaseUrl,
  socketUrl,
  assetBaseUrl,
  appName: 'TaskControl',
});

/**
 * Resolves a server-provided asset path (e.g. "/uploads/abc.png") to an
 * absolute URL against the API origin. Absolute URLs and falsy values pass
 * through untouched.
 */
export const resolveAssetUrl = (pathOrUrl) => {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${assetBaseUrl}${pathOrUrl}`;
};

export default config;
