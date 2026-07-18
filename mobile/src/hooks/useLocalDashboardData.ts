/**
 * useLocalDashboardData — Employee Dashboard Data Hook
 *
 * Two-phase fetch strategy for maximum perceived performance:
 *   Fast path  (login prefetch): prefetchCache already has user+jobs from the
 *              login flow → state is populated instantly, no spinner shown.
 *   Phase 1 (Critical): /auth/me + /jobs/ → renders dashboard immediately
 *   Phase 2 (Background): employee profile, applications, analytics → fills in details
 *
 * No mock data — only real backend data is shown. Skeleton loaders cover
 * the loading state and an error/retry banner covers fetch failures.
 */
import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "../services/api";
import { prefetchCache } from "../services/prefetch-cache";

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
  description: string;
  requirements: string[];
  status: "approved" | "pending" | "rejected";
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
    !!user.resumeUrl,
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
    { label: "Resume / Portfolio", done: !!user.resumeUrl },
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
  return rawJobs.map((j: any) => ({
    id: j.id.toString(),
    title: j.title,
    companyName: j.company_name,
    companyLogoUrl: j.company_logo_url,
    companyIsVerified: true,
    location: j.location,
    workType: j.is_remote ? "Remote" : ("Hybrid" as const),
    salaryRange: j.salary_range,
    commissionRange: j.commission_range,
    description: j.description,
    requirements: j.requirements || [],
    status: j.status || "approved",
    postedAt: j.created_at || new Date().toISOString(),
  }));
}

function normalizeApps(rawApps: any[]): Application[] {
  return rawApps.map((a: any) => ({
    id: a.id.toString(),
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

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useLocalDashboardData() {
  const [user, setUser] = useState<UserProfile>(EMPTY_USER);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [analytics, setAnalytics] = useState<any>({ ...EMPTY_ANALYTICS });

  // isLoading: true until Phase 1 (critical data) is done
  const [isLoading, setIsLoading] = useState(true);
  // isFetching: true until ALL data (both phases) is done
  const [isFetching, setIsFetching] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);

  const fetchLiveDashboard = useCallback(async () => {
    setIsFetching(true);
    setHasError(false);
    setIsNetworkError(false);

    try {
      const token = await SecureStore.getItemAsync("access_token");
      if (!token) {
        setIsFetching(false);
        setIsLoading(false);
        return;
      }

      // ── FAST PATH: data was prefetched during the login request ───────────
      // auth-screens.tsx fires /auth/login/ + /jobs/ in parallel, then
      // immediately stores user+jobs in prefetchCache and kicks off background
      // fetches for profile/applications/analytics. By the time this hook
      // mounts (right after onLogin() is called) the cache is already warm.
      //
      // Result: dashboard renders with ZERO loading spinner after login.
      const cached = prefetchCache.get();
      if (cached?.user) {
        // Build the user object — merge empProfile if it arrived already
        const cachedUser = normalizeUser(cached.user, cached.profile);

        // If location wasn't in the profile but was in the user object, keep it
        if (!cachedUser.location && cached.user.location) {
          cachedUser.location = cached.user.location;
        }
        // If profile has city+country, prefer that over the raw location string
        if (cached.profile?.city && cached.profile?.country) {
          cachedUser.location = `${cached.profile.city}, ${cached.profile.country}`;
        }

        setUser(cachedUser);

        const rawJobs = Array.isArray(cached.jobs)
          ? cached.jobs
          : ((cached.jobs as any)?.results ?? []);
        if (rawJobs.length > 0) setJobs(normalizeJobs(rawJobs));

        const rawApps = Array.isArray(cached.applications)
          ? cached.applications
          : ((cached.applications as any)?.results ?? []);
        const normalizedApps = normalizeApps(rawApps);
        if (normalizedApps.length > 0) setApplications(normalizedApps);

        if (cached.analytics) {
          setAnalytics(
            normalizeAnalytics(cached.analytics, normalizedApps.length),
          );
        }

        if (cached.user.saved_jobs) {
          setSavedJobs(
            cached.user.saved_jobs.map((j: any) => String(j.id ?? j)),
          );
        }

        // Mark as fully loaded — no spinner shown
        setIsLoading(false);
        setIsFetching(false);

        // Consume the cache so the next explicit refresh hits the API
        prefetchCache.clear();
        return;
      }

      // ── Phase 1: Critical data — render the dashboard NOW ─────────────────
      const [uData, jobsData] = await Promise.all([
        apiFetch("/auth/me/"),
        apiFetch("/jobs/").catch(() => []),
      ]);

      const normalizedUser = normalizeUser(uData);
      setUser(normalizedUser);

      const rawJobs = Array.isArray(jobsData)
        ? jobsData
        : jobsData?.results || [];
      setJobs(normalizeJobs(rawJobs));
      setIsLoading(false); // ← Dashboard is now visible!

      // ── Phase 2: Secondary data — fills in the rest in the background ─────
      const [empProfile, appsData, analData] = await Promise.all([
        apiFetch("/profile/employee/").catch(() => null),
        apiFetch("/applications/").catch(() => []),
        apiFetch("/dashboard/analytics/").catch(() => null),
      ]);

      // Merge employee profile details into user state
      if (empProfile) {
        setUser((prev) => ({
          ...prev,
          title: empProfile.title || prev.title || "",
          bio: empProfile.bio || prev.bio || "",
          skills: empProfile.skills || prev.skills || [],
          education: empProfile.education || prev.education || "",
          resumeUrl:
            empProfile.resume_url ||
            empProfile.resume_file ||
            prev.resumeUrl ||
            "",
          phone: empProfile.phone_number || prev.phone || "",
          location:
            empProfile.city && empProfile.country
              ? `${empProfile.city}, ${empProfile.country}`
              : prev.location || "",
          experienceYears:
            empProfile.experience_years || prev.experienceYears || 0,
        }));
      }

      const rawApps = Array.isArray(appsData)
        ? appsData
        : appsData?.results || [];
      const normalizedApps = normalizeApps(rawApps);
      setApplications(normalizedApps);
      setAnalytics(normalizeAnalytics(analData, normalizedApps.length));

      // Saved jobs from /auth/me/
      if (uData.saved_jobs) {
        setSavedJobs(uData.saved_jobs.map((j: any) => String(j.id || j)));
      }
    } catch (err: any) {
      console.warn("[Employee Dashboard] fetch failed:", err?.message || err);
      setIsLoading(false);

      const msg = String(err?.message || err);
      if (
        err?.isNetworkError === true ||
        msg.includes("internet") ||
        msg.includes("connection") ||
        msg.includes("Network") ||
        msg.includes("network") ||
        msg.includes("fetch") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("timeout") ||
        msg.includes("abort") ||
        err?.status === 0
      ) {
        setIsNetworkError(true);
      } else {
        setHasError(true);
      }
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveDashboard();
  }, [fetchLiveDashboard]);

  const toggleSavedJob = useCallback(async (jobId: string) => {
    try {
      setSavedJobs((prev) => {
        const next = prev.includes(jobId)
          ? prev.filter((id) => id !== jobId)
          : [...prev, jobId];
        return next;
      });
      await apiFetch(`/jobs/${jobId}/save/`, { method: "POST" });
    } catch {
      // Optimistic update — silently revert if needed on next refresh
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
    refreshData: fetchLiveDashboard,
    isLoading,
    isFetching,
    hasError,
    isNetworkError,
  };
}
