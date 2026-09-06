"""
Quota Hire — test settings.

Import the real settings, then force every external dependency to a local,
in-process stand-in. This module exists so that running the test suite can
NEVER reach the production Postgres, Redis, or mail provider, regardless of
what happens to be in backend/.env at the time.

Run with:
    python manage.py test --settings=quotahire.settings_test
"""

from .settings import *  # noqa: F401,F403

# ── Database ─────────────────────────────────────────────────────────────────
# Hard-coded sqlite. Not read from any environment variable, so a stray
# DATABASE_URL cannot redirect the suite at a real server.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'ATOMIC_REQUESTS': False,
        'AUTOCOMMIT': True,
        'CONN_MAX_AGE': 0,
        'OPTIONS': {},
        'TIME_ZONE': None,
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': '',
        'TEST': {'NAME': None, 'MIRROR': None, 'CHARSET': None, 'COLLATION': None},
    }
}

# ── Cache ────────────────────────────────────────────────────────────────────
# Local memory, per-process. DRF throttling stores its counters here, so
# throttle behaviour is genuinely exercised rather than stubbed out.
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'qh-test',
    }
}

# ── Email ────────────────────────────────────────────────────────────────────
# Replaces the ZeptoMail REST backend. Messages land in django.core.mail.outbox
# so tests can assert on them, and nothing is sent over the network.
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# ── Celery ───────────────────────────────────────────────────────────────────
# Run tasks inline; no broker required.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# ── Misc ─────────────────────────────────────────────────────────────────────
SECRET_KEY = 'test-only-key-not-used-anywhere-real'
DEBUG = False
ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']

# Security middleware would 301 every test request to https otherwise.
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0

# Keep uploads off Cloudinary and out of the real media directory.
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.InMemoryStorage'},
    'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
}

# Fast, deterministic password hashing — the suite creates a lot of users.
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

# The post_migrate hook in api/apps.py creates a superuser on every migrate.
# Tests migrate a fresh database, so give it an explicit password here rather
# than letting it fall back to a default.
import os  # noqa: E402

os.environ.setdefault('DJANGO_SUPERUSER_PASSWORD', 'test-superuser-password')
