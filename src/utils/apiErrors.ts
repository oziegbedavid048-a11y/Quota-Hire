/**
 * Rate-limit handling for the auth screens.
 *
 * Registration is capped at 10 accounts per IP per hour and login at 20
 * attempts per IP per hour. When a cap is hit, DRF answers HTTP 429 with a
 * body like:
 *
 *   {"detail": "Request was throttled. Expected available in 3600 seconds."}
 *
 * The signup form used to classify failures by searching the message for a
 * handful of words ("starting up", "already exists", "password", "connect").
 * The throttle string matched none of them, so it fell through to the generic
 * "Something went wrong. Please try again." — shown next to a Try Again button
 * that could not possibly succeed for another hour.
 *
 * Shared public IPs make this an ordinary-user problem, not an abuse problem:
 * mobile carriers, offices and campuses put many people behind one address, so
 * the eleventh person to sign up on that network is turned away with no idea
 * why. These helpers key off the HTTP status rather than prose, so the message
 * stays correct even if DRF rewords its detail string.
 */

/** Anything ApiError-shaped: a message plus the HTTP status that produced it. */
interface StatusError {
  message?: string;
  status?: number;
}

/** True when the request was refused by a rate limit. */
export const isRateLimited = (error: unknown): boolean => {
  const e = error as StatusError | null;
  if (!e) return false;
  if (e.status === 429) return true;
  // Fallback for callers that lose the status: DRF's own wording.
  return /throttl/i.test(e.message || '');
};

/** Seconds until the caller may retry, read out of DRF's detail string. */
export const rateLimitRetrySeconds = (error: unknown): number | null => {
  const message = (error as StatusError | null)?.message || '';
  const match = /available in (\d+)\s*second/i.exec(message);
  if (!match) return null;
  const seconds = Number.parseInt(match[1], 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
};

/** 3600 → "about 1 hour"; 90 → "about 2 minutes"; 20 → "a few seconds". */
export const formatRetryWait = (seconds: number | null): string => {
  if (seconds === null || seconds <= 45) return 'a few seconds';
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `about ${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.ceil(minutes / 60);
  return `about ${hours} hour${hours === 1 ? '' : 's'}`;
};

/**
 * The message to show for a rate-limited request. `activity` completes the
 * sentence "Too many <activity> from your network" — e.g. "sign-up attempts".
 */
export const rateLimitMessage = (error: unknown, activity: string): string =>
  `Too many ${activity} from your network. This limit is shared by everyone on ` +
  `the same internet connection, so it can be reached even if this is your first try. ` +
  `Please try again in ${formatRetryWait(rateLimitRetrySeconds(error))}.`;
