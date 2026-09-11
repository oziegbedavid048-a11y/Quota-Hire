/**
 * Is an employee's profile complete enough to apply for a job?
 *
 * This replaces calculateProfileStrength(), which returned a percentage that was
 * shown as a "Profile Strength" meter and a scrolling banner, and was also used
 * to gate the Apply button with `score < 100`.
 *
 * Two problems with that:
 *
 *  1. It could not reach 100. Twenty of the hundred points came from
 *     `resumeUrl || resumeFile`, but uploading a CV through the app writes it to
 *     `resume_binary` and leaves both of those empty, so the points were never
 *     awarded. Applicants with a genuinely complete profile were told it was
 *     incomplete and blocked from applying.
 *
 *  2. A percentage is the wrong answer to "why can't I apply?". It tells someone
 *     they are at 85% without saying what is missing.
 *
 * So this returns the list of what is actually missing, and the caller shows
 * those field names. The backend now reports `has_resume`, which is true if a CV
 * exists by any route, so the resume check finally works.
 */

export interface ProfileCompletion {
  /** True when nothing is outstanding. */
  complete: boolean;
  /** Human-readable names of the sections still to fill in, in page order. */
  missing: string[];
}

/**
 * Whether a field has actually been filled in, ignoring whitespace-only strings
 * and empty arrays.
 *
 * Numbers must be greater than zero. The only numeric field here is
 * experienceYears, where 0 is the untouched default rather than a real answer —
 * treating it as filled would let an empty profile past the check.
 */
const filled = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
};

/**
 * The sections an employee must complete before applying. Each entry is checked
 * against the profile object the app already holds, so no extra request is made.
 */
export const getProfileCompletion = (profile: any): ProfileCompletion => {
  if (!profile) return { complete: false, missing: ['Your profile'] };

  const missing: string[] = [];

  if (!filled(profile.name)) missing.push('Full name');
  if (!filled(profile.phoneNumber)) missing.push('Phone number');
  if (!filled(profile.location) && !(filled(profile.city) && filled(profile.country))) {
    missing.push('Location');
  }
  if (!filled(profile.title)) missing.push('Professional headline');
  // A one-word bio is not an "About you"; ask for a real sentence.
  if (!filled(profile.bio) || String(profile.bio).trim().length < 20) {
    missing.push('About you');
  }
  if (!filled(profile.skills)) missing.push('Skills and expertise');
  if (!filled(profile.education) && !filled(profile.experienceYears)) {
    missing.push('Education or work experience');
  }
  // hasResume comes from the API and is true for an uploaded file, a stored
  // binary, or an external link. The two legacy fields are kept as a fallback so
  // a cached profile fetched before this field existed still works.
  if (!profile.hasResume && !filled(profile.resumeUrl) && !filled(profile.resumeFile)) {
    missing.push('CV / resume');
  }

  return { complete: missing.length === 0, missing };
};

/** Convenience wrapper for the common yes/no question. */
export const isProfileComplete = (profile: any): boolean =>
  getProfileCompletion(profile).complete;
