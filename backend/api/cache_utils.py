"""
Quota Hire — Cache Utilities
============================
Central module for all caching logic.

Features:
  - safe_get / safe_set / safe_delete  → never crash if Redis is down
  - safe_delete_many                   → one Redis round-trip to clear multiple keys
  - safe_get_or_set                    → atomic stampede lock via cache.add (Redis SETNX)
  - invalidate_jobs_cache              → clears every known job-list variant + optional detail key
  - dashboard_key                      → per-user analytics cache key

All public functions degrade gracefully: if Redis is unavailable they log
a warning and return a safe default — the app keeps working, just without
the cache benefit.
"""

import logging
from django.core.cache import cache

logger = logging.getLogger(__name__)

# ── TTL constants (centralised here so they are easy to tune) ─────────────────

JOBS_LIST_TTL  = 60     # seconds — public job list (invalidated on every job save)
JOB_DETAIL_TTL = 60     # seconds — single job detail
DASHBOARD_TTL  = 60     # seconds — per-user analytics (fresh enough for live data)
RATE_TTL       = 3600   # seconds — EUR/NGN exchange rate (1 hour)

# ── Key builders ──────────────────────────────────────────────────────────────
# Note: django-redis prepends KEY_PREFIX:VERSION: automatically, so these
# plain strings become e.g. "qh:1:jobs_list:all" in Redis.

def jobs_list_key(remote: str = '') -> str:
    """Cache key for the public job list (page 1 only, optional remote filter)."""
    return f"jobs_list:{remote or 'all'}"


def job_detail_key(pk) -> str:
    """Cache key for a single approved job response."""
    return f"job_detail:{pk}"


def dashboard_key(user_pk, role: str) -> str:
    """Per-user analytics cache key — scoped by role so company ≠ employee."""
    return f"dashboard:{role}:{user_pk}"


# ── Known job-list cache key variants (used for bulk invalidation) ────────────
# These are the ONLY variants we cache (page 1 of each remote-filter option).
# Search-filtered requests are never cached — so there are no other variants.

_JOB_LIST_CACHE_VARIANTS = [
    jobs_list_key(''),       # /api/jobs/          — all approved jobs
    jobs_list_key('true'),   # /api/jobs/?remote=true
    jobs_list_key('false'),  # /api/jobs/?remote=false
]


# ── Safe cache primitives ─────────────────────────────────────────────────────

def safe_get(key: str, default=None):
    """
    Read from cache. Returns `default` if Redis is down or key missing.
    Never raises.
    """
    try:
        return cache.get(key, default)
    except Exception as exc:
        logger.warning("Cache GET failed key=%s: %s", key, exc)
        return default


def safe_set(key: str, value, ttl: int = 60):
    """
    Write to cache. Silently skips if Redis is down.
    Never raises.
    """
    try:
        cache.set(key, value, ttl)
    except Exception as exc:
        logger.warning("Cache SET failed key=%s: %s", key, exc)


def safe_delete(key: str):
    """
    Delete a single cache key. Silently skips if Redis is down.
    Never raises.
    """
    try:
        cache.delete(key)
    except Exception as exc:
        logger.warning("Cache DELETE failed key=%s: %s", key, exc)


def safe_delete_many(keys: list):
    """
    Delete multiple cache keys in one Redis round-trip.
    Silently skips if Redis is down. Never raises.
    """
    if not keys:
        return
    try:
        cache.delete_many(keys)
        logger.debug("Cache: deleted %d key(s): %s", len(keys), keys)
    except Exception as exc:
        logger.warning("Cache DELETE_MANY failed: %s", exc)


# ── Stampede-safe get-or-set ──────────────────────────────────────────────────

def safe_get_or_set(key: str, compute_fn, ttl: int = 60, lock_ttl: int = 10):
    """
    Cache-aside pattern with a distributed lock to prevent cache stampede.

    On a cache miss:
      1. Tries to acquire an atomic Redis lock via cache.add() (SET NX).
      2. The winner calls compute_fn(), writes the result, releases the lock.
      3. Other concurrent callers also call compute_fn() as a fallback
         (safe — compute_fn must be idempotent; worst case: 2 calls instead of N).

    If Redis is completely down: skips the lock, calls compute_fn() directly,
    skips the write — app still works, just without caching.

    Returns the computed value. Never raises.
    """
    # Fast path — cache hit
    value = safe_get(key)
    if value is not None:
        return value

    lock_key = f"{key}:__lock__"
    acquired = False
    try:
        # cache.add() is atomic SET NX — only one concurrent caller gets True
        acquired = cache.add(lock_key, '1', lock_ttl)
    except Exception:
        pass  # Redis down — proceed without lock, compute directly

    try:
        value = compute_fn()
        safe_set(key, value, ttl)
    finally:
        if acquired:
            safe_delete(lock_key)

    return value


# ── High-level invalidation helpers ──────────────────────────────────────────

def invalidate_jobs_cache(job_pk=None):
    """
    Clear all public job-list cache entries plus an optional job detail entry.

    Call this whenever any Job is created, saved, or status-changed.
    Covers all code paths: API views, Django admin panel, management commands.

    Uses delete_many → single Redis round-trip.
    """
    keys = list(_JOB_LIST_CACHE_VARIANTS)
    if job_pk is not None:
        keys.append(job_detail_key(job_pk))
    safe_delete_many(keys)
    logger.info("Cache: jobs invalidated (job_pk=%s, %d key(s) cleared)", job_pk, len(keys))
