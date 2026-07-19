import { useState, useEffect, useCallback } from 'react';
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
      const normalized = rawNotifs.map((n: any) => ({
        id: n.id.toString(),
        title: n.title || 'Alert',
        message: n.message || '',
        read: n.read || false,
        createdAt: n.created_at || n.createdAt || new Date().toISOString(),
      }));
      setNotifications(normalized);
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (
        err?.isNetworkError === true ||
        msg.includes('internet') ||
        msg.includes('connection') ||
        msg.includes('Network')
      ) {
        // Network error — keep existing list (may be empty), no error banner
      } else {
        setHasError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
      await apiFetch(`/notifications/${id}/read/`, { method: 'POST' });
    } catch {
      // Silently fall back locally
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await apiFetch('/notifications/mark-all-read/', { method: 'POST' });
    } catch {}
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
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
