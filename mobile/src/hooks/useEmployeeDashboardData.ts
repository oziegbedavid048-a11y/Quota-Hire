/**
 * useEmployeeDashboardData — Employee Dashboard Data Hook
 *
 * Direct network fetch strategy:
 *   Phase 1 (Critical): /auth/me + /jobs/ → renders dashboard immediately
 *   Phase 2 (Background): employee profile, applications, analytics → fills in details
 *
 * No mock data — only real backend data is shown. Skeleton loaders cover
 * the loading state and an error/retry banner covers fetch failures.
 */
import { useState, useEffect, useCallback } from "react";
import { AppState, DeviceEventEmitter } from "react-native";
import { useFocusEffect } from 'expo-router';
import { SERVER_STATE_CHANGED } from './useNotificationsData';
import { apiFetch, getAccessToken } from "../services/api";
import { cacheGet, cacheSet, CacheKeys } from "../services/app-cache";
import { rememberUserRole } from "../services/user-role";

export interface Job {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl?: string;
  companyIsVerified?: boolean;
  location: string;
  workType: "Remote" | "On-Site" | "Hybrid";
  salaryRange?: string;
  commissionRange?: string;
  currency?: string;
  description: string;
  requirements: string[];
  status: "approved" | "pending" | "rejected" | "closed";
  postedAt: string;
}

export interface Application {
  id: string;
  job: string;
  job_title: string;
  company_name: string;
  companyLogoUrl?: string;
  status:
    | "pending"
    | "under_review"
    | "interview"
    | "decision"
    | "accepted"
    | "rejected";
  applied_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: "employee" | "company";
  title?: string;
  bio?: string;
  skills?: string[];
  education?: string;
  resumeUrl?: string;
  avatarUrl?: string;
  phone?: string;
  location?: string;
  isVerified?: boolean;
  setupCompleted?: boolean;
  experienceYears?: number;
}

export function calculateProfileStrength(user: UserProfile): number {
  const fields = [
    !!user.name,
    !!user.title,
    !!user.bio,
    !!(user.skills && user.skills.length > 0),
    !!user.education,
  ];
  const done = fields.filter(Boolean).length;
  return Math.round((done / fields.length) * 100);
}

export function getProfileItems(user: UserProfile) {
  return [
    { label: "Full Name", done: !!user.name },
    { label: "Current Title", done: !!user.title },
    { label: "Professional Summary", done: !!user.bio },
    { label: "Core Skills", done: !!(user.skills && user.skills.length > 0) },
    { label: "Education Background", done: !!user.education },
    { label: "Resume / Portfolio", done: !!user.resumeUrl || (!!user.title && !!user.education && !!(user.skills && user.skills.length > 0)) },
  ];
}

const EMPTY_USER: UserProfile = {
  id: "",
  name: "",
  email: "",
  role: "employee",
  title: "",
  bio: "",
  skills: [],
  education: "",
  resumeUrl: "",
  avatarUrl: "",
  phone: "",
  location: "",
  isVerified: false,
  setupCompleted: false,
  experienceYears: 0,
};

const EMPTY_ANALYTICS = {
  applicationActivityData: [],
  marketInsightsData: [],
  skillMatchData: [],
  activeApps: 0,
};

// ─── Normalisation helpers (shared by fast-path and normal-path) ─────────────

function normalizeUser(uData: any, empProfile?: any | null): UserProfile {
  return {
    id: uData.id?.toString() || "user",
    name: uData.name || uData.first_name || uData.email || "User",
    email: uData.email || "",
    role: uData.role || "employee",
    isVerified: uData.is_verified || false,
    setupCompleted: uData.setup_completed || false,
    avatarUrl: uData.avatarUrl || uData.avatar_url || "",
    location: uData.location || "",
    // Profile fields — filled either from empProfile or left empty for Phase 2
    title: empProfile?.title || "",
    bio: empProfile?.bio || "",
    skills: empProfile?.skills || [],
    education: empProfile?.education || "",
    resumeUrl: empProfile?.resume_url || empProfile?.resume_file || "",
    phone: empProfile?.phone_number || "",
    experienceYears: empProfile?.experience_years || 0,
  };
}

function normalizeJobs(rawJobs: any[]): Job[] {
  return rawJobs.filter((j: any) => j?.id != null).map((j: any) => ({
    id: String(j.id),
    title: j.title,
    companyName: j.company_name || j.companyName || j.company?.name || "Company",
    companyLogoUrl:
      j.company_logo_url ||
      j.company_logo ||
      j.companyLogoUrl ||
      j.companyLogo ||
      j.company?.logo ||
      j.company?.avatar_url ||
      j.company?.logo_url ||
      undefined,
    companyIsVerified: Boolean(j.company_is_verified ?? j.company?.is_verified ?? j.is_verified),
    location: j.location,
    workType: j.is_remote ? "Remote" : ("Hybrid" as const),
    salaryRange: j.salary_range,
    commissionRange: j.commission_range,
    currency: j.currency || 'USD',
    description: j.description,
    requirements: j.requirements || [],
    status: j.status || "approved",
    postedAt: j.created_at || new Date().toISOString(),
  }));
}

function normalizeApps(rawApps: any[]): Application[] {
  return rawApps.filter((a: any) => a?.id != null).map((a: any) => ({
    id: String(a.id),
    job: a.job?.toString() || "",
    job_title: a.job_title || "",
    company_name: a.company_name || "",
    companyLogoUrl: a.company_logo_url || undefined,
    status: a.status || "pending",
    applied_at: a.created_at || a.applied_at || new Date().toISOString(),
  }));
}

function normalizeAnalytics(analData: any | null, appCount: number): any {
  if (!analData) return { ...EMPTY_ANALYTICS, activeApps: appCount };
  return {
    applicationActivityData: analData.applicationActivityData || [],
    marketInsightsData: analData.marketInsightsData || [],
    skillMatchData: analData.skillMatchData || [],
    activeApps: analData.activeApps ?? appCount,
  };
}

// ─── Module-Level In-Memory Cache (Instant 0ms Tab Switching) ─────────────────
/**
 * Emitted whenever the signed-in employee's application list changes —
 * currently when they apply for a job. Any mounted screen showing
 * applications listens for this.
 *
 * Screens are separate mounted instances of this hook, each with its own
 * useState seeded from module memory at mount time. Writing to module
 * memory alone does NOT re-render an already-mounted screen, which is why
 * applying from Job Details left the Tracker tab showing stale data until
 * a manual refresh. The event is what closes that gap.
 *
 * Payload: the newly created Application, or undefined to just refetch.
 */
export const APPLICATIONS_UPDATED = "APPLICATIONS_UPDATED";
export const JOB_STATUS_UPDATED = "JOB_STATUS_UPDATED";

let inMemoryUser: UserProfile | null = null;
let inMemoryJobs: Job[] = [];
let inMemoryApps: Application[] = [];
let inMemoryAnalytics: any | null = null;
let inMemorySavedJobs: string[] = [];
let inMemoryLastFetch = 0;
let inMemoryFetchPromise: Promise<void> | null = null;
let hasRestoredFromStorage = false;

export function resetEmployeeDashboardMemory() {
  inMemoryUser = null;
  inMemoryJobs = [];
  inMemoryApps = [];
  inMemoryAnalytics = null;
  inMemorySavedJobs = [];
  inMemoryLastFetch = 0;
  inMemoryFetchPromise = null;
  hasRestoredFromStorage = false;
}

// Auto-restore cache from storage once at startup
(async () => {
  try {
    const [cachedUser, cachedJobs, cachedApps, cachedAnalytics, cachedSavedJobs] = await Promise.all([
      cacheGet<UserProfile>(CacheKeys.userProfile),
      cacheGet<Job[]>(CacheKeys.jobs),
      cacheGet<Application[]>(CacheKeys.applications),
      cacheGet<any>(CacheKeys.analytics),
      cacheGet<string[]>(CacheKeys.savedJobs),
    ]);
    if (cachedUser) inMemoryUser = cachedUser;
    if (cachedJobs) inMemoryJobs = cachedJobs;
    if (cachedApps) inMemoryApps = cachedApps;
    if (cachedAnalytics) inMemoryAnalytics = cachedAnalytics;
    if (cachedSavedJobs) inMemorySavedJobs = cachedSavedJobs;
    hasRestoredFromStorage = true;
  } catch (_e) {}
})();

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useEmployeeDashboardData() {
  const [user, setUser] = useState<UserProfile>(inMemoryUser || EMPTY_USER);
  const [applications, setApplications] = useState<Application[]>(inMemoryApps);
  const [savedJobs, setSavedJobs] = useState<string[]>(inMemorySavedJobs);
  const [jobs, setJobs] = useState<Job[]>(inMemoryJobs);
  const [analytics, setAnalytics] = useState<any>(inMemoryAnalytics || { ...EMPTY_ANALYTICS });

  // isLoading: false if we already have cached data in memory
  const [isLoading, setIsLoading] = useState(!inMemoryUser);
  const [isFetching, setIsFetching] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);

  const fetchLiveDashboard = useCallback(async (force = false) => {
    // Throttle network fetches so switching back to the Home tab is instantaneous
    const now = Date.now();
    if (!force && inMemoryUser && now - inMemoryLastFetch < 30000) {
      return;
    }
    if (inMemoryFetchPromise) {
      return inMemoryFetchPromise;
    }

    setIsFetching(true);
    setHasError(false);
    setIsNetworkError(false);

    inMemoryFetchPromise = (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          setIsFetching(false);
          setIsLoading(false);
          return;
        }

        // ── Phase 1: Critical data — render the dashboard NOW ─────────────────
        const [uData, jobsData] = await Promise.all([
          apiFetch("/auth/me/"),
          apiFetch("/jobs/").catch(() => []),
        ]);

        const normalizedUser = normalizeUser(uData);
        rememberUserRole(normalizedUser.role);
        inMemoryUser = normalizedUser;
        setUser(normalizedUser);
        cacheSet(CacheKeys.userProfile, normalizedUser);

        const rawJobs = Array.isArray(jobsData)
          ? jobsData
          : jobsData?.results || [];
        const normalizedJobsList = normalizeJobs(rawJobs);
        inMemoryJobs = normalizedJobsList;
        setJobs(normalizedJobsList);
        cacheSet(CacheKeys.jobs, normalizedJobsList);
        setIsLoading(false);

        // ── Phase 2: Secondary data — fills in the rest in the background ─────
        const [empProfile, appsData, analData] = await Promise.all([
          apiFetch("/profile/employee/").catch(() => null),
          apiFetch("/applications/").catch(() => []),
          apiFetch("/dashboard/analytics/").catch(() => null),
        ]);

        if (empProfile) {
          const updatedUser: UserProfile = {
            ...normalizedUser,
            title: empProfile.title ?? "",
            bio: empProfile.bio ?? "",
            skills: empProfile.skills || [],
            education: empProfile.education ?? "",
            resumeUrl: empProfile.resume_url || empProfile.resume_file || "",
            phone: empProfile.phone_number ?? "",
            location: empProfile.city ? `${empProfile.city}${empProfile.country ? `, ${empProfile.country}` : ""}` : (normalizedUser.location || ""),
            experienceYears: empProfile.experience_years ?? 0,
          };
          inMemoryUser = updatedUser;
          setUser(updatedUser);
          cacheSet(CacheKeys.userProfile, updatedUser);
          DeviceEventEmitter.emit("USER_PROFILE_UPDATED", updatedUser);
        }

        const rawApps = Array.isArray(appsData)
          ? appsData
          : appsData?.results || [];
        const normalizedApps = normalizeApps(rawApps);
        inMemoryApps = normalizedApps;
        setApplications(normalizedApps);
        cacheSet(CacheKeys.applications, normalizedApps);

        const normalizedAnalytics = normalizeAnalytics(analData, normalizedApps.length);
        inMemoryAnalytics = normalizedAnalytics;
        setAnalytics(normalizedAnalytics);
        cacheSet(CacheKeys.analytics, normalizedAnalytics);

        if (uData.saved_jobs) {
          const saved = uData.saved_jobs.map((j: any) => String(j.id || j));
          inMemorySavedJobs = saved;
          setSavedJobs(saved);
          DeviceEventEmitter.emit("SAVED_JOBS_UPDATED", saved);
          cacheSet(CacheKeys.savedJobs, saved);
        }

        inMemoryLastFetch = Date.now();
      } catch (err: any) {
        console.warn("[Employee Dashboard] fetch failed:", err?.message || err);
        setIsLoading(false);

        const msg = String(err?.message || err);
        if (
          err?.isNetworkError === true ||
          msg.includes("internet") ||
          msg.includes("Failed to fetch") ||
          msg.includes("Network request failed")
        ) {
          setIsNetworkError(true);
        } else {
          setHasError(true);
        }
      } finally {
        setIsFetching(false);
        inMemoryFetchPromise = null;
      }
    })();

    return inMemoryFetchPromise;
  }, []);

  // Storage cache recovery fallback
  useEffect(() => {
    if (!hasRestoredFromStorage) {
      (async () => {
        try {
          const [cachedUser, cachedJobs, cachedApps, cachedAnalytics, cachedSavedJobs] = await Promise.all([
            cacheGet<UserProfile>(CacheKeys.userProfile),
            cacheGet<Job[]>(CacheKeys.jobs),
            cacheGet<Application[]>(CacheKeys.applications),
            cacheGet<any>(CacheKeys.analytics),
            cacheGet<string[]>(CacheKeys.savedJobs),
          ]);
          let hasCache = false;
          if (cachedUser) { inMemoryUser = cachedUser; setUser(cachedUser); hasCache = true; }
          if (cachedJobs) { inMemoryJobs = cachedJobs; setJobs(cachedJobs); hasCache = true; }
          if (cachedApps) { inMemoryApps = cachedApps; setApplications(cachedApps); hasCache = true; }
          if (cachedAnalytics) { inMemoryAnalytics = cachedAnalytics; setAnalytics(cachedAnalytics); hasCache = true; }
          if (cachedSavedJobs) { inMemorySavedJobs = cachedSavedJobs; setSavedJobs(cachedSavedJobs); hasCache = true; }
          if (hasCache) {
            hasRestoredFromStorage = true;
            setIsLoading(false);
            setIsFetching(false);
          }
        } catch (_e) {}
      })();
    }
  }, []);

  useEffect(() => {
    fetchLiveDashboard(false);

    const subAvatar = DeviceEventEmitter.addListener("USER_AVATAR_UPDATED", (newUrl: string) => {
      inMemoryUser = inMemoryUser ? { ...inMemoryUser, avatarUrl: newUrl } : null;
      if (inMemoryUser) {
        cacheSet(CacheKeys.userProfile, inMemoryUser);
      }
      setUser((prev) => ({ ...prev, avatarUrl: newUrl }));
    });

    const subData = DeviceEventEmitter.addListener("USER_DATA_UPDATED", (partialData: Partial<UserProfile>) => {
      if (partialData) {
        inMemoryUser = inMemoryUser
          ? { ...inMemoryUser, ...partialData }
          : ({ ...EMPTY_USER, ...partialData } as UserProfile);
        cacheSet(CacheKeys.userProfile, inMemoryUser);
        inMemoryLastFetch = 0; // reset throttle so subsequent calls fetch immediately
        setUser((prev) => ({ ...prev, ...partialData }));
      }
    });

    const subProfile = DeviceEventEmitter.addListener("USER_PROFILE_UPDATED", (updatedUser?: UserProfile | Partial<UserProfile>) => {
      if (updatedUser) {
        inMemoryUser = inMemoryUser
          ? { ...inMemoryUser, ...updatedUser }
          : ({ ...EMPTY_USER, ...updatedUser } as UserProfile);
        cacheSet(CacheKeys.userProfile, inMemoryUser);
        inMemoryLastFetch = 0;
        setUser((prev) => ({ ...prev, ...updatedUser }));
      } else {
        inMemoryLastFetch = 0;
        fetchLiveDashboard(true);
      }
    });

    const subSaved = DeviceEventEmitter.addListener("SAVED_JOBS_UPDATED", (newSaved: string[]) => {
      if (Array.isArray(newSaved)) {
        inMemorySavedJobs = newSaved;
        setSavedJobs(newSaved);
      }
    });

    const subApps = DeviceEventEmitter.addListener(
      APPLICATIONS_UPDATED,
      (newApp?: any) => {
        // Show it immediately when the caller hands us the created record,
        // so the Tracker updates on the same frame the modal closes rather
        // than after a network round trip.
        if (newApp && newApp.id != null) {
          const [normalized] = normalizeApps([newApp]);
          if (normalized && !inMemoryApps.some((a) => a.id === normalized.id)) {
            const next = [normalized, ...inMemoryApps];
            inMemoryApps = next;
            setApplications(next);
            cacheSet(CacheKeys.applications, next);
            // Keep the headline count consistent with the list.
            if (inMemoryAnalytics) {
              inMemoryAnalytics = { ...inMemoryAnalytics, activeApps: next.length };
              setAnalytics(inMemoryAnalytics);
              cacheSet(CacheKeys.analytics, inMemoryAnalytics);
            }
          }
        }
        // Then reconcile with the server. Clearing the throttle stamp is
        // required — fetchLiveDashboard ignores calls made within 30s of
        // the last one unless forced.
        inMemoryLastFetch = 0;
        fetchLiveDashboard(true);
      }
    );

    const subJobStatus = DeviceEventEmitter.addListener(
      JOB_STATUS_UPDATED,
      ({ jobId, status }: { jobId: string; status: any }) => {
        if (!jobId) return;
        inMemoryJobs = inMemoryJobs.map((j) =>
          String(j.id) === String(jobId) ? { ...j, status } : j
        );
        setJobs((prev) =>
          prev.map((j) => (String(j.id) === String(jobId) ? { ...j, status } : j))
        );
        cacheSet(CacheKeys.jobs, inMemoryJobs);
      }
    );

    return () => {
      subAvatar.remove();
      subData.remove();
      subProfile.remove();
      subSaved.remove();
      subApps.remove();
      subJobStatus.remove();
    };
  }, [fetchLiveDashboard]);



  // ── Real-time: react to changes made by other people ──────────────────────
  // The notification poller runs every 15s regardless. When it sees a
  // notification id it has never seen, something changed server-side that
  // this device did not cause — a decision on an application, a new
  // applicant, a job approval — so refetch rather than wait for the user
  // to pull down.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(SERVER_STATE_CHANGED, () => {
      fetchLiveDashboard(true);
    });
    return () => sub.remove();
  }, [fetchLiveDashboard]);

  // ── Real-time: refresh when the screen is focused or the app resumes ───────
  // Tab screens stay mounted, so navigating back to one does not remount the
  // hook and nothing refetches. Before this, a change made elsewhere (or by
  // another user) only appeared after a manual pull-to-refresh.
  //
  // fetchLiveDashboard is called unforced, so its 30s throttle still applies:
  // switching tabs rapidly stays instant and costs no requests, while a
  // genuinely stale screen updates itself.
  useFocusEffect(
    useCallback(() => {
      fetchLiveDashboard(false);
    }, [fetchLiveDashboard])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        fetchLiveDashboard(false);
      }
    });
    return () => sub.remove();
  }, [fetchLiveDashboard]);

  const toggleSavedJob = useCallback(async (jobId: string) => {
    const sId = String(jobId);
    const isCurrentlySaved = inMemorySavedJobs.includes(sId);
    const next = isCurrentlySaved
      ? inMemorySavedJobs.filter((id) => id !== sId)
      : [...inMemorySavedJobs, sId];
    inMemorySavedJobs = next;
    setSavedJobs(next);
    DeviceEventEmitter.emit("SAVED_JOBS_UPDATED", next);
    cacheSet(CacheKeys.savedJobs, next);

    try {
      await apiFetch(`/jobs/${sId}/save/`, { method: "POST" });
    } catch (e) {
      console.warn("[SavedJobs] toggle save API failed:", e);
    }
  }, []);

  const profileScore = calculateProfileStrength(user);
  const profileItems = getProfileItems(user);

  return {
    user,
    applications,
    savedJobs,
    jobs,
    analytics,
    profileScore,
    profileItems,
    toggleSavedJob,
    refreshData: () => fetchLiveDashboard(true),
    isLoading,
    isFetching,
    hasError,
    isNetworkError,
  };
}
