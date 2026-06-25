import axios from 'axios';

import { config } from '@/lib/config';
import { useAuthStore } from '@/store/authStore';

/**
 * Pre-configured Axios instance.
 *
 * - `withCredentials` sends the httpOnly refresh-token cookie.
 * - A request interceptor attaches the in-memory access token.
 * - A response interceptor transparently refreshes an expired access token
 *   once, then retries the original request (wired fully in the auth step).
 *
 * The access token is held in memory (not localStorage) to reduce XSS exposure.
 */
const axiosClient = axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken = null;
let onUnauthorized = null;

/** Set/clear the access token used for Authorization headers. */
export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

/** Register a callback invoked when refreshing fails (e.g. to force logout). */
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

axiosClient.interceptors.request.use((request) => {
  if (accessToken) {
    request.headers.Authorization = `Bearer ${accessToken}`;
  }
  // Scope every request to the active workspace (read fresh from the store).
  const workspaceId = useAuthStore.getState().activeWorkspaceId;
  if (workspaceId && !request.headers['x-workspace-id']) {
    request.headers['x-workspace-id'] = workspaceId;
  }
  return request;
});

// --- Refresh-token handling -------------------------------------------------
let isRefreshing = false;
let pendingQueue = [];

const resolveQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  pendingQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Only attempt a refresh for 401s that aren't from the auth endpoints
    // themselves and haven't already been retried.
    const isAuthRoute = original?.url?.includes('/auth/');
    if (status === 401 && !original?._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Queue requests while a refresh is in-flight.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return axiosClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axiosClient.post('/auth/refresh');
        const newToken = data?.data?.accessToken;
        setAccessToken(newToken);
        resolveQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(original);
      } catch (refreshError) {
        resolveQueue(refreshError, null);
        setAccessToken(null);
        onUnauthorized?.();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/** Extracts a human-readable message from an Axios error. */
export const getErrorMessage = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message || error?.message || fallback;

export default axiosClient;
