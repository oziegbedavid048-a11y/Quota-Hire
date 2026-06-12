from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from .models import CustomUser, EmployeeProfile, CompanyProfile
from appwrite.client import Client
from appwrite.services.account import Account

class AppwriteJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        jwt_token = auth_header.split(' ')[1]

        # Verify the JWT with Appwrite Server SDK
        client = Client()
        client.set_endpoint(settings.APPWRITE_ENDPOINT)
        client.set_project(settings.APPWRITE_PROJECT_ID)
        client.set_jwt(jwt_token)

        account = Account(client)
        try:
            user_data = account.get()
            email = user_data.get('email')
            name = user_data.get('name')
        except Exception as e:
            raise AuthenticationFailed('Invalid Appwrite JWT')

        # Since Django is now a backup/utility layer, we can create/get a local dummy user
        user, created = CustomUser.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'role': 'employee', # Will be overwritten by frontend if company
            }
        )
        if created:
            EmployeeProfile.objects.create(user=user)

        return (user, None)
