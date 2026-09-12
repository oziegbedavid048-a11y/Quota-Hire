"""
Quota Hire — Root URL Configuration
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Customise the Admin site header/title
admin.site.site_header  = 'Quotahire Administration'
admin.site.site_title   = 'Quotahire Admin'
admin.site.index_title  = 'Welcome to Quotahire Admin Portal'

urlpatterns = [
    # QH-36: the admin path is configurable via DJANGO_ADMIN_PATH so it can be
    # moved off the default /admin/ that scanners probe. Defaults to 'admin/',
    # so nothing changes unless the variable is set.
    path(settings.DJANGO_ADMIN_PATH, admin.site.urls),
    path('api/', include('api.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
