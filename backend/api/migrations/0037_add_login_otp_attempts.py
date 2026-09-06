"""
QH-02 — add a failed-attempt counter for the passwordless login OTP.

Deliberately minimal. Running `makemigrations` also picked up three unrelated
pre-existing drifts (a PasswordResetOTP index rename, and no-op AlterFields on
CustomUser.role and PaymentTransaction.google_ack_failed). Those are not part
of this security fix and a RenameIndex in particular can fail against a live
database whose index is not named as Django expects, so they are left out.
Reconcile that drift separately, in its own migration.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0036_add_google_ack_failed'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='login_otp_attempts',
            field=models.PositiveSmallIntegerField(
                default=0,
                help_text='Failed attempts against the current login OTP',
            ),
        ),
    ]
