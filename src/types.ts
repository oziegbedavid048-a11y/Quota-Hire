export type UserRole = 'employee' | 'company' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  setupCompleted: boolean;
  isVerified?: boolean;
  savedJobs?: number[];
}

export interface EmployeeProfile extends User {
  role: 'employee';
  title?: string;
  bio?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  resumeFile?: string;
  education?: string;
  skills?: string[];
  experienceYears?: number;
  phoneNumber?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  streetAddress?: string;
  generatedCv?: {
    summary: string;
    experience: string[];
    education: string;
    skills: string[];
    raw?: any;
  };
}

export interface CompanyProfile extends User {
  role: 'company';
  companyName: string;
  website?: string;
  industry?: string;
  description?: string;
  logoUrl?: string;
}

export type JobStatus = 'pending' | 'approved' | 'rejected' | 'closed';

export interface Job {
  id: string;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string;
  companyIsVerified?: boolean;
  title: string;
  description: string;
  requirements: string[];
  employment_type?: string;
  isRemote: boolean;
  location?: string;
  currency?: string;
  salaryRange?: string;
  commissionRange?: string;
  status: JobStatus;
  createdAt: string;
}

export type ApplicationStatus = 'pending' | 'under_review' | 'interview' | 'decision' | 'accepted' | 'rejected';

export interface Application {
  id: string;
  job: string;
  job_title: string;
  company_name: string;
  employee: string;
  employee_name: string;
  status: ApplicationStatus;
  applied_at: string;
  cover_letter?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}