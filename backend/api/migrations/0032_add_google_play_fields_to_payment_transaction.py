from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0031_alter_application_applied_at_and_more'),
    ]

    operations = [
        # Add payment_source field to distinguish Paystack (web) vs Google Play (mobile)
        migrations.AddField(
            model_name='paymenttransaction',
            name='payment_source',
            field=models.CharField(
                choices=[
                    ('paystack',    'Paystack (Web)'),
                    ('google_play', 'Google Play Billing (Mobile)'),
                ],
                default='paystack',
                max_length=20,
                db_index=True,
            ),
        ),
        # Add Google Play orderId field
        migrations.AddField(
            model_name='paymenttransaction',
            name='google_order_id',
            field=models.CharField(blank=True, max_length=200),
        ),
        # Add Google Play purchaseToken field
        migrations.AddField(
            model_name='paymenttransaction',
            name='google_purchase_token',
            field=models.CharField(blank=True, max_length=500),
        ),
    ]
