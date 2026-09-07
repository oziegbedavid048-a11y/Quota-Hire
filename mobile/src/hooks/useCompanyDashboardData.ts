import { useState, useEffect, useCallback } from 'react';
import { AppState, DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SERVER_STATE_CHANGED } from './useNotificationsData';
import { apiFetch, getAccessToken } from '../services/api';
import { cacheGet, cacheSet, CacheKeys } from '../services/app-cache';
import { rememberUserRole } from '../services/user-role';

export interface CompanyJob {
  id: string;
  title: string;
  location: string;
  workType: 'Remote' | 'On-Site' | 'Hybrid';
  status: 'approved' | 'pending' | 'rejected';
  postedAt: string;
  applicantsCount: number;
}

export interface CompanyApplication {
  id: string;
  candidateName: string;
  candidateTitle: string;
  jobTitle: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  email: string;
  role?: 'employee' | 'company';
  companyName?: string;
  industry?: string;
  aboutCompany?: string;
  isVerified?: boolean;
  avatarUrl?: string;
  logoUrl?: string;
  setupCompleted?: boolean;
}

// ─── Empty Initial States (no mock data) ────────────────────────────────────
const EMPTY_COMPANY: CompanyProfile = {
  id: '',
  name: '',
  email: '',
  role: 'company',
  companyName: '',
  industry: '',
  aboutCompany: '',
  isVerified: false,
  avatarUrl: '',
  setupCompleted: false,
};

const EMPTY_ANALYTICS = {
  totalApplicantsCount: 0,
  topMatchesCount: 0,
  applicantVelocityData: [],
  jobPerformanceData: [],
};

export function calculateCompanyProfileStrength(company: CompanyProfile, activeJobsCount: number): number {
  const fields = [
    !!company.companyName,
    !!company.industry,
    !!company.aboutCompany,
    activeJobsCount > 0,
    !!company.isVerified,
  ];
  const done = fields.filter(Boolean).length;
  return Math.round((done / fields.length) * 100);
}

export function getCompanyProfileItems(company: CompanyProfile, activeJobsCount: number) {
  return [
    { label: 'Company Name',      done: !!company.companyName },
    { label: 'Industry',          done: !!company.industry },
    { label: 'About Company',     done: !!company.aboutCompany },
    { label: 'Active Job Posted', done: activeJobsCount > 0 },
    { label: 'Profile Verified',  done: !!company.isVerified },
  ];
}

// ─── Module-Level In-Memory Cache (Instant 0ms Tab Switching) ─────────────────
let inMemoryCompany: CompanyProfile | null = null;
let inMemoryCompanyJobs: CompanyJob[] = [];
let inMemoryCompanyApps: CompanyApplication[] = [];
let inMemoryCompanyAnalytics: any | null = null;
let inMemoryCompanyLastFetch = 0;
let inMemoryCompanyFetchPromise: Promise<void> | null = null;
let hasCompanyRestoredFromStorage = false;

export function resetCompanyDashboardMemory() {
  inMemoryCompany = null;
  inMemoryCompanyJobs = [];
  inMemoryCompanyApps = [];
  inMemoryCompanyAnalytics = null;
  inMemoryCompanyLastFetch = 0;
  inMemoryCompanyFetchPromise = null;
  hasCompanyRestoredFromStorage = false;
}

(async () => {
  try {
    const [cachedProfile, cachedJobs, cachedApps] = await Promise.all([
      cacheGet<CompanyProfile>(CacheKeys.companyProfile),
      cacheGet<CompanyJob[]>(CacheKeys.companyJobs),
      cacheGet<CompanyApplication[]>(CacheKeys.companyApplications),
    ]);
    if (cachedProfile) inMemoryCompany = cachedProfile;
    if (cachedJobs) inMemoryCompanyJobs = cachedJobs;
    if (cachedApps) inMemoryCompanyApps = cachedApps;
    hasCompanyRestoredFromStorage = true;
  } catch (_e) {}
})();

// ─── Real Data Hook ──────────────────────────────────────────────────────────
export function useCompanyDashboardData() {
  const [company, setCompany]           = useState<CompanyProfile>(inMemoryCompany || EMPTY_COMPANY);
  const [jobs, setJobs]                 = useState<CompanyJob[]>(inMemoryCompanyJobs);
  const [applications, setApplications] = useState<CompanyApplication[]>(inMemoryCompanyApps);
  const [analytics, setAnalytics]       = useState<any>(inMemoryCompanyAnalytics || { ...EMPTY_ANALYTICS });
  const [isLoading, setIsLoading]       = useState(!inMemoryCompany);
  const [isFetching, setIsFetching]     = useState(false);
  const [hasError, setHasError]         = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);

  const fetchLiveCompanyData = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && inMemoryCompany && now - inMemoryCompanyLastFetch < 30000) {
      return;
    }
    if (inMemoryCompanyFetchPromise) {
      return inMemoryCompanyFetchPromise;
    }

    setIsFetching(true);
    setHasError(false);
    setIsNetworkError(false);

    inMemoryCompanyFetchPromise = (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          setIsFetching(false);
          setIsLoading(false);
          return;
        }

        // ── Phase 1: Critical data (user identity + jobs) ─────────────────────
        const [uData, jobsData] = await Promise.all([
          apiFetch('/auth/me/'),
          apiFetch('/company/jobs/').catch(() => []),
        ]);

        const normalizedCompany: CompanyProfile = {
          id: uData.id != null ? String(uData.id) : 'company',
          name: uData.name || uData.first_name || uData.email || 'User',
          email: uData.email || '',
          role: uData.role || 'company',
          companyName: uData.companyName || '',
          industry: uData.industry || '',
          aboutCompany: uData.aboutCompany || '',
          isVerified: uData.is_verified || false,
          avatarUrl: uData.avatarUrl || '',
          setupCompleted: uData.setup_completed || false,
        };
        rememberUserRole(normalizedCompany.role);
        inMemoryCompany = normalizedCompany;
        setCompany(normalizedCompany);
        cacheSet(CacheKeys.companyProfile, normalizedCompany);

        const rawJobs = Array.isArray(jobsData) ? jobsData : (jobsData?.results || []);
        const normalizedJobs = rawJobs.filter((j: any) => j?.id != null).map((j: any) => ({
          id: String(j.id),
          title: j.title,
          location: j.location,
          workType: j.is_remote ? 'Remote' : ('Hybrid' as const),
          status: j.status || 'pending',
          postedAt: j.created_at || new Date().toISOString(),
          applicantsCount: j.applicants_count || 0,
        }));
        inMemoryCompanyJobs = normalizedJobs;
        setJobs(normalizedJobs);
        cacheSet(CacheKeys.companyJobs, normalizedJobs);
        setIsLoading(false);

        // ── Phase 2: Secondary data (profile details, applications, analytics) ─
        const [compProfile, appsData, analData] = await Promise.all([
          apiFetch('/profile/company/').catch(() => null),
          apiFetch('/applications/').catch(() => []),
          apiFetch('/dashboard/analytics/').catch(() => null),
        ]);

        if (compProfile) {
          const updatedCompany: CompanyProfile = {
            ...normalizedCompany,
            companyName: compProfile.company_name || normalizedCompany.companyName || '',
            industry: compProfile.industry || normalizedCompany.industry || '',
            aboutCompany: compProfile.about_company || normalizedCompany.aboutCompany || '',
            avatarUrl: compProfile.logo_url || normalizedCompany.avatarUrl || '',
          };
          inMemoryCompany = updatedCompany;
          setCompany(updatedCompany);
          cacheSet(CacheKeys.companyProfile, updatedCompany);
        }

        const rawApps = Array.isArray(appsData) ? appsData : (appsData?.results || []);
        const normalizedApps = rawApps.filter((a: any) => a?.id != null).map((a: any) => ({
          id: String(a.id),
          candidateName: a.candidate_name || a.user?.name || 'Applicant',
          candidateTitle: a.candidate_title || 'Sales Professional',
          jobTitle: a.job_title || '',
          status: a.status || 'pending',
          appliedAt: a.created_at || a.applied_at || new Date().toISOString(),
        }));
        inMemoryCompanyApps = normalizedApps;
        setApplications(normalizedApps);
        cacheSet(CacheKeys.companyApplications, normalizedApps);

        if (analData) {
          const normalizedAnalytics = {
            totalApplicantsCount: analData.totalApplicantsCount ?? normalizedApps.length,
            topMatchesCount: analData.topMatchesCount || 0,
            applicantVelocityData: analData.applicantVelocityData || [],
            jobPerformanceData: analData.jobPerformanceData || [],
          };
          inMemoryCompanyAnalytics = normalizedAnalytics;
          setAnalytics(normalizedAnalytics);
        } else {
          const defaultAnalytics = {
            ...EMPTY_ANALYTICS,
            totalApplicantsCount: normalizedApps.length,
          };
          inMemoryCompanyAnalytics = defaultAnalytics;
          setAnalytics(defaultAnalytics);
        }

        inMemoryCompanyLastFetch = Date.now();
      } catch (err: any) {
        console.warn('[Company Dashboard] fetch failed:', err?.message || err);
        setIsLoading(false);

        const msg = String(err?.message || err);
        if (
          msg.includes('Network') ||
          msg.includes('network') ||
          msg.includes('internet') ||
          msg.includes('connection') ||
          msg.includes('fetch') ||
          msg.includes('ECONNREFUSED') ||
          msg.includes('timeout') ||
          msg.includes('abort') ||
          err?.status === 0
        ) {
          setIsNetworkError(true);
        } else {
          setHasError(true);
        }
      } finally {
        setIsFetching(false);
        inMemoryCompanyFetchPromise = null;
      }
    })();

    return inMemoryCompanyFetchPromise;
  }, []);

  // Storage recovery fallback
  useEffect(() => {
    if (!hasCompanyRestoredFromStorage) {
      (async () => {
        try {
          const [cachedProfile, cachedJobs, cachedApps] = await Promise.all([
            cacheGet<CompanyProfile>(CacheKeys.companyProfile),
            cacheGet<CompanyJob[]>(CacheKeys.companyJobs),
            cacheGet<CompanyApplication[]>(CacheKeys.companyApplications),
          ]);
          let hasCache = false;
          if (cachedProfile) { inMemoryCompany = cachedProfile; setCompany(cachedProfile); hasCache = true; }
          if (cachedJobs) { inMemoryCompanyJobs = cachedJobs; setJobs(cachedJobs); hasCache = true; }
          if (cachedApps) { inMemoryCompanyApps = cachedApps; setApplications(cachedApps); hasCache = true; }
          if (hasCache) {
            hasCompanyRestoredFromStorage = true;
            setIsLoading(false);
            setIsFetching(false);
          }
        } catch (_e) {}
      })();
    }
  }, []);

  useEffect(() => {
    fetchLiveCompanyData(false);

    const sub = DeviceEventEmitter.addListener('USER_AVATAR_UPDATED', (newUrl: string) => {
      inMemoryCompany = inMemoryCompany ? { ...inMemoryCompany, avatarUrl: newUrl, logoUrl: newUrl } : null;
      setCompany(prev => ({ ...prev, avatarUrl: newUrl, logoUrl: newUrl }));
    });
    const subProfile = DeviceEventEmitter.addListener('USER_PROFILE_UPDATED', () => {
      inMemoryCompanyLastFetch = 0;
      fetchLiveCompanyData(true);
    });
    const subData = DeviceEventEmitter.addListener('USER_DATA_UPDATED', (partial: any) => {
      if (partial) {
        inMemoryCompany = inMemoryCompany ? { ...inMemoryCompany, ...partial } : null;
        setCompany(prev => ({ ...prev, ...partial }));
      }
    });
    return () => {
      sub.remove();
      subProfile.remove();
      subData.remove();
    };
  }, [fetchLiveCompanyData]);

  const activeJobs  = jobs.filter(j => j.status === 'approved');
  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const profileScore = calculateCompanyProfileStrength(company, activeJobs.length);
  const profileItems = getCompanyProfileItems(company, activeJobs.length);



  // ── Real-time: react to changes made by other people ──────────────────────
  // The notification poller runs every 15s regardless. When it sees a
  // notification id it has never seen, something changed server-side that
  // this device did not cause — a decision on an application, a new
  // applicant, a job approval — so refetch rather than wait for the user
  // to pull down.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(SERVER_STATE_CHANGED, () => {
      fetchLiveCompanyData(true);
    });
    return () => sub.remove();
  }, [fetchLiveCompanyData]);

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
      fetchLiveCompanyData(false);
    }, [fetchLiveCompanyData])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        fetchLiveCompanyData(false);
      }
    });
    return () => sub.remove();
  }, [fetchLiveCompanyData]);

  return {
    company,
    jobs,
    activeJobs,
    pendingJobs,
    applications,
    analytics,
    profileScore,
    profileItems,
    refreshData: () => fetchLiveCompanyData(true),
    isLoading,
    isFetching,
    hasError,
    isNetworkError,
  };
}
