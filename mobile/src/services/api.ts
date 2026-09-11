/**
 * Quota Hire — Mobile API Service
 * Features:
 *   - Network detection via NetInfo before every request (instant error on no-internet)
 *   - 25-second timeout for auth requests, 15-second for everything else
 *   - Auto-refresh of expired JWT access token on 401 (single-flight)
 *   - Distinguishes network errors (no internet) from server errors
 *   - pingBackend() — lightweight keep-alive to prevent Render cold starts
 */

import { DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

export const API_BASE = 'https://quotahire-backend.onrender.com/api';

export const SESSION_EXPIRED_EVENT = 'SESSION_EXPIRED';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getAccessToken  = () => SecureStore.getItemAsync('access_token');
export const getRefreshToken = () => SecureStore.getItemAsync('refresh_token');
export const setAccessToken  = (t: string) => SecureStore.setItemAsync('access_token', t);
export const setRefreshToken = (t: string) => SecureStore.setItemAsync('refresh_token', t);
export const clearTokens     = async () => {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
};

// ─── Network Connectivity Check ───────────────────────────────────────────────
export const isOnline = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return true;
  }
};

export class ApiError extends Error {
  status: number;
  isNetworkError: boolean;
  constructor(message: string, status: number, isNetworkError = false) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
    this.isNetworkError = isNetworkError;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Rotate the access token. Concurrent callers share one request so SimpleJWT
 * blacklist-after-rotation cannot invalidate a second refresh.
 */
export const tryRefresh = async (): Promise<string | null> => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refresh = await getRefreshToken();
    if (!refresh) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.access) {
        await setAccessToken(data.access);
        if (data.refresh) await setRefreshToken(data.refresh);
        return data.access as string;
      }
    } catch {
      // network — keep existing access token
    }
    return null;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
};

function emitSessionExpired() {
  DeviceEventEmitter.emit(SESSION_EXPIRED_EVENT);
}

export const pingBackend = async (): Promise<void> => {
  const online = await isOnline();
  if (!online) return;

  const token = await getAccessToken();
  if (!token) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(`${API_BASE}/auth/me/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
  } catch {
    // warm-up only
  } finally {
    clearTimeout(timeout);
  }
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const online = await isOnline();
  if (!online) {
    throw new ApiError(
      'No internet connection. Please check your WiFi or mobile data and try again.',
      0,
      true
    );
  }

  let token = await getAccessToken();

  const buildHeaders = (tk: string | null) => {
    const h: Record<string, string> = { ...(options.headers as Record<string, string>) };
    if (!(options.body instanceof FormData)) h['Content-Type'] = 'application/json';
    if (tk) h['Authorization'] = `Bearer ${tk}`;
    return h;
  };

  const isAuthEndpoint = endpoint.startsWith('/auth/');
  const timeoutMs = isAuthEndpoint ? 25000 : 15000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: buildHeaders(token),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') {
      throw new ApiError(
        'The server is taking too long to respond. Please try again.',
        0,
        false
      );
    }
    throw new ApiError(
      'Could not reach the server. Please check your internet connection.',
      0,
      true
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) {
    const newToken = await tryRefresh();
    if (newToken) {
      const stillOnline = await isOnline();
      if (!stillOnline) {
        throw new ApiError('No internet connection. Please check your WiFi or mobile data.', 0, true);
      }
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), timeoutMs);
      try {
        const retried = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers: buildHeaders(newToken),
          signal: controller2.signal,
        });
        clearTimeout(timeout2);
        if (retried.ok) {
          const ct = retried.headers.get('content-type') || '';
          if (ct.includes('application/json')) return retried.json();
          return retried.text();
        }
        if (retried.status === 401) {
          emitSessionExpired();
          throw new ApiError('Session expired. Please log in again.', 401);
        }
      } catch (retryErr: any) {
        clearTimeout(timeout2);
        if (retryErr instanceof ApiError) throw retryErr;
      }
    } else {
      emitSessionExpired();
    }
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const err = await response.json();
      if (err && typeof err === 'object') {
        if (typeof err.detail === 'string') {
          message = err.detail;
        } else if (typeof err.error === 'string') {
          message = err.error;
        } else if (typeof err.message === 'string') {
          message = err.message;
        } else {
          // DRF validation errors: { field_name: ["error text"] }
          const entries = Object.entries(err);
          if (entries.length > 0) {
            const [field, val] = entries[0];
            const msg = Array.isArray(val) ? val[0] : typeof val === 'string' ? val : JSON.stringify(val);
            const cleanField = field.replace(/_/g, ' ');
            message = `${cleanField}: ${msg}`;
          }
        }
      }
    } catch {}
    throw new ApiError(message, response.status);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
};
