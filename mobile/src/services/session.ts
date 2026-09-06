import * as SecureStore from 'expo-secure-store';
import { clearTokens } from './api';
import { clearPersistedAppCache } from './app-cache';
import { clearRememberedRole } from './user-role';
import { resetEmployeeDashboardMemory } from '@/hooks/useEmployeeDashboardData';
import { resetCompanyDashboardMemory } from '@/hooks/useCompanyDashboardData';
import { resetNotificationsMemory } from '@/hooks/useNotificationsData';
import { resetCommunityMemory } from '@/hooks/useCommunityData';

const IDENTITY_KEYS = [
  'user_name',
  'user_role',
  'user_avatar',
] as const;

let uiLogout: (() => Promise<void>) | null = null;

export function registerSessionLogout(handler: () => Promise<void>) {
  uiLogout = handler;
}

/** Full local sign-out: JWT, identity, persisted caches, and in-memory stores. */
export async function clearLocalSession(): Promise<void> {
  await clearTokens();
  await Promise.all(IDENTITY_KEYS.map((key) => SecureStore.deleteItemAsync(key).catch(() => {})));
  await clearPersistedAppCache();
  clearRememberedRole();
  resetEmployeeDashboardMemory();
  resetCompanyDashboardMemory();
  resetNotificationsMemory();
  resetCommunityMemory();
}

export async function requestLogout(): Promise<void> {
  if (uiLogout) {
    await uiLogout();
    return;
  }
  await clearLocalSession();
}
