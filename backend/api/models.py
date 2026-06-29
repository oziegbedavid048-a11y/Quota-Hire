"""
Quota Hire — Database Models

Mirrors the TypeScript types defined in src/types.ts:
  User, EmployeeProfile, CompanyProfile, Job, Application, Notification
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


# ── User Roles ───────────────────────────────────────────────────────────────

class UserRole(models.TextChoices):
    EMPLOYEE = 'employee', 'Employee'
    COMPANY  = 'company',  'Company'
    ADMIN    = 'admin',    'Admin'


# ── Custom User ──────────────────────────────────────────────────────────────

class CustomUser(AbstractUser):
    """
    Extends Django's AbstractUser.
    Adds role (employee / company / admin) and setup_completed flag.
    """
    role             = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.EMPLOYEE)
    avatar           = models.ImageField(upload_to='avatars/', null=True, blank=True)
    setup_completed  = models.BooleanField(default=False)
    location         = models.CharField(max_length=200, blank=True)
    saved_jobs       = models.ManyToManyField('Job', related_name='saved_by', blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    # Use email as the primary login identifier
    email            = models.EmailField(unique=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name        = 'User'
        verbose_name_plural = 'Users'
        ordering            = ['-created_at']

    def __str__(self):
        return f'{self.get_full_name() or self.username} ({self.role})'

    @property
    def full_name(self):
        return self.get_full_name() or self.username

    @property
    def is_verified(self):
        if self.role == UserRole.COMPANY:
            try:
                prof = self.company_profile
                return bool(prof.company_name and prof.industry and prof.description and self.location)
            except Exception:
                return False
        elif self.role == UserRole.EMPLOYEE:
            try:
                prof = self.employee_profile
                return bool(self.get_full_name() and self.location and prof.title and prof.bio and len(prof.skills) > 0)
            except Exception:
                return False
        return True


# ── Employee Profile ─────────────────────────────────────────────────────────

class EmployeeProfile(models.Model):
    """
    Extended profile data for users with role='employee'.
    Mirrors: EmployeeProfile in types.ts
    """
    user             = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='employee_profile',
        limit_choices_to={'role': UserRole.EMPLOYEE},
    )
    title            = models.CharField(max_length=200, blank=True)
    bio              = models.TextField(blank=True)
    linkedin_url     = models.URLField(blank=True)
    resume_url       = models.URLField(blank=True)
    resume_file      = models.FileField(upload_to='resumes/', null=True, blank=True)
    resume_binary    = models.BinaryField(null=True, blank=True, editable=True)
    resume_filename  = models.CharField(max_length=255, null=True, blank=True)
    education        = models.TextField(blank=True)
    skills           = models.JSONField(default=list, blank=True)   # ["Python", "Sales", ...]
    experience_years = models.PositiveIntegerField(default=0)
    phone_number     = models.CharField(max_length=50, blank=True)
    country          = models.CharField(max_length=100, blank=True)
    city             = models.CharField(max_length=100, blank=True)
    postal_code      = models.CharField(max_length=50, blank=True)
    street_address   = models.CharField(max_length=300, blank=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Employee Profile'
        verbose_name_plural = 'Employee Profiles'

    def __str__(self):
        return f'Employee Profile — {self.user}'


# ── Company Profile ──────────────────────────────────────────────────────────

class CompanyProfile(models.Model):
    """
    Extended profile data for users with role='company'.
    Mirrors: CompanyProfile in types.ts
    """
    user         = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='company_profile',
        limit_choices_to={'role': UserRole.COMPANY},
    )
    company_name = models.CharField(max_length=200)
    website      = models.URLField(blank=True)
    industry     = models.CharField(max_length=100, blank=True)
    description  = models.TextField(blank=True)
    logo_url     = models.URLField(blank=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=50, blank=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Company Profile'
        verbose_name_plural = 'Company Profiles'

    def __str__(self):
        return f'{self.company_name}'


# ── Job ──────────────────────────────────────────────────────────────────────

class JobStatus(models.TextChoices):
    PENDING  = 'pending',  'Pending Review'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'
    CLOSED   = 'closed',   'Closed'


class JobPackage(models.TextChoices):
    PIPELINE  = 'pipeline',  'Quota Hire Pipeline'
    HUNTERS   = 'hunters',   'Quota Hire Commission Hunters'
    SALES_OPS = 'sales_ops', 'Quota Hire Sales Ops'


class Job(models.Model):
    """
    A job listing posted by a company.
    Mirrors: Job in types.ts
    """
    company      = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='posted_jobs',
        limit_choices_to={'role': UserRole.COMPANY},
    )
    title            = models.CharField(max_length=300)
    description      = models.TextField()
    requirements     = models.JSONField(default=list)   # ["5+ years SaaS", ...]
    employment_type  = models.CharField(max_length=100, default='Full-time', blank=True)
    is_remote        = models.BooleanField(default=False)
    location         = models.CharField(max_length=200, blank=True)
    salary_range     = models.CharField(max_length=200, blank=True)
    commission_range = models.CharField(max_length=200, blank=True)
    currency         = models.CharField(max_length=100, default='USD')
    contact_email    = models.EmailField(blank=True, null=True)
    contact_phone    = models.CharField(max_length=50, blank=True)
    whatsapp_number  = models.CharField(max_length=50, blank=True)
    company_address  = models.CharField(max_length=300, blank=True)
    custom_company_name = models.CharField(max_length=200, blank=True)
    external_apply_url = models.URLField(max_length=1000, blank=True, null=True, help_text="Link to external company website for applying")
    status           = models.CharField(max_length=20, choices=JobStatus.choices, default=JobStatus.PENDING)
    package          = models.CharField(max_length=50, choices=JobPackage.choices, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Job'
        verbose_name_plural = 'Jobs'
        ordering            = ['-created_at']

    def __str__(self):
        return f'{self.title} @ {self.company_name}'

    @property
    def company_name(self):
        if self.custom_company_name:
            return self.custom_company_name
        try:
            return self.company.company_profile.company_name
        except CompanyProfile.DoesNotExist:
            return self.company.get_full_name() or self.company.username

    @property
    def company_logo_url(self):
        try:
            return self.company.company_profile.logo_url or None
        except CompanyProfile.DoesNotExist:
            return None


# ── Application ──────────────────────────────────────────────────────────────

class ApplicationStatus(models.TextChoices):
    PENDING      = 'pending',      'Pending'
    UNDER_REVIEW = 'under_review', 'Under Review'
    INTERVIEW    = 'interview',    'Interview'
    DECISION     = 'decision',     'Decision'
    ACCEPTED     = 'accepted',     'Accepted'
    REJECTED     = 'rejected',     'Rejected'


class Application(models.Model):
    """
    A job application submitted by an employee.
    Mirrors: Application in types.ts
    """
    job          = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    employee     = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='applications',
        limit_choices_to={'role': UserRole.EMPLOYEE},
    )
    status       = models.CharField(max_length=20, choices=ApplicationStatus.choices, default=ApplicationStatus.PENDING)
    cover_letter = models.TextField(blank=True)
    applied_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Application'
        verbose_name_plural = 'Applications'
        ordering            = ['-applied_at']
        # An employee can only apply once per job
        unique_together     = ('job', 'employee')
    def __str__(self):
        return f'{self.employee} → {self.job.title} ({self.status})'


# ── Generated CV ──────────────────────────────────────────────────────────────

class GeneratedCV(models.Model):
    """
    Stores a CV generated by an employee during the application process.
    Linked to both the employee profile and the specific application.
    Every time an employee generates a CV, one record is created here.
    """
    employee      = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='generated_cvs',
        limit_choices_to={'role': UserRole.EMPLOYEE},
    )
    application   = models.OneToOneField(
        Application,
        on_delete=models.SET_NULL,
        related_name='generated_cv',
        null=True,
        blank=True,
    )
    template_id   = models.CharField(max_length=10)           # e.g. "T2"
    template_name = models.CharField(max_length=100)          # e.g. "Executive Dark"
    target_role   = models.CharField(max_length=200, blank=True)
    target_company= models.CharField(max_length=200, blank=True)
    # PDF stored as binary blob (base64 decoded on save)
    cv_pdf        = models.BinaryField(null=True, blank=True, editable=True)
    cv_filename   = models.CharField(max_length=255, default='cv.pdf')
    cover_letter_text = models.TextField(blank=True)
    work_experience_json = models.JSONField(default=list, blank=True)  # list of WorkEntry dicts
    generated_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Generated CV'
        verbose_name_plural = 'Generated CVs'
        ordering            = ['-generated_at']

    def __str__(self):
        name = self.employee.get_full_name() or self.employee.username
        return f'CV — {name} | {self.template_name} | {self.generated_at:%Y-%m-%d}'


# ── Notification ─────────────────────────────────────────────────────────────

class Notification(models.Model):
    """
    In-app notification for a user.
    Mirrors: Notification in types.ts
    """
    user       = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    title      = models.CharField(max_length=300)
    message    = models.TextField()
    read       = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering            = ['-created_at']

    def __str__(self):
        status = '✓ Read' if self.read else '● Unread'
        return f'[{status}] {self.title} → {self.user}'


# ── Saved Job (through model) ─────────────────────────────────────────────────

class SavedJob(models.Model):
    """
    Through model for CustomUser.saved_jobs M2M.
    Stores the timestamp of when a user saved a job.
    """
    user     = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='saved_job_entries')
    job      = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by_entries')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Saved Job'
        verbose_name_plural = 'Saved Jobs'
        ordering            = ['-saved_at']
        unique_together     = ('user', 'job')  # one save per user per job

    def __str__(self):
        return f'{self.user} saved "{self.job.title}" on {self.saved_at:%Y-%m-%d}'


# ── Shortlisted Applicant ────────────────────────────────────────────────────

class ShortlistedApplicant(models.Model):
    """
    Tracks applicants that have been shortlisted by a company.
    Admin manages the status of this shortlist.
    """
    application = models.OneToOneField(
        Application, 
        on_delete=models.CASCADE, 
        related_name='shortlist'
    )
    status = models.CharField(
        max_length=20, 
        choices=ApplicationStatus.choices, 
        default=ApplicationStatus.PENDING
    )
    shortlisted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Shortlisted Applicant'
        verbose_name_plural = 'Shortlisted Applicants'
        ordering = ['-shortlisted_at']

    def __str__(self):
        return f"Shortlisted: {self.application.employee.get_full_name()} for {self.application.job.title}"
