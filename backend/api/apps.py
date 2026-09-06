import logging
import os

from django.apps import AppConfig
from django.db.models.signals import post_migrate

logger = logging.getLogger(__name__)


def create_default_superuser(sender, **kwargs):
    """
    Keep the bootstrap superuser in sync with the environment on migrate.

    SECURITY (QH-33): this used to fall back to a hardcoded password
    ('adminpassword123') when DJANGO_SUPERUSER_PASSWORD was unset, and it runs
    on every deploy because the Render build calls `manage.py migrate`. Any
    environment that forgot the variable therefore came up with a publicly
    known superuser password on an internet-facing /admin/.

    There is now no fallback. If the password is not supplied the hook does
    nothing at all and says so in the logs — a missing variable degrades to
    "no superuser was touched", never to "a guessable superuser exists".

    It deliberately does not raise, so a missing variable cannot break a
    deploy; it just declines to act.
    """
    from django.contrib.auth import get_user_model

    User = get_user_model()

    username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
    email = os.environ.get('DJANGO_SUPERUSER_EMAIL', '')
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '')

    if not password:
        logger.warning(
            'DJANGO_SUPERUSER_PASSWORD is not set — skipping bootstrap '
            'superuser sync. Create administrators with '
            '`python manage.py createsuperuser` instead.'
        )
        return

    if not email:
        logger.warning(
            'DJANGO_SUPERUSER_EMAIL is not set — skipping bootstrap '
            'superuser sync.'
        )
        return

    existing = User.objects.filter(username=username).first()

    if existing is None:
        User.objects.create_superuser(
            username=username, email=email, password=password
        )
        logger.info('Bootstrap superuser %r created.', username)
        return

    # Resync from the environment. Note this overwrites the stored password on
    # every migrate, so the account's password can only be rotated by changing
    # DJANGO_SUPERUSER_PASSWORD — changing it in the admin UI will be undone by
    # the next deploy.
    existing.email = email
    existing.set_password(password)
    existing.save()
    logger.info('Bootstrap superuser %r resynced from environment.', username)


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    verbose_name = 'Quota Hire API'

    def ready(self):
        import api.signals  # noqa: F401
        post_migrate.connect(create_default_superuser, sender=self)
