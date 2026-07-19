"""
Quota Hire — API Views

Endpoints:
  POST   /api/auth/register/
  POST   /api/auth/login/
  POST   /api/auth/refresh/
  GET    /api/auth/me/
  PUT    /api/auth/me/
  PUT    /api/profile/employee/
  PUT    /api/profile/company/
  GET    /api/jobs/                 (public list of approved jobs)
  POST   /api/jobs/                 (company only)
  GET    /api/jobs/<id>/
  POST   /api/jobs/<id>/apply/      (employee only)
  PUT    /api/jobs/<id>/status/     (admin only)
  GET    /api/applications/         (own applications)
  PUT    /api/applications/<id>/status/  (company only)
  GET    /api/notifications/
  PUT    /api/notifications/<id>/read/
  GET    /api/admin/users/          (admin only)
  GET    /api/admin/jobs/           (admin only — all statuses)
  POST   /api/cv/generate/          (employee only)
  POST   /api/payments/initiate/    (employee only)
  POST   /api/payments/verify/      (employee only)
  POST   /api/payments/webhook/     (Paystack, no auth)
"""

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.mail import EmailMultiAlternatives
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import jwt
import hmac
import hashlib
import secrets
import urllib.request
import urllib.error
import urllib.parse
import json as json_module

import re
import io
import logging
from collections import Counter
from django.utils import timezone
from django.http import HttpResponse
from django.utils.decorators import method_decorator

logger = logging.getLogger(__name__)

from datetime import timedelta
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


# ── Custom Throttle Classes ───────────────────────────────────────────────────

class RegisterThrottle(AnonRateThrottle):
    """Limits new account creation to 10 per IP per hour.
    Prevents email bombing via mass fake-account registration.
    """
    scope = 'register'


class AuthEmailThrottle(AnonRateThrottle):
    """Limits verification and password-reset email sends to 5 per IP per hour.
    Prevents inbox flooding of real users via the open email endpoints.
    """
    scope = 'auth_email'


class UploadThrottle(UserRateThrottle):
    """Limits file uploads (avatar, resume) to 20 per authenticated user per hour.
    Prevents storage exhaustion attacks.
    """
    scope = 'upload'


class PaymentThrottle(UserRateThrottle):
    """Limits payment initialization to 30 requests per user per hour.
    Prevents spamming the payment provider.
    """
    scope = 'payment'


class ApplyThrottle(UserRateThrottle):
    """Limits job applications to 10 per authenticated user per hour.
    Prevents spamming job applications.
    """
    scope = 'apply'


from .models import (
    CustomUser, EmployeeProfile, CompanyProfile, Job, Application,
    Notification, SavedJob, GeneratedCV, PaymentTransaction, DownloadToken,
    PaymentStatus,
    CommunityPost, CommunityComment, CommunityPoll, CommunityPollChoice, CommunityPollVote,
    CommunityReport, CommunityCommentReport,
)

from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
    EmployeeProfileSerializer,
    CompanyProfileSerializer,
    CompanyPublicProfileSerializer,
    JobSerializer,
    ApplicationSerializer,
    NotificationSerializer,
    GeneratedCVSerializer,
    CommunityPostSerializer,
    CommunityCommentSerializer,
    CommunityPollSerializer,
    CommunityPollChoiceSerializer,
    JobListSerializer,
    CompanyApplicantListSerializer,
    ApplicationListSerializer,
    optimize_image_url,
)

# ── Resume Parsing Helpers ───────────────────────────────────────────────

SALES_SKILLS_LIST = [
    'salesforce', 'hubspot', 'zoho', 'pipedrive', 'outreach', 'salesloft', 'gong',
    'zoominfo', 'apollo', 'linkedin sales navigator', 'chorus', 'clari', 'groove',
    'cold calling', 'prospecting', 'lead generation', 'account management',
    'business development', 'closing', 'negotiation', 'pipeline management',
    'territory management', 'quota attainment', 'forecasting', 'upselling', 'cross-selling',
    'meddic', 'bant', 'challenger', 'spin selling', 'sandler', 'solution selling',
    'value selling', 'consultative selling', 'command of the message',
    'b2b', 'b2c', 'saas', 'enterprise sales', 'inside sales', 'field sales',
    'sdr', 'bdr', 'ae', 'account executive', 'crm', 'erp', 'sql', 'python',
    'excel', 'powerpoint', 'tableau', 'data analysis', 'marketing', 'social media',
    'communication', 'teamwork', 'leadership', 'problem solving', 'customer service',
    'project management', 'microsoft office', 'google workspace', 'slack', 'zoom',
]

TITLE_KEYWORDS = [
    'manager', 'executive', 'director', 'officer', 'specialist', 'analyst',
    'engineer', 'developer', 'designer', 'consultant', 'associate', 'coordinator',
    'representative', 'lead', 'head', 'sdr', 'bdr', 'ae', 'vp', 'president', 'founder',
    'supervisor', 'intern', 'assistant',
]

EDU_KEYWORDS = [
    'university', 'college', 'b.sc', 'b.a', 'b.eng', 'mba', 'msc', 'm.a', 'phd',
    'hnd', 'ond', 'bachelor', 'master', 'doctorate', 'diploma', 'degree', 'institute',
    'polytechnic', 'school of', 'faculty of',
]


def extract_text_from_file(file_obj, filename):
    """Extract plain text from PDF or DOCX file."""
    text = ''
    fname = filename.lower()
    file_bytes = file_obj.read()

    if fname.endswith('.pdf'):
        try:
            import fitz  # type: ignore
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                page_text = page.get_text()
                if page_text:
                    text += page_text + '\n'
        except Exception:
            pass

    elif fname.endswith('.docx') or fname.endswith('.doc'):
        try:
            import docx as docx_lib
            doc = docx_lib.Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                text += para.text + '\n'
        except Exception:
            pass

    return text.strip()


def parse_resume_text(text):
    """Parse raw resume text into structured profile fields."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    lower = text.lower()

    # Phone
    phone_match = re.search(r'(\+?[\d][\d\s\-().]{8,15})', text)
    phone = phone_match.group(1).strip() if phone_match else ''

    # Skills
    found_skills = []
    for skill in SALES_SKILLS_LIST:
        if skill in lower and skill.title() not in found_skills:
            found_skills.append(skill.title())

    # Job Title — first short line with a title keyword
    title = ''
    for line in lines[:25]:
        if 5 < len(line) < 80 and any(kw in line.lower() for kw in TITLE_KEYWORDS):
            title = line
            break

    # Education
    edu_lines = []
    for line in lines:
        if any(kw in line.lower() for kw in EDU_KEYWORDS):
            edu_lines.append(line)
    education = '\n'.join(edu_lines[:4])

    # Experience years
    exp_match = re.search(r'(\d+)\+?\s+years?\s+(of\s+)?(experience|exp)', lower)
    experience_years = int(exp_match.group(1)) if exp_match else 0

    # Bio — first paragraph with > 30 words
    bio = ''
    for line in lines:
        if len(line.split()) > 30:
            bio = line
            break
    if not bio and len(lines) >= 3:
        bio = ' '.join(lines[1:4])

    # Location
    location = ''
    loc_patterns = [
        r'([A-Z][a-z]+(?:[\s,]+[A-Z][a-z]+)*,\s*(?:Nigeria|Ghana|UK|USA|Canada|South Africa|Kenya|UAE|US))',
        r'(Lagos|Abuja|Port Harcourt|London|New York|Accra|Nairobi|Dubai|Cape Town|Kano|Ibadan)',
    ]
    for pat in loc_patterns:
        loc_m = re.search(pat, text)
        if loc_m:
            location = loc_m.group(1)
            break

    return {
        'title': title,
        'bio': bio,
        'skills': found_skills[:20],
        'education': education,
        'experience_years': experience_years,
        'phone_number': phone,
        'location': location,
    }


# ── Permission Helpers ────────────────────────────────────────────────────────

class IsEmployee(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'employee'


class IsCompany(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'company'


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'admin'


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — create a new user account."""
    queryset            = CustomUser.objects.all()
    serializer_class    = RegisterSerializer
    permission_classes  = [permissions.AllowAny]
    throttle_classes    = [RegisterThrottle]  # 10 new accounts/IP/hour

    def perform_create(self, serializer):
        from django.db import transaction

        # ── Step 1: Create the user in its own transaction ─────────────────────
        # The email send must NEVER block or roll back the account creation.
        # Even if Celery/Redis/SMTP is down, the user record must persist so
        # they can request a verification resend later.
        with transaction.atomic():
            user = serializer.save()

        # ── Step 2: Send the verification email OUTSIDE the transaction ────────
        # Any exception here is caught and logged only — it never raises back
        # to the caller, so the HTTP 201 response is always returned to the user.
        try:
            from django.conf import settings
            from .email_templates import get_verification_email_html, send_courier_email
            import datetime
            import jwt

            token = jwt.encode({
                'email': user.email,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
            }, settings.SECRET_KEY, algorithm='HS256')

            frontend_url = settings.FRONTEND_URL.strip()
            verify_link = f"{frontend_url}/verify-email?token={token}"
            display_name = user.get_full_name() or user.username

            html_content = get_verification_email_html(user=display_name, redirect=verify_link)
            text_content = (
                f"Hi {display_name},\n\n"
                f"Please verify your email for Quota Hire using this link:\n{verify_link}"
            )

            send_courier_email(
                to_email=user.email,
                subject="Verify your email for Quota Hire",
                text_content=text_content,
                html_content=html_content,
            )
        except Exception as e:
            # Log the failure but DO NOT raise — the account was created successfully.
            # The user will see a "check your email" screen and can request a resend.
            logger.error(
                "Verification email send failed for %s: %s",
                user.email, e, exc_info=True,
            )


class CustomTokenObtainPairView(TokenObtainPairView):
    """POST /api/auth/login/ — returns JWT access + refresh tokens with user info."""
    serializer_class = CustomTokenObtainPairSerializer


class GoogleLoginView(APIView):
    """
    POST /api/auth/google/
    Verifies a Google OAuth ID Token (JWT) sent from the client.
    Logs in the user (if exists) or signs them up directly.
    Returns access + refresh SimpleJWT tokens.
    """
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        token = request.data.get('token')
        role = request.data.get('role', 'employee')  # 'employee' or 'company'
        if not token:
            return Response({'error': 'Google token is required'}, status=status.HTTP_400_BAD_REQUEST)

        if role not in ['employee', 'company']:
            role = 'employee'

        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            from django.conf import settings
            from rest_framework_simplejwt.tokens import RefreshToken
            from .models import CustomUser, EmployeeProfile, CompanyProfile

            # 1. Verify the Google Token
            client_id = getattr(settings, 'GOOGLE_WEB_CLIENT_ID', '')
            if not client_id:
                logger.error("GOOGLE_WEB_CLIENT_ID is not configured in settings.")
                return Response({'error': 'Server configuration error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                client_id
            )

            # 2. Extract profile details
            email = idinfo.get('email')
            if not email:
                return Response({'error': 'Email not provided by Google'}, status=status.HTTP_400_BAD_REQUEST)

            name = idinfo.get('name', '')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')

            # 3. Match or Create User in database
            user = CustomUser.objects.filter(email=email).first()
            created = False

            if not user:
                # Username must be unique, we default to the email address
                import secrets
                user = CustomUser.objects.create_user(
                    username=email,
                    email=email,
                    password=secrets.token_urlsafe(16),
                    role=role,
                    first_name=first_name,
                    last_name=last_name,
                    email_verified=True,  # Google verified it!
                )
                created = True

                # Auto-create the matching profile just like RegisterSerializer does:
                if user.role == 'employee':
                    EmployeeProfile.objects.create(
                        user=user,
                        phone_number='',
                        city='',
                        country=''
                    )
                elif user.role == 'company':
                    comp_name = name if name else email.split('@')[0]
                    CompanyProfile.objects.create(
                        user=user,
                        company_name=comp_name,
                        contact_phone=''
                    )

                # Send the welcome email now that the user has signed up via Google
                try:
                    from .email_templates import get_welcome_email_html, send_courier_email
                    display_name = user.get_full_name() or user.username
                    is_company = user.role == 'company'
                    html_content = get_welcome_email_html(user=display_name, is_company=is_company)
                    send_courier_email(
                        to_email=user.email,
                        subject="Welcome - Quota Hire",
                        text_content=f"Hi {display_name}, your Quota Hire account is now verified. Complete your profile at https://quotahire.org/dashboard",
                        html_content=html_content,
                    )
                except Exception as e:
                    logger.warning(f"Welcome email failed for Google sign-up {user.email}: {e}")
            else:
                # If they already exist, we make sure they are marked verified
                if not user.email_verified:
                    user.email_verified = True
                    user.save(update_fields=['email_verified'])

            # 4. Generate SimpleJWT access & refresh tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'is_new_user': created,
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'role': user.role,
                    'name': user.get_full_name() or user.email,
                }
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            logger.warning(f"Google Token Verification failed: {e}")
            return Response({'error': 'Invalid Google Token'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error during Google authentication: {e}", exc_info=True)
            return Response({'error': 'An unexpected error occurred during Google sign-in'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class MeView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/auth/me/ — get or update the currently logged-in user."""
    serializer_class   = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        user = serializer.save()
        name = self.request.data.get('name')
        if name is not None:
            parts = name.strip().split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
            user.save(update_fields=['first_name', 'last_name'])


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ — update the user's password."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response({'error': 'Incorrect old password.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password updated successfully.'})


class DeleteAccountView(APIView):
    """DELETE /api/auth/delete/ — permanently delete the authenticated user's account."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({'message': 'Account deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


# ── Profile ───────────────────────────────────────────────────────────────────

class EmployeeProfileView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/profile/employee/ — get or update employee profile."""
    serializer_class   = EmployeeProfileSerializer
    permission_classes = [IsEmployee]

    def get_object(self):
        profile, _ = EmployeeProfile.objects.get_or_create(user=self.request.user)
        return profile

    def perform_update(self, serializer):
        serializer.save()
        # Mark user setup as complete
        self.request.user.setup_completed = True
        self.request.user.save(update_fields=['setup_completed'])


class CompanyProfileView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/profile/company/ — get or update company profile."""
    serializer_class   = CompanyProfileSerializer
    permission_classes = [IsCompany]

    def get_object(self):
        profile, _ = CompanyProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'company_name': self.request.user.get_full_name()}
        )
        return profile

    def perform_update(self, serializer):
        serializer.save()
        self.request.user.setup_completed = True
        self.request.user.save(update_fields=['setup_completed'])


class AvatarUploadView(APIView):
    """POST /api/profile/avatar/ — upload a new avatar/logo."""
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes   = [UploadThrottle]  # 20 uploads/user/hour

    # Allowed MIME types for avatar images
    ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
    MAX_AVATAR_SIZE_MB  = 5

    def post(self, request):
        if 'avatar' not in request.FILES:
            return Response({'error': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        avatar_file = request.FILES['avatar']

        # Validate file size (max 5 MB)
        max_bytes = self.MAX_AVATAR_SIZE_MB * 1024 * 1024
        if avatar_file.size > max_bytes:
            return Response(
                {'error': f'Image is too large. Maximum size is {self.MAX_AVATAR_SIZE_MB} MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate MIME type reported by the browser
        content_type = avatar_file.content_type or ''
        if content_type not in self.ALLOWED_IMAGE_TYPES:
            return Response(
                {'error': 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are accepted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        user.avatar = avatar_file
        user.save(update_fields=['avatar'])

        avatar_url = optimize_image_url(request.build_absolute_uri(user.avatar.url))
        return Response({'avatarUrl': avatar_url, 'message': 'Avatar updated successfully!'})

class AIAnalysisView(APIView):
    """GET /api/profile/ai-analysis/ — AI profile coach logic."""
    permission_classes = [IsEmployee]

    def get(self, request):
        user = request.user
        try:
            profile = user.employee_profile
        except EmployeeProfile.DoesNotExist:
            return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        score = 20
        tips = []
        strengths = []

        bio = profile.bio.lower() if profile.bio else ''
        skills = [s.lower() for s in profile.skills]
        exp = profile.experience_years

        # 1. Experience Scoring
        if exp > 5:
            score += 25
            strengths.append("Senior-level Experience")
        elif exp > 2:
            score += 15
            strengths.append("Mid-level Experience Match")
        elif exp > 0:
            score += 5
        else:
            tips.append({"title": "Showcase Internships", "desc": "As an entry-level candidate, ensure you highlight any internships or related coursework in your summary."})

        # 2. Tech Stack Analysis
        core_sales_tools = ['salesforce', 'hubspot', 'outreach', 'salesloft', 'gong', 'zoominfo', 'apollo']
        found_tools = [tool for tool in core_sales_tools if any(tool in s for s in skills) or tool in bio]
        if len(found_tools) >= 2:
            score += 15
            strengths.append(f"Modern Tech Stack ({', '.join(found_tools).title()})")
        elif len(found_tools) == 1:
            score += 5
            tips.append({"title": "Expand Tech Stack", "desc": f"You mentioned {found_tools[0].title()}. Adding proficiency in tools like Outreach, Gong, or ZoomInfo can boost your visibility by 30%."})
        else:
            tips.append({"title": "List CRM Experience", "desc": "Enterprise roles require CRM proficiency. Mention Salesforce or HubSpot explicitly in your skills."})

        # 3. Methodology Matching
        methodologies = ['meddic', 'bant', 'challenger', 'spin', 'sandler', 'command of the message']
        found_methods = [m for m in methodologies if any(m in s for s in skills) or m in bio]
        if found_methods:
            score += 15
            strengths.append(f"Formal Training ({', '.join(found_methods).title()})")
        else:
            tips.append({"title": "Highlight Methodologies", "desc": "Top SaaS companies filter by sales frameworks. If you know MEDDIC, BANT, or Challenger, add it to your profile."})

        # 4. Metrics Detection (The most important in sales)
        metrics_score = 0
        if re.search(r'\$\d+[kmbtKMBT]?', bio) or re.search(r'\d+[kmbtKMBT]?\s?(arr|mrr|revenue|quota)', bio):
            metrics_score += 15
            strengths.append("Revenue Metrics Included")
        if '%' in bio or 'percent' in bio:
            metrics_score += 10
            if "Revenue Metrics Included" not in strengths:
                strengths.append("Performance Metrics Included")

        if metrics_score > 0:
            score += metrics_score
        else:
            tips.append({"title": "Quantify Your Impact", "desc": "Sales managers want to see your numbers. Example: 'Consistently achieved 120% of a $1.5M ARR quota'."})

        # General check
        if not bio:
            tips.append({"title": "Write a Professional Summary", "desc": "A strong summary increases interview requests by 40%. Focus on your quota attainment and typical deal size."})

        # Cap score
        score = min(int(score), 99)

        # Percentile Calculation (Mocking a normal distribution curve based on score)
        if score > 90:
            percentile = 95
        elif score > 80:
            percentile = 85
        elif score > 60:
            percentile = 60
        else:
            percentile = max(10, score - 20)

        if not strengths:
            strengths.append("Profile created")

        return Response({
            'score': score,
            'percentile': percentile,
            'tips': tips[:4],
            'strengths': strengths[:4]
        })





# ── Jobs ──────────────────────────────────────────────────────────────────────

class CompanyJobsView(generics.ListAPIView):
    """GET /api/company/jobs/ — get all jobs for the currently logged-in company (all statuses)."""
    serializer_class = JobSerializer
    permission_classes = [IsCompany]

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'company_profile'):
            return Job.objects.none()
        return Job.objects.filter(company=user).order_by('-created_at')

class JobListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/jobs/ — list approved jobs (public).
        - Cached 60 s for unfiltered and remote-filtered requests (page 1 only).
        - Search queries (?search=) always bypass cache to prevent unbounded
          Redis key growth from search-as-you-type inputs.
        - Cache is invalidated immediately on any Job save via signals.py.
    POST /api/jobs/ — post a new job (company only, starts as pending).
    """
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return JobSerializer
        return JobListSerializer

    def get(self, request, *args, **kwargs):
        from .cache_utils import jobs_list_key, safe_get, safe_set, JOBS_LIST_TTL
        search = request.query_params.get('search', '')
        remote = request.query_params.get('remote', '')
        page   = request.query_params.get('page', '1')

        # Only cache: no free-text search, and only page 1 (the most-visited page).
        # Pages 2+ go direct to DB — they’re rarely hit and the count/next/previous
        # URLs in the paginated response would be wrong if served from a page-1 cache.
        use_cache = (not search) and (page == '1')

        if use_cache:
            cache_key = jobs_list_key(remote=remote)
            cached = safe_get(cache_key)
            if cached is not None:
                return Response(cached)
            response = super().get(request, *args, **kwargs)
            if response.status_code == 200:
                safe_set(cache_key, response.data, ttl=JOBS_LIST_TTL)
            return response

        # Search or paginated requests — always fresh from the database
        return super().get(request, *args, **kwargs)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsCompany()]
        return [permissions.AllowAny()]

    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        qs = Job.objects.filter(status='approved').select_related(
            'company', 'company__company_profile'
        ).only(
            'id', 'company__id', 'company__username', 'company__first_name', 'company__last_name',
            'company__is_verified', 'company__avatar', 'company__company_profile__logo_url',
            'title', 'description', 'requirements', 'employment_type',
            'is_remote', 'location', 'salary_range', 'commission_range', 'currency',
            'custom_company_name', 'status', 'created_at', 'job_code'
        )
        # Optional filters from query params
        search = self.request.query_params.get('search')
        remote = self.request.query_params.get('remote')
        if search:
            qs = qs.filter(title__icontains=search)
        if remote == 'true':
            qs = qs.filter(is_remote=True)
        return qs


class AdminJobUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAdminUser]


# ── Custom Verification ──────────────────────────────────────────────────────

class VerifyEmailView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            email = payload.get('email')

            if not email:
                return Response({'error': 'Invalid token payload'}, status=status.HTTP_400_BAD_REQUEST)

            # Verification is handled implicitly by successful login if needed, or we could add an is_verified field
            try:
                user = CustomUser.objects.get(email=email)
                if user.email_verified:
                    return Response({'message': 'Email already verified'}, status=status.HTTP_200_OK)
                user.email_verified = True
                user.save(update_fields=['email_verified'])
            except CustomUser.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

            # Send the welcome email now that the user has verified their email
            try:
                from .email_templates import get_welcome_email_html, send_courier_email
                display_name = user.get_full_name() or user.username
                is_company = user.role == 'company'
                html_content = get_welcome_email_html(user=display_name, is_company=is_company)
                send_courier_email(
                    to_email=user.email,
                    subject="Welcome - Quota Hire",
                    text_content=f"Hi {display_name}, your Quota Hire account is now verified. Complete your profile at https://quotahire.org/dashboard",
                    html_content=html_content,
                )
            except Exception as e:
                logger.warning(f"Welcome email failed for {user.email}: {e}")
                # Non-critical — do not block the verification response

            return Response({'message': 'Email verified successfully'}, status=status.HTTP_200_OK)

        except jwt.ExpiredSignatureError:
            return Response({'error': 'Verification link has expired'}, status=status.HTTP_400_BAD_REQUEST)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid verification link'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Email verification failed: {e}", exc_info=True)
            return Response({'error': 'An internal error occurred. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SendVerificationEmailView(APIView):
    permission_classes     = []
    authentication_classes = []
    throttle_classes       = [AuthEmailThrottle]  # 5 emails/IP/hour

    def post(self, request):
        email = request.data.get('email')
        name = request.data.get('name')

        if not email:
            return Response({'error': 'email is required'}, status=status.HTTP_400_BAD_REQUEST)

        import jwt, datetime
        from django.conf import settings
        from .email_templates import get_verification_email_html, send_courier_email

        token = jwt.encode({
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, settings.SECRET_KEY, algorithm='HS256')

        frontend_url = settings.FRONTEND_URL.strip()
        verify_link = f"{frontend_url}/verify-email?token={token}"
        display_name = name or email.split('@')[0]

        try:
            html_content = get_verification_email_html(user=display_name, redirect=verify_link)
            text_content = f"Hi {display_name},\n\nPlease verify your email for Quota Hire using this link:\n{verify_link}"

            send_courier_email(
                to_email=email,
                subject="Verify your email for Quota Hire",
                text_content=text_content,
                html_content=html_content
            )
        except Exception as e:
            logger.error(f"Failed to send manual verification email to {email}: {e}")
            return Response({'error': 'Failed to send verification email. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Verification email sent'}, status=status.HTTP_200_OK)

class ForgotPasswordView(APIView):
    permission_classes     = []
    authentication_classes = []
    throttle_classes       = [AuthEmailThrottle]  # 5 reset emails/IP/hour

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.filter(email=email).first()
        if not user:
            return Response({'message': 'If the email exists, a recovery link has been sent.'}, status=status.HTTP_200_OK)

        token = jwt.encode({
            'email': email,
            'exp': timezone.now() + timedelta(minutes=10)
        }, settings.SECRET_KEY, algorithm='HS256')

        frontend_url = settings.FRONTEND_URL.strip()
        reset_link = f"{frontend_url}/reset-password?token={token}"

        from .email_templates import get_recovery_email_html, send_courier_email
        display_name = user.first_name or user.username

        try:
            html_content = get_recovery_email_html(user=display_name, redirect=reset_link)
            text_content = f"Hi {display_name},\n\nPlease reset your password using this link:\n{reset_link}"

            send_courier_email(
                to_email=email,
                subject="Reset your Quota Hire Password",
                text_content=text_content,
                html_content=html_content
            )

        except Exception as e:
            logger.error(f"Failed to send recovery email to {email}: {e}")
            return Response({'error': 'Failed to send recovery email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'If the email exists, a recovery link has been sent.'}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        token = request.data.get('token')
        password = request.data.get('password')
        password_confirm = request.data.get('passwordConfirm')

        if not token or not password or not password_confirm:
            return Response({'error': 'Token, password, and passwordConfirm are required'}, status=status.HTTP_400_BAD_REQUEST)

        if password != password_confirm:
            return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            email = payload.get('email')

            if not email:
                return Response({'error': 'Invalid token payload'}, status=status.HTTP_400_BAD_REQUEST)

            user = CustomUser.objects.filter(email=email).first()
            if not user:
                 return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

            user.set_password(password)
            user.save()

            return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)

        except jwt.ExpiredSignatureError:
            return Response({'error': 'Reset link has expired'}, status=status.HTTP_400_BAD_REQUEST)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid reset link'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Password reset failed: {e}", exc_info=True)
            return Response({'error': 'An internal error occurred. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class JobDetailView(generics.RetrieveAPIView):
    """
    GET /api/jobs/<id>/ — get a single approved job.
    Cached 60 s. Cache is cleared immediately when the job’s status changes
    via JobStatusUpdateView or the Django admin (signals.py handles both).
    """
    serializer_class   = JobSerializer
    permission_classes = [permissions.AllowAny]
    queryset           = Job.objects.filter(status='approved')

    def get(self, request, *args, **kwargs):
        from .cache_utils import job_detail_key, safe_get, safe_set, JOB_DETAIL_TTL
        pk = self.kwargs.get('pk')
        cache_key = job_detail_key(pk)
        cached = safe_get(cache_key)
        if cached is not None:
            return Response(cached)
        response = super().get(request, *args, **kwargs)
        # Only cache 200 OK — don’t cache 404s for non-approved/missing jobs
        if response.status_code == 200:
            safe_set(cache_key, response.data, ttl=JOB_DETAIL_TTL)
        return response


class JobStatusUpdateView(APIView):
    """PUT /api/jobs/<id>/status/ — approve / reject / close a job (admin only)."""
    permission_classes = [IsAdmin]

    def put(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
        except Job.DoesNotExist:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        valid = ['pending', 'approved', 'rejected', 'closed']
        if new_status not in valid:
            return Response({'error': f'Status must be one of: {valid}'}, status=status.HTTP_400_BAD_REQUEST)

        job.status = new_status
        job.save(update_fields=['status'])

        # Immediately clear the public job-list cache and this job’s detail cache
        # so the status change is visible to users within the same request cycle.
        from .cache_utils import invalidate_jobs_cache
        invalidate_jobs_cache(job_pk=pk)

        return Response(JobSerializer(job).data)


# ── Analytics ─────────────────────────────────────────────────────────────────

class DashboardAnalyticsView(APIView):
    """GET /api/dashboard/analytics/ — Returns chart data and stats for dashboards."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .cache_utils import dashboard_key, safe_get, safe_set, DASHBOARD_TTL
        user = request.user

        # Return cached analytics for this user if available (60 s TTL).
        # Cache is per-user so company A never sees company B’s data.
        cache_key = dashboard_key(user.pk, user.role)
        cached = safe_get(cache_key)
        if cached is not None:
            return Response(cached)

        if user.role == 'employee':
            my_apps = Application.objects.filter(employee=user)
            all_jobs = Job.objects.filter(status='approved')

            # Market Insights Data (OTE vs Base)
            now = timezone.now()
            market_insights = []
            for i in range(5, -1, -1):
                month_start = (now.replace(day=1) - timedelta(days=30*i)).replace(day=1)
                month_str = month_start.strftime('%b')
                month_jobs = all_jobs.filter(created_at__year=month_start.year, created_at__month=month_start.month)

                total_base = 0
                total_ote = 0
                count = 0

                for job in month_jobs:
                    numbers = re.findall(r'\d+', job.salary_range.replace(',', ''))
                    if len(numbers) >= 2:
                        base = int(numbers[0])
                        ote = int(numbers[1])
                        if base < 1000: base *= 1000
                        if ote < 1000: ote *= 1000
                        total_base += base
                        total_ote += ote
                        count += 1

                avg_base = (total_base // count) if count > 0 else 75000
                avg_ote = (total_ote // count) if count > 0 else 110000
                market_insights.append({'month': month_str, 'ote': avg_ote, 'base': avg_base})

            # Skill Match Data
            all_reqs = []
            for job in all_jobs:
                all_reqs.extend(job.requirements)
            top_skills = [s for s, c in Counter(all_reqs).most_common(6)]
            defaults = ['Enterprise', 'SDR', 'Closing', 'Outbound', 'Inbound', 'CRM']
            while len(top_skills) < 6:
                top_skills.append(defaults[len(top_skills)])

            try:
                emp_skills = set(user.employee_profile.skills)
            except:
                emp_skills = set()

            skill_match = []
            for skill in top_skills:
                count_in_jobs = sum(1 for req in all_reqs if req == skill)
                market_demand = min(150, 80 + count_in_jobs * 10)
                candidate_has = 120 if skill in emp_skills else 50
                skill_match.append({
                    'subject': skill[:10],
                    'A': candidate_has,
                    'B': market_demand,
                    'fullMark': 150
                })

            # Application Activity Data
            app_activity = []
            for i in range(3, -1, -1):
                week_start = now - timedelta(days=7*(i+1))
                week_end = now - timedelta(days=7*i)
                week_apps = my_apps.filter(applied_at__gte=week_start, applied_at__lt=week_end)

                app_activity.append({
                    'week': f'W{4-i}',
                    'apps': week_apps.count(),
                    'interviews': week_apps.filter(status='accepted').count()
                })

            data = {
                'marketInsightsData': market_insights,
                'skillMatchData': skill_match,
                'applicationActivityData': app_activity,
                'activeApps': my_apps.count()
            }
            safe_set(cache_key, data, ttl=DASHBOARD_TTL)
            return Response(data)

        elif user.role == 'company':
            active_jobs = Job.objects.filter(company=user, status='approved')
            all_apps = Application.objects.filter(job__company=user)

            now = timezone.now()
            applicant_velocity = []
            for i in range(6, -1, -1):
                day = now - timedelta(days=i)
                day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + timedelta(days=1)

                apps_on_day = all_apps.filter(applied_at__gte=day_start, applied_at__lt=day_end).count()
                applicant_velocity.append({
                    'name': day.strftime('%a'),
                    'applicants': apps_on_day
                })

            job_performance = []
            for job in active_jobs[:5]:
                job_performance.append({
                    'name': job.title[:10] + '...',
                    'applicants': Application.objects.filter(job=job).count()
                })

            top_matches = 0
            for app in all_apps:
                try:
                    job_reqs = set(app.job.requirements)
                    emp_skills = set(app.employee.employee_profile.skills)
                    if job_reqs.intersection(emp_skills):
                        top_matches += 1
                except:
                    pass

            data = {
                'applicantVelocityData': applicant_velocity,
                'jobPerformanceData': job_performance,
                'activeRolesCount': active_jobs.count(),
                'totalApplicantsCount': all_apps.count(),
                'topMatchesCount': top_matches
            }
            safe_set(cache_key, data, ttl=DASHBOARD_TTL)
            return Response(data)

        return Response({'error': 'Invalid role'}, status=400)


class SavedJobToggleView(APIView):
    """POST /api/jobs/<id>/save/ — toggles saving a job (records saved_at timestamp)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            job = Job.objects.get(pk=pk, status='approved')
        except Job.DoesNotExist:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        entry = SavedJob.objects.filter(user=user, job=job).first()

        if entry:
            # Unsave: remove from both M2M and SavedJob
            entry.delete()
            user.saved_jobs.remove(job)
            return Response({'saved': False, 'job_id': job.id})
        else:
            # Save: create SavedJob entry and add to M2M
            new_entry = SavedJob.objects.create(user=user, job=job)
            user.saved_jobs.add(job)
            return Response({
                'saved': True,
                'job_id': job.id,
                'saved_at': new_entry.saved_at.isoformat(),
            })



# ── Applications ──────────────────────────────────────────────────────────────

class ApplyForJobView(APIView):
    """POST /api/jobs/<id>/apply/ — employee applies for a job."""
    permission_classes = [IsEmployee]
    throttle_classes   = [ApplyThrottle]

    def post(self, request, pk):
        try:
            job = Job.objects.get(pk=pk, status='approved')
        except Job.DoesNotExist:
            return Response({'error': 'Job not found or not open.'}, status=status.HTTP_404_NOT_FOUND)

        if Application.objects.filter(job=job, employee=request.user).exists():
            return Response({'error': 'You have already applied for this job.'}, status=status.HTTP_400_BAD_REQUEST)

        app = Application.objects.create(
            job=job,
            employee=request.user,
            cover_letter=request.data.get('cover_letter', ''),
        )

        generated_cv_id = request.data.get('generated_cv_id')
        if generated_cv_id:
            try:
                cv = GeneratedCV.objects.get(pk=generated_cv_id, employee=request.user)
                cv.application = app
                cv.save(update_fields=['application'])
            except GeneratedCV.DoesNotExist:
                pass

        # ── Notify the company — in-app + push ────────────────────────────
        # This notification was previously missing from the system entirely.
        try:
            from .push_utils import send_push_notification
            employee_name = request.user.get_full_name() or request.user.username or 'Someone'
            Notification.objects.create(
                user=job.company,
                title='New Application Received',
                message=(
                    f'{employee_name} has applied for your "{job.title}" position. '
                    'Review their profile in the Applicants section.'
                ),
            )
            send_push_notification(
                user=job.company,
                title='New Application Received',
                body=f'{employee_name} applied for {job.title}.',
                data={'type': 'new_application', 'job_id': str(job.pk)},
            )
        except Exception as _notify_exc:
            logger.warning('Could not notify company of new application: %s', _notify_exc)

        return Response(ApplicationSerializer(app).data, status=status.HTTP_201_CREATED)


class SavePushTokenView(APIView):
    """
    POST /api/notifications/push-token/
    Body: { "token": "ExponentPushToken[...]" }

    Saves the Expo push token for the authenticated user's device.
    Called by the mobile app on every login and app open so the token
    stays current (tokens can change after app reinstalls or OS updates).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = (request.data.get('token') or '').strip()
        if not token:
            return Response({'error': 'token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not token.startswith('ExponentPushToken['):
            return Response({'error': 'Invalid token format.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.push_token = token
        request.user.save(update_fields=['push_token'])
        logger.info('Push token saved for user %s', request.user.pk)
        return Response({'status': 'ok'})


class MyApplicationsView(generics.ListAPIView):
    """GET /api/applications/ — list the current user's own applications (or applications to company's jobs)."""
    serializer_class   = ApplicationListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'company':
            return Application.objects.filter(job__company=user).select_related(
                'job', 'employee'
            ).only(
                'id', 'job__id', 'job__title', 'job__company_name',
                'employee__id', 'employee__username', 'employee__first_name', 'employee__last_name',
                'status', 'applied_at'
            )
        return Application.objects.filter(employee=user).select_related(
            'job', 'job__company', 'job__company__company_profile'
        ).only(
            'id', 'job__id', 'job__title', 'job__company_name',
            'job__company__id', 'job__company__username', 'job__company__first_name', 'job__company__last_name',
            'job__company__avatar', 'job__company__company_profile__logo_url',
            'employee__id', 'status', 'applied_at'
        )


class ApplicationStatusUpdateView(APIView):
    """PUT /api/applications/<id>/status/ — company accepts or rejects an application."""
    permission_classes = [IsCompany]

    def put(self, request, pk):
        try:
            app = Application.objects.get(pk=pk, job__company=request.user)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ['accepted', 'rejected']:
            return Response({'error': 'Status must be accepted or rejected.'}, status=status.HTTP_400_BAD_REQUEST)

        app.status = new_status
        app.save(update_fields=['status'])

        # Create a notification for the employee
        Notification.objects.create(
            user    = app.employee,
            title   = f'Application {new_status.capitalize()}',
            message = (
                f'Your application for "{app.job.title}" has been {new_status}. '
                + ('The company will contact you shortly.' if new_status == 'accepted' else '')
            ),
        )

        return Response(ApplicationSerializer(app).data)


# ── Notifications ─────────────────────────────────────────────────────────────

class NotificationListView(generics.ListAPIView):
    """GET /api/notifications/ — list current user's notifications."""
    serializer_class   = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class MarkNotificationReadView(APIView):
    """PUT /api/notifications/<id>/read/ — mark a notification as read."""
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)
        notif.read = True
        notif.save(update_fields=['read'])
        return Response(NotificationSerializer(notif).data)


# ── Admin-only Endpoints ──────────────────────────────────────────────────────

class AdminUserListView(generics.ListAPIView):
    """GET /api/admin/users/ — list all users (admin only)."""
    serializer_class   = UserSerializer
    permission_classes = [IsAdmin]
    queryset           = CustomUser.objects.all().select_related('employee_profile', 'company_profile')


class AdminJobListView(generics.ListAPIView):
    """GET /api/admin/jobs/ — list all jobs regardless of status (admin only)."""
    serializer_class   = JobSerializer
    permission_classes = [IsAdmin]
    queryset           = Job.objects.all().select_related('company')


class AdminJobUpdateView(generics.UpdateAPIView):
    """PUT/PATCH /api/admin/jobs/<id>/edit/ — update job details (admin only)."""
    serializer_class   = JobSerializer
    permission_classes = [IsAdmin]
    queryset           = Job.objects.all()

# ── Resume Upload & Parse ─────────────────────────────────────────────────────

class ResumeUploadView(APIView):
    """
    POST /api/profile/resume/upload/
    Accepts a PDF or DOCX resume file, extracts text, parses it into
    structured profile fields, saves the file, and returns parsed data.
    """
    permission_classes = [IsEmployee]
    throttle_classes   = [UploadThrottle]  # 20 uploads/user/hour

    # Allowed MIME types for resume documents
    ALLOWED_RESUME_TYPES = {
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # .docx
        'application/msword',  # .doc
    }
    MAX_RESUME_SIZE_MB = 10

    def post(self, request):
        if 'resume' not in request.FILES:
            return Response({'error': 'No resume file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        resume_file = request.FILES['resume']
        filename = resume_file.name.lower()

        # Validate extension (first line of defence)
        if not (filename.endswith('.pdf') or filename.endswith('.docx') or filename.endswith('.doc')):
            return Response(
                {'error': 'Only PDF, DOC, and DOCX files are accepted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate MIME type reported by the browser
        content_type = resume_file.content_type or ''
        if content_type not in self.ALLOWED_RESUME_TYPES:
            return Response(
                {'error': 'Invalid file type. Only PDF, DOC, and DOCX files are accepted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file size (max 10 MB)
        max_bytes = self.MAX_RESUME_SIZE_MB * 1024 * 1024
        if resume_file.size > max_bytes:
            return Response(
                {'error': f'File is too large. Maximum resume size is {self.MAX_RESUME_SIZE_MB} MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Extract text
        text = extract_text_from_file(resume_file, filename)

        if not text:
            text = ""

        # Parse text into fields
        parsed = parse_resume_text(text)

        # Save file to profile
        profile, _ = EmployeeProfile.objects.get_or_create(user=request.user)
        resume_file.seek(0)  # Reset after reading
        profile.resume_binary = resume_file.read()
        profile.resume_filename = resume_file.name
        resume_file.seek(0)
        profile.resume_file = resume_file
        profile.save(update_fields=['resume_file', 'resume_binary', 'resume_filename'])

        resume_file_url = None
        if profile.resume_file:
            try:
                resume_file_url = request.build_absolute_uri(profile.resume_file.url)
            except Exception:
                pass

        return Response({
            'message': 'Resume parsed successfully.',
            'resume_file_url': resume_file_url,
            'parsed': parsed,
        }, status=status.HTTP_200_OK)


# ── Company Applicant Review Views ────────────────────────────────────────────

class CompanyJobApplicantsView(generics.ListAPIView):
    """GET /api/company/jobs/<int:job_id>/applicants/"""
    serializer_class = CompanyApplicantListSerializer
    permission_classes = [IsCompany]

    def get_queryset(self):
        job_id = self.kwargs.get('job_id')
        return Application.objects.filter(
            job_id=job_id, job__company=self.request.user
        ).select_related(
            'employee', 'employee__employee_profile', 'job', 'shortlist'
        ).only(
            'id', 'job__id', 'job__title',
            'employee__id', 'employee__username', 'employee__first_name', 'employee__last_name',
            'employee__avatar',
            'employee__employee_profile__title', 'employee__employee_profile__bio', 'employee__employee_profile__skills',
            'status', 'applied_at'
        )

class ShortlistApplicantView(APIView):
    """POST /api/company/applications/<int:pk>/shortlist/"""
    permission_classes = [IsCompany]

    def post(self, request, pk):
        try:
            app = Application.objects.get(pk=pk, job__company=request.user)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        if hasattr(app, 'shortlist'):
            return Response({'error': 'Applicant is already shortlisted.'}, status=status.HTTP_400_BAD_REQUEST)

        from .models import ShortlistedApplicant
        shortlist = ShortlistedApplicant.objects.create(application=app)

        return Response({
            'message': 'Applicant successfully shortlisted.',
            'shortlist_id': shortlist.id
        }, status=status.HTTP_201_CREATED)

class CompanyApplicationDetailView(generics.RetrieveAPIView):
    """GET /api/company/applications/<int:pk>/"""
    from .serializers import CompanyApplicantSerializer
    serializer_class = CompanyApplicantSerializer
    permission_classes = [IsCompany]

    def get_queryset(self):
        # Ensure company can only view applications for their own jobs
        return Application.objects.filter(job__company=self.request.user).select_related('employee', 'job')


class ResumeProxyView(APIView):
    """
    GET /api/company/applications/<int:pk>/resume/
    Returns a short-lived signed Cloudinary URL for the applicant's resume.
    The frontend uses this URL directly instead of proxying through Django.
    """
    permission_classes = [IsCompany]

    def get(self, request, pk):
        try:
            app = Application.objects.get(pk=pk, job__company=request.user)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            profile = app.employee.employee_profile
        except EmployeeProfile.DoesNotExist:
            return Response({'error': 'No profile found.'}, status=status.HTTP_404_NOT_FOUND)

        if not profile.resume_file:
            return Response({'error': 'No resume on file.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            # First check if we have the binary data in the database (Option 2)
            if profile.resume_binary:
                file_data = profile.resume_binary
                filename = profile.resume_filename or 'resume.pdf'

                from django.http import HttpResponse
                response = HttpResponse(file_data, content_type='application/pdf')
                response['Content-Disposition'] = f'inline; filename="{filename}"'
                return response

            # Fallback for old resumes that don't have binary data yet:
            # Attempt to fetch from Cloudinary as a fallback
            import cloudinary
            import cloudinary.utils
            import urllib.request
            from django.conf import settings

            if hasattr(settings, 'CLOUDINARY_URL') and settings.CLOUDINARY_URL:
                cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL)

            resume_field = profile.resume_file
            if not resume_field:
                return Response({'error': 'No resume on file.'}, status=status.HTTP_404_NOT_FOUND)

            public_id = resume_field.name

            signed_url = cloudinary.utils.private_download_url(
                public_id,
                'pdf',
                resource_type="image",
                expires_at=3600
            )

            req = urllib.request.Request(signed_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as file_resp:
                file_data = file_resp.read()

            from django.http import HttpResponse
            response = HttpResponse(file_data, content_type='application/pdf')
            response['Content-Disposition'] = 'inline; filename="resume.pdf"'
            return response

        except Exception as e:
            # Log full traceback server-side only — never expose to API clients
            logger.error("Error reading resume for application pk=%s: %s", pk, e, exc_info=True)
            return Response(
                {'error': 'Unable to retrieve resume. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ── Generated CV Views ────────────────────────────────────────────────────────

class SaveGeneratedCVView(APIView):
    """
    POST /api/cv/save/
    Accepts a base64-encoded PDF + cover letter text + metadata.
    Creates a GeneratedCV record and also saves the cover letter to the Application.
    Accepts either application_id or job_id (will resolve application from job_id).
    """
    permission_classes = [IsEmployee]

    def post(self, request):
        import base64

        data = request.data
        application_id      = data.get('application_id')
        job_id              = data.get('job_id')          # ← new: accept job_id too
        template_id         = data.get('template_id', 'T1')
        template_name       = data.get('template_name', 'Classic Split')
        target_role         = data.get('target_role', '')
        target_company      = data.get('target_company', '')
        cover_letter_text   = data.get('cover_letter_text', '')
        work_experience_json= data.get('work_experience_json', [])
        cv_pdf_b64          = data.get('cv_pdf_base64', '')

        # Decode PDF binary
        cv_pdf_bytes = None
        if cv_pdf_b64:
            try:
                cv_pdf_bytes = base64.b64decode(cv_pdf_b64)
            except Exception as e:
                logger.warning(f'CV PDF base64 decode failed: {e}')

        # Resolve the Application — try application_id first, then job_id
        application = None
        if application_id:
            try:
                application = Application.objects.get(
                    pk=application_id,
                    employee=request.user,
                )
            except Application.DoesNotExist:
                pass

        if application is None and job_id:
            # Find the most recent application by this user for this job
            application = Application.objects.filter(
                job_id=job_id,
                employee=request.user,
            ).order_by('-applied_at').first()

        # Also store cover letter on the application itself
        if application and cover_letter_text:
            application.cover_letter = cover_letter_text
            application.save(update_fields=['cover_letter'])

        # Delete any previous GeneratedCV for this application to avoid duplicates
        if application:
            GeneratedCV.objects.filter(application=application).delete()

        # Also clean up orphaned CVs (application=NULL) for the same job+employee
        # so the profile list doesn't accumulate duplicates from multiple generate attempts
        if job_id:
            GeneratedCV.objects.filter(
                employee=request.user,
                application__isnull=True,
                target_role=target_role,
                target_company=target_company,
            ).delete()

        cv_obj = GeneratedCV.objects.create(
            employee            = request.user,
            application         = application,
            template_id         = template_id,
            template_name       = template_name,
            target_role         = target_role,
            target_company      = target_company,
            cv_pdf              = cv_pdf_bytes,
            cv_filename         = f'cv_{request.user.id}_{template_id}.pdf',
            cover_letter_text   = cover_letter_text,
            work_experience_json= work_experience_json if isinstance(work_experience_json, list) else [],
        )

        serializer = GeneratedCVSerializer(cv_obj, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyGeneratedCVsView(generics.ListAPIView):
    """
    GET /api/cv/my-cvs/
    Returns all GeneratedCV records for the authenticated employee.
    """
    serializer_class   = GeneratedCVSerializer
    permission_classes = [IsEmployee]

    def get_queryset(self):
        return GeneratedCV.objects.filter(employee=self.request.user).order_by('-generated_at')


class DownloadGeneratedCVView(APIView):
    """
    GET /api/cv/<pk>/download/?token=<download_token>
    Streams the binary PDF for a specific GeneratedCV.

    Security model:
    - Admin/staff: can download any CV directly with JWT auth (no token needed)
    - Employee (owner): must supply a valid, unused, non-expired DownloadToken
      issued by PaymentVerifyView after a successful Paystack payment.
    - Any other user: 403 Forbidden
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            cv_obj = GeneratedCV.objects.get(pk=pk)
        except GeneratedCV.DoesNotExist:
            return Response({'error': 'CV not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user

        # Admin/staff bypass — they can always download freely
        if user.is_staff or user.role == 'admin':
            if not cv_obj.cv_pdf:
                return Response({'error': 'No PDF stored for this CV.'}, status=status.HTTP_404_NOT_FOUND)
            response = HttpResponse(bytes(cv_obj.cv_pdf), content_type='application/pdf')
            filename = cv_obj.cv_filename or 'cv.pdf'
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        # Non-owner employee: forbidden
        if cv_obj.employee != user:
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        # Check if the owner has already paid for this CV
        has_paid = PaymentTransaction.objects.filter(
            user=user,
            cv=cv_obj,
            status=PaymentStatus.PAID,
        ).exists()

        # If they already paid, bypass the download token verification entirely!
        if has_paid:
            if not cv_obj.cv_pdf:
                return Response({'error': 'No PDF stored for this CV.'}, status=status.HTTP_404_NOT_FOUND)
            response = HttpResponse(bytes(cv_obj.cv_pdf), content_type='application/pdf')
            filename = cv_obj.cv_filename or 'cv.pdf'
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['X-Content-Type-Options'] = 'nosniff'
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
            return response

        # Employee must provide a valid payment-based download token
        raw_token = request.query_params.get('token', '').strip()
        if not raw_token:
            return Response(
                {'error': 'payment_required', 'message': 'A valid payment token is required to download this document.'},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        # Validate the download token
        try:
            dt = DownloadToken.objects.select_related('cv', 'user').get(
                token=raw_token,
                user=user,
                cv=cv_obj,
            )
        except DownloadToken.DoesNotExist:
            return Response(
                {'error': 'invalid_token', 'message': 'Download token is invalid or does not belong to you.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if dt.used:
            return Response(
                {'error': 'token_used', 'message': 'This download token has already been used. Please initiate a new payment.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if timezone.now() > dt.expires_at:
            return Response(
                {'error': 'token_expired', 'message': 'Your download link has expired (10 minutes). You can re-download using your existing payment.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Mark token as used BEFORE streaming — prevents replay even if request errors
        dt.used = True
        dt.save(update_fields=['used'])

        if not cv_obj.cv_pdf:
            return Response({'error': 'No PDF stored for this CV.'}, status=status.HTTP_404_NOT_FOUND)

        response = HttpResponse(bytes(cv_obj.cv_pdf), content_type='application/pdf')
        filename = cv_obj.cv_filename or 'cv.pdf'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
        return response


# ── Payment Views ────────────────────────────────────────────────────────────────


def _paystack_request(path, method='GET', payload=None):
    """
    Internal helper to call the Paystack REST API using only stdlib.
    Raises RuntimeError on non-2xx responses.
    """
    secret_key = settings.PAYSTACK_SECRET_KEY
    if not secret_key:
        raise RuntimeError('PAYSTACK_SECRET_KEY is not configured on the server.')

    url = f'https://api.paystack.co{path}'
    headers = {
        'Authorization': f'Bearer {secret_key}',
        'Content-Type': 'application/json',
        'User-Agent': 'QuotaHire/1.0 (https://quotahire.org)',
        'Accept': 'application/json',
    }
    data = json_module.dumps(payload).encode('utf-8') if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode('utf-8')
            return json_module.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        logger.error(f'Paystack API error [{e.code}] {path}: {body}')
        raise RuntimeError(f'Paystack API error {e.code}: {body}')
    except (urllib.error.URLError, TimeoutError) as e:
        logger.error(f'Paystack network error {path}: {e}')
        raise RuntimeError(f'Paystack API network error: {e}')


def _make_download_token(user_id, cv_id, transaction_id):
    """
    Generate a cryptographically secure HMAC-signed download token.
    Format: <random_hex>.<hmac_hex>
    The HMAC covers: user_id + cv_id + transaction_id + random_hex.
    """
    random_part = secrets.token_hex(24)
    message = f'{user_id}:{cv_id}:{transaction_id}:{random_part}'
    sig = hmac.new(
        settings.SECRET_KEY.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()
    return f'{random_part}.{sig}'


def _get_live_eur_ngn_rate() -> float:
    """
    Fetches the live EUR → NGN exchange rate from a free public API.

    Improvements over the original:
      - Stampede-safe: uses a Redis atomic lock (cache.add / SET NX) so only
        ONE concurrent payment request calls the external API on cache miss.
        All others use the fallback rate while the lock-holder fetches.
      - Failure-safe: Redis down or API timeout → returns NGN_PER_EUR setting
        instead of propagating an exception up through the payment flow.

    Free API: https://open.er-api.com/v6/latest/EUR  (1,500 req/month free)
    With the stampede lock, the worst case is 1 external call per cache miss,
    not N calls where N = concurrent payment requests at that moment.
    """
    from .cache_utils import safe_get_or_set, RATE_TTL

    CACHE_KEY = 'eur_ngn_rate'
    fallback  = float(settings.NGN_PER_EUR)

    def _fetch_from_api():
        try:
            req = urllib.request.Request(
                'https://open.er-api.com/v6/latest/EUR',
                headers={'User-Agent': 'QuotaHire/1.0'},
                method='GET',
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json_module.loads(resp.read().decode('utf-8'))
            if data.get('result') == 'success':
                rate = float(data['rates'].get('NGN', fallback))
                if 500 <= rate <= 5000:
                    logger.info('Live EUR/NGN rate fetched: %s', rate)
                    return rate
                logger.warning(
                    'EUR/NGN rate %s outside sanity range [500–5000], using fallback %s',
                    rate, fallback
                )
        except Exception as exc:
            logger.warning(
                'Could not fetch live EUR/NGN rate: %s. Using fallback %s',
                exc, fallback
            )
        return fallback

    result = safe_get_or_set(CACHE_KEY, _fetch_from_api, ttl=RATE_TTL, lock_ttl=10)
    return float(result) if result is not None else fallback


class PaymentInitiateView(APIView):
    """
    POST /api/payments/initiate/
    Body: { "cv_id": <int> }

    1. Checks if the user already has a valid unused paid token for this CV
       → returns it immediately so user can download without paying again.
    2. Otherwise creates a new PaymentTransaction and calls Paystack /transaction/initialize.
    3. Returns: { authorization_url, reference, amount_ngn, already_paid, download_token }
    """
    permission_classes = [IsEmployee]
    throttle_classes = [PaymentThrottle]

    def post(self, request):
        cv_id = request.data.get('cv_id')
        if not cv_id:
            return Response({'error': 'cv_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cv_obj = GeneratedCV.objects.get(pk=cv_id, employee=request.user)
        except GeneratedCV.DoesNotExist:
            return Response({'error': 'CV not found.'}, status=status.HTTP_404_NOT_FOUND)

        # ─ Idempotency: check if user has ever successfully paid for this CV
        has_paid = PaymentTransaction.objects.filter(
            user=request.user,
            cv=cv_obj,
            status=PaymentStatus.PAID,
        ).exists()

        if has_paid:
            # Get the last successful transaction to associate the new token with
            last_paid_tx = PaymentTransaction.objects.filter(
                user=request.user,
                cv=cv_obj,
                status=PaymentStatus.PAID,
            ).order_by('-created_at').first()

            # Generate a fresh download token on the fly for free
            token_str = _make_download_token(request.user.pk, cv_obj.pk, last_paid_tx.pk)
            new_token = DownloadToken.objects.create(
                user=request.user,
                cv=cv_obj,
                transaction=last_paid_tx,
                token=token_str,
                expires_at=timezone.now() + timedelta(minutes=10),
            )
            return Response({
                'already_paid': True,
                'download_token': new_token.token,
                'message': 'You have already paid for this document. Download is ready.',
            })

        # ─ Calculate amount in kobo using LIVE EUR/NGN rate
        fee_eur = settings.CV_DOWNLOAD_FEE_EUR
        ngn_per_eur = _get_live_eur_ngn_rate()   # live rate, cached 1 hour
        amount_ngn = fee_eur * ngn_per_eur
        amount_kobo = int(amount_ngn * 100)  # Paystack expects kobo

        # ─ Create pending transaction record (idempotent reference)
        import uuid as _uuid
        reference = str(_uuid.uuid4())

        transaction = PaymentTransaction.objects.create(
            user=request.user,
            cv=cv_obj,
            reference=reference,
            amount_eur=fee_eur,
            status=PaymentStatus.PENDING,
        )

        # ─ Call Paystack to initialize the transaction
        try:
            payload = {
                'email': request.user.email,
                'amount': amount_kobo,
                'reference': reference,
                'currency': 'NGN',
                'metadata': {
                    'cv_id': cv_obj.pk,
                    'user_id': request.user.pk,
                    'document': cv_obj.cv_filename or 'cv.pdf',
                    'fee_eur': str(fee_eur),
                },
            }
            result = _paystack_request('/transaction/initialize', method='POST', payload=payload)
        except RuntimeError as e:
            transaction.status = PaymentStatus.FAILED
            transaction.save(update_fields=['status'])
            logger.error(f'Paystack init failed for user {request.user.pk}: {e}')
            return Response(
                {'error': 'payment_init_failed', 'message': 'Could not connect to payment provider. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if not result.get('status'):
            transaction.status = PaymentStatus.FAILED
            transaction.save(update_fields=['status'])
            return Response(
                {'error': 'payment_init_failed', 'message': result.get('message', 'Paystack returned an error.')},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        data = result.get('data', {})
        return Response({
            'already_paid': False,
            'authorization_url': data.get('authorization_url'),
            'access_code': data.get('access_code'),
            'reference': reference,
            'amount_kobo': amount_kobo,
            'amount_ngn': amount_kobo / 100,
            'fee_eur': fee_eur,
        })


class PaymentVerifyView(APIView):
    """
    POST /api/payments/verify/
    Body: { "reference": "<paystack_reference>" }

    1. Looks up the PaymentTransaction by reference (must belong to this user).
    2. Calls Paystack /transaction/verify/:reference with the secret key.
    3. Validates status == 'success' and amount >= expected.
    4. Issues a one-time, 10-minute DownloadToken for the CV.
    5. Returns: { download_token, cv_id }
    """
    permission_classes = [IsEmployee]

    def post(self, request):
        reference = request.data.get('reference', '').strip()
        if not reference:
            return Response({'error': 'reference is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch transaction; enforce ownership
        try:
            transaction = PaymentTransaction.objects.select_related('cv', 'user').get(
                reference=reference,
                user=request.user,
            )
        except PaymentTransaction.DoesNotExist:
            return Response(
                {'error': 'invalid_reference', 'message': 'Transaction not found or does not belong to you.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # If already verified and paid, just regenerate a fresh download token
        if transaction.status == PaymentStatus.PAID:
            token_str = _make_download_token(request.user.pk, transaction.cv_id, transaction.pk)
            dt = DownloadToken.objects.create(
                user=request.user,
                cv=transaction.cv,
                transaction=transaction,
                token=token_str,
                expires_at=timezone.now() + timedelta(minutes=10),
            )
            return Response({
                'download_token': dt.token,
                'cv_id': transaction.cv_id,
                'already_verified': True,
            })

        # Call Paystack verify endpoint — server-side, using secret key
        try:
            result = _paystack_request(f'/transaction/verify/{reference}', method='GET')
        except RuntimeError as e:
            logger.error(f'Paystack verify failed for reference {reference}: {e}')
            return Response(
                {'error': 'verify_failed', 'message': 'Could not verify payment with Paystack. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if not result.get('status'):
            return Response(
                {'error': 'verify_failed', 'message': result.get('message', 'Paystack verification error.')},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        pdata = result.get('data', {})
        ps_status = pdata.get('status')

        if ps_status != 'success':
            transaction.status = PaymentStatus.FAILED
            transaction.save(update_fields=['status', 'updated_at'])
            return Response(
                {
                    'error': 'payment_not_successful',
                    'message': f'Payment status is "{ps_status}". Please try paying again.',
                    'paystack_status': ps_status,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        # Validate amount — must be >= expected kobo (allow small rounding diff)
        # Use the same live rate that was used when the payment was initiated (cached, 1 hour)
        paid_kobo = pdata.get('amount', 0)
        live_rate = _get_live_eur_ngn_rate()
        expected_kobo = int(settings.CV_DOWNLOAD_FEE_EUR * live_rate * 100)
        if paid_kobo < expected_kobo * 0.90:  # 10% tolerance covers rate drift between initiate + verify
            transaction.status = PaymentStatus.FAILED
            transaction.save(update_fields=['status', 'updated_at'])
            logger.warning(
                f'Amount mismatch: paid {paid_kobo} kobo, expected >={expected_kobo} '
                f'(rate={live_rate}) for ref {reference}'
            )
            return Response(
                {'error': 'amount_mismatch', 'message': 'Payment amount does not match the required fee.'},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )


        # All checks passed — mark transaction as paid
        transaction.status = PaymentStatus.PAID
        transaction.paystack_id = str(pdata.get('id', ''))
        transaction.amount_kobo = paid_kobo
        transaction.save(update_fields=['status', 'paystack_id', 'amount_kobo', 'updated_at'])

        # Immediately bust the user's dashboard cache so payment stats and CV
        # counts reflect the new payment without waiting for the 60-second TTL.
        # This is the ONLY place where we intentionally force-invalidate the
        # dashboard cache mid-session — all other cache entries expire naturally.
        try:
            from .cache_utils import safe_delete, dashboard_key
            safe_delete(dashboard_key(request.user.pk, request.user.role))
            logger.debug(
                'Payment cache bust: cleared dashboard cache for user=%s',
                request.user.pk,
            )
        except Exception as _cache_exc:
            logger.warning('Could not bust dashboard cache after payment: %s', _cache_exc)

        # Issue one-time download token (10 minutes)
        token_str = _make_download_token(request.user.pk, transaction.cv_id, transaction.pk)
        dt = DownloadToken.objects.create(
            user=request.user,
            cv=transaction.cv,
            transaction=transaction,
            token=token_str,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        logger.info(
            f'Payment verified: user={request.user.pk} cv={transaction.cv_id} '
            f'reference={reference} paystack_id={transaction.paystack_id}'
        )

        return Response({
            'download_token': dt.token,
            'cv_id': transaction.cv_id,
            'already_verified': False,
        })


@method_decorator(csrf_exempt, name='dispatch')
class PaystackWebhookView(APIView):
    """
    POST /api/payments/webhook/
    Receives async event notifications from Paystack.
    Validates the HMAC-SHA512 signature in X-Paystack-Signature header.
    On charge.success: marks matching transaction as paid and creates a download token.
    """
    permission_classes = [permissions.AllowAny]  # Webhook is public; auth via HMAC
    authentication_classes = []  # No JWT required

    def post(self, request):
        secret_key = settings.PAYSTACK_SECRET_KEY
        if not secret_key:
            return HttpResponse(status=400)

        # Validate Paystack HMAC-SHA512 signature
        paystack_sig = request.headers.get('X-Paystack-Signature', '')
        body_bytes = request.body  # raw bytes
        expected_sig = hmac.new(
            secret_key.encode('utf-8'),
            body_bytes,
            hashlib.sha512,
        ).hexdigest()

        if not hmac.compare_digest(paystack_sig, expected_sig):
            logger.warning(f'Paystack webhook: invalid signature received.')
            return HttpResponse('Invalid signature', status=401)

        try:
            event = json_module.loads(body_bytes.decode('utf-8'))
        except Exception:
            return HttpResponse('Bad JSON', status=400)

        event_type = event.get('event')
        edata = event.get('data', {})

        if event_type == 'charge.success':
            reference = edata.get('reference', '')
            paid_kobo = edata.get('amount', 0)
            paystack_id = str(edata.get('id', ''))
class CompanyPublicProfileView(APIView):
    """GET /api/company/<lookup_val>/ — get public details of a company (supports user_id or external company name)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, lookup_val):
        # 1. Try to parse lookup_val as user_id (integer)
        try:
            user_id = int(lookup_val)
            profile = CompanyProfile.objects.filter(user_id=user_id).first()
            if profile:
                serializer = CompanyPublicProfileSerializer(profile, context={'request': request})
                return Response(serializer.data)
        except ValueError:
            pass

        # 2. Check if lookup_val starts with 'external-' or look up by name
        company_name = lookup_val
        if lookup_val.startswith('external-'):
            from urllib.parse import unquote
            company_name = unquote(lookup_val[9:])

        # 3. Try to find a matching database CompanyProfile by name (case-insensitive)
        profile = CompanyProfile.objects.filter(company_name__iexact=company_name).first()
        if profile:
            serializer = CompanyPublicProfileSerializer(profile, context={'request': request})
            return Response(serializer.data)

        # 4. Check if there is any Job with this custom_company_name
        job = Job.objects.all_with_deleted().filter(custom_company_name__iexact=company_name).first()
        if job:
            return Response({
                'id': f'external-{company_name}',
                'company_name': job.custom_company_name,
                'website': job.external_apply_url or '',
                'industry': 'Technology' if 'tech' in job.title.lower() or 'saas' in job.title.lower() else 'Sales',
                'about_company': '',  # Compulsory About Company field is empty/blank for incomplete external profiles
                'logo_url': ''
            })

        return Response({'error': 'Company profile not found'}, status=404)



# ── Community Views (Mobile App Only) ─────────────────────────────────────────

class CommunityFeedView(generics.ListAPIView):
    """GET /api/community/posts/ — posts feed for authenticated users (all roles)."""
    serializer_class   = CommunityPostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Count, Exists, OuterRef, Value, BooleanField
        user = self.request.user

        qs = CommunityPost.objects.select_related('author')

        if user and user.is_authenticated:
            liked_subquery = CommunityPost.likes.through.objects.filter(
                communitypost_id=OuterRef('pk'),
                customuser_id=user.pk
            )
            qs = qs.annotate(user_has_liked=Exists(liked_subquery))
        else:
            qs = qs.annotate(user_has_liked=Value(False, output_field=BooleanField()))

        qs = qs.annotate(
            annotated_likes_count=Count('likes', distinct=True),
            annotated_comments_count=Count('community_comments', distinct=True)
        )

        category = self.request.query_params.get('category', '').strip()
        if category == 'trending':
            week_ago = timezone.now() - timedelta(days=7)
            qs = qs.filter(created_at__gte=week_ago).order_by('-annotated_likes_count', '-created_at')
        elif category and category not in ('polls',):
            # 'polls' is handled by the separate polls endpoint; filter everything else
            qs = qs.filter(category=category)
        else:
            qs = qs.order_by('-created_at')
        return qs


class CommunityPostCreateView(APIView):
    """POST /api/community/posts/create/ — body: { content, category }."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        content  = (request.data.get('content') or '').strip()
        category = (request.data.get('category') or 'general').strip()
        if not content:
            return Response({'error': 'Content is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(content) > 500:
            return Response({'error': 'Content must be 500 characters or fewer.'}, status=status.HTTP_400_BAD_REQUEST)
        valid_categories = ('general', 'wins', 'questions', 'tips', 'polls')
        if category not in valid_categories:
            category = 'general'
        post = CommunityPost.objects.create(author=request.user, content=content, category=category)
        serializer = CommunityPostSerializer(post, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CommunityPostLikeView(APIView):
    """POST /api/community/posts/<pk>/like/ — toggle like."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            post = CommunityPost.objects.get(pk=pk)
        except CommunityPost.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        user = request.user
        if post.likes.filter(pk=user.pk).exists():
            post.likes.remove(user)
            liked = False
        else:
            post.likes.add(user)
            liked = True
        return Response({'liked': liked, 'likes_count': post.likes.count()})


class CommunityCommentListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/community/posts/<pk>/comments/"""
    serializer_class   = CommunityCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CommunityComment.objects.filter(post_id=self.kwargs['pk']).select_related('author', 'parent', 'parent__author').prefetch_related('likes', 'dislikes')

    def perform_create(self, serializer):
        try:
            post = CommunityPost.objects.get(pk=self.kwargs['pk'])
        except CommunityPost.DoesNotExist:
            raise ValidationError('Post not found.')

        parent_id = self.request.data.get('parent')
        if parent_id:
            try:
                parent_comment = CommunityComment.objects.get(pk=parent_id)
                if parent_comment.post_id != post.id:
                    raise ValidationError('Parent comment does not belong to this post.')
            except CommunityComment.DoesNotExist:
                raise ValidationError('Parent comment not found.')

        serializer.save(author=self.request.user, post=post)


class CommunityCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """PATCH/DELETE /api/community/comments/<pk>/ for editing and deleting."""
    queryset = CommunityComment.objects.all()
    serializer_class = CommunityCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        comment = self.get_object()
        if comment.author != self.request.user:
            raise PermissionDenied("You can only edit your own comments.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            raise PermissionDenied("You can only delete your own comments.")
        instance.delete()


class CommunityCommentLikeView(APIView):
    """POST /api/community/comments/<pk>/like/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            comment = CommunityComment.objects.get(pk=pk)
        except CommunityComment.DoesNotExist:
            return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)

        if comment.likes.filter(pk=request.user.pk).exists():
            comment.likes.remove(request.user)
            liked = False
        else:
            comment.likes.add(request.user)
            comment.dislikes.remove(request.user)
            liked = True

        return Response({
            'is_liked': liked,
            'is_disliked': False,
            'likes_count': comment.likes.count(),
            'dislikes_count': comment.dislikes.count()
        })


class CommunityCommentDislikeView(APIView):
    """POST /api/community/comments/<pk>/dislike/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            comment = CommunityComment.objects.get(pk=pk)
        except CommunityComment.DoesNotExist:
            return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)

        if comment.dislikes.filter(pk=request.user.pk).exists():
            comment.dislikes.remove(request.user)
            disliked = False
        else:
            comment.dislikes.add(request.user)
            comment.likes.remove(request.user)
            disliked = True

        return Response({
            'is_liked': False,
            'is_disliked': disliked,
            'likes_count': comment.likes.count(),
            'dislikes_count': comment.dislikes.count()
        })


class CommunityCommentReportView(APIView):
    """POST /api/community/comments/<pk>/report/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            comment = CommunityComment.objects.get(pk=pk)
        except CommunityComment.DoesNotExist:
            return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'other')
        report, created = CommunityCommentReport.objects.get_or_create(
            comment=comment,
            reporter=request.user,
            defaults={'reason': reason}
        )
        if not created:
            return Response({'detail': 'You have already reported this comment.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'status': 'reported', 'id': report.id})


class CommunityPollListView(generics.ListAPIView):
    """GET /api/community/polls/ — list polls, newest first."""
    serializer_class   = CommunityPollSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CommunityPoll.objects.select_related('author').prefetch_related(
            'choices__poll_votes'
        ).order_by('-created_at')


class CommunityPollCreateView(APIView):
    """POST /api/community/polls/create/ — body: { question, category, choices[], ends_at? }."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = (request.data.get('question') or '').strip()
        category = (request.data.get('category') or 'polls').strip()
        choices  = request.data.get('choices', [])
        ends_at  = request.data.get('ends_at', None)
        if not question:
            return Response({'error': 'Question is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(choices) < 2:
            return Response({'error': 'At least 2 choices are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(choices) > 4:
            return Response({'error': 'Maximum 4 choices allowed.'}, status=status.HTTP_400_BAD_REQUEST)
        poll = CommunityPoll.objects.create(
            author=request.user, question=question, category=category, ends_at=ends_at,
        )
        for i, text in enumerate(choices):
            text = str(text).strip()
            if text:
                CommunityPollChoice.objects.create(poll=poll, text=text, order=i)
        serializer = CommunityPollSerializer(poll, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CommunityPollVoteView(APIView):
    """POST /api/community/polls/<pk>/vote/ — cast or change vote. Body: { choice_id }."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        choice_id = request.data.get('choice_id')
        if not choice_id:
            return Response({'error': 'choice_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            poll   = CommunityPoll.objects.get(pk=pk)
            choice = CommunityPollChoice.objects.get(pk=choice_id, poll=poll)
        except (CommunityPoll.DoesNotExist, CommunityPollChoice.DoesNotExist):
            return Response({'error': 'Poll or choice not found.'}, status=status.HTTP_404_NOT_FOUND)
        user = request.user
        # Delete existing vote (allow changing vote) then create new one
        CommunityPollVote.objects.filter(poll=poll, voter=user).delete()
        CommunityPollVote.objects.create(poll=poll, choice=choice, voter=user)
        serializer = CommunityPollSerializer(poll, context={'request': request})
        return Response(serializer.data)


class CommunityMyPostsView(generics.ListAPIView):
    """GET /api/community/my-posts/ — authenticated user's own posts."""
    serializer_class   = CommunityPostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CommunityPost.objects.filter(
            author=self.request.user
        ).select_related('author').prefetch_related('likes', 'community_comments')



class CommunityPostUpdateView(APIView):
    """PATCH /api/community/posts/<pk>/edit/ - author only."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            post = CommunityPost.objects.get(pk=pk)
        except CommunityPost.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        if post.author_id != request.user.pk:
            return Response({'error': 'Not your post.'}, status=status.HTTP_403_FORBIDDEN)
        content = (request.data.get('content') or '').strip()
        if content:
            if len(content) > 500:
                return Response({'error': 'Content must be 500 characters or fewer.'}, status=status.HTTP_400_BAD_REQUEST)
            post.content = content
        for field in ('is_anonymous', 'hide_likes', 'comments_disabled'):
            val = request.data.get(field)
            if val is not None:
                setattr(post, field, bool(val))
        post.save()
        serializer = CommunityPostSerializer(post, context={'request': request})
        return Response(serializer.data)


class CommunityPostDeleteView(APIView):
    """DELETE /api/community/posts/<pk>/delete/ - author only."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            post = CommunityPost.objects.get(pk=pk)
        except CommunityPost.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        if post.author_id != request.user.pk:
            return Response({'error': 'Not your post.'}, status=status.HTTP_403_FORBIDDEN)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommunityReportView(APIView):
    """POST /api/community/posts/<pk>/report/ - body: { reason }."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            post = CommunityPost.objects.get(pk=pk)
        except CommunityPost.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
        if post.author_id == request.user.pk:
            return Response({'error': 'You cannot report your own post.'}, status=status.HTTP_400_BAD_REQUEST)
        reason = (request.data.get('reason') or 'other').strip()
        valid_reasons = [r[0] for r in CommunityReport.Reason.choices]
        if reason not in valid_reasons:
            reason = 'other'
        _, created = CommunityReport.objects.get_or_create(
            post=post,
            reporter=request.user,
            defaults={'reason': reason},
        )
        if not created:
            return Response({'detail': 'You have already reported this post.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Report submitted. Thank you for keeping the community safe.'}, status=status.HTTP_201_CREATED)
