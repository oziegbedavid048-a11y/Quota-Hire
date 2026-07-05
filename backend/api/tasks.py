from celery import shared_task
from django.core.mail import EmailMultiAlternatives
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_courier_email_task(to_email, subject, text_content, html_content):
    from django.conf import settings
    from_email = settings.DEFAULT_FROM_EMAIL
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[to_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info("Async email sent via Sender.net to %s (subject=%r)", to_email, subject)
        return True
    except Exception as e:
        logger.error(
            "Async Sender.net email send failed (to=%s subject=%r): %s",
            to_email, subject, e, exc_info=True,
        )
        raise
