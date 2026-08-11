import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quotahire.settings')
django.setup()

from api.models import CustomUser, UserRole

email = "admin@quotahire.com"
username = "admin"
password = "adminpassword123"

# Check by username or email
user = CustomUser.objects.filter(username=username).first() or CustomUser.objects.filter(email=email).first()

if not user:
    user = CustomUser.objects.create(
        username=username,
        email=email,
        role=UserRole.SUPERADMIN,
        is_staff=True,
        is_superuser=True,
        email_verified=True,
        setup_completed=True,
    )

user.email = email
user.is_staff = True
user.is_superuser = True
user.role = UserRole.SUPERADMIN
user.set_password(password)
user.save()

print(f"Superadmin configured successfully!\nEmail: {email}\nUsername: {username}\nPassword: {password}")
