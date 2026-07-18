/**
 * Quota Hire — Login Prefetch Cache
 * ===================================
 * A module-level singleton that bridges the login flow and the dashboard hook.
 *
 * How it works:
 *   1. auth-screens.tsx fires the login request AND the public /jobs/ fetch in
 *      parallel. The login response already contains the user object.
 *   2. As soon as login succeeds we populate this cache with user + jobs data.
 *   3. We also fire private background fetches (profile, applications, analytics)
 *      WITHOUT awaiting them — they fill the cache as they resolve.
 *   4. useLocalDashboardData checks this cache on mount. If data is present it
 *      populates state immediately and sets isLoading = false → zero spinner.
 *   5. The cache auto-expires after 45 s so a manual refresh always hits the API.
 *
 * Net result: the dashboard renders instantly after login with NO loading circle.
 */

export interface PrefetchedData {
  /** Raw /auth/me/ (or login response user object) */
  user: any;
  /** Raw array from /jobs/ */
  jobs: any[];
  /** Raw /profile/employee/ or /profile/company/ response — may arrive later */
  profile: any | null;
  /** Raw array from /applications/ — may arrive later */
  applications: any[];
  /** Raw /dashboard/analytics/ response — may arrive later */
  analytics: any | null;
  /** Unix ms timestamp of when the cache was last written */
  timestamp: number;
}

/** Maximum age in milliseconds before the cache is considered stale. */
const MAX_AGE_MS = 45_000; // 45 seconds

let _store: PrefetchedData | null = null;

export const prefetchCache = {
  /**
   * Write data into the cache. Can be called multiple times to patch fields
   * as background fetches resolve (profile, applications, analytics arrive
   * slightly after user + jobs).
   */
  set(data: Omit<PrefetchedData, 'timestamp'>): void {
    _store = { ...data, timestamp: Date.now() };
  },

  /**
   * Patch individual fields without overwriting the whole entry.
   * Used by the background prefetch to add profile/apps/analytics once they arrive.
   */
  patch(fields: Partial<Omit<PrefetchedData, 'timestamp'>>): void {
    if (!_store) return;
    _store = { ..._store, ...fields };
  },

  /**
   * Read the cached data. Returns null if the cache is empty or expired.
   */
  get(): PrefetchedData | null {
    if (!_store) return null;
    if (Date.now() - _store.timestamp > MAX_AGE_MS) {
      _store = null;
      return null;
    }
    return _store;
  },

  /**
   * Consume the cache — called after useLocalDashboardData has read it so
   * the next explicit refresh skips the cache and hits the API.
   */
  clear(): void {
    _store = null;
  },

  /** Returns true if there is non-expired data in the cache. */
  has(): boolean {
    return prefetchCache.get() !== null;
  },
};
