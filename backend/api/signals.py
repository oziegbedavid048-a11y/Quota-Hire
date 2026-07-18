"""
Quota Hire — Django Signals

Creates in-app Notification records AND sends branded emails AND Expo push
notifications for every key platform event:

  1. User created          → welcome notification
  2. Job created (new)     → company gets "submitted" in-app + email + push
  3. Job status → approved → company gets "approved" in-app + email + push
  4. Job status → rejected → company gets "rejected" in-app + email + push
  5. Application created   → employee gets "confirmed" in-app + email + push
  6. Application status ↑  → employee gets status-update in-app + email + push

All email and push sends are wrapped in try/except so they NEVER break
the main save transaction.
"""

import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import CustomUser, Job, Application, Notification, JobStatus, ApplicationStatus

logger = logging.getLogger(__name__)


# ── Helper: fire email without breaking the calling transaction ───────────────

def _send_email_safe(to_email: str, subject: str, html_content: str, text_content: str = None):
    """Send a transactional email via ZeptoMail, catching and logging any failure."""
    try:
        from .email_templates import send_courier_email
        if not text_content:
            text_content = subject
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


# ── Helper: fire push without breaking the calling transaction ────────────────

def _send_push_safe(user, title: str, body: str, data: dict = None):
    """
    Send an Expo push notification, catching and logging any failure.
    Skips silently if user has no push token registered.
    """
    try:
        from .push_utils import send_push_notification
        send_push_notification(user=user, title=title, body=body, data=data or {})
    except Exception as exc:
        logger.warning(
            "Push send failed (user=%s title=%r): %s",
            getattr(user, 'pk', '?'), title, exc
        )


# ── 1. Welcome notification when user is first created ───────────────────────

@receiver(post_save, sender=CustomUser)
def create_welcome_notification(sender, instance, created, **kwargs):
    """
    Creates the initial welcome in-app notification.
    The welcome email is sent separately in VerifyEmailView (after verification).
    No push notification on registration — per product spec.
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


# ── 2, 3 & 4. Job status changes (and new job creation) ──────────────────────

@receiver(post_save, sender=Job)
def handle_job_post_save(sender, instance, created, **kwargs):
    """
    post_save handler for Job.
    • New job    → notify company it was submitted for review (in-app + email + push)
    • Approved   → notify company it is now live            (in-app + email + push)
    • Rejected   → notify company it needs revision         (in-app + email + push)

    Cache: always invalidates the public job-list and detail caches.
    """
    # ── Cache invalidation (runs first, always) ───────────────────────────────
    from .cache_utils import invalidate_jobs_cache
    invalidate_jobs_cache(job_pk=instance.pk)

    company_user = instance.company
    company_name = company_user.get_full_name() or company_user.username

    if created:
        # ── New job submitted ─────────────────────────────────────────────────
        Notification.objects.create(
            user=company_user,
            title="Job Submitted for Review",
            message=(
                f"Your job posting '{instance.title}' has been submitted successfully. "
                "Our team will review it and it will go live within a few hours once approved."
            )
        )

        _send_push_safe(
            user=company_user,
            title="Job Submitted for Review",
            body=f"Your posting for {instance.title} is under review. We will notify you once approved.",
            data={"type": "job_submitted", "job_id": str(instance.pk)},
        )

        from .email_templates import get_job_submitted_email_html
        html = get_job_submitted_email_html(
            user=company_name,
            job_title=instance.title,
        )
        _send_email_safe(
            to_email=company_user.email,
            subject=f"Job submitted for review - {instance.title}",
            html_content=html,
        )

        # If created directly as approved, also send the approval notification
        if instance.status == JobStatus.APPROVED:
            Notification.objects.create(
                user=company_user,
                title="Job Approved",
                message=(
                    f"Your job posting '{instance.title}' has been approved and is now live on Quota Hire."
                )
            )
            _send_push_safe(
                user=company_user,
                title="Your Job is Now Live",
                body=f"{instance.title} has been approved and is now visible to candidates.",
                data={"type": "job_approved", "job_id": str(instance.pk)},
            )
            from .email_templates import get_job_approved_email_html
            html_approved = get_job_approved_email_html(
                user=company_name,
                job_title=instance.title,
                job_code=instance.job_code,
            )
            _send_email_safe(
                to_email=company_user.email,
                subject=f"Your job is live - {instance.title}",
                html_content=html_approved,
            )
        return  # Skip status-change logic for brand-new jobs

    # ── Status changes on existing jobs ──────────────────────────────────────
    old_status = getattr(instance, '_pre_save_status', None)
    if old_status is None or old_status == instance.status:
        return

    if instance.status == JobStatus.APPROVED:
        Notification.objects.create(
            user=company_user,
            title="Job Approved",
            message=(
                f"Your job posting '{instance.title}' has been approved and is now live on Quota Hire."
            )
        )
        _send_push_safe(
            user=company_user,
            title="Your Job is Now Live",
            body=f"{instance.title} has been approved and is now visible to candidates.",
            data={"type": "job_approved", "job_id": str(instance.pk)},
        )
        from .email_templates import get_job_approved_email_html
        html = get_job_approved_email_html(
            user=company_name,
            job_title=instance.title,
            job_code=instance.job_code,
        )
        _send_email_safe(
            to_email=company_user.email,
            subject=f"Your job is live - {instance.title}",
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
        _send_push_safe(
            user=company_user,
            title="Action Required on Your Job",
            body=f"Your posting for {instance.title} was not approved. Please review and resubmit.",
            data={"type": "job_rejected", "job_id": str(instance.pk)},
        )
        from .email_templates import get_job_rejected_email_html
        html = get_job_rejected_email_html(
            user=company_name,
            job_title=instance.title,
        )
        _send_email_safe(
            to_email=company_user.email,
            subject=f"Your job listing needs revision - {instance.title}",
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


# ── 5 & 6. Application submitted / status changed ────────────────────────────

@receiver(post_save, sender=Application)
def handle_application_post_save(sender, instance, created, **kwargs):
    """
    post_save handler for Application.
    • New application → notify employee confirmation (in-app + email + push)
    • Status change   → notify employee of update   (in-app + email + push)
    """
    employee_user = instance.employee
    employee_name = employee_user.get_full_name() or employee_user.username

    if created:
        # ── Application just submitted ────────────────────────────────────────
        Notification.objects.create(
            user=employee_user,
            title="Application Submitted",
            message=(
                f"Your application for '{instance.job.title}' has been sent successfully. "
                "Good luck! We'll notify you of any updates."
            )
        )
        _send_push_safe(
            user=employee_user,
            title="Application Submitted",
            body=f"Your application for {instance.job.title} has been sent. Good luck!",
            data={"type": "application_submitted", "job_id": str(instance.job.pk)},
        )
        from .email_templates import get_application_confirmed_email_html
        html = get_application_confirmed_email_html(
            user=employee_name,
            job_title=instance.job.title,
        )
        _send_email_safe(
            to_email=employee_user.email,
            subject=f"Application submitted - {instance.job.title}",
            html_content=html,
        )
        return  # Skip status-change logic for new applications

    # ── Application status changed ────────────────────────────────────────────
    old_status = getattr(instance, '_pre_save_status', None)
    if old_status is None or old_status == instance.status:
        return

    # In-app notification messages
    STATUS_MESSAGES = {
        ApplicationStatus.UNDER_REVIEW: (
            "Application Under Review",
            f"Your application for '{instance.job.title}' is now under review. "
            "The hiring team is looking through your profile."
        ),
        ApplicationStatus.INTERVIEW: (
            "Interview Invitation",
            f"Great news! You have been selected for an interview for '{instance.job.title}'. "
            "The company will reach out to you with further details."
        ),
        ApplicationStatus.DECISION: (
            "Decision Pending",
            f"A decision is being made for your application to '{instance.job.title}'. "
            "You will hear back very soon."
        ),
        ApplicationStatus.ACCEPTED: (
            "Application Accepted",
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

    # Push notification body messages (shorter, no emojis per product spec)
    PUSH_MESSAGES = {
        ApplicationStatus.UNDER_REVIEW: (
            "Your Application is Under Review",
            f"The hiring team is reviewing your application for {instance.job.title}.",
        ),
        ApplicationStatus.INTERVIEW: (
            "Interview Invitation",
            f"You have been selected for an interview for {instance.job.title}.",
        ),
        ApplicationStatus.DECISION: (
            "A Decision is Pending",
            f"A final decision is being made on your application for {instance.job.title}.",
        ),
        ApplicationStatus.ACCEPTED: (
            "You Have Been Accepted",
            f"Your application for {instance.job.title} has been accepted. Congratulations!",
        ),
        ApplicationStatus.REJECTED: (
            "Application Update",
            f"The company has updated your application status for {instance.job.title}.",
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

    # Push notification
    push_entry = PUSH_MESSAGES.get(instance.status)
    if push_entry:
        push_title, push_body = push_entry
        _send_push_safe(
            user=employee_user,
            title=push_title,
            body=push_body,
            data={
                "type": "application_update",
                "status": instance.status,
                "job_id": str(instance.job.pk),
            },
        )

    # Mirror to email
    from .email_templates import get_notification_email_html
    html = get_notification_email_html(
        user=employee_name,
        title=notif_title,
        message=notif_message,
        job_title=instance.job.title,
        is_remote=instance.job.is_remote,
        employment_type=instance.job.employment_type
    )
    _send_email_safe(
        to_email=employee_user.email,
        subject=f"{notif_title} - Quota Hire",
        html_content=html,
        text_content=notif_message,
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
