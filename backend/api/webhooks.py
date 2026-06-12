import logging
import jwt
import datetime
from django.core.mail import EmailMultiAlternatives
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .models import CustomUser, EmployeeProfile, CompanyProfile, Job, Application, Notification, UserRole
from appwrite.client import Client
from appwrite.services.users import Users

logger = logging.getLogger(__name__)

class AppwriteWebhookView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        event = request.headers.get('X-Appwrite-Event', '')
        payload = request.data
        
        logger.info(f"Received Appwrite Webhook: {event}")
        
        try:
            # Handle user creation/update/deletion
            if event.startswith('users.'):
                appwrite_id = payload.get('$id')
                email = payload.get('email')
                name = payload.get('name')
                if 'delete' in event:
                    CustomUser.objects.filter(appwrite_id=appwrite_id).delete()
                else:
                    user, created = CustomUser.objects.update_or_create(
                        appwrite_id=appwrite_id,
                        defaults={
                            'email': email,
                            'username': email or appwrite_id,
                            'first_name': name.split()[0] if name else '',
                            'last_name': ' '.join(name.split()[1:]) if name and len(name.split()) > 1 else ''
                        }
                    )
                    
                    # If this is a create event, send custom verification email
                    if 'create' in event and email:
                        token = jwt.encode({
                            'appwrite_id': appwrite_id,
                            'email': email,
                            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
                        }, settings.SECRET_KEY, algorithm='HS256')
                        
                        frontend_url = 'http://localhost:5173' # Change this when deploying to production
                        verify_link = f"{frontend_url}/verify-email?token={token}"
                        
                        try:
                            template_path = settings.BASE_DIR.parent / 'appwrite_email_template.html'
                            with open(template_path, 'r', encoding='utf-8') as f:
                                html_content = f.read()
                            
                            html_content = html_content.replace('{{user}}', name or email.split('@')[0])
                            html_content = html_content.replace('{{redirect}}', verify_link)
                            
                            text_content = f"Hi {name},\n\nPlease verify your email for Quota Hire using this link:\n{verify_link}"
                            
                            msg = EmailMultiAlternatives(
                                subject="Verify your email for Quota Hire",
                                body=text_content,
                                from_email=settings.DEFAULT_FROM_EMAIL,
                                to=[email]
                            )
                            msg.attach_alternative(html_content, "text/html")
                            msg.send(fail_silently=False)
                            logger.info(f"Successfully sent custom verification email to {email}")
                        except Exception as e:
                            logger.error(f"Failed to send verification email to {email}: {e}")
            
            # Handle collection documents
            elif 'collections.' in event:
                collection_id = payload.get('$collectionId')
                doc_id = payload.get('$id')
                
                if 'delete' in event:
                    if collection_id == 'jobs':
                        Job.objects.filter(appwrite_id=doc_id).delete()
                    elif collection_id == 'applications':
                        Application.objects.filter(appwrite_id=doc_id).delete()
                    elif collection_id == 'notifications':
                        Notification.objects.filter(appwrite_id=doc_id).delete()
                    return Response({"status": "deleted"}, status=status.HTTP_200_OK)

                # Helper to guarantee user existence
                def get_or_create_user(appw_id):
                    user = CustomUser.objects.filter(appwrite_id=appw_id).first()
                    if not user:
                        try:
                            client = Client()
                            client.set_endpoint(settings.APPWRITE_ENDPOINT)
                            client.set_project(settings.APPWRITE_PROJECT_ID)
                            client.set_key(settings.APPWRITE_API_KEY)
                            users_service = Users(client)
                            appw_user = users_service.get(appw_id)
                            email = appw_user.get('email')
                            name = appw_user.get('name', '')
                            
                            user, _ = CustomUser.objects.update_or_create(
                                appwrite_id=appw_id,
                                defaults={
                                    'email': email,
                                    'username': email or appw_id,
                                    'first_name': name.split()[0] if name else '',
                                    'last_name': ' '.join(name.split()[1:]) if name and len(name.split()) > 1 else ''
                                }
                            )
                        except Exception as e:
                            logger.error(f"Could not fetch user {appw_id}: {e}")
                            return None
                    return user

                if collection_id == 'users_profile':
                    user_id = payload.get('user_id')
                    user = get_or_create_user(user_id)
                    if user:
                        user.role = payload.get('role', UserRole.EMPLOYEE)
                        user.location = payload.get('location', '')
                        user.setup_completed = payload.get('setup_completed', False)
                        user.save()
                        
                elif collection_id == 'employee_profiles':
                    user_id = payload.get('user_id')
                    user = get_or_create_user(user_id)
                    if user:
                        EmployeeProfile.objects.update_or_create(
                            user=user,
                            defaults={
                                'title': payload.get('title', ''),
                                'bio': payload.get('bio', ''),
                                'linkedin_url': payload.get('linkedin_url', ''),
                                'resume_url': payload.get('resume_url', ''),
                                'education': payload.get('education', ''),
                                'skills': payload.get('skills', []),
                                'experience_years': payload.get('experience_years', 0),
                                'phone_number': payload.get('phone_number', ''),
                                'country': payload.get('country', ''),
                                'city': payload.get('city', ''),
                                'postal_code': payload.get('postal_code', ''),
                                'street_address': payload.get('street_address', ''),
                            }
                        )
                elif collection_id == 'company_profiles':
                    user_id = payload.get('user_id')
                    user = get_or_create_user(user_id)
                    if user:
                        CompanyProfile.objects.update_or_create(
                            user=user,
                            defaults={
                                'company_name': payload.get('company_name', ''),
                                'website': payload.get('website', ''),
                                'industry': payload.get('industry', ''),
                                'description': payload.get('description', ''),
                                'logo_url': payload.get('logo_url', ''),
                                'contact_email': payload.get('contact_email', ''),
                                'contact_phone': payload.get('contact_phone', ''),
                            }
                        )
                elif collection_id == 'jobs':
                    company_user_id = payload.get('company_user_id')
                    company = get_or_create_user(company_user_id)
                    if company:
                        Job.objects.update_or_create(
                            appwrite_id=doc_id,
                            defaults={
                                'company': company,
                                'title': payload.get('title', ''),
                                'description': payload.get('description', ''),
                                'requirements': payload.get('requirements', []),
                                'employment_type': payload.get('employment_type', 'Full-time'),
                                'is_remote': payload.get('is_remote', False),
                                'location': payload.get('location', ''),
                                'salary_range': payload.get('salary_range', ''),
                                'commission_range': payload.get('commission_range', ''),
                                'currency': payload.get('currency', 'USD'),
                                'status': payload.get('status', 'pending'),
                            }
                        )
                elif collection_id == 'applications':
                    job_id = payload.get('job_id')
                    employee_id = payload.get('employee_user_id')
                    
                    job = Job.objects.filter(appwrite_id=job_id).first()
                    employee = get_or_create_user(employee_id)
                    
                    if job and employee:
                        Application.objects.update_or_create(
                            appwrite_id=doc_id,
                            defaults={
                                'job': job,
                                'employee': employee,
                                'status': payload.get('status', 'pending'),
                                'cover_letter': payload.get('cover_letter', ''),
                            }
                        )
                elif collection_id == 'notifications':
                    user_id = payload.get('user_id')
                    user = get_or_create_user(user_id)
                    if user:
                        Notification.objects.update_or_create(
                            appwrite_id=doc_id,
                            defaults={
                                'user': user,
                                'title': payload.get('title', ''),
                                'message': payload.get('message', ''),
                                'read': payload.get('read', False),
                            }
                        )

        except Exception as e:
            logger.error(f"Error processing Appwrite webhook: {e}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"status": "success"}, status=status.HTTP_200_OK)
