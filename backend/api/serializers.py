"""
Quota Hire — DRF Serializers
"""

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    CustomUser,
    EmployeeProfile,
    CompanyProfile,
    Job,
    Application,
    Notification,
    SavedJob,
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
        data = super().validate(attrs)
        saved_entries = SavedJob.objects.filter(user=self.user).select_related('job').order_by('-saved_at')
        data['user'] = {
            'id':              self.user.id,
            'email':           self.user.email,
            'name':            self.user.get_full_name() or self.user.username,
            'role':            self.user.role,
            'setup_completed': self.user.setup_completed,
            'location':        self.user.location,
            'saved_jobs':      [{'id': e.job_id, 'saved_at': e.saved_at.isoformat()} for e in saved_entries],
            'avatarUrl':       self.user.avatar.url if self.user.avatar else None,
        }
        return data


# ── Profile Serializers ───────────────────────────────────────────────────────

class EmployeeProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = EmployeeProfile
        fields = ('title', 'bio', 'linkedin_url', 'resume_url', 'resume_file', 'education', 'skills', 'experience_years', 'phone_number', 'country', 'city', 'postal_code', 'street_address')


class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CompanyProfile
        fields = ('company_name', 'website', 'industry', 'description', 'logo_url', 'contact_email', 'contact_phone')


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
        read_only_fields = ('id', 'created_at', 'role')

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
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

    def get_is_verified(self, obj):
        return obj.is_verified


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')
    name      = serializers.CharField(required=True, write_only=True)
    phone     = serializers.CharField(required=False, allow_blank=True, write_only=True)
    city      = serializers.CharField(required=False, allow_blank=True, write_only=True)
    country   = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model  = CustomUser
        fields = ('email', 'name', 'role', 'password', 'password2', 'phone', 'city', 'country')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        name    = validated_data.pop('name', '')
        phone   = validated_data.pop('phone', '')
        city    = validated_data.pop('city', '')
        country = validated_data.pop('country', '')

        parts = name.strip().split(' ', 1)
        first = parts[0]
        last  = parts[1] if len(parts) > 1 else ''

        user = CustomUser.objects.create_user(
            username   = validated_data['email'],
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
                phone_number=phone,
                city=city,
                country=country
            )
        elif user.role == 'company':
            CompanyProfile.objects.create(
                user=user, 
                company_name=name,
                contact_phone=phone
            )
        return user


# ── Job Serializers ───────────────────────────────────────────────────────────

class JobSerializer(serializers.ModelSerializer):
    company_name     = serializers.SerializerMethodField()
    company_id       = serializers.SerializerMethodField()
    company_is_verified = serializers.SerializerMethodField()
    company_logo_url = serializers.SerializerMethodField()

    class Meta:
        model  = Job
        fields = (
            'id', 'company_id', 'company_name', 'company_is_verified', 'company_logo_url',
            'title', 'description', 'requirements', 'employment_type',
            'is_remote', 'location', 'salary_range', 'commission_range', 'currency',
            'status', 'created_at',
        )
        read_only_fields = ('id', 'status', 'created_at')

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
                return request.build_absolute_uri(obj.company.avatar.url)
            return obj.company.avatar.url
        try:
            logo = obj.company.company_profile.logo_url
            if logo:
                if request and not logo.startswith('http'):
                    return request.build_absolute_uri(logo)
                return logo
        except Exception:
            pass
        return None

    def create(self, validated_data):
        validated_data['company']  = self.context['request'].user
        validated_data['status']   = 'pending'
        return super().create(validated_data)


# ── Application Serializers ───────────────────────────────────────────────────

class ApplicationSerializer(serializers.ModelSerializer):
    job_title    = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.SerializerMethodField()
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model  = Application
        fields = ('id', 'job', 'job_title', 'company_name', 'employee', 'employee_name', 'status', 'cover_letter', 'applied_at')
        read_only_fields = ('id', 'employee', 'status', 'applied_at')

    def get_company_name(self, obj):
        return obj.job.company_name

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
