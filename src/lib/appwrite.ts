import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '6a228524002b449caeac';

export const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Environment variables
export const appwriteConfig = {
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'quota_hire_db',
    userProfilesCollection: import.meta.env.VITE_APPWRITE_COL_USERS_PROFILE || 'users_profile',
    employeeProfilesCollection: import.meta.env.VITE_APPWRITE_COL_EMPLOYEE_PROFILES || 'employee_profiles',
    companyProfilesCollection: import.meta.env.VITE_APPWRITE_COL_COMPANY_PROFILES || 'company_profiles',
    jobsCollection: import.meta.env.VITE_APPWRITE_COL_JOBS || 'jobs',
    applicationsCollection: import.meta.env.VITE_APPWRITE_COL_APPLICATIONS || 'applications',
    notificationsCollection: import.meta.env.VITE_APPWRITE_COL_NOTIFICATIONS || 'notifications',
    savedJobsCollection: import.meta.env.VITE_APPWRITE_COL_SAVED_JOBS || 'saved_jobs',
    filesBucketId: import.meta.env.VITE_APPWRITE_BUCKET_FILES || 'quota_hire_files',
};

// Re-export ID and Query for convenience
export { ID, Query };
