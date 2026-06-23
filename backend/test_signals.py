import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quotahire.settings')
django.setup()

from api.models import CustomUser, Job, Notification

u, _ = CustomUser.objects.get_or_create(email="test@example.com", username="testuser", role="company")
j, created = Job.objects.get_or_create(company=u, title="Test Job", defaults={'status': 'pending'})

print('Initial status:', j.status)
j.status = 'approved' if j.status != 'approved' else 'rejected'
print('New status:', j.status)
j.save()
print('Notifications count:', Notification.objects.count())
for n in Notification.objects.all():
    print('Notification:', n.title, '-', n.message)
