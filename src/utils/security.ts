/**
 * Security utilities for frontend validation and sanitization.
 */

// Regex patterns to block XSS and malicious characters
export const strictNoHtmlRegex = /^[^<>]*$/;
export const strictNameRegex = /^[a-zA-Z\s.,'-]+$/;

// Error messages for validation
export const ERROR_MSGS = {
  NO_HTML: "HTML tags (<, >) are not allowed.",
  INVALID_NAME: "Only letters and basic punctuation (.,'-) are allowed.",
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
