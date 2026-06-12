import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { account, databases, storage, appwriteConfig, ID, Query } from '../lib/appwrite';
import {
  User,
  EmployeeProfile,
  CompanyProfile,
  Job,
  Application,
  Notification
} from '../types';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:8000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Custom fetch for Django backend (passing Appwrite JWT for auth)
let cachedJwt: string | null = null;
let jwtExpiry: number | null = null;

export const getAppwriteJwt = async () => {
  const now = Date.now();
  if (cachedJwt && jwtExpiry && now < jwtExpiry) {
    return cachedJwt;
  }
  try {
    const jwt = await account.createJWT();
    cachedJwt = jwt.jwt;
    jwtExpiry = now + 14 * 60 * 1000;
    return cachedJwt;
  } catch (e) {
    console.warn("Could not get Appwrite JWT", e);
    return cachedJwt || '';
  }
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const jwtToken = await getAppwriteJwt();

  const headers = {
    'Content-Type': 'application/json',
    ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  } catch (error) {
    throw new ApiError('We couldn\'t connect to the server. Please check your internet connection.', 0);
  }

  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || Object.values(errorData).flat()[0] || errorMessage;
    } catch (e) {}
    throw new ApiError(errorMessage as string, response.status);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }

  return response.json();
};

export const normalizeJob = (j: any): Job => ({
  id: j.$id,
  companyId: j.company_user_id,
  companyName: j.company_name,
  companyLogoUrl: j.company_logo_url,
  companyIsVerified: j.company_is_verified,
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
});

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
  fetchData: () => Promise<void>;
  postJob: (job: any) => Promise<void>;
  applyForJob: (jobId: string, coverLetter?: string) => Promise<void>;
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
  loading: true,
  appError: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(defaultState);

  useEffect(() => {
    const init = async () => {
      try {
        const session = await account.getSession('current');
        if (session) {
          await fetchData();
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        setState(prev => ({ ...prev, loading: false }));
      }
    };
    init();
  }, []);

  const normalizeUser = (authUser: any, userProfile: any, specificProfile: any): any => {
    if (!authUser || !userProfile) return null;
    
    const baseUser = {
      id: authUser.$id,
      email: authUser.email,
      role: userProfile.role,
      name: authUser.name,
      avatarUrl: userProfile.avatar_url,
      createdAt: userProfile.created_at,
      setupCompleted: userProfile.setup_completed,
      isVerified: true, // simplified
      savedJobs: [],
      location: userProfile.location || '',
    };

    if (userProfile.role === 'company' && specificProfile) {
      return {
        ...baseUser,
        companyName: specificProfile.company_name || authUser.name,
        website: specificProfile.website || '',
        industry: specificProfile.industry || '',
        description: specificProfile.description || '',
        logoUrl: specificProfile.logo_url || userProfile.avatar_url,
      };
    } else if (userProfile.role === 'employee' && specificProfile) {
      return {
        ...baseUser,
        title: specificProfile.title || '',
        bio: specificProfile.bio || '',
        linkedinUrl: specificProfile.linkedin_url || '',
        resumeUrl: specificProfile.resume_url || '',
        resumeFile: specificProfile.resume_file_id || '',
        education: specificProfile.education || '',
        skills: specificProfile.skills || [],
        experienceYears: specificProfile.experience_years || 0,
        phoneNumber: specificProfile.phone_number || '',
        country: specificProfile.country || '',
        city: specificProfile.city || '',
        postalCode: specificProfile.postal_code || '',
        streetAddress: specificProfile.street_address || '',
      };
    }
    return baseUser;
  };

  const fetchData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const authUser = await account.get();
      
      // Get base profile
      const userProfileList = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userProfilesCollection,
        [Query.equal('user_id', authUser.$id)]
      );
      const userProfile = userProfileList.documents[0];

      let specificProfile = null;
      if (userProfile) {
        const collectionId = userProfile.role === 'company' 
          ? appwriteConfig.companyProfilesCollection 
          : appwriteConfig.employeeProfilesCollection;
        
        const specificList = await databases.listDocuments(
          appwriteConfig.databaseId,
          collectionId,
          [Query.equal('user_id', authUser.$id)]
        );
        specificProfile = specificList.documents[0];
      }

      // Fetch public jobs
      const jobsList = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.jobsCollection,
        [Query.orderDesc('created_at')]
      );
      const normalizedJobs = jobsList.documents.map(normalizeJob);
      
      // Fetch private data
      let applications: any[] = [];
      let notifications: any[] = [];
      let savedJobIds: string[] = [];
      let savedJobDates: Record<string, string> = {};

      if (userProfile) {
        try {
          if (userProfile.role === 'company') {
            const myJobs = jobsList.documents.filter(j => j.company_user_id === authUser.$id).map(j => j.$id);
            if (myJobs.length > 0) {
              const appsList = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.applicationsCollection, [Query.equal('job_id', myJobs)]);
              applications = appsList.documents;
            }
          } else {
            const appsList = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.applicationsCollection, [Query.equal('employee_user_id', authUser.$id)]);
            applications = appsList.documents;
            
            const savedList = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.savedJobsCollection, [Query.equal('user_id', authUser.$id)]);
            savedJobIds = savedList.documents.map(d => d.job_id);
            savedList.documents.forEach(d => {
              savedJobDates[d.job_id] = d.saved_at;
            });
          }

          const notifsList = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.notificationsCollection, [Query.equal('user_id', authUser.$id), Query.orderDesc('created_at')]);
          notifications = notifsList.documents;
        } catch (e) {
          console.warn("Could not fetch private data", e);
        }
      }

      const normalizedUser = normalizeUser(authUser, userProfile, specificProfile);

      setState(prev => ({
        ...prev,
        currentUser: { ...normalizedUser, savedJobs: savedJobIds },
        profileData: specificProfile,
        savedJobs: savedJobIds,
        savedJobDates,
        jobs: normalizedJobs,
        applications: applications.map(a => ({ id: a.$id, ...a })) as any,
        notifications: notifications.map(n => ({ id: n.$id, ...n })) as any,
        loading: false,
        appError: null
      }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false,
        appError: error.message || "We couldn't connect to the server."
      }));
    }
  };

  const clearError = () => setState(prev => ({ ...prev, appError: null }));
  const retryFetchData = () => fetchData();

  const login = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password);
      
      const user = await account.get();
      if (!user.emailVerification) {
        await account.deleteSession('current');
        throw new Error("Please verify your email address before logging in.");
      }

      await fetchData();
      toast.success(`Welcome back!`);
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to login'}`);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
    } catch (error) {}
    setState(defaultState);
    toast.success('Logged out successfully');
  };

  const register = async (userData: any) => {
    try {
      const newAccount = await account.create(ID.unique(), userData.email, userData.password, userData.name);
      await account.createEmailPasswordSession(userData.email, userData.password);

      // Create profile entries
      const role = userData.role || 'employee';
      const locationString = [userData.city, userData.country].filter(Boolean).join(', ');

      await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.userProfilesCollection, ID.unique(), {
        user_id: newAccount.$id,
        role: role,
        setup_completed: false,
        location: locationString,
        created_at: new Date().toISOString(),
      });

      if (role === 'employee') {
        await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.employeeProfilesCollection, ID.unique(), {
          user_id: newAccount.$id,
          experience_years: 0,
          phone_number: userData.phone || '',
          city: userData.city || '',
          country: userData.country || ''
        });
      } else {
        await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.companyProfilesCollection, ID.unique(), {
          user_id: newAccount.$id,
          company_name: userData.name,
          contact_phone: userData.phone || ''
        });
      }

      // Send verification email manually using Django backend
      try {
        await fetch('http://localhost:8000/api/auth/send-verification/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userData.email,
            name: userData.name,
            appwrite_id: newAccount.$id
          })
        });
      } catch (emailErr) {
        console.error("Failed to send custom verification email", emailErr);
      }

      // Log out to enforce email verification before accessing app
      await account.deleteSession('current');

      toast.success('Account created! Please check your email to verify your account.');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to register'}. Please try again.`);
      throw error;
    }
  };

  const postJob = async (jobData: any) => {
    try {
      if (!state.currentUser) throw new Error('Not logged in');
      const payload = {
        company_user_id: state.currentUser.id,
        company_name: (state.currentUser as CompanyProfile).companyName || state.currentUser.name,
        company_logo_url: (state.currentUser as CompanyProfile).logoUrl || '',
        company_is_verified: true,
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements || [],
        employment_type: jobData.employment_type || 'Full-time',
        is_remote: jobData.isRemote || false,
        location: jobData.location || '',
        salary_range: jobData.salaryRange || '',
        commission_range: jobData.commissionRange || '',
        currency: jobData.currency || 'USD',
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const newJobRaw = await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.jobsCollection, ID.unique(), payload);
      const newJob = normalizeJob(newJobRaw);
      setState(prev => ({ ...prev, jobs: [newJob, ...prev.jobs] }));
      toast.success('Job posted successfully!', { description: 'You will be notified once the job listing is approved.' });
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to post job'}. Please try again.`);
    }
  };

  const applyForJob = async (jobId: string, coverLetter?: string) => {
    try {
      if (!state.currentUser) throw new Error('Not logged in');
      const job = state.jobs.find(j => j.id === jobId);
      if (!job) throw new Error('Job not found');

      const payload = {
        job_id: jobId,
        job_title: job.title,
        company_name: job.companyName,
        employee_user_id: state.currentUser.id,
        employee_name: state.currentUser.name,
        status: 'pending',
        cover_letter: coverLetter || '',
        applied_at: new Date().toISOString(),
      };

      const newApp = await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.applicationsCollection, ID.unique(), payload);
      setState(prev => ({ ...prev, applications: [{ id: newApp.$id, ...newApp } as any, ...prev.applications] }));
      toast.success('Application submitted successfully');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to apply'}. Please try again.`);
    }
  };

  const updateJobStatus = async (jobId: string, status: Job['status']) => {
    try {
      await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.jobsCollection, jobId, { status });
      setState(prev => ({ ...prev, jobs: prev.jobs.map(j => j.id === jobId ? { ...j, status } : j) }));
      toast.success(`Job ${status}`);
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to update status'}. Please try again.`);
    }
  };

  const updateApplicationStatus = async (appId: string, status: Application['status']) => {
    try {
      const app = state.applications.find(a => (a as any).$id === appId || a.id === appId);
      if (!app) throw new Error('Application not found');

      await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.applicationsCollection, appId, { status });
      
      // Notify employee
      await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.notificationsCollection, ID.unique(), {
        user_id: (app as any).employee_user_id,
        title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your application for "${(app as any).job_title}" has been ${status}.`,
        read: false,
        created_at: new Date().toISOString(),
      });

      setState(prev => ({ ...prev, applications: prev.applications.map(a => a.id === appId ? { ...a, status } : a) }));
      toast.success(`Application ${status}`);
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to update application'}. Please try again.`);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.notificationsCollection, id, { read: true });
      setState(prev => ({ ...prev, notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
    } catch (error: any) {
      console.error('Failed to mark read', error);
    }
  };

  const generateCV = async (formData: any) => {
    try {
      // Forward to Django API
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
      if (!state.currentUser) return;
      const uploadedFile = await storage.createFile(appwriteConfig.filesBucketId, ID.unique(), file);
      const avatarUrl = storage.getFileView(appwriteConfig.filesBucketId, uploadedFile.$id).toString();

      // Update users_profile
      const userProfileList = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.userProfilesCollection, [Query.equal('user_id', state.currentUser.id)]);
      if (userProfileList.documents[0]) {
        await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.userProfilesCollection, userProfileList.documents[0].$id, { avatar_url: avatarUrl });
      }

      if (state.currentUser.role === 'company' && state.profileData) {
         await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.companyProfilesCollection, state.profileData.$id, { logo_url: avatarUrl });
      }

      await fetchData();
      toast.success('Profile picture updated!');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to upload profile picture'}. Please try again.`);
    }
  };

  const updateProfile = async (profileData: any) => {
    try {
      if (!state.currentUser || !state.profileData) return;
      
      const payload: any = {};
      // Map frontend fields to Appwrite fields
      if (profileData.title !== undefined) payload.title = profileData.title;
      if (profileData.bio !== undefined) payload.bio = profileData.bio;
      if (profileData.linkedinUrl !== undefined) payload.linkedin_url = profileData.linkedinUrl;
      if (profileData.resumeUrl !== undefined) payload.resume_url = profileData.resumeUrl;
      if (profileData.education !== undefined) payload.education = profileData.education;
      if (profileData.skills !== undefined) payload.skills = profileData.skills;
      if (profileData.experienceYears !== undefined) payload.experience_years = profileData.experienceYears;
      if (profileData.phoneNumber !== undefined) payload.phone_number = profileData.phoneNumber;
      if (profileData.country !== undefined) payload.country = profileData.country;
      if (profileData.city !== undefined) payload.city = profileData.city;
      if (profileData.postalCode !== undefined) payload.postal_code = profileData.postalCode;
      if (profileData.streetAddress !== undefined) payload.street_address = profileData.streetAddress;
      
      if (profileData.companyName !== undefined) payload.company_name = profileData.companyName;
      if (profileData.website !== undefined) payload.website = profileData.website;
      if (profileData.industry !== undefined) payload.industry = profileData.industry;
      if (profileData.description !== undefined) payload.description = profileData.description;
      if (profileData.contactEmail !== undefined) payload.contact_email = profileData.contactEmail;
      if (profileData.contactPhone !== undefined) payload.contact_phone = profileData.contactPhone;

      const collectionId = state.currentUser.role === 'company' ? appwriteConfig.companyProfilesCollection : appwriteConfig.employeeProfilesCollection;
      
      await databases.updateDocument(appwriteConfig.databaseId, collectionId, state.profileData.$id, payload);

      // Update main users_profile if needed
      if (profileData.location !== undefined || profileData.setupCompleted !== undefined) {
         const userProfileList = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.userProfilesCollection, [Query.equal('user_id', state.currentUser.id)]);
         if (userProfileList.documents[0]) {
           await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.userProfilesCollection, userProfileList.documents[0].$id, {
             ...(profileData.location !== undefined && { location: profileData.location }),
             ...(profileData.setupCompleted !== undefined && { setup_completed: profileData.setupCompleted })
           });
         }
      }

      await fetchData();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to update profile'}. Please try again.`);
      throw error;
    }
  };

  const uploadResume = async (file: File) => {
    try {
      if (!state.currentUser) return;
      const uploadedFile = await storage.createFile(appwriteConfig.filesBucketId, ID.unique(), file);
      const resumeUrl = storage.getFileView(appwriteConfig.filesBucketId, uploadedFile.$id).toString();

      // Forward to Django for parsing
      const formData = new FormData();
      formData.append('resume', file);
      
      let parsed = null;
      try {
        const parseRes = await apiFetch('/profile/resume/upload/', {
          method: 'POST',
          headers: {}, // Remove Content-Type so browser sets boundary for FormData
          body: formData as any,
        });
        parsed = parseRes?.parsed;
      } catch (e) {
        console.warn('Django resume parsing failed', e);
      }

      if (state.profileData && state.currentUser.role === 'employee') {
        await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.employeeProfilesCollection, state.profileData.$id, { 
          resume_url: resumeUrl,
          resume_file_id: uploadedFile.$id,
          ...(parsed ? { 
            title: parsed.title,
            bio: parsed.bio,
            skills: parsed.skills,
            education: parsed.education,
            experience_years: parsed.experience_years,
            phone_number: parsed.phone_number
           } : {})
        });
        
        if (parsed?.location) {
           const userProfileList = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.userProfilesCollection, [Query.equal('user_id', state.currentUser.id)]);
           if (userProfileList.documents[0]) {
             await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.userProfilesCollection, userProfileList.documents[0].$id, { location: parsed.location });
           }
        }
      }

      await fetchData();
      return { parsed };
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to upload resume'}.`);
      throw error;
    }
  };

  const changePassword = async (data: any) => {
    try {
      await account.updatePassword(data.new_password, data.old_password);
      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to change password'}. Please try again.`);
      throw error;
    }
  };

  const sendPasswordRecovery = async (email: string) => {
    try {
      const res = await fetch(`${(import.meta as any).env.VITE_API_URL}/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send recovery email');
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to send recovery email'}.`);
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string, passwordConfirm: string) => {
    try {
      // For Django custom flow, we use the token
      const res = await fetch(`${(import.meta as any).env.VITE_API_URL}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword, passwordConfirm })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      toast.success('Password reset successfully! You can now log in.');
    } catch (error: any) {
      toast.error(`${error.message || 'Failed to reset password'}.`);
      throw error;
    }
  };

  const toggleSavedJob = async (jobId: string) => {
    try {
      if (!state.currentUser) return;
      
      const savedList = await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.savedJobsCollection, [
        Query.equal('user_id', state.currentUser.id),
        Query.equal('job_id', jobId)
      ]);

      if (savedList.documents.length > 0) {
        // Unsave
        await databases.deleteDocument(appwriteConfig.databaseId, appwriteConfig.savedJobsCollection, savedList.documents[0].$id);
        setState(prev => {
          const newDates = { ...prev.savedJobDates };
          delete newDates[jobId];
          return {
            ...prev,
            savedJobs: prev.savedJobs.filter(id => id !== jobId),
            savedJobDates: newDates
          };
        });
        toast.info('Job removed from saved');
      } else {
        // Save
        const now = new Date().toISOString();
        await databases.createDocument(appwriteConfig.databaseId, appwriteConfig.savedJobsCollection, ID.unique(), {
          user_id: state.currentUser.id,
          job_id: jobId,
          saved_at: now
        });
        setState(prev => ({
          ...prev,
          savedJobs: [...prev.savedJobs, jobId],
          savedJobDates: { ...prev.savedJobDates, [jobId]: now }
        }));
        toast.success('Job saved successfully!');
      }
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