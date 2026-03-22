from django.urls import path
from .views import (
    AdminStatsView, 
    RegistrantStatsView,
    BrandingSettingsView,
)

urlpatterns = [
    path('admin/', AdminStatsView.as_view(), name='admin-stats'),
    path('registrant/', RegistrantStatsView.as_view(), name='registrant-stats'),
    path('branding/', BrandingSettingsView.as_view(), name='branding-settings'),
]
