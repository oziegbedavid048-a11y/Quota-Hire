import urllib.request
import json

data = json.dumps({
    "title": "Test Job with Salary",
    "location": "NY",
    "is_remote": False,
    "currency": "USD",
    "salary_range": "$100k-$120k",
    "commission_range": "OTE $30k",
    "description": "Test description",
    "requirements": ["Req 1"]
}).encode('utf-8')

# We need an access token. Let's create a user and get token first.
import sys
sys.path.append('c:\\Users\\David\\Desktop\\QOUTA HIRE\\backend')
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quotahire.settings')
django.setup()

from api.models import CustomUser, CompanyProfile
from rest_framework.test import APIClient

user, created = CustomUser.objects.get_or_create(email='company_test@example.com', username='company_test@example.com', role='company')
if created:
    user.set_password('testpass')
    user.save()
    CompanyProfile.objects.create(user=user, company_name='Test Company')

client = APIClient()
client.force_authenticate(user=user)

response = client.post('/api/jobs/', {
    "title": "Test Job with Salary",
    "location": "NY",
    "is_remote": False,
    "currency": "USD",
    "salary_range": "$100k-$120k",
    "commission_range": "OTE $30k",
    "description": "Test description",
    "requirements": ["Req 1"]
}, format='json')

print("Status:", response.status_code)
print("Response Data:", json.dumps(response.data, indent=2))
