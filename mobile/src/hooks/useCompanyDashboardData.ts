import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../services/api';

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

// ─── Real Data Hook ──────────────────────────────────────────────────────────
export function useCompanyDashboardData() {
  const [company, setCompany]           = useState<CompanyProfile>(EMPTY_COMPANY);
  const [jobs, setJobs]                 = useState<CompanyJob[]>([]);
  const [applications, setApplications] = useState<CompanyApplication[]>([]);
  const [analytics, setAnalytics]       = useState<any>({ ...EMPTY_ANALYTICS });
  const [isLoading, setIsLoading]       = useState(true);
  const [isFetching, setIsFetching]     = useState(true);
  const [hasError, setHasError]         = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);

  const fetchLiveCompanyData = useCallback(async () => {
    setIsFetching(true);
    setHasError(false);
    setIsNetworkError(false);

    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        setIsFetching(false);
        setIsLoading(false);
        return;
      }

      // ── Phase 1: Critical data (user identity + jobs) ─────────────────────
      // Render these immediately — show the dashboard as fast as possible.
      const [uData, jobsData] = await Promise.all([
        apiFetch('/auth/me/'),
        apiFetch('/company/jobs/').catch(() => []),
      ]);

      // Normalize Company Profile
      const normalizedCompany: CompanyProfile = {
        id: uData.id?.toString() || 'company',
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
      setCompany(normalizedCompany);

      // Normalize Company Jobs
      const rawJobs = Array.isArray(jobsData) ? jobsData : (jobsData?.results || []);
      const normalizedJobs = rawJobs.map((j: any) => ({
        id: j.id.toString(),
        title: j.title,
        location: j.location,
        workType: j.is_remote ? 'Remote' : ('Hybrid' as const),
        status: j.status || 'pending',
        postedAt: j.created_at || new Date().toISOString(),
        applicantsCount: j.applicants_count || 0,
      }));
      setJobs(normalizedJobs);
      setIsLoading(false); // Dashboard visible NOW

      // ── Phase 2: Secondary data (profile details, applications, analytics) ─
      // These load in the background — dashboard is already rendering
      const [compProfile, appsData, analData] = await Promise.all([
        apiFetch('/profile/company/').catch(() => null),
        apiFetch('/applications/').catch(() => []),
        apiFetch('/dashboard/analytics/').catch(() => null),
      ]);

      // Merge company profile details into state
      if (compProfile) {
        setCompany(prev => ({
          ...prev,
          companyName: compProfile.company_name || prev.companyName || '',
          industry: compProfile.industry || prev.industry || '',
          aboutCompany: compProfile.about_company || prev.aboutCompany || '',
          avatarUrl: compProfile.logo_url || prev.avatarUrl || '',
        }));
      }

      // Normalize Company Applications
      const rawApps = Array.isArray(appsData) ? appsData : (appsData?.results || []);
      const normalizedApps = rawApps.map((a: any) => ({
        id: a.id.toString(),
        candidateName: a.candidate_name || a.user?.name || 'Applicant',
        candidateTitle: a.candidate_title || 'Sales Professional',
        jobTitle: a.job_title || '',
        status: a.status || 'pending',
        appliedAt: a.created_at || a.applied_at || new Date().toISOString(),
      }));
      setApplications(normalizedApps);

      // Normalize Analytics
      if (analData) {
        setAnalytics({
          totalApplicantsCount: analData.totalApplicantsCount ?? normalizedApps.length,
          topMatchesCount: analData.topMatchesCount || 0,
          applicantVelocityData: analData.applicantVelocityData || [],
          jobPerformanceData: analData.jobPerformanceData || [],
        });
      } else {
        setAnalytics({
          ...EMPTY_ANALYTICS,
          totalApplicantsCount: normalizedApps.length,
        });
      }

    } catch (err: any) {
      console.warn('[Company Dashboard] fetch failed:', err?.message || err);
      setIsLoading(false);

      // Detect network vs server errors
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
    }
  }, []);

  useEffect(() => {
    fetchLiveCompanyData();
  }, [fetchLiveCompanyData]);

  const activeJobs  = jobs.filter(j => j.status === 'approved');
  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const profileScore = calculateCompanyProfileStrength(company, activeJobs.length);
  const profileItems = getCompanyProfileItems(company, activeJobs.length);

  return {
    company,
    jobs,
    activeJobs,
    pendingJobs,
    applications,
    analytics,
    profileScore,
    profileItems,
    refreshData: fetchLiveCompanyData,
    isLoading,
    isFetching,
    hasError,
    isNetworkError,
  };
}
