"""
Quota Hire Django Settings
"""

from pathlib import Path
from decouple import config
from datetime import timedelta
import dj_database_url
import sentry_sdk
from posthog import Posthog


BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = config('DEBUG', default=False, cast=bool)
SECRET_KEY = config('SECRET_KEY', default='insecure-dev-key-change-in-production' if DEBUG else '')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY must be set in production")

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'cloudinary_storage',
    'cloudinary',
    'rest_framework',
    'corsheaders',
    # Local
    'api.apps.ApiConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be first
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'quotahire.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'quotahire.wsgi.application'

# Database
DATABASES = {
    'default': config(
        'DATABASE_URL',
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        cast=dj_database_url.parse
    )
}

# Caching (Redis)
REDIS_URL = config('REDIS_URL', default=None)
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
            }
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }

# Custom User Model
AUTH_USER_MODEL = 'api.CustomUser'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# CSRF Trusted Origins for Render (needed for admin login)
CSRF_TRUSTED_ORIGINS = config('CSRF_TRUSTED_ORIGINS', default='https://quotahire-backend.onrender.com,https://quotahire.org,http://localhost,http://127.0.0.1').split(',')

# Media files (uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Cloudinary Storage
CLOUDINARY_URL = config('CLOUDINARY_URL', default=None)
if CLOUDINARY_URL:
    import os
    os.environ['CLOUDINARY_URL'] = CLOUDINARY_URL
    import cloudinary
    cloudinary.config()
    STORAGES["default"]["BACKEND"] = "cloudinary_storage.storage.MediaCloudinaryStorage"

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── Django REST Framework ────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# ── Simple JWT ───────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# ── CORS ─────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='https://quotahire.org,http://quotahire.org,https://oziegbedavid048-a11y.github.io,http://localhost:5173').split(',')
CORS_ALLOW_CREDENTIALS = True

# ── Courier API Settings ──────────────────────────────────────────────────────
COURIER_AUTH_TOKEN = config('COURIER_AUTH_TOKEN', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default="quotahire.recruit@gmail.com")

# ── Sentry Configuration ─────────────────────────────────────────────────────
SENTRY_DSN = config('SENTRY_DSN', default=None)
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        # Set traces_sample_rate to 1.0 to capture 100%
        # of transactions for performance monitoring.
        traces_sample_rate=1.0,
        # Set profiles_sample_rate to 1.0 to profile 100%
        # of sampled transactions.
        # We recommend adjusting this value in production.
        profiles_sample_rate=1.0,
    )

# ── PostHog Configuration ────────────────────────────────────────────────────
POSTHOG_API_KEY = config('POSTHOG_API_KEY', default=None)
POSTHOG_HOST = config('POSTHOG_HOST', default=None)
if POSTHOG_API_KEY and POSTHOG_HOST:
    posthog = Posthog(POSTHOG_API_KEY, host=POSTHOG_HOST)
