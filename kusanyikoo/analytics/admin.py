from django.contrib import admin

from .models import ExportHistory, BrandingSettings


@admin.register(ExportHistory)
class ExportHistoryAdmin(admin.ModelAdmin):
	list_display = ('export_type', 'format', 'created_by', 'file_size', 'download_count', 'created_at')
	list_filter = ('export_type', 'format', 'created_at')
	search_fields = ('created_by__username',)
	date_hierarchy = 'created_at'


@admin.register(BrandingSettings)
class BrandingSettingsAdmin(admin.ModelAdmin):
	list_display = ('app_name', 'camp_location', 'registration_status_label', 'updated_at')
	search_fields = ('app_name', 'camp_location', 'ministry_lead')
