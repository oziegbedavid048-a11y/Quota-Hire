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
import { DeviceEventEmitter } from "react-native";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "../services/api";

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
    companyIsVerified: true,
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
export function useEmployeeDashboardData() {
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

      // ── Phase 1: Critical data — render the dashboard NOW ─────────────────
      const [uData, jobsData] = await Promise.all([
        apiFetch("/auth/me/"),
        apiFetch("/jobs/").catch(() => []),
      ]);

      const normalizedUser = normalizeUser(uData);
      setUser(normalizedUser);
      SecureStore.setItemAsync("cached_user_profile", JSON.stringify(normalizedUser)).catch(() => {});

      const rawJobs = Array.isArray(jobsData)
        ? jobsData
        : jobsData?.results || [];
      const normalizedJobsList = normalizeJobs(rawJobs);
      setJobs(normalizedJobsList);
      SecureStore.setItemAsync("cached_jobs", JSON.stringify(normalizedJobsList)).catch(() => {});
      setIsLoading(false); // ← Dashboard is now visible!

      // ── Phase 2: Secondary data — fills in the rest in the background ─────
      const [empProfile, appsData, analData] = await Promise.all([
        apiFetch("/profile/employee/").catch(() => null),
        apiFetch("/applications/").catch(() => []),
        apiFetch("/dashboard/analytics/").catch(() => null),
      ]);

      // Merge employee profile details into user state
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
        setUser(updatedUser);
        SecureStore.setItemAsync("cached_user_profile", JSON.stringify(updatedUser)).catch(() => {});
        DeviceEventEmitter.emit("USER_PROFILE_UPDATED", updatedUser);
      }

      const rawApps = Array.isArray(appsData)
        ? appsData
        : appsData?.results || [];
      const normalizedApps = normalizeApps(rawApps);
      setApplications(normalizedApps);
      SecureStore.setItemAsync("cached_applications", JSON.stringify(normalizedApps)).catch(() => {});

      const normalizedAnalytics = normalizeAnalytics(analData, normalizedApps.length);
      setAnalytics(normalizedAnalytics);
      SecureStore.setItemAsync("cached_analytics", JSON.stringify(normalizedAnalytics)).catch(() => {});

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

  // Fast-path: Instant zero-delay cache restore on mount
  // All 4 data shapes are restored simultaneously — user sees full UI in 0ms
  useEffect(() => {
    (async () => {
      try {
        const [cachedUser, cachedJobs, cachedApps, cachedAnalytics] = await Promise.all([
          SecureStore.getItemAsync("cached_user_profile"),
          SecureStore.getItemAsync("cached_jobs"),
          SecureStore.getItemAsync("cached_applications"),
          SecureStore.getItemAsync("cached_analytics"),
        ]);
        let hasCache = false;
        if (cachedUser) { setUser(JSON.parse(cachedUser)); hasCache = true; }
        if (cachedJobs) { setJobs(JSON.parse(cachedJobs)); hasCache = true; }
        if (cachedApps) { setApplications(JSON.parse(cachedApps)); hasCache = true; }
        if (cachedAnalytics) { setAnalytics(JSON.parse(cachedAnalytics)); hasCache = true; }
        if (hasCache) {
          setIsLoading(false);
          setIsFetching(false);
        }
      } catch (_e) {}
    })();
  }, []);

  useEffect(() => {
    fetchLiveDashboard();

    const subAvatar = DeviceEventEmitter.addListener("USER_AVATAR_UPDATED", (newUrl: string) => {
      setUser((prev) => ({ ...prev, avatarUrl: newUrl }));
    });

    const subData = DeviceEventEmitter.addListener("USER_DATA_UPDATED", (partialData: Partial<UserProfile>) => {
      if (partialData) {
        setUser((prev) => ({ ...prev, ...partialData }));
      }
    });

    return () => {
      subAvatar.remove();
      subData.remove();
    };
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
