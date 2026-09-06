import { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';

let memoryRole: string | null = null;

function normalizeRole(role: string | undefined | null): string {
  if (role === 'company' || role === 'employee' || role === 'admin') return role;
  return 'employee';
}

export function getRememberedRole(): string | null {
  return memoryRole;
}

export function rememberUserRole(role: string | undefined | null): void {
  const next = normalizeRole(role);
  memoryRole = next;
  SecureStore.setItemAsync('user_role', next).catch(() => {});
  DeviceEventEmitter.emit('USER_ROLE_UPDATED', next);
}

export function clearRememberedRole(): void {
  memoryRole = null;
}

export function useStoredRole(): string {
  const [role, setRole] = useState<string>(memoryRole || 'employee');

  useEffect(() => {
    let cancelled = false;
    if (memoryRole) {
      setRole(memoryRole);
    } else {
      SecureStore.getItemAsync('user_role').then((stored) => {
        if (cancelled) return;
        const active = stored || 'employee';
        memoryRole = active;
        setRole(active);
      });
    }
    const sub = DeviceEventEmitter.addListener('USER_ROLE_UPDATED', (next: string) => {
      setRole(next);
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return role;
}
