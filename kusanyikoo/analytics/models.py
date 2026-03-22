from django.db import models
from django.conf import settings

# Create your models here.

class ExportHistory(models.Model):
    EXPORT_TYPES = [
        ('members', 'Members'),
        ('analytics', 'Analytics'),
        ('users', 'User Activity'),
        ('financial', 'Financial'),
    ]
    
    FORMAT_CHOICES = [
        ('csv', 'CSV'),
        ('excel', 'Excel'),
        ('pdf', 'PDF'),
    ]
    
    export_type = models.CharField(max_length=20, choices=EXPORT_TYPES)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exports')
    created_at = models.DateTimeField(auto_now_add=True)
    file_size = models.CharField(max_length=50)
    download_count = models.PositiveIntegerField(default=0)
    filters_applied = models.JSONField(default=dict)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_by', 'created_at']),
            models.Index(fields=['export_type', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.export_type} - {self.format} - {self.created_by} - {self.created_at}"


class BrandingSettings(models.Model):
    app_name = models.CharField(max_length=120, default="Efatha Leaders' Camp")
    app_subtitle = models.CharField(max_length=180, default="EFATHA Leaders' Camp Registration • Kibaha")
    landing_header_title = models.CharField(max_length=120, default="Efatha Leaders' Camp")
    landing_header_subtitle = models.CharField(max_length=180, default="Kibaha Leadership Registration Portal")
    landing_hero_prefix = models.CharField(max_length=80, default="Welcome to")
    landing_hero_highlight = models.CharField(max_length=120, default="Efatha Leaders' Camp")
    landing_hero_suffix = models.CharField(max_length=80, default="Registration")
    landing_description = models.TextField(
        default="Register church leaders for the Kibaha camp where spiritual services are ministered by Apostle and Prophet Josephat Elias Mwingira at Precious Centre, Kibaha."
    )
    ministry_lead = models.CharField(max_length=180, default="Apostle and Prophet Josephat Elias Mwingira")
    camp_location = models.CharField(max_length=120, default="Precious Centre, Kibaha")
    camp_start_date = models.CharField(max_length=80, default="October 6, 2025")
    camp_end_date = models.CharField(max_length=80, default="October 12, 2025")
    registration_status_label = models.CharField(max_length=80, default="Camp Registration Active")
    admin_dashboard_subtitle = models.CharField(max_length=180, default="EFATHA Leaders' Camp Dashboard")
    registrant_dashboard_subtitle = models.CharField(max_length=180, default="EFATHA Leaders' Camp • Your registration dashboard")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Branding Settings'
        verbose_name_plural = 'Branding Settings'

    def __str__(self):
        return self.app_name
