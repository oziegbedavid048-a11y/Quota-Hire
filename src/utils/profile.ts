import { EmployeeProfile } from '../types';

export const calculateProfileStrength = (profile: any): number => {
  if (!profile || profile.role !== 'employee') return 0;
  
  let completionScore = 10; // Base score for signing up

  // Personal Info (10%)
  if (profile.name && profile.phoneNumber && profile.location) completionScore += 10;

  // Professional Headline (15%)
  if (profile.title) completionScore += 15;

  // Professional Summary / Bio (15%)
  if (profile.bio && profile.bio.length > 10) completionScore += 15;

  // Core Skills (20%)
  if (profile.skills && profile.skills.length > 0) completionScore += 20;

  // Experience & Education (10%)
  if (profile.experienceYears > 0 || profile.education) completionScore += 10;

  // Resume (20%)
  if (profile.resumeUrl || profile.resumeFile) completionScore += 20;
  
  return Math.min(completionScore, 100);
};
