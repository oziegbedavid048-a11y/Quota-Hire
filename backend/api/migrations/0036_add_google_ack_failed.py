from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0035_add_login_otp_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='paymenttransaction',
            name='google_ack_failed',
            field=models.BooleanField(
                default=False,
                db_index=True,
                help_text=(
                    'True if the Google Play acknowledge() call failed after a successful '
                    'verification. Google will auto-refund unacknowledged purchases within '
                    '3 days. Check Google Play Console > Order management to manually '
                    'acknowledge if this is True.'
                ),
            ),
        ),
    ]
