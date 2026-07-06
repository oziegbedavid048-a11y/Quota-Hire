"""
Quota Hire — Django Admin Configuration

Registers all models with rich, search-friendly admin views.
Access at: http://localhost:8000/admin/
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django import forms
import json

from .models import (
    CustomUser,
    UserRole,
    EmployeeProfile,
    CompanyProfile,
    Job,
    Application,
    Notification,
    ShortlistedApplicant,
    GeneratedCV,
    PaymentTransaction,
    DownloadToken,
    Newsletter,
    NewsletterAudience,
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
    fields = ('company_name', 'website', 'industry', 'about_company', 'logo_url')
    extra = 0


# ── Custom User Admin ─────────────────────────────────────────────────────────

class SendCustomEmailForm(forms.Form):
    subject = forms.CharField(
        max_length=200, 
        required=True,
        widget=forms.TextInput(attrs={'placeholder': 'Enter email subject...'})
    )
    message_body = forms.CharField(
        required=True,
        widget=forms.Textarea(attrs={'placeholder': 'Write your message here...'})
    )
    attachment = forms.FileField(
        required=False,
        help_text="Optional: Attach any document (PDF, DOCX) or image (PNG, JPG)."
    )


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """
    Admin for all users — shows role, setup status, creation date.
    Inline profile shows automatically based on role.
    """
    list_display    = ('email', 'get_full_name', 'role', 'role_badge', 'setup_completed', 'email_verified', 'is_active', 'created_at')
    list_filter     = ('role', 'setup_completed', 'email_verified', 'is_active', 'is_staff', 'created_at')
    search_fields   = ('email', 'first_name', 'last_name', 'username')
    ordering        = ('-created_at',)
    readonly_fields = ('created_at',)

    fieldsets = (
        ('Account',       {'fields': ('username', 'email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Role & Status', {'fields': ('role', 'setup_completed', 'email_verified', 'is_active', 'is_staff', 'is_superuser')}),
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
    actions = ['mark_as_verified', 'send_custom_email']

    @admin.action(description='✅ Mark selected users as email verified')
    def mark_as_verified(self, request, queryset):
        updated = queryset.update(email_verified=True)
        self.message_user(request, f'Successfully marked {updated} user(s) as email verified.')

    @admin.action(description='✉️ Send custom email to selected users')
    def send_custom_email(self, request, queryset):
        if 'apply' in request.POST:
            form = SendCustomEmailForm(request.POST, request.FILES)
            if form.is_valid():
                subject = form.cleaned_data['subject']
                body = form.cleaned_data['message_body']
                attachment = request.FILES.get('attachment')
                
                from django.core.mail import EmailMultiAlternatives
                from django.conf import settings
                from .email_templates import get_custom_admin_email_html
                import logging
                
                logger = logging.getLogger(__name__)
                html_content = get_custom_admin_email_html(body)
                
                sent_count = 0
                error_count = 0
                for user in queryset:
                    try:
                        msg = EmailMultiAlternatives(
                            subject=subject,
                            body=body,
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            to=[user.email]
                        )
                        msg.attach_alternative(html_content, "text/html")
                        if attachment:
                            attachment.seek(0)
                            msg.attach(attachment.name, attachment.read(), attachment.content_type)
                        msg.send(fail_silently=False)
                        sent_count += 1
                    except Exception as e:
                        logger.error(f"Failed to send custom email to {user.email}: {e}", exc_info=True)
                        error_count += 1
                
                if sent_count > 0:
                    self.message_user(request, f"Successfully sent custom email to {sent_count} user(s).")
                if error_count > 0:
                    from django.contrib import messages
                    self.message_user(request, f"Failed to send email to {error_count} user(s). Check logs for details.", level=messages.ERROR)
                
                return None
        else:
            form = SendCustomEmailForm()
            
        from django.contrib.admin.helpers import ACTION_CHECKBOX_NAME
        from django.shortcuts import render
        return render(request, 'admin/send_email.html', {
            'users': queryset,
            'form': form,
            'opts': self.model._meta,
            'selected_ids': request.POST.getlist(ACTION_CHECKBOX_NAME),
            'select_across': request.POST.get('select_across', '0')
        })

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

class JobAdminForm(forms.ModelForm):
    requirements_text = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 10, 'cols': 80}),
        required=False,
        label="Requirements",
        help_text="Enter requirements, one per line. It will be saved correctly for the app."
    )

    class Meta:
        model = Job
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            reqs = self.instance.requirements
            if isinstance(reqs, list):
                self.fields['requirements_text'].initial = '\n'.join(reqs)
            elif isinstance(reqs, str):
                try:
                    reqs_list = json.loads(reqs)
                    if isinstance(reqs_list, list):
                        self.fields['requirements_text'].initial = '\n'.join(reqs_list)
                except Exception:
                    self.fields['requirements_text'].initial = reqs
        elif 'requirements' in self.initial:
            reqs = self.initial['requirements']
            if isinstance(reqs, list):
                self.fields['requirements_text'].initial = '\n'.join(reqs)
        
        # Hide the original JSON field from the UI
        if 'requirements' in self.fields:
            self.fields['requirements'].required = False
            self.fields['requirements'].widget = forms.HiddenInput()

        # Customize company choice dropdown to show company name and email
        if 'company' in self.fields:
            self.fields['company'].queryset = CustomUser.objects.filter(role=UserRole.COMPANY)
            self.fields['company'].label_from_instance = lambda obj: f"{getattr(getattr(obj, 'company_profile', None), 'company_name', obj.get_full_name() or obj.username)} ({obj.email})"

    def clean(self):
        cleaned_data = super().clean()
        req_text = cleaned_data.get('requirements_text', '')
        # Convert newline separated text to a list
        req_list = [r.strip() for r in req_text.split('\n') if r.strip()]
        cleaned_data['requirements'] = req_list
        return cleaned_data

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    form = JobAdminForm
    list_display    = ('title', 'job_code', 'company_name_display', 'package', 'status', 'status_badge', 'employment_type', 'is_remote', 'location', 'created_at', 'edit_button')
    list_display_links = ('title', 'edit_button')
    list_filter     = ('status', 'package', 'is_remote', 'created_at')
    search_fields   = ('title', 'description', 'company__email', 'location', 'job_code')
    ordering        = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'job_code')
    actions         = ['approve_jobs', 'reject_jobs', 'close_jobs']

    fieldsets = (
        ('Job Details', {'fields': ('company', 'job_code', 'title', 'description', 'requirements_text', 'requirements')}),
        ('Location & Pay', {'fields': ('employment_type', 'is_remote', 'location', 'currency', 'salary_range', 'commission_range')}),
        ('Contact Info (Hidden from users)', {'fields': ('custom_company_name', 'company_address', 'contact_email', 'contact_phone', 'whatsapp_number')}),
        ('Status & Package', {'fields': ('status', 'package')}),
        ('Timestamps',  {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    class Media:
        js = ('admin/js/job_admin_suggestions.js',)

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
        count = 0
        for job in queryset:
            job.status = 'approved'
            job.save()
            count += 1
        self.message_user(request, f'{count} job(s) approved.')

    @admin.action(description='❌ Reject selected jobs')
    def reject_jobs(self, request, queryset):
        count = 0
        for job in queryset:
            job.status = 'rejected'
            job.save()
            count += 1
        self.message_user(request, f'{count} job(s) rejected.')

    @admin.action(description='🔒 Close selected jobs')
    def close_jobs(self, request, queryset):
        count = 0
        for job in queryset:
            job.status = 'closed'
            job.save()
            count += 1
        self.message_user(request, f'{count} job(s) closed.')


# ── Application Admin ─────────────────────────────────────────────────────────

class GeneratedCVInline(admin.StackedInline):
    """Inline to show the generated CV on each Application change page."""
    model        = GeneratedCV
    can_delete   = False
    extra        = 0
    verbose_name = 'Generated CV'
    verbose_name_plural = 'Generated CV (from wizard)'
    readonly_fields = ('template_name', 'template_id', 'target_role', 'target_company',
                       'generated_at', 'view_cv_link', 'cover_letter_display')
    fields = ('template_name', 'target_role', 'target_company', 'generated_at',
              'view_cv_link', 'cover_letter_display')

    @admin.display(description='View CV PDF')
    def view_cv_link(self, obj):
        if obj.pk and obj.cv_pdf:
            url = reverse('admin:api_generatedcv_view_pdf', args=[obj.pk])
            return format_html(
                '<a class="button" style="background:#10b981;color:white;padding:5px 12px;'
                'border-radius:4px;font-weight:bold;text-decoration:none;" '
                'href="{}" target="_blank">&#128196; Open CV PDF</a>', url
            )
        return format_html('<span style="color:#94a3b8;">No PDF stored</span>')

    @admin.display(description='Cover Letter')
    def cover_letter_display(self, obj):
        if obj.cover_letter_text:
            return format_html(
                '<div style="white-space:pre-wrap;max-width:700px;background:#f8fafc;'
                'padding:12px;border-radius:6px;border:1px solid #e2e8f0;font-size:13px;'
                'line-height:1.6;">{}</div>', obj.cover_letter_text
            )
        return format_html('<span style="color:#94a3b8;">No cover letter</span>')

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display    = ('employee', 'job', 'status', 'status_badge', 'applied_at', 'edit_button', 'resume_link', 'cv_link')
    list_display_links = ('employee', 'edit_button')
    list_editable   = ('status',)
    list_filter     = ('status', 'applied_at')
    search_fields   = ('employee__email', 'job__title', 'cover_letter')
    ordering        = ('-applied_at',)
    readonly_fields = (
        'applied_at', 'updated_at',
        'applicant_email', 'applicant_phone', 'applicant_location',
        'applicant_address', 'applicant_linkedin',
    )
    actions         = ['mark_under_review', 'mark_interview', 'mark_decision', 'accept_applications', 'reject_applications']
    inlines         = [GeneratedCVInline]

    fieldsets = (
        ('Applicant Contact Information', {
            'fields': (
                'applicant_email', 'applicant_phone',
                'applicant_location', 'applicant_address', 'applicant_linkedin',
            ),
            'description': (
                '<div style="background:#eff6ff;border-left:4px solid #3b82f6;'
                'padding:10px 14px;border-radius:4px;margin-bottom:8px;font-size:13px;">'
                'Contact details submitted by the applicant at the time of application.</div>'
            ),
        }),
        ('Application Details', {
            'fields': ('employee', 'job', 'status', 'cover_letter', 'applied_at', 'updated_at'),
        }),
    )

    # ── Contact info read-only helpers ────────────────────────────────────────

    @admin.display(description='Email')
    def applicant_email(self, obj):
        email = obj.employee.email
        return format_html('<a href="mailto:{0}">{0}</a>', email)

    @admin.display(description='Phone Number')
    def applicant_phone(self, obj):
        try:
            phone = obj.employee.employee_profile.phone_number
            return phone or format_html('<span style="color:#94a3b8;">Not provided</span>')
        except Exception:
            return format_html('<span style="color:#94a3b8;">Not provided</span>')

    @admin.display(description='City / Country')
    def applicant_location(self, obj):
        try:
            p = obj.employee.employee_profile
            parts = [p.city, p.country]
            loc = ', '.join(x for x in parts if x)
            return loc or format_html('<span style="color:#94a3b8;">Not provided</span>')
        except Exception:
            return format_html('<span style="color:#94a3b8;">Not provided</span>')

    @admin.display(description='Street Address / Postal Code')
    def applicant_address(self, obj):
        try:
            p = obj.employee.employee_profile
            parts = [p.street_address, p.postal_code]
            addr = ', '.join(x for x in parts if x)
            return addr or format_html('<span style="color:#94a3b8;">Not provided</span>')
        except Exception:
            return format_html('<span style="color:#94a3b8;">Not provided</span>')

    @admin.display(description='LinkedIn')
    def applicant_linkedin(self, obj):
        try:
            url = obj.employee.employee_profile.linkedin_url
            if url:
                return format_html('<a href="{}" target="_blank">{}</a>', url, url)
        except Exception:
            pass
        return format_html('<span style="color:#94a3b8;">Not provided</span>')

    @admin.display(description='CV')
    def cv_link(self, obj):
        try:
            if obj.generated_cv:
                return format_html('<span style="color:#10b981;font-weight:bold;">✅ Attached</span>')
        except Exception:
            pass
        return format_html('<span style="color:#94a3b8;">—</span>')

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
        count = 0
        for app in queryset:
            app.status = 'under_review'
            app.save()
            count += 1
        self.message_user(request, f'{count} application(s) marked as Under Review.')

    @admin.action(description='📅 Mark for Interview')
    def mark_interview(self, request, queryset):
        count = 0
        for app in queryset:
            app.status = 'interview'
            app.save()
            count += 1
        self.message_user(request, f'{count} application(s) marked for Interview.')

    @admin.action(description='🤔 Mark as Decision Pending')
    def mark_decision(self, request, queryset):
        count = 0
        for app in queryset:
            app.status = 'decision'
            app.save()
            count += 1
        self.message_user(request, f'{count} application(s) marked as Decision Pending.')

    @admin.action(description='✅ Accept selected applications')
    def accept_applications(self, request, queryset):
        count = 0
        for app in queryset:
            app.status = 'accepted'
            app.save()
            count += 1
        self.message_user(request, f'{count} application(s) accepted.')

    @admin.action(description='❌ Reject selected applications')
    def reject_applications(self, request, queryset):
        count = 0
        for app in queryset:
            app.status = 'rejected'
            app.save()
            count += 1
        self.message_user(request, f'{count} application(s) rejected.')


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


# ── Generated CV Admin ─────────────────────────────────────────────────────────

@admin.register(GeneratedCV)
class GeneratedCVAdmin(admin.ModelAdmin):
    list_display    = ('employee_name', 'template_name', 'target_role', 'target_company', 'has_pdf', 'generated_at', 'view_cv_button', 'has_cover_letter')
    list_filter     = ('template_id', 'generated_at')
    search_fields   = ('employee__email', 'employee__first_name', 'employee__last_name', 'target_role', 'target_company')
    ordering        = ('-generated_at',)
    readonly_fields = ('generated_at', 'employee', 'application', 'template_id', 'template_name',
                       'target_role', 'target_company', 'view_cv_button_detail', 'cover_letter_preview')

    fieldsets = (
        ('CV Info', {
            'fields': ('employee', 'application', 'template_name', 'template_id', 'target_role', 'target_company', 'generated_at')
        }),
        ('Documents', {
            'fields': ('view_cv_button_detail', 'cover_letter_preview'),
        }),
    )

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            # Admin-session-authenticated PDF download — no JWT token needed
            path('<int:pk>/view-pdf/', self.admin_site.admin_view(self.serve_cv_pdf), name='api_generatedcv_view_pdf'),
        ]
        return custom_urls + urls

    def serve_cv_pdf(self, request, pk):
        """Serve the CV PDF binary directly via Django admin session auth — no JWT needed."""
        from django.http import HttpResponse, Http404
        try:
            cv_obj = GeneratedCV.objects.get(pk=pk)
        except GeneratedCV.DoesNotExist:
            raise Http404('CV not found')
        if not cv_obj.cv_pdf:
            raise Http404('No PDF stored for this CV')
        response = HttpResponse(bytes(cv_obj.cv_pdf), content_type='application/pdf')
        filename = cv_obj.cv_filename or 'cv.pdf'
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response

    @admin.display(description='Has PDF', boolean=True)
    def has_pdf(self, obj):
        return bool(obj.cv_pdf)

    @admin.display(description='Employee')
    def employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.email

    @admin.display(description='View CV')
    def view_cv_button(self, obj):
        if obj.cv_pdf:
            url = reverse('admin:api_generatedcv_view_pdf', args=[obj.pk])
            return format_html(
                '<a class="button" style="background:#10b981;color:white;padding:4px 10px;'
                'border-radius:4px;font-weight:bold;text-decoration:none;font-size:11px;" '
                'href="{}" target="_blank">&#128196; View PDF</a>', url
            )
        return format_html('<span style="color:#94a3b8;font-size:11px;">No PDF</span>')

    @admin.display(description='CV PDF (click to open)')
    def view_cv_button_detail(self, obj):
        if obj.cv_pdf:
            url = reverse('admin:api_generatedcv_view_pdf', args=[obj.pk])
            return format_html(
                '<a class="button" style="background:#10b981;color:white;padding:8px 16px;'
                'border-radius:6px;font-weight:bold;text-decoration:none;font-size:14px;" '
                'href="{}" target="_blank">&#128196; Open Full CV PDF in New Tab</a>', url
            )
        return format_html('<span style="color:#94a3b8;">No PDF stored yet</span>')

    @admin.display(description='Has Cover Letter', boolean=True)
    def has_cover_letter(self, obj):
        return bool(obj.cover_letter_text)

    @admin.display(description='Cover Letter')
    def cover_letter_preview(self, obj):
        if obj.cover_letter_text:
            return format_html(
                '<div style="white-space:pre-wrap;max-width:720px;background:#f8fafc;'
                'padding:16px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;'
                'line-height:1.7;font-family:Georgia,serif;">{}</div>',
                obj.cover_letter_text
            )
        return format_html('<span style="color:#94a3b8;">No cover letter</span>')


# ── Payment Admin ─────────────────────────────────────────────────────────────

@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display   = ('reference', 'user', 'cv', 'status', 'amount_eur', 'amount_kobo', 'paystack_id', 'created_at')
    list_filter    = ('status', 'created_at')
    search_fields  = ('reference', 'user__email', 'user__first_name', 'user__last_name', 'paystack_id')
    readonly_fields = ('reference', 'created_at', 'updated_at', 'paystack_id', 'amount_kobo')
    ordering       = ('-created_at',)
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Transaction Info', {'fields': ('reference', 'status', 'amount_eur', 'amount_kobo', 'paystack_id')}),
        ('Linked Records', {'fields': ('user', 'cv')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(DownloadToken)
class DownloadTokenAdmin(admin.ModelAdmin):
    list_display  = ('token_short', 'user', 'cv', 'used', 'expires_at', 'created_at')
    list_filter   = ('used', 'created_at')
    search_fields = ('token', 'user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('token', 'created_at', 'expires_at')
    ordering      = ('-created_at',)

    @admin.display(description='Token (short)')
    def token_short(self, obj):
        return obj.token[:20] + '…' if len(obj.token) > 20 else obj.token


# ── Newsletter Admin ──────────────────────────────────────────────────────────

class NewsletterAdminForm(forms.ModelForm):
    """Custom form with a larger, more user-friendly body textarea."""
    body = forms.CharField(
        widget=forms.Textarea(attrs={
            'rows': 18,
            'cols': 80,
            'style': 'font-size:14px;line-height:1.6;font-family:Georgia,serif;',
            'placeholder': (
                'Write your newsletter here in plain text.\n\n'
                'Each line break becomes a new paragraph in the email.\n\n'
                'Example:\n'
                'We are excited to share some updates with you...\n\n'
                'This month we have added new features including...\n\n'
                'We hope you enjoy the platform!\n\n'
                'Warm regards,\nThe Quota Hire Team'
            )
        }),
        help_text=(
            'Write in plain text. Each new line becomes a paragraph in the branded email. '
            'No HTML required. The system will automatically wrap this in the '
            'Quota Hire email template with your logo and colours.'
        )
    )

    class Meta:
        model = Newsletter
        fields = '__all__'


@admin.register(Newsletter)
class NewsletterAdmin(admin.ModelAdmin):
    """
    Admin panel for composing and sending newsletters.

    HOW TO USE:
    1. Click '+ Add Newsletter'
    2. Fill in the Subject, write your plain-text body, and choose your Audience
    3. Save the newsletter (it starts as a Draft)
    4. From the newsletter list, tick the checkbox and select 'Send Newsletter'
       — OR — open the newsletter and click the green 'Send Newsletter Now' button
    5. The system will dispatch branded emails to all matching users via Sender.net SMTP
    """
    form            = NewsletterAdminForm
    list_display    = ('subject', 'audience_badge', 'recipients_count', 'status_badge', 'created_at', 'send_button')
    list_filter     = ('audience', 'created_at')
    search_fields   = ('subject', 'body')
    ordering        = ('-created_at',)
    readonly_fields = ('sent_at', 'recipients_count', 'created_at', 'send_now_button')
    actions         = ['send_newsletter_action']

    fieldsets = (
        ('📝 Compose Newsletter', {
            'fields': ('subject', 'body', 'audience'),
            'description': (
                '<div style="background:#f0faf0;border-left:4px solid #1A6515;'
                'padding:12px 16px;border-radius:6px;margin-bottom:16px;">'
                '<strong style="color:#1A6515;">ℹ️ How to send:</strong><br>'
                'Fill in the fields below, save, then click the green '
                '<strong>Send Newsletter Now</strong> button that appears below, '
                'or use the list action checkbox after saving.'
                '</div>'
            )
        }),
        ('📊 Send Status', {
            'fields': ('send_now_button', 'sent_at', 'recipients_count', 'created_at'),
            'classes': ('collapse',),
        }),
    )

    # ── Display helpers ───────────────────────────────────────────────────────

    @admin.display(description='Audience')
    def audience_badge(self, obj):
        colours = {
            NewsletterAudience.EMPLOYEES: '#3b82f6',
            NewsletterAudience.COMPANIES: '#10b981',
            NewsletterAudience.ALL:       '#8b5cf6',
        }
        colour = colours.get(obj.audience, '#64748b')
        label = obj.get_audience_display()
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;'
            'border-radius:20px;font-size:11px;font-weight:600">{}</span>',
            colour, label
        )

    @admin.display(description='Status')
    def status_badge(self, obj):
        if obj.sent_at:
            return format_html(
                '<span style="background:#10b981;color:#fff;padding:2px 10px;'
                'border-radius:20px;font-size:11px;font-weight:600">✅ Sent</span>'
            )
        return format_html(
            '<span style="background:#f59e0b;color:#fff;padding:2px 10px;'
            'border-radius:20px;font-size:11px;font-weight:600">📝 Draft</span>'
        )

    @admin.display(description='Send')
    def send_button(self, obj):
        url = reverse('admin:api_newsletter_change', args=[obj.id])
        return format_html(
            '<a class="button" style="background:#1A6515;color:white;padding:4px 12px;'
            'border-radius:4px;font-weight:bold;text-decoration:none;font-size:11px;" '
            'href="{}">📧 Open</a>',
            url
        )

    @admin.display(description='Send Newsletter Now')
    def send_now_button(self, obj):
        if not obj.pk:
            return format_html(
                '<span style="color:#94a3b8;">Save first, then the Send button will appear here.</span>'
            )
        url = reverse('admin:api_newsletter_send', args=[obj.id])
        return format_html(
            '<a class="button" style="background:linear-gradient(to right,#1A6515,#15750a);'
            'color:white;padding:10px 24px;border-radius:8px;font-weight:800;'
            'text-decoration:none;font-size:14px;display:inline-block;'
            'box-shadow:0 4px 12px rgba(26,101,21,0.3);" href="{}">'
            '📧 Send Newsletter Now</a>',
            url
        )

    # ── Custom URLs ───────────────────────────────────────────────────────────

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:pk>/send/',
                self.admin_site.admin_view(self.send_newsletter_view),
                name='api_newsletter_send'
            ),
        ]
        return custom_urls + urls

    # ── Core send logic ───────────────────────────────────────────────────────

    def _dispatch_newsletter(self, newsletter_obj):
        """
        Queries users based on audience, sends each a branded email via Sender.net SMTP.
        Returns (sent_count, failed_count, error_list).
        """
        from django.utils import timezone
        from .email_templates import get_newsletter_email_html, send_courier_email
        from .models import CustomUser

        audience = newsletter_obj.audience

        if audience == NewsletterAudience.EMPLOYEES:
            users = CustomUser.objects.filter(role='employee', is_active=True, email_verified=True)
        elif audience == NewsletterAudience.COMPANIES:
            users = CustomUser.objects.filter(role='company', is_active=True, email_verified=True)
        else:  # ALL
            users = CustomUser.objects.filter(
                role__in=['employee', 'company'],
                is_active=True,
                email_verified=True
            )

        html_content = get_newsletter_email_html(
            subject=newsletter_obj.subject,
            plain_body=newsletter_obj.body,
        )

        sent = 0
        failed = 0
        errors = []

        for user in users:
            try:
                send_courier_email(
                    to_email=user.email,
                    subject=newsletter_obj.subject,
                    text_content=newsletter_obj.body[:200],
                    html_content=html_content,
                )
                sent += 1
            except Exception as exc:
                failed += 1
                errors.append(f"{user.email}: {exc}")

        # Update the newsletter record
        newsletter_obj.sent_at = timezone.now()
        newsletter_obj.recipients_count = sent
        newsletter_obj.save(update_fields=['sent_at', 'recipients_count'])

        return sent, failed, errors

    # ── Action: send from list ────────────────────────────────────────────────

    @admin.action(description='📧 Send Newsletter to selected audience')
    def send_newsletter_action(self, request, queryset):
        total_sent = 0
        total_failed = 0

        for newsletter in queryset:
            sent, failed, errors = self._dispatch_newsletter(newsletter)
            total_sent += sent
            total_failed += failed
            if errors:
                import logging
                logging.getLogger(__name__).error(
                    "Newsletter '%s' send errors: %s", newsletter.subject, errors
                )

        if total_sent:
            self.message_user(
                request,
                f'✅ Newsletter dispatched successfully to {total_sent} recipient(s).'
                + (f' ⚠️ {total_failed} failed — check server logs.' if total_failed else '')
            )
        else:
            self.message_user(
                request,
                f'⚠️ No emails were sent. {total_failed} error(s) occurred — check server logs.',
                level='WARNING'
            )

    # ── View: send from detail page button ───────────────────────────────────

    def send_newsletter_view(self, request, pk):
        from django.http import HttpResponseRedirect
        from django.contrib import messages

        try:
            newsletter = Newsletter.objects.get(pk=pk)
        except Newsletter.DoesNotExist:
            messages.error(request, 'Newsletter not found.')
            return HttpResponseRedirect(reverse('admin:api_newsletter_changelist'))

        sent, failed, errors = self._dispatch_newsletter(newsletter)

        if sent > 0:
            messages.success(
                request,
                f'✅ Newsletter "{newsletter.subject}" dispatched to {sent} recipient(s) successfully!'
                + (f' ⚠️ {failed} failed — check server logs.' if failed else '')
            )
        else:
            messages.error(
                request,
                f'❌ Newsletter send failed — no emails were sent. {failed} error(s). Check server logs.'
            )

        return HttpResponseRedirect(
            reverse('admin:api_newsletter_change', args=[pk])
        )
