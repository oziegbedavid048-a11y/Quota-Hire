import { useState, useEffect, useCallback, useRef } from 'react';
import { DeviceEventEmitter, AppState, AppStateStatus } from 'react-native';
import { apiFetch, getAccessToken } from '../services/api';
import { cacheGet, cacheSet, CacheKeys } from '../services/app-cache';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ── Shared Module-Level Singleton Cache & Coordination ────────────────────────
// Prevents duplicate database queries across multiple hook instances
// (FloatingHeader, FabMenuSheet, NotificationsScreen, etc.)
let globalNotifications: NotificationItem[] = [];
let hasLoadedFromCache = false;
let lastFetchTimestamp = 0;
let isFetchingPromise: Promise<void> | null = null;
const activeSubscribers = new Set<(items: NotificationItem[]) => void>();

// Polling interval in ms when app is active (15 seconds — ultra light on DB)
const POLLING_INTERVAL_MS = 15000;
// Minimum throttle window between manual/auto fetches (8 seconds)
const THROTTLE_WINDOW_MS = 8000;

export function resetNotificationsMemory() {
  globalNotifications = [];
  hasLoadedFromCache = false;
  lastFetchTimestamp = 0;
  isFetchingPromise = null;
}

/**
 * Emitted when the notification poll sees an id it has not seen before,
 * which means something changed on the server that this client did not do.
 * Dashboard hooks listen for it and refetch, giving near-real-time updates
 * for other people's actions without every screen running its own poll.
 */
export const SERVER_STATE_CHANGED = 'SERVER_STATE_CHANGED';

async function doFetchNotifications(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastFetchTimestamp < THROTTLE_WINDOW_MS) {
    return;
  }
  if (isFetchingPromise) {
    return isFetchingPromise;
  }

  isFetchingPromise = (async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const data = await apiFetch('/notifications/');
      const rawNotifs = Array.isArray(data) ? data : (data?.results || []);
      const normalized: NotificationItem[] = rawNotifs.filter((n: any) => n?.id != null).map((n: any) => ({
        id: String(n.id),
        title: n.title || 'Alert',
        message: n.message || '',
        read: Boolean(n.read),
        createdAt: n.created_at || n.createdAt || new Date().toISOString(),
      }));

      lastFetchTimestamp = Date.now();

      // A notification the client has never seen means the server state
      // changed because of something that happened elsewhere — a company
      // accepted an application, a job was approved, someone applied to
      // your posting. Detected by id so that merely marking one as read
      // does not count as an arrival.
      const knownIds = new Set(globalNotifications.map(n => n.id));
      const hasNewArrivals = normalized.some(n => !knownIds.has(n.id));

      // Only notify & write storage if data has actually changed
      const hasChanged =
        normalized.length !== globalNotifications.length ||
        normalized.some((n, idx) => {
          const prev = globalNotifications[idx];
          return !prev || prev.id !== n.id || prev.read !== n.read;
        });

      const wasFirstLoad = !hasLoadedFromCache;

      if (hasChanged || !hasLoadedFromCache) {
        globalNotifications = normalized;
        hasLoadedFromCache = true;
        cacheSet(CacheKeys.notifications, normalized);
        activeSubscribers.forEach(cb => {
          try {
            cb(normalized);
          } catch (_e) {}
        });
        DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED', normalized);
      }

      // Piggyback on the 15s notification poll that already runs, instead of
      // adding a second timer: tell the dashboards to refetch so screens
      // reflect other people's actions without their own polling loop.
      // Skipped on first load because every screen fetches on mount anyway.
      if (hasNewArrivals && !wasFirstLoad) {
        DeviceEventEmitter.emit(SERVER_STATE_CHANGED);
      }
    } catch (_err) {
      // Silently catch network drops — preserve existing state without DB strain
    } finally {
      isFetchingPromise = null;
    }
  })();

  return isFetchingPromise;
}

export function useNotificationsData() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(globalNotifications);
  const [isLoading, setIsLoading] = useState(!hasLoadedFromCache);
  const [hasError, setHasError] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // 1. Initial fast cache load
  useEffect(() => {
    if (!hasLoadedFromCache) {
      (async () => {
        try {
          const cached = await cacheGet<NotificationItem[]>(CacheKeys.notifications);
          if (Array.isArray(cached)) {
            globalNotifications = cached;
            hasLoadedFromCache = true;
            setNotifications(cached);
            setIsLoading(false);
          }
        } catch (_e) {}
      })();
    } else {
      setNotifications(globalNotifications);
      setIsLoading(false);
    }
  }, []);

  // 2. Subscribe to singleton state updates
  useEffect(() => {
    const updateHandler = (items: NotificationItem[]) => {
      setNotifications(items);
      setIsLoading(false);
    };

    activeSubscribers.add(updateHandler);
    return () => {
      activeSubscribers.delete(updateHandler);
    };
  }, []);

  // 3. Global DeviceEventEmitter listeners
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('NOTIFICATIONS_UPDATED', (updated: NotificationItem[]) => {
      if (Array.isArray(updated)) {
        setNotifications(updated);
        globalNotifications = updated;
      }
    });

    const subRefresh = DeviceEventEmitter.addListener('REFRESH_NOTIFICATIONS', () => {
      doFetchNotifications(true);
    });

    return () => {
      sub.remove();
      subRefresh.remove();
    };
  }, []);

  // 4. Smart Polling & AppState lifecycle (only polls when active, 0 DB load in background)
  useEffect(() => {
    // Initial fetch on mount (throttled)
    doFetchNotifications();

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        doFetchNotifications();
      }
    }, POLLING_INTERVAL_MS);

    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App just came to foreground — fetch immediately if throttled window passed
        doFetchNotifications(false);
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      clearInterval(interval);
      appStateSub.remove();
    };
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    const updated = globalNotifications.map(n => (n.id === id ? { ...n, read: true } : n));
    globalNotifications = updated;
    setNotifications(updated);
    cacheSet(CacheKeys.notifications, updated);
    DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED', updated);

    try {
      await apiFetch(`/notifications/${id}/read/`, { method: 'POST' });
    } catch {
      // Fallback
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const updated = globalNotifications.map(n => ({ ...n, read: true }));
    globalNotifications = updated;
    setNotifications(updated);
    cacheSet(CacheKeys.notifications, updated);
    DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED', updated);

    try {
      await apiFetch('/notifications/mark-all-read/', { method: 'POST' });
    } catch {}
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    const updated = globalNotifications.filter(n => n.id !== id);
    globalNotifications = updated;
    setNotifications(updated);
    cacheSet(CacheKeys.notifications, updated);
    DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED', updated);

    try {
      await apiFetch(`/notifications/${id}/`, { method: 'DELETE' });
    } catch {}
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllRead,
    deleteNotification,
    isLoading,
    hasError,
    refreshNotifications: () => doFetchNotifications(true),
  };
}
