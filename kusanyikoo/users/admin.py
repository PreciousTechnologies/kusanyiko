from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import AuditLog, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
	list_display = (
		'username',
		'email',
		'first_name',
		'last_name',
		'role',
		'kanda',
		'status',
		'is_staff',
		'is_superuser',
	)
	list_filter = ('role', 'kanda', 'status', 'is_staff', 'is_superuser', 'is_active')
	search_fields = ('username', 'email', 'first_name', 'last_name')
	fieldsets = DjangoUserAdmin.fieldsets + (
		('Kusanyiko Profile', {'fields': ('role', 'status', 'kanda', 'country', 'region')}),
	)
	add_fieldsets = DjangoUserAdmin.add_fieldsets + (
		('Kusanyiko Profile', {'fields': ('role', 'status', 'kanda', 'country', 'region')}),
	)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
	list_display = ('user', 'action', 'resource_type', 'resource_id', 'ip_address', 'timestamp')
	list_filter = ('action', 'resource_type', 'timestamp')
	search_fields = ('user__username', 'resource_type', 'resource_id', 'ip_address')
	date_hierarchy = 'timestamp'
