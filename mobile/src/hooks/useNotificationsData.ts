import { useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../services/api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function useNotificationsData() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setHasError(false);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      const data = await apiFetch('/notifications/');
      const rawNotifs = Array.isArray(data) ? data : (data?.results || []);
      const normalized: NotificationItem[] = rawNotifs.map((n: any) => ({
        id: n.id.toString(),
        title: n.title || 'Alert',
        message: n.message || '',
        read: Boolean(n.read),
        createdAt: n.created_at || n.createdAt || new Date().toISOString(),
      }));
      setNotifications(normalized);
      SecureStore.setItemAsync('cached_notifications', JSON.stringify(normalized)).catch(() => {});
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (
        err?.isNetworkError === true ||
        msg.includes('internet') ||
        msg.includes('connection') ||
        msg.includes('Network')
      ) {
        // Network error — keep existing list
      } else {
        setHasError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fast-path: Instant zero-delay cache restore on mount
  useEffect(() => {
    (async () => {
      try {
        const cached = await SecureStore.getItemAsync('cached_notifications');
        if (cached) {
          setNotifications(JSON.parse(cached));
          setIsLoading(false);
        }
      } catch (_e) {}
    })();
  }, []);

  // Listen for global real-time notifications synchronization
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('NOTIFICATIONS_UPDATED', (updated: NotificationItem[]) => {
      if (Array.isArray(updated)) {
        setNotifications(updated);
      }
    });

    const subRefresh = DeviceEventEmitter.addListener('REFRESH_NOTIFICATIONS', () => {
      fetchNotifications();
    });

    return () => {
      sub.remove();
      subRefresh.remove();
    };
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => (n.id === id ? { ...n, read: true } : n));
      SecureStore.setItemAsync('cached_notifications', JSON.stringify(updated)).catch(() => {});
      DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED', updated);
      return updated;
    });

    try {
      await apiFetch(`/notifications/${id}/read/`, { method: 'POST' });
    } catch {
      // Fallback
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      SecureStore.setItemAsync('cached_notifications', JSON.stringify(updated)).catch(() => {});
      DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED', updated);
      return updated;
    });

    try {
      await apiFetch('/notifications/mark-all-read/', { method: 'POST' });
    } catch {}
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      SecureStore.setItemAsync('cached_notifications', JSON.stringify(updated)).catch(() => {});
      DeviceEventEmitter.emit('NOTIFICATIONS_UPDATED', updated);
      return updated;
    });

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
    refreshNotifications: fetchNotifications,
  };
}

