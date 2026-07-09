import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import {
  User,
  EmployeeProfile,
  CompanyProfile,
  Job,
  Application,
  Notification
} from '../types';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// 10-second timeout wrapper — prevents a sleeping Render backend from
// hanging the page indefinitely with no visible feedback.
const fetchWithTimeout = (url: string, options: RequestInit, timeoutMs = 10000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

// Attempt to silently refresh the access token using the stored refresh token.
// Returns the new access token on success, or null if refresh fails.
const tryRefreshToken = async (): Promise<string | null> => {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      // If the backend rotates refresh tokens, save the new one too
      if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
      return data.access;
    }
    return null;
  } catch {
    return null;
  }
};

// Global fetch wrapper for Django API
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  let token = localStorage.getItem('access_token');

  const buildHeaders = (tk: string | null) => {
    const h: any = { ...options.headers };
    if (!(options.body instanceof FormData)) h['Content-Type'] = 'application/json';
    if (tk) h['Authorization'] = `Bearer ${tk}`;
    return h;
  };

  let response;
  try {
    response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, { ...options, headers: buildHeaders(token) });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. It may be starting up — please try again in a moment.', 0);
    }
    throw new ApiError('We couldn\'t connect to the server. Please check your internet connection.', 0);
  }

  // ── JWT Auto-Refresh ──────────────────────────────────────────────────────
  // If we got a 401 and we have a refresh token, try to get a new access token
  // silently before giving up. This prevents unexpected logouts when the 30-min
  // access token expires while the user is still active.
  if (response.status === 401 && token) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      // Retry the original request with the fresh token
      try {
        response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, { ...options, headers: buildHeaders(newToken) });
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          throw new ApiError('The server took too long to respond.', 0);
        }
        throw new ApiError('We couldn\'t connect to the server.', 0);
      }
    } else {
      // Refresh also failed — session is truly expired, log the user out
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      const baseUrl = import.meta.env.BASE_URL || '/';
      window.location.href = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}login`;
      throw new ApiError('Session expired. Please log in again.', 401);
    }
  }

  if (!response.ok) {
    if (response.status >= 500) {
      throw new ApiError('An unexpected server error occurred. Please try again later.', response.status);
    }
    let errorMessage = 'An unexpected error occurred.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.error || Object.values(errorData).flat()[0] || errorMessage;
    } catch (e) {}
    throw new ApiError(errorMessage as string, response.status);
  }

  // Handle 204 No Content
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }

  return response.json();
};

interface AppState {
  currentUser: User | EmployeeProfile | CompanyProfile | null;
  profileData: any;
  jobs: Job[];
  applications: Application[];
  notifications: Notification[];
  savedJobs: string[];
  savedJobDates: Record<string, string>;
  loading: boolean;
  appError: string | null;
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (user: any) => Promise<void>;
  fetchData: (showLoading?: boolean) => Promise<void>;
  postJob: (job: any) => Promise<void>;
  applyForJob: (jobId: string, coverLetter?: string, generatedCvId?: number) => Promise<void>;
  updateJobStatus: (jobId: string, status: Job['status']) => Promise<void>;
  updateApplicationStatus: (appId: string, status: Application['status']) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  generateCV: (formData: any) => Promise<void>;
  updateProfileImage: (file: File) => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  uploadResume: (file: File) => Promise<any>;
  changePassword: (data: any) => Promise<void>;
  sendPasswordRecovery: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string, passwordConfirm: string) => Promise<void>;
  toggleSavedJob: (jobId: string) => Promise<void>;
  clearError: () => void;
  retryFetchData: () => Promise<void>;
}

const defaultState: AppState = {
  currentUser: null,
  profileData: null,
  jobs: [],
  applications: [],
  notifications: [],
  savedJobs: [],
  savedJobDates: {},
  // FIX: Start as false so the UI renders immediately for unauthenticated users.
  // fetchData() sets it to true only when a logged-in user triggers a full reload.
  loading: false,
  appError: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(defaultState);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Authenticated user: fetch full data (loading will be set true inside fetchData)
        try {
            await fetchData();
        } catch (e) {
            setState(prev => ({ ...prev, loading: false }));
        }
      } else {
        // Unauthenticated user: load public jobs in the background — DO NOT block the UI.
        // The page renders immediately, jobs populate when the backend responds.
        // loading stays false so users see the page instantly even if backend is slow.
        fetchPublicJobsInBackground();
      }
    };
    init();

    // Background polling for real-time updates (notifications + jobs + applications)
    const pollInterval = setInterval(async () => {
      const token = localStorage.getItem('access_token');
      // FIX: Skip polling entirely when the tab is hidden (user switched to another tab)
      // and when there is no auth token. This was firing 3 sequential API calls every
      // 2 minutes regardless — even in background tabs.
      if (!token || document.hidden) return;
      try {
        // FIX: Run all 3 poll requests in parallel instead of sequentially
        const [notifData, jobsData, appsResult] = await Promise.all([
          apiFetch('/notifications/').catch(() => []),
          apiFetch('/jobs/').catch(() => null),
          apiFetch('/applications/').catch(() => []),
        ]);

        const notifs = Array.isArray(notifData) ? notifData : (notifData?.results || []);
        const jobsRaw = jobsData ? (Array.isArray(jobsData) ? jobsData : (jobsData?.results || [])) : null;
        const applications: any[] = Array.isArray(appsResult) ? appsResult : (appsResult?.results || []);

        const normalizedJobs = jobsRaw ? jobsRaw.map((j: any) => ({
          id: j.id.toString(),
          companyId: j.company?.toString() || j.company_name,
          companyName: j.company_name,
          companyLogoUrl: j.company_logo_url,
          companyIsVerified: true,
          title: j.title,
          description: j.description,
          requirements: j.requirements || [],
          employment_type: j.employment_type,
          isRemote: j.is_remote,
          location: j.location,
          currency: j.currency,
          salaryRange: j.salary_range,
          commissionRange: j.commission_range,
          status: j.status,
          createdAt: j.created_at,
          job_code: j.job_code,
        })) : null;

        setState(prev => ({
          ...prev,
          notifications: notifs.map((n: any) => ({ ...n, id: n.id.toString(), createdAt: n.created_at })) as any,
          ...(normalizedJobs ? { jobs: normalizedJobs } : {}),
          applications: applications.length > 0
            ? applications.map((a: any) => ({ id: a.id.toString(), ...a })) as any
            : prev.applications,
        }));
      } catch (e) {
        // silently ignore polling errors
      }
    }, 120000);

    return () => clearInterval(pollInterval);
  }, []);

  // Non-blocking background fetch for public jobs (unauthenticated visitors).
  // This never sets loading=true so the page always shows instantly.
  const fetchPublicJobsInBackground = async () => {
    try {
      const jobsData = await apiFetch('/jobs/').catch(() => null);
      if (!jobsData) return; // backend still waking up — silently ignore
      const jobsRaw = Array.isArray(jobsData) ? jobsData : (jobsData?.results || []);
      const jobs = jobsRaw.map((j: any) => ({
        id: j.id.toString(),
        companyId: j.custom_company_name ? `external-${encodeURIComponent(j.custom_company_name)}` : (j.company_id?.toString() || j.company?.toString() || j.company_name),
        companyName: j.company_name,
        companyLogoUrl: j.company_logo_url,
        companyIsVerified: true,
        title: j.title,
        description: j.description,
        requirements: j.requirements || [],
        employment_type: j.employment_type,
        isRemote: j.is_remote,
        location: j.location,
        currency: j.currency,
        salaryRange: j.salary_range,
        commissionRange: j.commission_range,
        status: j.status,
        createdAt: j.created_at,
        job_code: j.job_code,
      }));
      setState(prev => ({ ...prev, jobs, appError: null }));
    } catch {
      // Silently ignore — page already visible, jobs will show as empty
    }
  };

  const fetchData = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setState(prev => ({ ...prev, loading: true }));
      }

      const token = localStorage.getItem('access_token');

      if (!token) {
        // Unauthenticated: fetch public jobs in background (non-blocking)
        setState(prev => ({ ...prev, loading: false }));
        fetchPublicJobsInBackground();
        return;
      }

      // FIX: Run jobs + user fetch in parallel (both are independent)
      const [jobsData, user] = await Promise.all([
        apiFetch('/jobs/'),
        apiFetch('/auth/me/'),
      ]);
      const jobs = Array.isArray(jobsData) ? jobsData : (jobsData?.results || []);

      let profileData = null;
      let applications: any[] = [];
      let notifications: any[] = [];
      let savedJobs: string[] = [];
      let savedJobDates: Record<string, string> = {};

      // FIX: Run role-specific data + notifications in parallel
      if (user.role === 'employee') {
        const [empProfile, appsData, notifData] = await Promise.all([
          apiFetch('/profile/employee/'),
          apiFetch('/applications/'),
          apiFetch('/notifications/').catch(() => []),
        ]);
        profileData = empProfile;
        applications = Array.isArray(appsData) ? appsData : (appsData?.results || []);
        notifications = Array.isArray(notifData) ? notifData : (notifData?.results || []);

        user.saved_jobs = user.saved_jobs || [];
        savedJobs = user.saved_jobs.map((j: any) => String(j.id || j));
        user.saved_jobs.forEach((j: any) => {
          if (j.id && j.saved_at) {
            savedJobDates[String(j.id)] = j.saved_at;
          }
        });
      } else if (user.role === 'company') {
        const [compProfile, notifData] = await Promise.all([
          apiFetch('/profile/company/'),
          apiFetch('/notifications/').catch(() => []),
        ]);
        profileData = compProfile;
        notifications = Array.isArray(notifData) ? notifData : (notifData?.results || []);
      } else {
        const notifData = await apiFetch('/notifications/').catch(() => []);
        notifications = Array.isArray(notifData) ? notifData : (notifData?.results || []);
      }

      // Map Django data back to frontend expected structure
      const currentUserData = {
          id: user.id.toString(),
          email: user.email,
          role: user.role,
          name: user.name || user.first_name || user.email || 'User',
          avatarUrl: user.avatarUrl || '',
          createdAt: user.created_at,
          setupCompleted: user.setup_completed,
          isVerified: user.is_verified,
          savedJobs: savedJobs,
          location: user.location || '',
          ...(user.role === 'company' && profileData ? {
              companyName: profileData.company_name || '',
              website: profileData.website || '',
              industry: profileData.industry || '',
              aboutCompany: profileData.about_company || '',
              logoUrl: profileData.logo_url || user.avatarUrl || '',
              phoneNumber: profileData.contact_phone || '',
          } : {}),
          ...(user.role === 'employee' && profileData ? {
              title: profileData.title || '',
              bio: profileData.bio || '',
              linkedinUrl: profileData.linkedin_url || '',
              resumeUrl: profileData.resume_url || '',
              resumeFile: profileData.resume_file || '',
              education: profileData.education || '',
              skills: profileData.skills || [],
              experienceYears: profileData.experience_years || 0,
              phoneNumber: profileData.phone_number || '',
              country: profileData.country || '',
              city: profileData.city || '',
              postalCode: profileData.postal_code || '',
              streetAddress: profileData.street_address || '',
          } : {})
      };

      const normalizedJobs = jobs.map((j: any) => ({
          id: j.id.toString(),
          companyId: j.custom_company_name ? `external-${encodeURIComponent(j.custom_company_name)}` : (j.company_id?.toString() || j.company?.toString() || j.company_name),
          companyName: j.company_name,
          companyLogoUrl: j.company_logo_url,
          companyIsVerified: true,
          title: j.title,
          description: j.description,
          requirements: j.requirements || [],
          employment_type: j.employment_type,
          isRemote: j.is_remote,
          location: j.location,
          currency: j.currency,
          salaryRange: j.salary_range,
          commissionRange: j.commission_range,
          status: j.status,
          createdAt: j.created_at,
          job_code: j.job_code,
      }));

      setState(prev => ({
        ...prev,
        currentUser: currentUserData,
        profileData: profileData,
        savedJobs,
        savedJobDates,
        jobs: normalizedJobs,
        applications: applications.map(a => ({ id: a.id.toString(), ...a })) as any,
        notifications: notifications.map((n: any) => ({ ...n, id: n.id.toString(), createdAt: n.created_at })) as any,
        loading: false,
        appError: null
      }));
    } catch (error: any) {
      const wasAuthenticated = !!localStorage.getItem('access_token');
      setState(prev => ({ 
        ...prev, 
        loading: false,
        // Only surface the error screen for authenticated users whose session
        // data failed. Unauthenticated visitors should never see "Connection Lost"
        // — they just get an empty jobs list and can browse normally.
        appError: wasAuthenticated ? (error.message || "We couldn't connect to the server.") : null
      }));
    }
  };

  const clearError = () => setState(prev => ({ ...prev, appError: null }));
  const retryFetchData = () => fetchData();

  const login = async (email: string, password: string) => {
    try {
      const data = await apiFetch('/auth/login/', {
          method: 'POST',
          body: JSON.stringify({ email, password })
      });
      
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      await fetchData();
      toast.success(`Welcome back!`);
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to login'}`);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setState(defaultState);
    toast.success('Logged out successfully');
  };

  const register = async (userData: any) => {
    try {
      await apiFetch('/auth/register/', {
          method: 'POST',
          body: JSON.stringify({
              email: userData.email,
              name: userData.name,
              password: userData.password,
              password2: userData.password2,
              role: userData.role || 'employee',
              phone: userData.phone || '',
              city: userData.city || '',
              country: userData.country || '',
          })
      });

      // Django register automatically creates the base profile and sends a verification email.
      // We do NOT auto-login here, so the signup component can show the verification modal.

      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to register'}. Please try again.`);
      throw error;
    }
  };

  const postJob = async (jobData: any) => {
    try {
      if (!state.currentUser) throw new Error('Not logged in');
      const payload = {
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements || [],
        employment_type: jobData.employment_type || 'Full-time',
        is_remote: jobData.isRemote || false,
        location: jobData.location || '',
        salary_range: jobData.salaryRange || '',
        commission_range: jobData.commissionRange || '',
        currency: jobData.currency || 'USD',
        contact_email: jobData.contactEmail || '',
        contact_phone: jobData.contactPhone || '',
        whatsapp_number: jobData.whatsappNumber || '',
        company_address: jobData.companyAddress || '',
        custom_company_name: jobData.companyName || '',
        package: jobData.package || '',
      };

      await apiFetch('/jobs/', {
          method: 'POST',
          body: JSON.stringify(payload)
      });
      
      // Fetch data to refresh job list
      await fetchData(false);
      toast.success('Job posted successfully!', { description: 'You will be notified once the job listing is approved.' });
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to post job'}. Please try again.`);
    }
  };

  const applyForJob = async (jobId: string, coverLetter?: string, generatedCvId?: number) => {
    try {
      await apiFetch(`/jobs/${jobId}/apply/`, {
          method: 'POST',
          body: JSON.stringify({ cover_letter: coverLetter || '', generated_cv_id: generatedCvId })
      });
      await fetchData(false);
      toast.success('Application submitted successfully');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to apply'}. Please try again.`);
      throw error; // rethrow so callers can react to failure
    }
  };

  const updateJobStatus = async (jobId: string, status: Job['status']) => {
    try {
      await apiFetch(`/jobs/${jobId}/status/`, {
          method: 'PUT',
          body: JSON.stringify({ status })
      });
      await fetchData(false);
      toast.success(`Job ${status}`);
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to update status'}. Please try again.`);
    }
  };

  const updateApplicationStatus = async (appId: string, status: Application['status']) => {
    try {
      await apiFetch(`/applications/${appId}/status/`, {
          method: 'PUT',
          body: JSON.stringify({ status })
      });
      await fetchData(false);
      toast.success(`Application ${status}`);
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to update application'}. Please try again.`);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read/`, { method: 'PUT' });
      setState(prev => ({ ...prev, notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
    } catch (error: any) {
      console.error('Failed to mark read', error);
    }
  };

  const generateCV = async (formData: any) => {
    try {
      await apiFetch('/cv/generate/', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      toast.success('CV generated successfully!');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to generate CV'}. Please try again.`);
      throw error;
    }
  };

  const updateProfileImage = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      await apiFetch('/profile/avatar/', {
          method: 'POST',
          body: formData
      });

      await fetchData(false);
      toast.success('Profile picture updated!');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to upload profile picture'}. Please try again.`);
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      if (!state.currentUser) return;
      
      const payload: any = {};
      
      // Generic
      if (profileData.location !== undefined) payload.location = profileData.location;

      // Employee
      if (profileData.title !== undefined) payload.title = profileData.title;
      if (profileData.bio !== undefined) payload.bio = profileData.bio;
      if (profileData.linkedinUrl !== undefined) payload.linkedin_url = profileData.linkedinUrl;
      if (profileData.resumeUrl !== undefined) payload.resume_url = profileData.resumeUrl;
      if (profileData.education !== undefined) payload.education = profileData.education;
      if (profileData.skills !== undefined) payload.skills = profileData.skills;
      if (profileData.experienceYears !== undefined) payload.experience_years = profileData.experienceYears;
      if (profileData.phoneNumber !== undefined) {
        if (state.currentUser.role === 'company') {
          payload.contact_phone = profileData.phoneNumber;
        } else {
          payload.phone_number = profileData.phoneNumber;
        }
      }
      if (profileData.country !== undefined) payload.country = profileData.country;
      if (profileData.city !== undefined) payload.city = profileData.city;
      
      // Company
      if (profileData.companyName !== undefined) payload.company_name = profileData.companyName;
      if (profileData.website !== undefined) payload.website = profileData.website;
      if (profileData.industry !== undefined) payload.industry = profileData.industry;
      if (profileData.aboutCompany !== undefined) payload.about_company = profileData.aboutCompany;
      if (profileData.contactEmail !== undefined) payload.contact_email = profileData.contactEmail;
      if (profileData.contactPhone !== undefined) payload.contact_phone = profileData.contactPhone;

      const endpoint = state.currentUser.role === 'company' ? '/profile/company/' : '/profile/employee/';
      
      await apiFetch(endpoint, {
          method: 'PUT',
          body: JSON.stringify(payload)
      });

      // Update User model fields (like location and name)
      const userPayload: any = {};
      if (profileData.location !== undefined) userPayload.location = profileData.location;
      if (profileData.name !== undefined) userPayload.name = profileData.name;
      
      if (Object.keys(userPayload).length > 0) {
          await apiFetch('/auth/me/', {
              method: 'PATCH',
              body: JSON.stringify(userPayload)
          });
      }

      await fetchData(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to update profile'}. Please try again.`);
      throw error;
    }
  };

  const uploadResume = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      const res = await apiFetch('/profile/resume/upload/', {
        method: 'POST',
        body: formData,
      });

      // Do NOT call fetchData() here — it resets global loading state which
      // causes UnifiedDashboardLayout to flash PageSkeleton and wipe local
      // parsedData state before the user can review it.
      // fetchData() is called automatically by updateProfile when user saves.
      return { parsed: res?.parsed };
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to upload resume'}.`);
      throw error;
    }
  };

  const changePassword = async (data: any) => {
    try {
      await apiFetch('/auth/change-password/', {
          method: 'POST',
          body: JSON.stringify(data)
      });
      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to change password'}. Please try again.`);
      throw error;
    }
  };

  const sendPasswordRecovery = async (email: string) => {
    try {
      await apiFetch('/auth/forgot-password/', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to send recovery email'}.`);
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string, passwordConfirm: string) => {
    try {
      await apiFetch('/auth/reset-password/', {
        method: 'POST',
        body: JSON.stringify({ token, password: newPassword, passwordConfirm })
      });
      toast.success('Password reset successfully! You can now log in.');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to reset password'}.`);
      throw error;
    }
  };

  const toggleSavedJob = async (jobId: string) => {
    try {
      await apiFetch(`/jobs/${jobId}/save/`, { method: 'POST' });
      await fetchData(false);
      toast.success('Job saved status updated');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to save job'}. Please try again.`);
    }
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        fetchData,
        postJob,
        applyForJob,
        updateJobStatus,
        updateApplicationStatus,
        markNotificationRead,
        generateCV,
        updateProfileImage,
        updateProfile,
        uploadResume,
        changePassword,
        sendPasswordRecovery,
        resetPassword,
        toggleSavedJob,
        clearError,
        retryFetchData,
      } as any}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};