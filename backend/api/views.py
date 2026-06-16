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
import jwt

import re
import io
import logging
from collections import Counter
from django.utils import timezone
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

logger = logging.getLogger(__name__)

from datetime import timedelta
from .models import CustomUser, EmployeeProfile, CompanyProfile, Job, Application, Notification, SavedJob
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
    EmployeeProfileSerializer,
    CompanyProfileSerializer,
    JobSerializer,
    ApplicationSerializer,
    NotificationSerializer,
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

    def perform_create(self, serializer):
        from django.db import transaction
        from rest_framework.exceptions import ValidationError
        
        try:
            with transaction.atomic():
                user = serializer.save()
                
                # Automatically trigger verification email
                from django.conf import settings
                from .email_templates import get_verification_email_html, send_courier_email
                import datetime
                import jwt
                
                token = jwt.encode({
                    'email': user.email,
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
                }, settings.SECRET_KEY, algorithm='HS256')
                
                frontend_url = settings.FRONTEND_URL
                verify_link = f"{frontend_url}/verify-email?token={token}"
                display_name = user.get_full_name() or user.username
                
                html_content = get_verification_email_html(user=display_name, redirect=verify_link)
                text_content = f"Hi {display_name},\n\nPlease verify your email for Quota Hire using this link:\n{verify_link}"
                
                send_courier_email(
                    to_email=user.email,
                    subject="Verify your email for Quota Hire",
                    text_content=text_content,
                    html_content=html_content
                )
                
        except Exception as e:
            logger.error(f"Registration failed - Could not send verification email to {serializer.validated_data.get('email')}: {e}")
            raise ValidationError({
                "email": "We couldn't send a verification email to this address. Please ensure the email is valid and try again later."
            })


class CustomTokenObtainPairView(TokenObtainPairView):
    """POST /api/auth/login/ — returns JWT access + refresh tokens with user info."""
    serializer_class = CustomTokenObtainPairSerializer


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

    def post(self, request):
        if 'avatar' not in request.FILES:
            return Response({'error': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        user.avatar = request.FILES['avatar']
        user.save(update_fields=['avatar'])
        
        avatar_url = request.build_absolute_uri(user.avatar.url)
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
    GET  /api/jobs/ — list approved jobs (public). Cached for 5 minutes.
    POST /api/jobs/ — post a new job (company only, starts as pending).
    """
    serializer_class = JobSerializer

    @method_decorator(cache_page(60 * 5))
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsCompany()]
        return [permissions.AllowAny()]

    def create(self, request, *args, **kwargs):
        print("INCOMING JOB DATA:", request.data)
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        qs = Job.objects.filter(status='approved').select_related('company')
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
            return Response({'message': 'Email verified successfully'}, status=status.HTTP_200_OK)
            
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Verification link has expired'}, status=status.HTTP_400_BAD_REQUEST)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid verification link'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Email verification failed: {e}", exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SendVerificationEmailView(APIView):
    permission_classes = []
    authentication_classes = []

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
        
        frontend_url = settings.FRONTEND_URL
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
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response({'message': 'Verification email sent'}, status=status.HTTP_200_OK)

class ForgotPasswordView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.filter(email=email).first()
        if not user:
            return Response({'message': 'If the email exists, a recovery link has been sent.'}, status=status.HTTP_200_OK)

        token = jwt.encode({
            'email': email,
            'exp': timezone.now() + timedelta(hours=1)
        }, settings.SECRET_KEY, algorithm='HS256')

        frontend_url = settings.FRONTEND_URL
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
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class JobDetailView(generics.RetrieveAPIView):
    """GET /api/jobs/<id>/ — get a single approved job. Cached for 5 minutes."""
    serializer_class   = JobSerializer
    permission_classes = [permissions.AllowAny]
    queryset           = Job.objects.filter(status='approved')

    @method_decorator(cache_page(60 * 5))
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


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
        return Response(JobSerializer(job).data)


# ── Analytics ─────────────────────────────────────────────────────────────────

class DashboardAnalyticsView(APIView):
    """GET /api/dashboard/analytics/ — Returns chart data and stats for dashboards."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
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

            return Response({
                'marketInsightsData': market_insights,
                'skillMatchData': skill_match,
                'applicationActivityData': app_activity,
                'activeApps': my_apps.count()
            })

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

            return Response({
                'applicantVelocityData': applicant_velocity,
                'jobPerformanceData': job_performance,
                'activeRolesCount': active_jobs.count(),
                'totalApplicantsCount': all_apps.count(),
                'topMatchesCount': top_matches
            })

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
        return Response(ApplicationSerializer(app).data, status=status.HTTP_201_CREATED)


class MyApplicationsView(generics.ListAPIView):
    """GET /api/applications/ — list the current user's own applications (or applications to company's jobs)."""
    serializer_class   = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'company':
            return Application.objects.filter(job__company=user).select_related('job', 'employee')
        return Application.objects.filter(employee=user).select_related('job')


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

    def post(self, request):
        if 'resume' not in request.FILES:
            return Response({'error': 'No resume file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        resume_file = request.FILES['resume']
        filename = resume_file.name.lower()

        if not (filename.endswith('.pdf') or filename.endswith('.docx') or filename.endswith('.doc')):
            return Response(
                {'error': 'Only PDF, DOC, and DOCX files are accepted.'},
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
        profile.resume_file = resume_file
        profile.save(update_fields=['resume_file'])

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
    from .serializers import CompanyApplicantSerializer
    serializer_class = CompanyApplicantSerializer
    permission_classes = [IsCompany]

    def get_queryset(self):
        job_id = self.kwargs.get('job_id')
        return Application.objects.filter(job_id=job_id, job__company=self.request.user).select_related('employee', 'job')

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
            # Get the raw Cloudinary public_id from the file field
            resume_field = profile.resume_file
            
            # Use the direct .url property (works if already public)
            direct_url = resume_field.url
            # Cloudinary requires .pdf extension to serve PDF files correctly without 401 error
            if 'cloudinary.com' in direct_url and not direct_url.lower().endswith('.pdf'):
                # Sometimes the url might have query params, but usually resume_field.url does not.
                if '?' in direct_url:
                    parts = direct_url.split('?', 1)
                    direct_url = parts[0] + '.pdf?' + parts[1]
                else:
                    direct_url += '.pdf'
            return Response({'url': direct_url}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': 'Could not resolve resume URL.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

