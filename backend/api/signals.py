"""
Quota Hire — Django Signals

Creates in-app Notification records AND sends branded Courier emails for every
key platform event:

  1. User created          → welcome notification (email sent after verification, see views.py)
  2. Job created (new)     → company gets "submitted" in-app notification + email
  3. Job status → approved → company gets "approved" in-app notification + email
  4. Job status → rejected → company gets "rejected" in-app notification + email
  5. Application created   → employee gets "confirmed" in-app notification + email
  6. Application status ↑  → employee gets status-update in-app notification + email

All email sends are wrapped in try/except so they NEVER break the main save transaction.
"""

import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import CustomUser, Job, Application, Notification, JobStatus, ApplicationStatus

logger = logging.getLogger(__name__)


# ── Helper: fire email without breaking the calling transaction ───────────────

def _send_email_safe(to_email: str, subject: str, html_content: str):
    """Send a Courier email, catching and logging any failure."""
    try:
        from .email_templates import send_courier_email
        text_content = subject  # plain-text fallback is just the subject
        send_courier_email(
            to_email=to_email,
            subject=subject,
            text_content=text_content,
            html_content=html_content,
        )
    except Exception as exc:
        logger.error(
            "Email send failed (to=%s subject=%r): %s",
            to_email, subject, exc, exc_info=True
        )


# ── 1. Welcome notification when user is first created ───────────────────────

@receiver(post_save, sender=CustomUser)
def create_welcome_notification(sender, instance, created, **kwargs):
    """
    Creates the initial welcome in-app notification.
    The *welcome email* is sent separately in VerifyEmailView (after verification).
    """
    if created:
        Notification.objects.create(
            user=instance,
            title="Welcome to Quota Hire!",
            message=(
                "We're glad to have you here. Please complete your profile "
                "to get started and enjoy the full experience of the platform."
            )
        )


# ── 2 & 3 & 4. Job status changes (and new job creation) ─────────────────────

@receiver(post_save, sender=Job)
def handle_job_post_save(sender, instance, created, **kwargs):
    """
    post_save handler for Job.
    • New job   → notify company that it was submitted for review
    • Approved  → notify company that it is now live
    • Rejected  → notify company that it needs revision
    """
    company_user = instance.company
    company_name = company_user.get_full_name() or company_user.username

    if created:
        # ── New job submitted ──────────────────────────────────────────────
        Notification.objects.create(
            user=company_user,
            title="Job Submitted for Review",
            message=(
                f"Your job posting '{instance.title}' has been submitted successfully. "
                "Our team will review it and it will go live within a few hours once approved."
            )
        )

        from .email_templates import get_job_submitted_email_html
        html = get_job_submitted_email_html(
            user=company_name,
            job_title=instance.title,
        )
        _send_email_safe(
            to_email=company_user.email,
            subject=f"Job submitted for review — {instance.title}",
            html_content=html,
        )
        return  # Skip status-change logic for brand-new jobs

    # ── Status changes on existing jobs ───────────────────────────────────
    # We rely on update_fields being set, or compare against the saved state.
    # Because we switched from pre_save to post_save we read the DB value
    # stored in instance directly (Django only fires post_save once committed).
    # Track the old value via a sentinel attached by pre_save below.
    old_status = getattr(instance, '_pre_save_status', None)
    if old_status is None or old_status == instance.status:
        return

    if instance.status == JobStatus.APPROVED:
        Notification.objects.create(
            user=company_user,
            title="Job Approved ✅",
            message=(
                f"Your job posting '{instance.title}' has been approved and is now live on Quota Hire."
            )
        )
        from .email_templates import get_job_approved_email_html
        html = get_job_approved_email_html(
            user=company_name,
            job_title=instance.title,
        )
        _send_email_safe(
            to_email=company_user.email,
            subject=f"Your job is live — {instance.title}",
            html_content=html,
        )

    elif instance.status == JobStatus.REJECTED:
        Notification.objects.create(
            user=company_user,
            title="Job Listing Needs Revision",
            message=(
                f"Your job posting '{instance.title}' was not approved. "
                "Please review our guidelines and resubmit."
            )
        )
        from .email_templates import get_job_rejected_email_html
        html = get_job_rejected_email_html(
            user=company_name,
            job_title=instance.title,
        )
        _send_email_safe(
            to_email=company_user.email,
            subject=f"Your job listing needs revision — {instance.title}",
            html_content=html,
        )


@receiver(pre_save, sender=Job)
def capture_job_old_status(sender, instance, **kwargs):
    """
    Stores the current DB status on the instance before save,
    so post_save can detect status changes.
    """
    if instance.pk:
        try:
            instance._pre_save_status = Job.objects.values_list('status', flat=True).get(pk=instance.pk)
        except Job.DoesNotExist:
            instance._pre_save_status = None
    else:
        instance._pre_save_status = None


# ── 5. Application submitted ──────────────────────────────────────────────────

@receiver(post_save, sender=Application)
def handle_application_post_save(sender, instance, created, **kwargs):
    """
    post_save handler for Application.
    • New application → notify employee + send confirmation email
    • Status change   → notify employee + mirror to email
    """
    employee_user = instance.employee
    employee_name = employee_user.get_full_name() or employee_user.username

    if created:
        # ── Application just submitted ─────────────────────────────────────
        Notification.objects.create(
            user=employee_user,
            title="Application Submitted",
            message=(
                f"Your application for '{instance.job.title}' has been sent successfully. "
                "Good luck! We'll notify you of any updates."
            )
        )

        from .email_templates import get_application_confirmed_email_html
        html = get_application_confirmed_email_html(
            user=employee_name,
            job_title=instance.job.title,
        )
        _send_email_safe(
            to_email=employee_user.email,
            subject=f"Application submitted — {instance.job.title}",
            html_content=html,
        )
        return  # Skip status-change logic for new applications

    # ── Application status changed ─────────────────────────────────────────
    old_status = getattr(instance, '_pre_save_status', None)
    if old_status is None or old_status == instance.status:
        return

    STATUS_MESSAGES = {
        ApplicationStatus.UNDER_REVIEW: (
            "Application Under Review 👀",
            f"Your application for '{instance.job.title}' is now under review. "
            "The hiring team is looking through your profile."
        ),
        ApplicationStatus.INTERVIEW: (
            "Interview Invitation 🎉",
            f"Great news! You've been selected for an interview for '{instance.job.title}'. "
            "The company will reach out to you with further details."
        ),
        ApplicationStatus.DECISION: (
            "Decision Pending",
            f"A decision is being made for your application to '{instance.job.title}'. "
            "You will hear back very soon."
        ),
        ApplicationStatus.ACCEPTED: (
            "Application Accepted 🏆",
            f"Congratulations! Your application for '{instance.job.title}' has been accepted. "
            "The company will be in touch with next steps."
        ),
        ApplicationStatus.REJECTED: (
            "Application Update",
            f"Thank you for applying for '{instance.job.title}'. After careful consideration, "
            "the company has decided to move forward with other candidates. "
            "Don't be discouraged — keep applying and the right role will come!"
        ),
    }

    entry = STATUS_MESSAGES.get(instance.status)
    if not entry:
        return

    notif_title, notif_message = entry

    # In-app notification
    Notification.objects.create(
        user=employee_user,
        title=notif_title,
        message=notif_message,
    )

    # Mirror to email
    from .email_templates import get_notification_email_html
    html = get_notification_email_html(
        user=employee_name,
        title=notif_title,
        message=notif_message,
    )
    _send_email_safe(
        to_email=employee_user.email,
        subject=f"{notif_title} — Quota Hire",
        html_content=html,
    )


@receiver(pre_save, sender=Application)
def capture_application_old_status(sender, instance, **kwargs):
    """
    Stores the current DB status on the instance before save,
    so post_save can detect status changes.
    """
    if instance.pk:
        try:
            instance._pre_save_status = Application.objects.values_list('status', flat=True).get(pk=instance.pk)
        except Application.DoesNotExist:
            instance._pre_save_status = None
    else:
        instance._pre_save_status = None
