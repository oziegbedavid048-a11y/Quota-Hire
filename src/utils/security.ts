/**
 * Security utilities for frontend validation and sanitization.
 */

// Regex patterns to block XSS and malicious characters
export const strictNoHtmlRegex = /^[^<>]*$/;

// Personal and company names.
//
// This used to be /^[a-zA-Z\s.,'-]+$/, which allowed only unaccented A-Z. That
// rejected a large share of real signups at step 1 of the form: every company
// name containing a digit, an ampersand or a bracket ("9mobile Nigeria (Ltd) &
// Co", "H&M", "3M"), and every personal name outside plain ASCII ("José",
// "Müller", "Adébáyọ̀"). The backend accepts all of them, so the rule cost
// signups without protecting anything.
//
// The allowlist is now Unicode-aware: letters (\p{L}) and the combining marks
// that tonal and accented scripts need (\p{M}), digits (\p{N}), whitespace,
// and the punctuation that legitimately appears in names. Angle brackets are
// still excluded, so the anti-markup intent of the original rule is kept.
export const strictNameRegex = /^[\p{L}\p{M}\p{N}\s.,'’\-&()/+]+$/u;

// Error messages for validation
export const ERROR_MSGS = {
  NO_HTML: "HTML tags (<, >) are not allowed.",
  INVALID_NAME: "Please use letters, numbers and standard punctuation only.",
  REQUIRED: "This field is required.",
};

/**
 * Calculates the strength of a password and returns a score from 0 to 4.
 * 0: Very Weak
 * 1: Weak
 * 2: Fair
 * 3: Good
 * 4: Strong
 */
export const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  let score = 0;
  
  // Length > 8
  if (password.length >= 8) score += 1;
  
  // Contains lowercase and uppercase
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  
  // Contains number
  if (/\d/.test(password)) score += 1;
  
  // Contains special character
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  return score;
};
