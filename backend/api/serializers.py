"""
Quota Hire — DRF Serializers
"""

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import re

def sanitize_text(value):
    if not value:
        return value
    # Remove emojis and characters outside the basic multilingual plane (BMP)
    # This prevents DB crashes on strict utf8 setups and PDF generation crashes.
    return re.sub(r'[^\u0000-\uFFFF]', '', str(value))


def optimize_image_url(url):
    if not url:
        return url
    # If the URL points to Cloudinary, inject f_auto,q_auto for automated format (WebP) and quality optimization.
    if 'res.cloudinary.com' in url and '/image/upload/' in url:
        parts = url.split('/image/upload/')
        if len(parts) == 2:
            return f"{parts[0]}/image/upload/f_auto,q_auto/{parts[1]}"
    return url


from .models import (
    CustomUser,
    UserRole,
    EmployeeProfile,
    CompanyProfile,
    Job,
    Application,
    Notification,
    SavedJob,
    GeneratedCV,
    CommunityPost,
    CommunityComment,
    CommunityPoll,
    CommunityPollChoice,
    CommunityPollVote,
    username_for_email,
)


# ── JWT Token ─────────────────────────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds user data to the JWT response so the frontend knows the role immediately."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role']  = user.role
        token['email'] = user.email
        token['name']  = user.get_full_name() or user.username
        return token

    def validate(self, attrs):
        from rest_framework.exceptions import AuthenticationFailed
        
        email = attrs.get(self.username_field)
        password = attrs.get('password')

        if email and password:
            user = CustomUser.objects.filter(**{self.username_field: email}).first()

            # SECURITY (QH-04): one message for "no such account" and "wrong
            # password". Previously these were distinct ('No account found
            # please sign up' vs 'Password incorrect'), which turned the login
            # form into a free oracle for enumerating registered users.
            if user is None:
                # Run a hash anyway so a missing account cannot be detected by
                # how quickly the request comes back — without this, the
                # no-account path returns before any password hashing happens.
                CustomUser().set_password(password)
                raise AuthenticationFailed('Incorrect email or password.')

            if not user.check_password(password):
                raise AuthenticationFailed('Incorrect email or password.')

            # Only reachable once the password is already correct, so this
            # message reveals nothing to someone who does not hold the
            # credentials — and the resend-verification flow needs it.
            if not user.email_verified and not user.is_staff and not user.is_superuser:
                raise AuthenticationFailed('The account with this email is not verified.')

        try:
            data = super().validate(attrs)
        except AuthenticationFailed as e:
            # Re-raise if we raised it, or if it's from super
            raise e
        except Exception:
            raise AuthenticationFailed('An unexpected error occurred during login. Please try again.')

        saved_entries = SavedJob.objects.filter(user=self.user).select_related('job').order_by('-saved_at')
        data['user'] = {
            'id':              self.user.id,
            'email':           self.user.email,
            'name':            self.user.get_full_name() or self.user.username,
            'role':            self.user.role,
            'setup_completed': self.user.setup_completed,
            'location':        self.user.location,
            'saved_jobs':      [{'id': e.job_id, 'saved_at': e.saved_at.isoformat()} for e in saved_entries],
            'avatarUrl':       optimize_image_url(self.user.avatar.url) if self.user.avatar else None,
        }
        return data


# ── Profile Serializers ───────────────────────────────────────────────────────

class EmployeeProfileSerializer(serializers.ModelSerializer):
    bio = serializers.CharField(max_length=2000, allow_blank=True, required=False)
    has_resume = serializers.SerializerMethodField()
    experienceYears = serializers.IntegerField(source='experience_years', required=False)

    class Meta:
        model  = EmployeeProfile
        fields = ('title', 'bio', 'linkedin_url', 'resume_url', 'resume_file', 'has_resume', 'resume_filename', 'education', 'skills', 'experience_years', 'experienceYears', 'phone_number', 'country', 'city', 'postal_code', 'street_address')
        read_only_fields = ('has_resume', 'resume_filename')

    def validate_bio(self, value):
        return sanitize_text(value)

    def get_has_resume(self, obj) -> bool:
        """Whether this profile has a CV on file, by any of the three routes.

        ResumeUploadView deliberately stores the file in `resume_binary` and
        stops there — it used to also assign `resume_file`, which pushed the
        document at Cloudinary's image endpoint and failed for every PDF and
        DOCX. But `resume_binary` is not in this serializer (it is a BinaryField
        of megabytes), so the only resume fields the frontend could see were the
        two that an upload no longer fills.

        The result was that a freshly uploaded CV looked like no CV at all: the
        profile-completeness check never counted it, and the Apply button — which
        required a "100%" profile — could never be satisfied by anyone who had
        uploaded through the app. This flag reports the real answer.
        """
        return bool(obj.resume_binary or obj.resume_file or obj.resume_url)


class CompanyProfileSerializer(serializers.ModelSerializer):
    about_company = serializers.CharField(max_length=5000, allow_blank=True, required=False)
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model  = CompanyProfile
        fields = ('company_name', 'website', 'industry', 'about_company', 'logo_url', 'contact_email', 'contact_phone')

    def validate_about_company(self, value):
        return sanitize_text(value)

    def get_logo_url(self, obj):
        request = self.context.get('request') if self.context else None
        logo = obj.logo_url
        if logo:
            if request and not logo.startswith('http'):
                return optimize_image_url(request.build_absolute_uri(logo))
            return optimize_image_url(logo)
        if obj.user and obj.user.avatar:
            if request:
                return optimize_image_url(request.build_absolute_uri(obj.user.avatar.url))
            return optimize_image_url(obj.user.avatar.url)
        return None


class CompanyPublicProfileSerializer(serializers.ModelSerializer):
    """Serializer for public company profiles — hides all contact phone and email fields."""
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model  = CompanyProfile
        fields = ('id', 'company_name', 'website', 'industry', 'about_company', 'logo_url')

    def get_logo_url(self, obj):
        request = self.context.get('request') if self.context else None
        logo = obj.logo_url
        if logo:
            if request and not logo.startswith('http'):
                return optimize_image_url(request.build_absolute_uri(logo))
            return optimize_image_url(logo)
        if obj.user and obj.user.avatar:
            if request:
                return optimize_image_url(request.build_absolute_uri(obj.user.avatar.url))
            return optimize_image_url(obj.user.avatar.url)
        return None


# ── User Serializers ──────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    employee_profile = EmployeeProfileSerializer(read_only=True)
    company_profile  = CompanyProfileSerializer(read_only=True)
    name             = serializers.SerializerMethodField()
    avatarUrl        = serializers.SerializerMethodField()
    is_verified      = serializers.SerializerMethodField()
    saved_jobs       = serializers.SerializerMethodField()

    class Meta:
        model  = CustomUser
        fields = ('id', 'email', 'name', 'first_name', 'last_name', 'role', 'setup_completed', 'location', 'saved_jobs', 'created_at', 'employee_profile', 'company_profile', 'avatarUrl', 'is_verified')
        # SECURITY (QH-05): email is the USERNAME_FIELD, so a writable email
        # let anyone holding a stolen access token repoint the account at their
        # own address — email_verified was not reset — and then use
        # forgot-password to lock the real owner out permanently. Changing an
        # email must go through a dedicated, re-authenticated, verified flow.
        read_only_fields = ('id', 'created_at', 'role', 'email')

    def get_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_saved_jobs(self, obj):
        """Return list of {id, saved_at} so the frontend can show the save date."""
        entries = SavedJob.objects.filter(user=obj).select_related('job').order_by('-saved_at')
        return [
            {'id': entry.job_id, 'saved_at': entry.saved_at.isoformat()}
            for entry in entries
        ]

    def get_avatarUrl(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return optimize_image_url(request.build_absolute_uri(obj.avatar.url))
            return optimize_image_url(obj.avatar.url)
        return None

    def get_is_verified(self, obj):
        return obj.is_verified


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')
    name      = serializers.CharField(required=True, write_only=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, write_only=True)
    city      = serializers.CharField(required=False, allow_blank=True, write_only=True)
    country   = serializers.CharField(required=False, allow_blank=True, write_only=True)

    # SECURITY (QH-01): role must never be inferred from the model's choices.
    # UserRole also declares admin, SUPERADMIN, FINANCE_ADMIN, HR_OPS and
    # SALES_CAM — a plain ModelSerializer field would accept any of them from
    # an unauthenticated caller, who could then self-assign administrator.
    # Only the two roles a member of the public may legitimately choose are
    # listed here; anything else is rejected with a 400.
    role = serializers.ChoiceField(
        choices=[
            (UserRole.EMPLOYEE, 'Employee'),
            (UserRole.COMPANY,  'Company'),
        ],
        default=UserRole.EMPLOYEE,
    )

    class Meta:
        model  = CustomUser
        fields = ('email', 'name', 'role', 'password', 'password2', 'phone_number', 'city', 'country')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        name    = validated_data.pop('name', '')
        phone_number = validated_data.pop('phone_number', '')
        city    = validated_data.pop('city', '')
        country = validated_data.pop('country', '')

        parts = name.strip().split(' ', 1)
        first = parts[0]
        last  = parts[1] if len(parts) > 1 else ''

        user = CustomUser.objects.create_user(
            # username is varchar(150) while email is varchar(254): passing the
            # raw address through made any email over 150 characters a 500.
            username   = username_for_email(validated_data['email']),
            email      = validated_data['email'],
            password   = validated_data['password'],
            role       = validated_data.get('role', 'employee'),
            first_name = first,
            last_name  = last,
        )
        
        if city or country:
            user.location = f"{city}{', ' if city and country else ''}{country}"
            user.save()

        # Auto-create the matching profile
        if user.role == 'employee':
            EmployeeProfile.objects.create(
                user=user, 
                phone_number=phone_number,
                city=city,
                country=country
            )
        elif user.role == 'company':
            CompanyProfile.objects.create(
                user=user, 
                company_name=name,
                contact_phone=phone_number
            )
        return user


# ── Job Serializers ───────────────────────────────────────────────────────────

class JobSerializer(serializers.ModelSerializer):
    company_name     = serializers.SerializerMethodField()
    company_id       = serializers.SerializerMethodField()
    company_is_verified = serializers.SerializerMethodField()
    company_logo_url = serializers.SerializerMethodField()
    company_about    = serializers.SerializerMethodField()
    applicants_count = serializers.SerializerMethodField()
    description      = serializers.CharField(max_length=5000, allow_blank=True, required=False)

    class Meta:
        model  = Job
        fields = (
            'id', 'company_id', 'company_name', 'company_is_verified', 'company_logo_url',
            'title', 'description', 'requirements', 'employment_type',
            'is_remote', 'location', 'salary_range', 'commission_range', 'currency',
            'contact_email', 'contact_phone', 'whatsapp_number', 'company_address', 'custom_company_name',
            'external_apply_url', 'status', 'package', 'applicants_count', 'created_at', 'job_code', 'company_about',
        )
        read_only_fields = ('id', 'status', 'created_at', 'job_code', 'company_about')

    def validate_description(self, value):
        return sanitize_text(value)

    def get_company_name(self, obj):
        return obj.company_name

    def get_company_id(self, obj):
        return obj.company_id

    def get_company_is_verified(self, obj):
        return obj.company.is_verified

    def get_company_logo_url(self, obj):
        request = self.context.get('request')
        if obj.company.avatar:
            if request:
                return optimize_image_url(request.build_absolute_uri(obj.company.avatar.url))
            return optimize_image_url(obj.company.avatar.url)
        try:
            logo = obj.company.company_profile.logo_url
            if logo:
                if request and not logo.startswith('http'):
                    return optimize_image_url(request.build_absolute_uri(logo))
                return optimize_image_url(logo)
        except Exception:
            pass
        return None

    def create(self, validated_data):
        validated_data['company']  = self.context['request'].user
        validated_data['status']   = 'pending'
        return super().create(validated_data)

    def get_applicants_count(self, obj):
        return obj.applications.count()

    def get_company_about(self, obj):
        try:
            return obj.company.company_profile.about_company
        except Exception:
            return ""


# ── Application Serializers ───────────────────────────────────────────────────

class ApplicationSerializer(serializers.ModelSerializer):
    job_title    = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.SerializerMethodField()
    company_logo_url = serializers.SerializerMethodField()
    employee_name = serializers.SerializerMethodField()
    cover_letter = serializers.CharField(max_length=3000, allow_blank=True, required=False)

    class Meta:
        model  = Application
        fields = ('id', 'job', 'job_title', 'company_name', 'company_logo_url', 'employee', 'employee_name', 'status', 'cover_letter', 'applied_at')
        read_only_fields = ('id', 'employee', 'status', 'applied_at')

    def validate_cover_letter(self, value):
        return sanitize_text(value)

    def get_company_name(self, obj):
        return obj.job.company_name

    def get_company_logo_url(self, obj):
        request = self.context.get('request')
        company = obj.job.company
        if company.avatar:
            if request:
                return optimize_image_url(request.build_absolute_uri(company.avatar.url))
            return optimize_image_url(company.avatar.url)
        try:
            logo = company.company_profile.logo_url
            if logo:
                if request and not logo.startswith('http'):
                    return optimize_image_url(request.build_absolute_uri(logo))
                return optimize_image_url(logo)
        except Exception:      # QH-30: never swallow SystemExit/KeyboardInterrupt
            pass
        return None

    def get_employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.username

    def create(self, validated_data):
        validated_data['employee'] = self.context['request'].user
        return super().create(validated_data)


# ── Notification Serializer ───────────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = ('id', 'title', 'message', 'read', 'created_at')
        read_only_fields = ('id', 'created_at')


# ── Company Applicant Review Serializers ──────────────────────────────────────

import re

def scrub_contact_info(text, user=None, profile=None):
    if not text:
        return text
    
    # Simple regex to remove email
    text = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '', text)
    
    # Phone numbers
    text = re.sub(r'(?:\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?|\(\d{2,4}\))[-.\s]?\d{3,4}[-.\s]?\d{3,4}', '', text)

    # Street addresses using common keywords
    addr_pattern = r'\b\d{1,5}\s+[a-zA-Z0-9\s.,-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Plaza|Plz|Square|Sq|Close|Crescent|Estate)\b'
    text = re.sub(addr_pattern, '', text, flags=re.IGNORECASE)

    # Specific scrubbing based on actual user data (bulletproof)
    strings_to_hide = []
    if user and user.location:
        strings_to_hide.append(user.location)
    if profile:
        for field in ['street_address', 'city', 'country', 'postal_code', 'phone_number']:
            val = getattr(profile, field, None)
            if val and len(val) > 2:
                strings_to_hide.append(val)
                
    # Also grab parts of the address (like hiding 'Lagos' if 'Lagos, Nigeria' was extracted)
    for val in list(strings_to_hide):
        if ',' in val:
            parts = [p.strip() for p in val.split(',')]
            for p in parts:
                if len(p) > 3 and p not in strings_to_hide:
                    strings_to_hide.append(p)
                    
    # Sort strings by length descending to replace the longest matching strings first
    strings_to_hide.sort(key=len, reverse=True)
    
    for s in strings_to_hide:
        # Create a regex to match the exact string case-insensitively
        escaped_s = re.escape(s)
        # Use regex to replace without word boundaries to catch variations
        text = re.sub(escaped_s, '', text, flags=re.IGNORECASE)

    # Final cleanup to remove multiple commas or spaces that might be left behind
    text = re.sub(r'(\s*,\s*)+', ', ', text)
    text = re.sub(r'^\s*,\s*', '', text)

    return text

def calculate_experience_from_work_entries(work_entries):
    """
    Computes total years of experience from structured CV work experience items.
    Parses date/year spans such as '2021 - 2023' or '2023 - Present'.
    """
    if not work_entries or not isinstance(work_entries, list):
        return 0
    total = 0
    import datetime
    current_year = datetime.datetime.now().year
    for entry in work_entries:
        if not isinstance(entry, dict):
            continue
        period = str(entry.get('period', '') or '')
        years = re.findall(r'\b(20\d\d|19\d\d)\b', period)
        if len(years) >= 2:
            y1, y2 = int(years[0]), int(years[1])
            diff = max(1, abs(y2 - y1))
            total += diff
        elif len(years) == 1:
            y1 = int(years[0])
            if any(w in period.lower() for w in ('present', 'current', 'now')):
                diff = max(1, current_year - y1)
                total += diff
            else:
                total += 1
        elif entry.get('role') or entry.get('company'):
            total += 1
    return min(total, 40)

class SafeEmployeeProfileSerializer(serializers.ModelSerializer):
    experienceYears = serializers.IntegerField(source='experience_years', read_only=True)

    class Meta:
        model = EmployeeProfile
        fields = ('title', 'bio', 'linkedin_url', 'resume_url', 'resume_file', 'education', 'skills', 'experience_years', 'experienceYears')
        read_only_fields = fields

class CompanyApplicantSerializer(serializers.ModelSerializer):
    """
    Serializes application for company view.
    For 'promoted' jobs: exposes full unmasked candidate contact info, raw bio/cover letter, and resume download.
    For standard agency packages: strictly preserves anonymization and hides contact info.
    """
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_package = serializers.CharField(source='job.package', read_only=True)
    employee_name = serializers.SerializerMethodField()
    employee_profile = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    is_shortlisted = serializers.SerializerMethodField()
    applicant_email = serializers.SerializerMethodField()
    applicant_phone = serializers.SerializerMethodField()
    applicant_location = serializers.SerializerMethodField()
    applicant_address = serializers.SerializerMethodField()
    applicant_linkedin = serializers.SerializerMethodField()
    has_resume = serializers.SerializerMethodField()
    has_generated_cv = serializers.SerializerMethodField()
    resume_download_url = serializers.SerializerMethodField()
    experience_years = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = (
            'id', 'job', 'job_title', 'job_package', 'employee_name', 'status',
            'cover_letter', 'applied_at', 'employee_profile', 'avatar_url',
            'is_shortlisted', 'applicant_email', 'applicant_phone',
            'applicant_location', 'applicant_address', 'applicant_linkedin',
            'has_resume', 'has_generated_cv', 'resume_download_url', 'experience_years'
        )
        read_only_fields = fields

    def _is_promoted(self, obj):
        pkg = str(getattr(obj.job, 'package', '') or '').strip().lower()
        return pkg == 'promoted' or 'promoted' in pkg

    def get_employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.username

    def get_applicant_email(self, obj):
        if self._is_promoted(obj):
            return obj.employee.email
        return None

    def get_applicant_phone(self, obj):
        if self._is_promoted(obj):
            try:
                return obj.employee.employee_profile.phone_number or getattr(obj.employee, 'phone_number', '')
            except Exception:
                return getattr(obj.employee, 'phone_number', '')
        return None

    def get_applicant_location(self, obj):
        if self._is_promoted(obj):
            try:
                p = obj.employee.employee_profile
                parts = [p.city, p.country]
                loc = ', '.join(x for x in parts if x)
                return loc or getattr(obj.employee, 'location', '')
            except Exception:
                return getattr(obj.employee, 'location', '')
        return None

    def get_applicant_address(self, obj):
        if self._is_promoted(obj):
            try:
                p = obj.employee.employee_profile
                parts = [p.street_address, p.postal_code]
                return ', '.join(x for x in parts if x)
            except Exception:
                return ''
        return None

    def get_applicant_linkedin(self, obj):
        if self._is_promoted(obj):
            try:
                return obj.employee.employee_profile.linkedin_url or ''
            except Exception:
                return ''
        return None

    def get_has_resume(self, obj):
        try:
            p = obj.employee.employee_profile
            return bool(p.resume_binary or p.resume_file or p.resume_url)
        except Exception:
            return False

    def get_has_generated_cv(self, obj):
        try:
            return hasattr(obj, 'generated_cv') or obj.employee.generated_cvs.exists()
        except Exception:
            return False

    def get_resume_download_url(self, obj):
        if self._is_promoted(obj):
            return f'/api/company/applications/{obj.id}/resume/'
        return None

    def get_experience_years(self, obj):
        try:
            profile = getattr(obj.employee, 'employee_profile', None)
            if profile and profile.experience_years > 0:
                return profile.experience_years
            # Fallback to calculating from GeneratedCV if profile has 0
            for cv in obj.employee.generated_cvs.all():
                if cv.work_experience_json:
                    yrs = calculate_experience_from_work_entries(cv.work_experience_json)
                    if yrs > 0:
                        if profile and profile.experience_years == 0:
                            profile.experience_years = yrs
                            profile.save(update_fields=['experience_years'])
                        return yrs
            return profile.experience_years if profile else 0
        except Exception:
            return 0

    def get_employee_profile(self, obj):
        try:
            profile = obj.employee.employee_profile
            data = SafeEmployeeProfileSerializer(profile).data
            
            # If experience_years is 0, attempt to dynamically resolve from CV
            if not data.get('experience_years'):
                calc_exp = self.get_experience_years(obj)
                if calc_exp > 0:
                    data['experience_years'] = calc_exp
            data['experienceYears'] = data.get('experience_years', 0)
            
            if not self._is_promoted(obj):
                # Scrub bio using exact profile data for non-promoted jobs
                if data.get('bio'):
                    data['bio'] = scrub_contact_info(data['bio'], user=obj.employee, profile=profile)
                data['linkedin_url'] = ''
                data['resume_url'] = ''
                data['resume_file'] = None
            else:
                # For promoted jobs, provide all profile contact details unscrubbed
                data['phone_number'] = profile.phone_number or getattr(obj.employee, 'phone_number', '')
                data['street_address'] = profile.street_address or ''
                data['city'] = profile.city or ''
                data['country'] = profile.country or ''
                data['postal_code'] = profile.postal_code or ''
                
            return data
        except EmployeeProfile.DoesNotExist:
            return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Scrub cover letter only for non-promoted jobs
        if not self._is_promoted(instance):
            if data.get('cover_letter'):
                profile = getattr(instance.employee, 'employee_profile', None)
                data['cover_letter'] = scrub_contact_info(data['cover_letter'], user=instance.employee, profile=profile)
        return data

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.employee.avatar:
            if request:
                return optimize_image_url(request.build_absolute_uri(obj.employee.avatar.url))
            return optimize_image_url(obj.employee.avatar.url)
        return None

    def get_is_shortlisted(self, obj):
        return hasattr(obj, 'shortlist')

CompanyApplicantListSerializer = CompanyApplicantSerializer

class ShortlistedApplicantSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import ShortlistedApplicant
        model = ShortlistedApplicant
        fields = ('id', 'application', 'status', 'shortlisted_at', 'updated_at')
        read_only_fields = ('id', 'shortlisted_at', 'updated_at')


# ── Generated CV Serializer ───────────────────────────────────────────────────

class GeneratedCVSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()
    is_paid = serializers.SerializerMethodField()

    class Meta:
        model  = GeneratedCV
        fields = (
            'id', 'template_id', 'template_name', 'target_role',
            'target_company', 'cover_letter_text', 'generated_at',
            'download_url', 'application', 'work_experience_json', 'is_paid',
        )
        read_only_fields = ('id', 'generated_at', 'download_url', 'is_paid')

    def get_download_url(self, obj):
        request = self.context.get('request')
        url = f'/api/cv/{obj.id}/download/'
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_is_paid(self, obj):
        from .models import PaymentTransaction, PaymentStatus
        return PaymentTransaction.objects.filter(cv=obj, status=PaymentStatus.PAID).exists()


# ── Community Serializers (Mobile App Only) ───────────────────────────────────

class CommunityAuthorSerializer(serializers.ModelSerializer):
    """Minimal author info shown on community posts/comments."""
    name       = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model  = CustomUser
        fields = ('id', 'name', 'avatar_url')

    def get_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return optimize_image_url(request.build_absolute_uri(obj.avatar.url))
        return None


class CommunityCommentSerializer(serializers.ModelSerializer):
    author = CommunityAuthorSerializer(read_only=True)
    # QH-19: comment bodies had no length limit anywhere, while posts were
    # capped at 500 characters in the view. The model field is a TextField,
    # so the effective ceiling was the whole request body.
    content = serializers.CharField(max_length=1000, allow_blank=False, trim_whitespace=True)
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_disliked = serializers.SerializerMethodField()
    is_author = serializers.SerializerMethodField()
    parent_author_name = serializers.SerializerMethodField()

    class Meta:
        model  = CommunityComment
        fields = (
            'id', 'author', 'content', 'created_at',
            'likes_count', 'dislikes_count', 'is_liked', 'is_disliked',
            'is_author', 'parent', 'parent_author_name'
        )
        read_only_fields = (
            'id', 'author', 'created_at',
            'likes_count', 'dislikes_count', 'is_liked', 'is_disliked',
            # QH-31: 'parent' is validated against the post on create, but
            # perform_update re-ran no such check, so a PATCH could repoint a
            # reply at a comment in a different thread.
            'is_author', 'parent_author_name', 'parent'
        )

    def validate_content(self, value):
        return sanitize_text(value)

    # QH-24: the view already calls prefetch_related('likes', 'dislikes'), but
    # `.count()` and `.filter().exists()` issue fresh queries and ignore that
    # cache entirely — so twenty comments cost roughly eighty extra queries and
    # the prefetch was pure overhead. Reading through .all() uses the prefetched
    # rows instead.
    def get_likes_count(self, obj):
        return len(obj.likes.all())

    def get_dislikes_count(self, obj):
        return len(obj.dislikes.all())

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return any(u.pk == request.user.pk for u in obj.likes.all())

    def get_is_disliked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return any(u.pk == request.user.pk for u in obj.dislikes.all())

    def get_is_author(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.author_id == request.user.pk

    def get_parent_author_name(self, obj):
        if obj.parent:
            return obj.parent.author.get_full_name() or obj.parent.author.username
        return None


class CommunityPollChoiceSerializer(serializers.ModelSerializer):
    votes_count = serializers.IntegerField(read_only=True)

    class Meta:
        model  = CommunityPollChoice
        fields = ('id', 'text', 'order', 'votes_count')


class CommunityPollSerializer(serializers.ModelSerializer):
    author      = CommunityAuthorSerializer(read_only=True)
    choices     = CommunityPollChoiceSerializer(many=True, read_only=True)
    total_votes = serializers.SerializerMethodField()
    user_voted_choice = serializers.SerializerMethodField()

    class Meta:
        model  = CommunityPoll
        fields = (
            'id', 'author', 'question', 'category', 'choices',
            'total_votes', 'user_voted_choice', 'ends_at', 'created_at',
        )
        read_only_fields = ('id', 'author', 'total_votes', 'created_at')

    def get_total_votes(self, obj):
        return sum(c.votes_count for c in obj.choices.all())

    def get_user_voted_choice(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        vote = CommunityPollVote.objects.filter(
            poll=obj, voter=request.user
        ).first()
        return vote.choice_id if vote else None



class CommunityPostSerializer(serializers.ModelSerializer):
    author            = serializers.SerializerMethodField()
    likes_count       = serializers.SerializerMethodField()
    comments_count    = serializers.SerializerMethodField()
    is_liked          = serializers.SerializerMethodField()
    is_author         = serializers.SerializerMethodField()

    class Meta:
        model  = CommunityPost
        fields = (
            'id', 'author', 'content', 'category',
            'likes_count', 'comments_count', 'is_liked',
            'is_anonymous', 'hide_likes', 'comments_disabled',
            'is_author', 'created_at',
        )
        read_only_fields = ('id', 'author', 'likes_count', 'comments_count', 'is_liked', 'is_author', 'created_at')

    def get_author(self, obj):
        """Return masked author info when post is anonymous."""
        request = self.context.get('request')
        # The actual author always sees their own real name
        is_own = request and request.user.is_authenticated and obj.author_id == request.user.pk
        if obj.is_anonymous and not is_own:
            return {'id': 0, 'name': 'Anonymous', 'avatar_url': None}
        serializer = CommunityAuthorSerializer(obj.author, context=self.context)
        return serializer.data

    def get_likes_count(self, obj):
        request = self.context.get('request')
        is_own = request and request.user.is_authenticated and obj.author_id == request.user.pk
        if obj.hide_likes and not is_own:
            return None   # mobile will treat None as hidden
        annotated_likes = getattr(obj, 'annotated_likes_count', None)
        if annotated_likes is not None:
            return annotated_likes
        return obj.likes.count()

    def get_comments_count(self, obj):
        annotated_comments = getattr(obj, 'annotated_comments_count', None)
        if annotated_comments is not None:
            return annotated_comments
        return obj.community_comments.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        user_liked = getattr(obj, 'user_has_liked', None)
        if user_liked is not None:
            return user_liked
        return obj.likes.filter(pk=request.user.pk).exists()

    def get_is_author(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.author_id == request.user.pk


# ── Optimized Lightweight List Serializers ───────────────────────────────────────

class JobListSerializer(serializers.ModelSerializer):
    company_name     = serializers.SerializerMethodField()
    company_id       = serializers.SerializerMethodField()
    company_is_verified = serializers.SerializerMethodField()
    company_logo_url = serializers.SerializerMethodField()
    description      = serializers.SerializerMethodField()

    class Meta:
        model  = Job
        fields = (
            'id', 'company_id', 'company_name', 'company_is_verified', 'company_logo_url',
            'title', 'description', 'requirements', 'employment_type',
            'is_remote', 'location', 'salary_range', 'commission_range', 'currency',
            'custom_company_name', 'status', 'created_at', 'job_code',
        )

    def get_company_name(self, obj):
        return obj.company_name

    def get_company_id(self, obj):
        return obj.company_id

    def get_company_is_verified(self, obj):
        return obj.company.is_verified

    def get_company_logo_url(self, obj):
        request = self.context.get('request')
        if obj.company.avatar:
            if request:
                return optimize_image_url(request.build_absolute_uri(obj.company.avatar.url))
            return optimize_image_url(obj.company.avatar.url)
        try:
            logo = obj.company.company_profile.logo_url
            if logo:
                if request and not logo.startswith('http'):
                    return optimize_image_url(request.build_absolute_uri(logo))
                return optimize_image_url(logo)
        except Exception:
            pass
        return None

    def get_description(self, obj):
        desc = obj.description or ''
        return desc[:250] + '...' if len(desc) > 250 else desc


class ApplicationListSerializer(serializers.ModelSerializer):
    """
    Lightweight applications serializer for the job tracker screen.
    """
    job_title    = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.SerializerMethodField()
    company_logo_url = serializers.SerializerMethodField()
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model  = Application
        fields = ('id', 'job', 'job_title', 'company_name', 'company_logo_url', 'employee', 'employee_name', 'status', 'applied_at')
        read_only_fields = fields

    def get_company_name(self, obj):
        return obj.job.company_name

    def get_company_logo_url(self, obj):
        request = self.context.get('request')
        company = obj.job.company
        if company.avatar:
            if request:
                return optimize_image_url(request.build_absolute_uri(company.avatar.url))
            return optimize_image_url(company.avatar.url)
        try:
            logo = company.company_profile.logo_url
            if logo:
                if request and not logo.startswith('http'):
                    return optimize_image_url(request.build_absolute_uri(logo))
                return optimize_image_url(logo)
        except Exception:
            pass
        return None

    def get_employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.username
