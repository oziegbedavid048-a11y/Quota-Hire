/**
 * Quota Hire — Mobile API Service
 * Features:
 *   - Network detection via NetInfo before every request (instant error on no-internet)
 *   - 25-second timeout for auth requests, 15-second for everything else
 *   - Auto-refresh of expired JWT access token on 401
 *   - Distinguishes network errors (no internet) from server errors
 *   - pingBackend() — lightweight keep-alive to prevent Render cold starts
 */

import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

export const API_BASE = 'https://quotahire-backend.onrender.com/api';

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
/**
 * Returns true if the device has internet access.
 * This is checked BEFORE every API call so we fail instantly
 * instead of waiting 15+ seconds for a fetch timeout.
 */
export const isOnline = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return true; // Fail open — let the fetch attempt proceed if NetInfo errors
  }
};

// ─── API Error Class ──────────────────────────────────────────────────────────
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

// ─── Silent token refresh ─────────────────────────────────────────────────────
const tryRefresh = async (): Promise<string | null> => {
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
      return data.access;
    }
  } catch {}
  return null;
};

// ─── Keep-Alive Ping ──────────────────────────────────────────────────────────
/**
 * Silently pings the backend to prevent Render dyno from going idle.
 * Called every 10 minutes by the useKeepAlive hook while app is in foreground.
 * Uses a short 5s timeout — we don't care about the response, just keeping warm.
 */
export const pingBackend = async (): Promise<void> => {
  const online = await isOnline();
  if (!online) return; // Don't ping on no-internet

  const token = await getAccessToken();
  if (!token) return; // Only ping if user is logged in

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(`${API_BASE}/auth/me/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
    });
  } catch {
    // Silently ignore — this is just a warm-up ping
  } finally {
    clearTimeout(timeout);
  }
};

// ─── Main fetch wrapper ───────────────────────────────────────────────────────
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  // ── Step 1: Check network BEFORE attempting the request ───────────────────
  // This gives an instant error message instead of waiting 15+ seconds.
  const online = await isOnline();
  if (!online) {
    throw new ApiError(
      'No internet connection. Please check your WiFi or mobile data and try again.',
      0,
      true // isNetworkError = true
    );
  }

  let token = await getAccessToken();

  const buildHeaders = (tk: string | null) => {
    const h: Record<string, string> = { ...(options.headers as Record<string, string>) };
    if (!(options.body instanceof FormData)) h['Content-Type'] = 'application/json';
    if (tk) h['Authorization'] = `Bearer ${tk}`;
    return h;
  };

  // Auth endpoints get a longer timeout (25s) to handle Render cold starts.
  // All other requests use 15s (down from 12s) for better reliability.
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
    // Any other fetch error (network dropped mid-request, DNS failure, etc.)
    throw new ApiError(
      'Could not reach the server. Please check your internet connection.',
      0,
      true // isNetworkError = true
    );
  } finally {
    clearTimeout(timeout);
  }

  // ── Auto-refresh on 401 ───────────────────────────────────────────────────
  if (response.status === 401) {
    const newToken = await tryRefresh();
    if (newToken) {
      // Re-check network before retry
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
      } catch {
        clearTimeout(timeout2);
      }
    }
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const err = await response.json();
      message = err?.detail || err?.error || err?.message || message;
    } catch {}
    throw new ApiError(message, response.status);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
};
