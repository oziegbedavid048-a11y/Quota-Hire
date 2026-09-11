/**
 * What an employee must complete before applying for a job.
 *
 * This is the single source of truth for two things that used to disagree:
 * the checklist on the profile page, and the check the Apply button runs.
 * When they disagreed the page showed every section complete while Apply still
 * refused, with no way for the applicant to tell what was wrong.
 *
 * The rule now is simply: if every card on the profile page is ticked, Apply
 * works. The page renders these requirements, and the Apply gate reads the same
 * list, so the two cannot drift apart.
 *
 * History worth knowing: the previous version demanded a phone number AND a
 * location, a bio of at least twenty characters, and education OR years of
 * experience — none of which the profile page asked for or showed. Before that,
 * a percentage score gated Apply at 100%, which was unreachable because an
 * uploaded CV was invisible to it.
 */

export interface ProfileRequirement {
  /** Matches the section key on the profile page, so a caller can deep-link. */
  key: string;
  /** The exact label shown on the profile page card. */
  label: string;
  filled: boolean;
}

export interface ProfileCompletion {
  complete: boolean;
  /** Labels of the sections still to fill, in page order. */
  missing: string[];
  requirements: ProfileRequirement[];
}

/** Non-empty, ignoring whitespace-only strings and empty arrays. */
const filled = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
};

/**
 * The required sections, in the order they appear on the profile page.
 * "My Tailored CVs" is deliberately absent — generating a tailored CV is
 * optional, and applicants can do it during the application itself.
 */
export const getProfileRequirements = (profile: any): ProfileRequirement[] => {
  const p = profile || {};

  // A CV counts by any route. `hasResume` comes from the API and is the only
  // reliable signal: uploading through the app stores the file in resume_binary
  // and leaves resume_url and resume_file empty. The other two are kept as a
  // fallback for a profile cached before that flag existed.
  const hasCv = Boolean(p.hasResume) || filled(p.resumeUrl) || filled(p.resumeFile);

  return [
    {
      key: 'contact',
      label: 'Personal Details',
      // Either is enough, matching the profile page card.
      filled: filled(p.location) || filled(p.phoneNumber),
    },
    { key: 'resume',         label: 'Smart Resume Upload', filled: hasCv },
    { key: 'bio',            label: 'About You (Bio)',     filled: filled(p.bio) },
    { key: 'qualifications', label: 'Skills & Expertise',  filled: filled(p.skills) },
    { key: 'experience',     label: 'Work Experience',     filled: filled(p.title) },
    { key: 'education',      label: 'Education',           filled: filled(p.education) },
  ];
};

export const getProfileCompletion = (profile: any): ProfileCompletion => {
  // No profile loaded yet is not the same as an incomplete one. Callers must
  // wait for the profile before judging it, or every user sees the prompt on
  // first paint.
  const requirements = getProfileRequirements(profile);
  const missing = requirements.filter((r) => !r.filled).map((r) => r.label);
  return { complete: missing.length === 0, missing, requirements };
};

export const isProfileComplete = (profile: any): boolean =>
  getProfileCompletion(profile).complete;
