from django.contrib import admin

from .models import Member


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
	list_display = (
		'first_name',
		'last_name',
		'gender',
		'region',
		'country',
		'saved',
		'created_by',
		'created_at',
		'is_deleted',
	)
	list_filter = ('gender', 'saved', 'country', 'region', 'origin', 'is_deleted')
	search_fields = ('first_name', 'middle_name', 'last_name', 'mobile_no', 'email')
	date_hierarchy = 'created_at'
