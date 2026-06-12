"""
Quota Hire — API URL Routing
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views
from . import webhooks

urlpatterns = [
    # ── Auth ─────────────────────────────────────────────────────────────────
    path('auth/register/',          views.RegisterView.as_view(),                name='auth-register'),
    path('auth/login/',             views.CustomTokenObtainPairView.as_view(),   name='auth-login'),
    path('auth/refresh/',           TokenRefreshView.as_view(),                  name='auth-refresh'),
    path('auth/me/',                views.MeView.as_view(),                      name='auth-me'),
    path('auth/change-password/',   views.ChangePasswordView.as_view(),          name='auth-change-password'),
    path('auth/delete/',            views.DeleteAccountView.as_view(),           name='auth-delete'),
    path('auth/send-verification/', views.SendVerificationEmailView.as_view(),   name='auth-send-verification'),
    path('auth/verify-email/',      views.VerifyEmailView.as_view(),             name='auth-verify-email'),
    path('auth/forgot-password/',   views.ForgotPasswordView.as_view(),          name='auth-forgot-password'),
    path('auth/reset-password/',    views.ResetPasswordView.as_view(),           name='auth-reset-password'),

    # ── Profiles ──────────────────────────────────────────────────────────────
    path('profile/employee/',       views.EmployeeProfileView.as_view(),         name='profile-employee'),
    path('profile/company/',        views.CompanyProfileView.as_view(),          name='profile-company'),
    path('profile/avatar/',         views.AvatarUploadView.as_view(),            name='profile-avatar'),
    path('profile/ai-analysis/',    views.AIAnalysisView.as_view(),              name='profile-ai-analysis'),

    # ── CV & Resume ───────────────────────────────────────────────────────────
    path('profile/resume/upload/',  views.ResumeUploadView.as_view(),            name='resume-upload'),

    # ── Webhooks ──────────────────────────────────────────────────────────────
    path('webhooks/appwrite/',      webhooks.AppwriteWebhookView.as_view(),      name='webhook-appwrite'),


    # ── Analytics ─────────────────────────────────────────────────────────────
    path('dashboard/analytics/',    views.DashboardAnalyticsView.as_view(),      name='dashboard-analytics'),

    # ── Jobs ──────────────────────────────────────────────────────────────────
    path('jobs/',                   views.JobListCreateView.as_view(),           name='job-list-create'),
    path('company/jobs/',           views.CompanyJobsView.as_view(),             name='company-jobs'),
    path('jobs/<int:pk>/',          views.JobDetailView.as_view(),               name='job-detail'),
    path('jobs/<int:pk>/apply/',    views.ApplyForJobView.as_view(),             name='job-apply'),
    path('jobs/<int:pk>/save/',     views.SavedJobToggleView.as_view(),          name='job-save'),
    path('jobs/<int:pk>/status/',   views.JobStatusUpdateView.as_view(),         name='job-status-update'),

    # ── Applications ──────────────────────────────────────────────────────────
    path('applications/',                       views.MyApplicationsView.as_view(),          name='my-applications'),
    path('applications/<int:pk>/status/',       views.ApplicationStatusUpdateView.as_view(), name='application-status'),

    # ── Notifications ─────────────────────────────────────────────────────────
    path('notifications/',                  views.NotificationListView.as_view(),      name='notifications'),
    path('notifications/<int:pk>/read/',    views.MarkNotificationReadView.as_view(),  name='notification-read'),

    # ── Admin endpoints ───────────────────────────────────────────────────────
    path('admin/users/',            views.AdminUserListView.as_view(),           name='admin-users'),
    path('admin/jobs/',             views.AdminJobListView.as_view(),            name='admin-jobs'),
    path('admin/jobs/<int:pk>/edit/', views.AdminJobUpdateView.as_view(),        name='admin-job-update'),
]
