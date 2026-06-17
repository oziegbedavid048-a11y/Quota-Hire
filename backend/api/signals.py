from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import CustomUser, Job, Application, Notification, JobStatus, ApplicationStatus

@receiver(post_save, sender=CustomUser)
def create_welcome_notification(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            user=instance,
            title="Welcome to Quota Hire!",
            message="We're glad to have you here. Please complete your profile to get started."
        )

@receiver(pre_save, sender=Job)
def notify_job_status_change(sender, instance, **kwargs):
    if instance.id:
        try:
            old_job = Job.objects.get(id=instance.id)
            if old_job.status != instance.status:
                if instance.status == JobStatus.APPROVED:
                    Notification.objects.create(
                        user=instance.company,
                        title="Job Approved",
                        message=f"Your job posting '{instance.title}' has been approved and is now live."
                    )
                elif instance.status == JobStatus.REJECTED:
                    Notification.objects.create(
                        user=instance.company,
                        title="Job Rejected",
                        message=f"Your job posting '{instance.title}' has been rejected. Please review our guidelines or contact support."
                    )
        except Job.DoesNotExist:
            pass

@receiver(pre_save, sender=Application)
def notify_application_status_change(sender, instance, **kwargs):
    if instance.id:
        try:
            old_app = Application.objects.get(id=instance.id)
            if old_app.status != instance.status:
                status_messages = {
                    ApplicationStatus.UNDER_REVIEW: f"Your application for '{instance.job.title}' is now under review.",
                    ApplicationStatus.INTERVIEW: f"Great news! You've been selected for an interview for '{instance.job.title}'.",
                    ApplicationStatus.DECISION: f"A decision is being made for your application to '{instance.job.title}'.",
                    ApplicationStatus.ACCEPTED: f"Congratulations! Your application for '{instance.job.title}' has been accepted.",
                    ApplicationStatus.REJECTED: f"Your application for '{instance.job.title}' was rejected. We wish you luck in your future endeavors.",
                }
                
                message = status_messages.get(instance.status)
                if message:
                    Notification.objects.create(
                        user=instance.employee,
                        title="Application Update",
                        message=message
                    )
        except Application.DoesNotExist:
            pass
