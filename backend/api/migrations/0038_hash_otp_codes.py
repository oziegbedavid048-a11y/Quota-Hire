"""
QH-09 — store OTPs as HMAC digests instead of plaintext.

Widens both OTP columns from 6 to 64 characters so they can hold a SHA-256
hex digest, then clears any codes still stored in the clear. Clearing is safe:
a login or reset OTP is valid for at most 30 minutes, so at worst a handful of
users in flight during the deploy request a new code. Leaving them would mean
plaintext values sitting in a column the application now treats as digests,
which would silently never match.
"""

from django.db import migrations, models


def clear_plaintext_otps(apps, schema_editor):
    """Discard in-flight plaintext codes; they cannot be migrated to digests."""
    CustomUser = apps.get_model('api', 'CustomUser')
    PasswordResetOTP = apps.get_model('api', 'PasswordResetOTP')

    CustomUser.objects.exclude(login_otp_code='').update(
        login_otp_code='', login_otp_expires_at=None,
    )
    PasswordResetOTP.objects.all().delete()


def noop_reverse(apps, schema_editor):
    """Nothing to restore — the plaintext codes are gone by design."""


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0037_add_login_otp_attempts'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='login_otp_code',
            field=models.CharField(
                blank=True, default='', max_length=64,
                help_text='HMAC digest of the passwordless-login OTP',
            ),
        ),
        migrations.AlterField(
            model_name='passwordresetotp',
            name='otp_code',
            field=models.CharField(max_length=64),
        ),
        migrations.RunPython(clear_plaintext_otps, noop_reverse),
    ]
