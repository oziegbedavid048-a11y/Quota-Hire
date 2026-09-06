/**
 * Non-secret app cache. Android SecureStore rejects values over ~2KB, so job
 * lists and feeds must not live there. Tokens stay in SecureStore.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const CacheKeys = {
  userProfile: 'cached_user_profile',
  jobs: 'cached_jobs',
  applications: 'cached_applications',
  analytics: 'cached_analytics',
  savedJobs: 'cached_saved_jobs',
  companyProfile: 'cached_company_profile',
  companyJobs: 'cached_company_jobs',
  companyApplications: 'cached_company_applications',
  exploreJobs: 'cached_explore_jobs',
  notifications: 'cached_notifications',
  communityFeed: 'cached_community_feed',
  communityMembers: 'cached_community_members',
  exchangeRates: 'cached_exchange_rates_eur',
  exchangeRatesTime: 'cached_exchange_rates_time',
  onboardingDone: 'has_completed_onboarding',
} as const;

const ALL_CACHE_KEYS = Object.values(CacheKeys);

export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw != null) return JSON.parse(raw) as T;

    // One-time migrate leftovers from SecureStore (older app versions)
    const legacy = await SecureStore.getItemAsync(key);
    if (legacy) {
      await AsyncStorage.setItem(key, legacy).catch(() => {});
      await SecureStore.deleteItemAsync(key).catch(() => {});
      try {
        return JSON.parse(legacy) as T;
      } catch {
        return legacy as T;
      }
    }
  } catch {
    // ignore corrupt cache
  }
  return null;
}

/**
 * Fields stripped before anything is written to AsyncStorage (QH-25).
 *
 * AsyncStorage is plaintext in the app sandbox — readable on a rooted or
 * jailbroken device, and previously via ADB backup. The split in this module
 * is deliberate and correct (tokens belong in SecureStore, bulk data cannot
 * fit there), but that is no reason to persist direct contact details.
 *
 * These are all re-fetched from /auth/me/ and the profile endpoints on the
 * next successful request, so dropping them costs nothing but a brief
 * placeholder while the network call completes.
 */
const SENSITIVE_FIELDS = new Set([
  'email',
  'contact_email',
  'phone_number',
  'contact_phone',
  'whatsapp_number',
  'street_address',
  'postal_code',
  'date_of_birth',
  'resume_url',
  'resume_file',
  'resume_binary',
  'cv_pdf',
  'cv_pdf_base64',
]);

function stripSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSensitive);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.has(k)) continue;
      out[k] = stripSensitive(v);
    }
    return out;
  }
  return value;
}

export async function cacheSet(key: string, value: unknown): Promise<void> {
  try {
    const payload =
      typeof value === 'string' ? value : JSON.stringify(stripSensitive(value));
    await AsyncStorage.setItem(key, payload);
  } catch {
    // quota / serialization — never crash the UI
  }
}

export async function cacheRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

export async function clearPersistedAppCache(): Promise<void> {
  await Promise.all(ALL_CACHE_KEYS.map((key) => cacheRemove(key)));
}
