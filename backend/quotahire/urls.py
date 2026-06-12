"""
Quota Hire — Root URL Configuration
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Customise the Admin site header/title
admin.site.site_header  = 'Quota Hire Administration'
admin.site.site_title   = 'Quota Hire Admin'
admin.site.index_title  = 'Welcome to Quota Hire Admin Portal'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
