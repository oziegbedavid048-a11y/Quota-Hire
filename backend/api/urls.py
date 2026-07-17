"""
Quota Hire — API URL Routing
"""

from django.urls import path
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

# Simple health-check view — no auth required, instant response.
# Use this URL with a free ping service (e.g. UptimeRobot, cron-job.org)
# to keep the Render free-tier backend awake and prevent cold starts.
# Ping target: https://quotahire-backend.onrender.com/api/ping/
def ping(request):
    import subprocess
    try:
        commit = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']).decode().strip()
    except Exception as e:
        commit = f"unknown: {str(e)}"
    return JsonResponse({"status": "ok", "commit": commit})

urlpatterns = [
    path('ping/', ping, name='ping'),

    # ── Auth ─────────────────────────────────────────────────────────────────
    path('auth/register/',          views.RegisterView.as_view(),                name='auth-register'),
    path('auth/login/',             views.CustomTokenObtainPairView.as_view(),   name='auth-login'),
    path('auth/google/',            views.GoogleLoginView.as_view(),             name='auth-google'),
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
    path('cv/save/',                views.SaveGeneratedCVView.as_view(),          name='cv-save'),
    path('cv/my-cvs/',              views.MyGeneratedCVsView.as_view(),           name='cv-my-list'),
    path('cv/<int:pk>/download/',   views.DownloadGeneratedCVView.as_view(),      name='cv-download'),

    # ── Payments ──────────────────────────────────────────────────────────────
    path('payments/initiate/',      views.PaymentInitiateView.as_view(),         name='payment-initiate'),
    path('payments/verify/',        views.PaymentVerifyView.as_view(),           name='payment-verify'),
    path('payments/webhook/',       views.PaystackWebhookView.as_view(),         name='payment-webhook'),

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

    # ── Company Applicant Review ──────────────────────────────────────────────
    path('company/jobs/<int:job_id>/applicants/', views.CompanyJobApplicantsView.as_view(), name='company-job-applicants'),
    path('company/applications/<int:pk>/', views.CompanyApplicationDetailView.as_view(), name='company-application-detail'),
    path('company/applications/<int:pk>/shortlist/', views.ShortlistApplicantView.as_view(), name='company-shortlist-applicant'),
    path('company/applications/<int:pk>/resume/', views.ResumeProxyView.as_view(), name='company-resume-proxy'),
    path('company/<str:lookup_val>/',  views.CompanyPublicProfileView.as_view(),    name='company-public-profile'),

    # ── Notifications ─────────────────────────────────────────────────────────
    path('notifications/',                  views.NotificationListView.as_view(),      name='notifications'),
    path('notifications/<int:pk>/read/',    views.MarkNotificationReadView.as_view(),  name='notification-read'),

    # ── Admin endpoints ───────────────────────────────────────────────────────
    path('admin/users/',            views.AdminUserListView.as_view(),           name='admin-users'),
    path('admin/jobs/',             views.AdminJobListView.as_view(),            name='admin-jobs'),
    path('admin/jobs/<int:pk>/edit/', views.AdminJobUpdateView.as_view(),        name='admin-job-update'),

    # ── Community (Mobile App Only) ───────────────────────────────────────────
    path('community/posts/',                          views.CommunityFeedView.as_view(),              name='community-feed'),
    path('community/posts/create/',                   views.CommunityPostCreateView.as_view(),        name='community-post-create'),
    path('community/posts/<int:pk>/like/',            views.CommunityPostLikeView.as_view(),          name='community-post-like'),
    path('community/posts/<int:pk>/comments/',        views.CommunityCommentListCreateView.as_view(), name='community-comments'),
    path('community/posts/<int:pk>/edit/',            views.CommunityPostUpdateView.as_view(),        name='community-post-edit'),
    path('community/posts/<int:pk>/delete/',          views.CommunityPostDeleteView.as_view(),        name='community-post-delete'),
    path('community/posts/<int:pk>/report/',          views.CommunityReportView.as_view(),            name='community-post-report'),
    path('community/polls/',                          views.CommunityPollListView.as_view(),          name='community-polls'),
    path('community/polls/create/',                   views.CommunityPollCreateView.as_view(),        name='community-poll-create'),
    path('community/polls/<int:pk>/vote/',            views.CommunityPollVoteView.as_view(),          name='community-poll-vote'),
    path('community/my-posts/',                       views.CommunityMyPostsView.as_view(),           name='community-my-posts'),
]


