"""
Quota Hire — Django Admin Configuration

Registers all models with rich, search-friendly admin views.
Access at: http://localhost:8000/admin/
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse

from .models import (
    CustomUser,
    EmployeeProfile,
    CompanyProfile,
    Job,
    Application,
    Notification,
    ShortlistedApplicant,
)


# ── Inline Admins ─────────────────────────────────────────────────────────────

class EmployeeProfileInline(admin.StackedInline):
    model       = EmployeeProfile
    can_delete  = False
    verbose_name_plural = 'Employee Profile'
    fields = ('title', 'bio', 'linkedin_url', 'resume_url', 'skills', 'experience_years')
    extra = 0


class CompanyProfileInline(admin.StackedInline):
    model       = CompanyProfile
    can_delete  = False
    verbose_name_plural = 'Company Profile'
    fields = ('company_name', 'website', 'industry', 'description', 'logo_url')
    extra = 0


# ── Custom User Admin ─────────────────────────────────────────────────────────

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """
    Admin for all users — shows role, setup status, creation date.
    Inline profile shows automatically based on role.
    """
    list_display    = ('email', 'get_full_name', 'role', 'role_badge', 'setup_completed', 'is_active', 'created_at')
    list_filter     = ('role', 'setup_completed', 'is_active', 'is_staff', 'created_at')
    search_fields   = ('email', 'first_name', 'last_name', 'username')
    ordering        = ('-created_at',)
    readonly_fields = ('created_at',)

    fieldsets = (
        ('Account',       {'fields': ('username', 'email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Role & Status', {'fields': ('role', 'setup_completed', 'is_active', 'is_staff', 'is_superuser')}),
        ('Groups',        {'fields': ('groups', 'user_permissions'), 'classes': ('collapse',)}),
        ('Timestamps',    {'fields': ('created_at', 'last_login', 'date_joined'), 'classes': ('collapse',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields':  ('email', 'username', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )
    inlines = [EmployeeProfileInline, CompanyProfileInline]

    @admin.display(description='Role Badge')
    def role_badge(self, obj):
        colours = {
            'employee': '#3b82f6',
            'company':  '#10b981',
            'admin':    '#d96820',
        }
        colour = colours.get(obj.role, '#64748b')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600">{}</span>',
            colour, obj.role.upper()
        )


# ── Employee Profile Admin ────────────────────────────────────────────────────

@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display    = ('user', 'title', 'experience_years', 'has_resume', 'updated_at')
    list_filter     = ('experience_years', 'updated_at')
    search_fields   = ('user__email', 'user__first_name', 'title', 'bio')
    readonly_fields = ('updated_at',)

    @admin.display(description='Has Resume', boolean=True)
    def has_resume(self, obj):
        return bool(obj.resume_url or obj.resume_file)


# ── Company Profile Admin ─────────────────────────────────────────────────────

@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display    = ('company_name', 'user', 'industry', 'website_link', 'updated_at')
    list_filter     = ('industry', 'updated_at')
    search_fields   = ('company_name', 'user__email', 'industry')
    readonly_fields = ('updated_at',)

    @admin.display(description='Website')
    def website_link(self, obj):
        if obj.website:
            return format_html('<a href="{}" target="_blank">{}</a>', obj.website, obj.website)
        return '—'


# ── Job Admin ─────────────────────────────────────────────────────────────────

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display    = ('title', 'company_name_display', 'package', 'status', 'status_badge', 'is_remote', 'location', 'created_at', 'edit_button')
    list_display_links = ('title', 'edit_button')
    list_filter     = ('status', 'package', 'is_remote', 'created_at')
    search_fields   = ('title', 'description', 'company__email', 'location')
    ordering        = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    actions         = ['approve_jobs', 'reject_jobs', 'close_jobs']

    fieldsets = (
        ('Job Details', {'fields': ('company', 'title', 'description', 'requirements')}),
        ('Location & Pay', {'fields': ('is_remote', 'location', 'currency', 'salary_range', 'commission_range')}),
        ('Contact Info (Hidden from users)', {'fields': ('custom_company_name', 'company_address', 'contact_email', 'contact_phone', 'whatsapp_number')}),
        ('Status & Package', {'fields': ('status', 'package')}),
        ('Timestamps',  {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    @admin.display(description='Company')
    def company_name_display(self, obj):
        return obj.company_name

    @admin.display(description='Status')
    def status_badge(self, obj):
        colours = {
            'pending':  '#f59e0b',
            'approved': '#10b981',
            'rejected': '#ef4444',
            'closed':   '#64748b',
        }
        colour = colours.get(obj.status, '#64748b')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600">{}</span>',
            colour, obj.status.upper()
        )

    @admin.display(description='Actions')
    def edit_button(self, obj):
        url = reverse('admin:api_job_change', args=[obj.id])
        return format_html('<a class="button" style="background-color:#417690;color:white;padding:5px 10px;border-radius:4px;font-weight:bold;text-decoration:none;" href="{}">Edit Job</a>', url)

    @admin.action(description='✅ Approve selected jobs')
    def approve_jobs(self, request, queryset):
        updated = queryset.update(status='approved')
        self.message_user(request, f'{updated} job(s) approved.')

    @admin.action(description='❌ Reject selected jobs')
    def reject_jobs(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f'{updated} job(s) rejected.')

    @admin.action(description='🔒 Close selected jobs')
    def close_jobs(self, request, queryset):
        updated = queryset.update(status='closed')
        self.message_user(request, f'{updated} job(s) closed.')


# ── Application Admin ─────────────────────────────────────────────────────────

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display    = ('employee', 'job', 'status', 'status_badge', 'applied_at', 'edit_button', 'resume_link')
    list_display_links = ('employee', 'edit_button')
    list_editable   = ('status',)
    list_filter     = ('status', 'applied_at')
    search_fields   = ('employee__email', 'job__title', 'cover_letter')
    ordering        = ('-applied_at',)
    readonly_fields = ('applied_at', 'updated_at')
    actions         = ['mark_under_review', 'mark_interview', 'mark_decision', 'accept_applications', 'reject_applications']

    @admin.display(description='Status')
    def status_badge(self, obj):
        colours = {
            'pending':      '#64748b',
            'under_review': '#f59e0b',
            'interview':    '#8b5cf6',
            'decision':     '#3b82f6',
            'accepted':     '#10b981',
            'rejected':     '#ef4444',
        }
        colour = colours.get(obj.status, '#64748b')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600">{}</span>',
            colour, obj.status.replace('_', ' ').upper()
        )

    @admin.display(description='Actions')
    def edit_button(self, obj):
        url = reverse('admin:api_application_change', args=[obj.id])
        return format_html('<a class="button" style="background-color:#417690;color:white;padding:5px 10px;border-radius:4px;font-weight:bold;text-decoration:none;" href="{}">Edit</a>', url)

    @admin.display(description='Resume')
    def resume_link(self, obj):
        try:
            profile = obj.employee.employee_profile
            if profile.resume_binary or profile.resume_file:
                url = reverse('admin:api_application_resume', args=[obj.id])
                return format_html('<a class="button" style="background-color:#10b981;color:white;padding:5px 10px;border-radius:4px;font-weight:bold;text-decoration:none;" href="{}" target="_blank">View Resume</a>', url)
        except Exception:
            pass
        return 'No Resume'

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('<int:pk>/resume/', self.admin_site.admin_view(self.view_resume), name='api_application_resume'),
        ]
        return custom_urls + urls

    def view_resume(self, request, pk):
        from django.http import HttpResponse, Http404
        app = self.get_object(request, pk)
        if not app:
            raise Http404("Application not found")
        try:
            profile = app.employee.employee_profile
        except Exception:
            raise Http404("Profile not found")
        
        if profile.resume_binary:
            response = HttpResponse(profile.resume_binary, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="{profile.resume_filename or "resume.pdf"}"'
            return response
        elif profile.resume_file:
            import urllib.request
            import cloudinary
            import cloudinary.utils
            from django.conf import settings
            if hasattr(settings, 'CLOUDINARY_URL') and settings.CLOUDINARY_URL:
                cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL)
            public_id = profile.resume_file.name
            signed_url = cloudinary.utils.private_download_url(
                public_id,
                'pdf',
                resource_type="image",
                expires_at=3600
            )
            req = urllib.request.Request(signed_url, headers={'User-Agent': 'Mozilla/5.0'})
            try:
                with urllib.request.urlopen(req) as file_resp:
                    file_data = file_resp.read()
                response = HttpResponse(file_data, content_type='application/pdf')
                response['Content-Disposition'] = 'inline; filename="resume.pdf"'
                return response
            except Exception:
                pass
        raise Http404("Resume not found")

    @admin.action(description='👀 Mark as Under Review')
    def mark_under_review(self, request, queryset):
        updated = queryset.update(status='under_review')
        self.message_user(request, f'{updated} application(s) marked as Under Review.')

    @admin.action(description='📅 Mark for Interview')
    def mark_interview(self, request, queryset):
        updated = queryset.update(status='interview')
        self.message_user(request, f'{updated} application(s) marked for Interview.')

    @admin.action(description='🤔 Mark as Decision Pending')
    def mark_decision(self, request, queryset):
        updated = queryset.update(status='decision')
        self.message_user(request, f'{updated} application(s) marked as Decision Pending.')

    @admin.action(description='✅ Accept selected applications')
    def accept_applications(self, request, queryset):
        updated = queryset.update(status='accepted')
        self.message_user(request, f'{updated} application(s) accepted.')

    @admin.action(description='❌ Reject selected applications')
    def reject_applications(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f'{updated} application(s) rejected.')


# ── Notification Admin ────────────────────────────────────────────────────────

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display    = ('title', 'user', 'read', 'created_at')
    list_filter     = ('read', 'created_at')
    search_fields   = ('title', 'message', 'user__email')
    ordering        = ('-created_at',)
    readonly_fields = ('created_at',)
    actions         = ['mark_as_read']

    @admin.action(description='Mark selected as read')
    def mark_as_read(self, request, queryset):
        updated = queryset.update(read=True)
        self.message_user(request, f'{updated} notification(s) marked as read.')


# ── Shortlisted Applicant Admin ───────────────────────────────────────────────

@admin.register(ShortlistedApplicant)
class ShortlistedApplicantAdmin(admin.ModelAdmin):
    list_display    = ('application', 'get_job', 'status', 'status_badge', 'shortlisted_at', 'edit_button')
    list_display_links = ('application', 'edit_button')
    list_editable   = ('status',)
    list_filter     = ('status', 'shortlisted_at')
    search_fields   = ('application__employee__email', 'application__job__title')
    ordering        = ('-shortlisted_at',)
    readonly_fields = ('shortlisted_at', 'updated_at')

    @admin.display(description='Job')
    def get_job(self, obj):
        return obj.application.job.title

    @admin.display(description='Status')
    def status_badge(self, obj):
        colours = {
            'pending':      '#64748b',
            'under_review': '#f59e0b',
            'interview':    '#8b5cf6',
            'decision':     '#3b82f6',
            'accepted':     '#10b981',
            'rejected':     '#ef4444',
        }
        colour = colours.get(obj.status, '#64748b')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600">{}</span>',
            colour, obj.status.replace('_', ' ').upper()
        )

    @admin.display(description='Actions')
    def edit_button(self, obj):
        url = reverse('admin:api_shortlistedapplicant_change', args=[obj.id])
        return format_html('<a class="button" style="background-color:#417690;color:white;padding:5px 10px;border-radius:4px;font-weight:bold;text-decoration:none;" href="{}">Edit</a>', url)
