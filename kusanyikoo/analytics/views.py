from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Count, Q
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta, datetime
import csv
import io
import json
from members.models import Member
from users.models import User, AuditLog
from .models import ExportHistory, BrandingSettings
from .serializers import BrandingSettingsSerializer


KANDA_AREAS = {
    'dar_es_salaam_na_pwani': [
        'Dar es Salaam', 'Pwani', 'Mwenge', 'Temeke', 'Ushindi', 'Imara',
        'Kinondoni', 'Zanzibar', 'Yombo', 'Kisukuru'
    ],
    'nyanda_za_juu_kusini': ['Mbeya', 'Rukwa', 'Katavi', 'Iringa'],
    'kusini': ['Mtwara', 'Lindi', 'Ruvuma', 'Njombe'],
    'kaskazini': ['Kilimanjaro', 'Arusha', 'Manyara', 'Tanga'],
    'magharibi_na_ziwa': ['Kigoma', 'Shinyanga', 'Simiyu', 'Mwanza', 'Geita', 'Mara', 'Kagera', 'Tabora'],
    'kati': ['Dodoma', 'Singida'],
}


def get_member_scope_queryset(user):
    queryset = Member.objects.filter(is_deleted=False)

    if user.role == 'admin':
        return queryset

    if user.role == 'apostle':
        if not user.kanda:
            return queryset.none()

        areas = KANDA_AREAS.get(user.kanda, [])
        scope_q = Q()
        for area in areas:
            scope_q |= Q(region__iexact=area)
            scope_q |= Q(center_area__iexact=area)
            scope_q |= Q(zone__iexact=area)

        return queryset.filter(scope_q)

    return queryset.filter(created_by=user)


class BrandingSettingsView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        # Singleton record with pk=1 keeps deployment and querying simple.
        branding, _ = BrandingSettings.objects.get_or_create(pk=1)
        return Response(BrandingSettingsSerializer(branding).data)

    def patch(self, request):
        if not request.user.is_authenticated or getattr(request.user, 'role', '') != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)

        branding, _ = BrandingSettings.objects.get_or_create(pk=1)
        serializer = BrandingSettingsSerializer(branding, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        
        # Get basic stats
        total_members = Member.objects.filter(is_deleted=False).count()
        
        # Get breakdown by country
        country_stats = Member.objects.filter(is_deleted=False)\
            .values('country')\
            .annotate(count=Count('id'))\
            .order_by('-count')
        
        # Get breakdown by region
        region_stats = Member.objects.filter(is_deleted=False)\
            .values('region')\
            .annotate(count=Count('id'))\
            .order_by('-count')
        
        # Get breakdown by gender
        gender_stats = Member.objects.filter(is_deleted=False)\
            .values('gender')\
            .annotate(count=Count('id'))
        
        # Get breakdown by marital status
        marital_stats = Member.objects.filter(is_deleted=False)\
            .values('marital_status')\
            .annotate(count=Count('id'))
        
        # Get saved vs unsaved
        saved_stats = Member.objects.filter(is_deleted=False)\
            .values('saved')\
            .annotate(count=Count('id'))
        
        # Get recent registrations (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_registrations = Member.objects.filter(
            is_deleted=False,
            created_at__gte=thirty_days_ago
        ).count()
        
        # Get weekly growth data (last 8 weeks)
        weekly_data = []
        for i in range(8):
            week_start = timezone.now() - timedelta(weeks=i+1)
            week_end = timezone.now() - timedelta(weeks=i)
            week_count = Member.objects.filter(
                is_deleted=False,
                created_at__gte=week_start,
                created_at__lt=week_end
            ).count()
            weekly_data.insert(0, {
                'week': f'Week {8-i}',
                'count': week_count
            })
        
        return Response({
            'total_members': total_members,
            'country_stats': list(country_stats),
            'region_stats': list(region_stats),
            'gender_stats': list(gender_stats),
            'marital_stats': list(marital_stats),
            'saved_stats': list(saved_stats),
            'recent_registrations': recent_registrations,
            'weekly_growth': weekly_data,
        })


class RegistrantStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        scoped_members = get_member_scope_queryset(request.user)

        # Get basic stats for current user
        total_registered = scoped_members.count()
        
        # Get breakdown by gender
        gender_stats = scoped_members.values('gender').annotate(count=Count('id'))
        
        # Get breakdown by region
        region_stats = scoped_members.values('region').annotate(count=Count('id'))
        
        # Get saved vs unsaved
        saved_stats = scoped_members.values('saved').annotate(count=Count('id'))
        
        # Get recent registrations (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_registrations = scoped_members.filter(created_at__gte=thirty_days_ago).count()
        
        # Get weekly performance (last 4 weeks)
        weekly_data = []
        for i in range(4):
            week_start = timezone.now() - timedelta(weeks=i+1)
            week_end = timezone.now() - timedelta(weeks=i)
            week_count = scoped_members.filter(created_at__gte=week_start, created_at__lt=week_end).count()
            weekly_data.insert(0, {
                'week': f'Week {4-i}',
                'count': week_count
            })
        
        # Get recent activity (last 5 members)
        recent_members = scoped_members.order_by('-created_at')[:5].values(
            'first_name', 'last_name', 'created_at'
        )
        
        return Response({
            'total_registered': total_registered,
            'gender_stats': list(gender_stats),
            'region_stats': list(region_stats),
            'saved_stats': list(saved_stats),
            'recent_registrations': recent_registrations,
            'weekly_performance': weekly_data,
            'recent_activity': list(recent_members),
        })


# Export Views

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_members(request):
    """Export members data in various formats"""
    format_type = request.data.get('format', 'csv')
    filters = request.data.get('filters', {})
    
    # Build queryset with filters
    queryset = get_member_scope_queryset(request.user)
    
    if filters.get('created_by') and request.user.role == 'admin':
        queryset = queryset.filter(created_by=filters['created_by'])
    
    if filters.get('region'):
        queryset = queryset.filter(region=filters['region'])
    
    if filters.get('gender'):
        queryset = queryset.filter(gender=filters['gender'])
    
    if filters.get('date_from'):
        queryset = queryset.filter(created_at__gte=filters['date_from'])
    
    if filters.get('date_to'):
        queryset = queryset.filter(created_at__lte=filters['date_to'])
    
    # Export based on format
    if format_type == 'csv':
        response = export_members_csv(queryset)
    elif format_type == 'excel':
        response = export_members_excel(queryset)
    elif format_type == 'pdf':
        response = export_members_pdf(queryset)
    else:
        return Response({'error': 'Unsupported format'}, status=400)
    
    # Log export activity
    file_size = f"{len(response.content) / 1024:.1f} KB"
    ExportHistory.objects.create(
        export_type='members',
        format=format_type,
        created_by=request.user,
        file_size=file_size,
        filters_applied=filters
    )
    
    return response


def export_members_csv(queryset):
    """Export members to CSV format"""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="members_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow([
        'First Name', 'Last Name', 'Email', 'Phone', 'Country', 'Region', 
        'Gender', 'Marital Status', 'Saved', 'Date Registered', 'Registered By'
    ])
    
    for member in queryset:
        writer.writerow([
            member.first_name,
            member.last_name,
            member.email,
            member.mobile_no,
            member.country,
            member.region,
            member.gender,
            member.marital_status,
            'Yes' if member.saved else 'No',
            member.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            member.created_by.username if member.created_by else 'N/A'
        ])
    
    return response


def export_members_excel(queryset):
    """Export members to Excel format (placeholder - requires openpyxl)"""
    # For now, return CSV with Excel MIME type
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename="members_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx"'
    
    # This would require openpyxl library for proper Excel export
    # For now, we'll return a CSV file
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'First Name', 'Last Name', 'Email', 'Phone', 'Country', 'Region', 
        'Gender', 'Marital Status', 'Saved', 'Date Registered', 'Registered By'
    ])
    
    for member in queryset:
        writer.writerow([
            member.first_name,
            member.last_name,
            member.email,
            member.mobile_no,
            member.country,
            member.region,
            member.gender,
            member.marital_status,
            'Yes' if member.saved else 'No',
            member.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            member.created_by.username if member.created_by else 'N/A'
        ])
    
    response.write(output.getvalue().encode('utf-8'))
    return response


def export_members_pdf(queryset):
    """Export members to PDF format (placeholder - requires reportlab)"""
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="members_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
    
    # This would require reportlab library for proper PDF export
    # For now, we'll return a simple text representation
    content = "MEMBERS EXPORT REPORT\n"
    content += "=" * 50 + "\n\n"
    
    for member in queryset:
        content += f"Name: {member.first_name} {member.last_name}\n"
        content += f"Email: {member.email}\n"
        content += f"Phone: {member.mobile_no}\n"
        content += f"Region: {member.region}\n"
        content += f"Gender: {member.gender}\n"
        content += f"Registered: {member.created_at.strftime('%Y-%m-%d')}\n"
        content += "-" * 30 + "\n"
    
    response.write(content.encode('utf-8'))
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_analytics(request):
    """Export analytics data"""
    try:
        format_type = request.data.get('format', 'pdf')
        export_type = request.data.get('type', 'overview')
        date_range = request.data.get('date_range', {})
        
        print(f"Export analytics: format={format_type}, type={export_type}, date_range={date_range}")
        
        if format_type not in ['pdf', 'excel']:
            return Response({'error': f'Unsupported format: {format_type}'}, status=400)
        
        if export_type not in ['overview', 'summary', 'demographics', 'geographical']:
            return Response({'error': f'Unsupported export type: {export_type}'}, status=400)
        
        if format_type == 'pdf':
            response = export_analytics_pdf(export_type, date_range)
        elif format_type == 'excel':
            response = export_analytics_excel(export_type, date_range)
        
        # Log export activity
        try:
            file_size = f"{len(response.content) / 1024:.1f} KB"
            ExportHistory.objects.create(
                export_type='analytics',
                format=format_type,
                created_by=request.user,
                file_size=file_size,
                filters_applied={'type': export_type, 'date_range': date_range}
            )
        except Exception as log_error:
            print(f"Failed to log export: {log_error}")
            # Don't fail the export if logging fails
        
        return response
        
    except Exception as e:
        print(f"Export analytics error: {e}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


def export_analytics_pdf(export_type, date_range):
    """Export analytics to PDF"""
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="analytics_{export_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
    
    # Generate analytics content based on type
    content = f"ANALYTICS REPORT - {export_type.upper()}\n"
    content += "=" * 50 + "\n\n"
    content += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    
    if export_type in ['summary', 'overview']:
        # Summary Report
        total_members = Member.objects.filter(is_deleted=False).count()
        males = Member.objects.filter(is_deleted=False, gender='male').count()
        females = Member.objects.filter(is_deleted=False, gender='female').count()
        saved = Member.objects.filter(is_deleted=False, saved=True).count()
        unsaved = Member.objects.filter(is_deleted=False, saved=False).count()
        
        content += f"Total Members Registered: {total_members}\n"
        content += f"Number of Males: {males}\n"
        content += f"Number of Females: {females}\n"
        content += f"Number of Saved Members: {saved}\n"
        content += f"Number of Unsaved Members: {unsaved}\n\n"
        
        # Countries
        country_stats = Member.objects.filter(is_deleted=False).values('country').annotate(count=Count('id')).order_by('-count')
        content += "Members by Country:\n"
        for stat in country_stats:
            content += f"  {stat['country']}: {stat['count']}\n"
        content += "\n"
        
        # Tanzania Regions
        tanzania_regions = Member.objects.filter(is_deleted=False, country='Tanzania').exclude(region__isnull=True).exclude(region='').values('region').annotate(count=Count('id')).order_by('-count')
        if tanzania_regions:
            content += "Members by Region (Tanzania):\n"
            for stat in tanzania_regions:
                content += f"  {stat['region']}: {stat['count']}\n"
            content += "\n"
        
        # Dar es Salaam Areas
        dar_areas = Member.objects.filter(is_deleted=False, country='Tanzania', region='Dar es Salaam').exclude(center_area__isnull=True).exclude(center_area='').values('center_area').annotate(count=Count('id')).order_by('-count')
        if dar_areas:
            content += "Members by Center/Area (Dar es Salaam):\n"
            for stat in dar_areas:
                content += f"  {stat['center_area']}: {stat['count']}\n"
    
    elif export_type == 'demographics':
        # Demographics Report
        total_members = Member.objects.filter(is_deleted=False).count()
        males = Member.objects.filter(is_deleted=False, gender='male').count()
        females = Member.objects.filter(is_deleted=False, gender='female').count()
        saved = Member.objects.filter(is_deleted=False, saved=True).count()
        unsaved = Member.objects.filter(is_deleted=False, saved=False).count()
        
        content += "DEMOGRAPHICS REPORT\n"
        content += "=" * 30 + "\n\n"
        content += f"Total Members: {total_members}\n\n"
        content += f"Gender Distribution:\n"
        content += f"  Males: {males}\n"
        content += f"  Females: {females}\n\n"
        content += f"Salvation Status:\n"
        content += f"  Saved: {saved}\n"
        content += f"  Unsaved: {unsaved}\n"
        
        # Marital status
        marital_stats = Member.objects.filter(is_deleted=False).values('marital_status').annotate(count=Count('id')).order_by('-count')
        content += "\nMarital Status Distribution:\n"
        for stat in marital_stats:
            content += f"  {stat['marital_status']}: {stat['count']}\n"
    
    elif export_type == 'geographical':
        # Geographical Report
        content += "GEOGRAPHICAL DISTRIBUTION REPORT\n"
        content += "=" * 35 + "\n\n"
        
        # Countries
        country_stats = Member.objects.filter(is_deleted=False).values('country').annotate(count=Count('id')).order_by('-count')
        content += "Members by Country:\n"
        for stat in country_stats:
            content += f"  {stat['country']}: {stat['count']}\n"
        content += "\n"
        
        # Tanzania Regions
        tanzania_regions = Member.objects.filter(is_deleted=False, country='Tanzania').exclude(region__isnull=True).exclude(region='').values('region').annotate(count=Count('id')).order_by('-count')
        content += "Members by Region (Tanzania):\n"
        for stat in tanzania_regions:
            content += f"  {stat['region']}: {stat['count']}\n"
        content += "\n"
        
        # Dar es Salaam Areas
        dar_areas = Member.objects.filter(is_deleted=False, country='Tanzania', region='Dar es Salaam').exclude(center_area__isnull=True).exclude(center_area='').values('center_area').annotate(count=Count('id')).order_by('-count')
        content += "Members by Center/Area (Dar es Salaam):\n"
        for stat in dar_areas:
            content += f"  {stat['center_area']}: {stat['count']}\n"
    
    response.write(content.encode('utf-8'))
    return response


def export_analytics_excel(export_type, date_range):
    """Export analytics to Excel"""
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename="analytics_{export_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx"'
    
    # Generate CSV content based on type
    output = io.StringIO()
    writer = csv.writer(output)
    
    if export_type in ['summary', 'overview']:
        writer.writerow(['Summary Report'])
        writer.writerow(['Generated', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow([])
        
        # Basic stats
        total_members = Member.objects.filter(is_deleted=False).count()
        males = Member.objects.filter(is_deleted=False, gender='male').count()
        females = Member.objects.filter(is_deleted=False, gender='female').count()
        saved = Member.objects.filter(is_deleted=False, saved=True).count()
        unsaved = Member.objects.filter(is_deleted=False, saved=False).count()
        
        writer.writerow(['Metric', 'Count'])
        writer.writerow(['Total Members Registered', total_members])
        writer.writerow(['Number of Males', males])
        writer.writerow(['Number of Females', females])
        writer.writerow(['Number of Saved Members', saved])
        writer.writerow(['Number of Unsaved Members', unsaved])
        writer.writerow([])
        
        # Countries
        writer.writerow(['Country', 'Member Count'])
        country_stats = Member.objects.filter(is_deleted=False).values('country').annotate(count=Count('id')).order_by('-count')
        for stat in country_stats:
            writer.writerow([stat['country'], stat['count']])
        writer.writerow([])
        
        # Tanzania Regions
        writer.writerow(['Region (Tanzania)', 'Member Count'])
        tanzania_regions = Member.objects.filter(is_deleted=False, country='Tanzania').exclude(region__isnull=True).exclude(region='').values('region').annotate(count=Count('id')).order_by('-count')
        for stat in tanzania_regions:
            writer.writerow([stat['region'], stat['count']])
        writer.writerow([])
        
        # Dar es Salaam Areas
        writer.writerow(['Center/Area (Dar es Salaam)', 'Member Count'])
        dar_areas = Member.objects.filter(is_deleted=False, country='Tanzania', region='Dar es Salaam').exclude(center_area__isnull=True).exclude(center_area='').values('center_area').annotate(count=Count('id')).order_by('-count')
        for stat in dar_areas:
            writer.writerow([stat['center_area'], stat['count']])
    
    elif export_type == 'demographics':
        writer.writerow(['Demographics Report'])
        writer.writerow(['Generated', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow([])
        
        total_members = Member.objects.filter(is_deleted=False).count()
        males = Member.objects.filter(is_deleted=False, gender='male').count()
        females = Member.objects.filter(is_deleted=False, gender='female').count()
        saved = Member.objects.filter(is_deleted=False, saved=True).count()
        unsaved = Member.objects.filter(is_deleted=False, saved=False).count()
        
        writer.writerow(['Total Members', total_members])
        writer.writerow([])
        writer.writerow(['Gender Distribution'])
        writer.writerow(['Males', males])
        writer.writerow(['Females', females])
        writer.writerow([])
        writer.writerow(['Salvation Status'])
        writer.writerow(['Saved', saved])
        writer.writerow(['Unsaved', unsaved])
        writer.writerow([])
        
        # Marital status
        writer.writerow(['Marital Status', 'Count'])
        marital_stats = Member.objects.filter(is_deleted=False).values('marital_status').annotate(count=Count('id')).order_by('-count')
        for stat in marital_stats:
            writer.writerow([stat['marital_status'], stat['count']])
    
    elif export_type == 'geographical':
        writer.writerow(['Geographical Distribution Report'])
        writer.writerow(['Generated', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow([])
        
        # Countries
        writer.writerow(['Country', 'Member Count'])
        country_stats = Member.objects.filter(is_deleted=False).values('country').annotate(count=Count('id')).order_by('-count')
        for stat in country_stats:
            writer.writerow([stat['country'], stat['count']])
        writer.writerow([])
        
        # Tanzania Regions
        writer.writerow(['Region (Tanzania)', 'Member Count'])
        tanzania_regions = Member.objects.filter(is_deleted=False, country='Tanzania').exclude(region__isnull=True).exclude(region='').values('region').annotate(count=Count('id')).order_by('-count')
        for stat in tanzania_regions:
            writer.writerow([stat['region'], stat['count']])
        writer.writerow([])
        
        # Dar es Salaam Areas
        writer.writerow(['Center/Area (Dar es Salaam)', 'Member Count'])
        dar_areas = Member.objects.filter(is_deleted=False, country='Tanzania', region='Dar es Salaam').exclude(center_area__isnull=True).exclude(center_area='').values('center_area').annotate(count=Count('id')).order_by('-count')
        for stat in dar_areas:
            writer.writerow([stat['center_area'], stat['count']])
    
    response.write(output.getvalue().encode('utf-8'))
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_user_activity(request):
    """Export user activity logs"""
    format_type = request.data.get('format', 'csv')
    date_range = request.data.get('date_range', {})
    user_ids = request.data.get('user_ids', [])
    
    # Build queryset
    queryset = AuditLog.objects.all()
    
    if date_range.get('start_date'):
        queryset = queryset.filter(timestamp__gte=date_range['start_date'])
    
    if date_range.get('end_date'):
        queryset = queryset.filter(timestamp__lte=date_range['end_date'])
    
    if user_ids:
        queryset = queryset.filter(user_id__in=user_ids)
    
    if format_type == 'csv':
        response = export_user_activity_csv(queryset)
    elif format_type == 'excel':
        response = export_user_activity_excel(queryset)
    else:
        return Response({'error': 'Unsupported format'}, status=400)
    
    # Log export activity
    file_size = f"{len(response.content) / 1024:.1f} KB"
    ExportHistory.objects.create(
        export_type='users',
        format=format_type,
        created_by=request.user,
        file_size=file_size,
        filters_applied={'date_range': date_range, 'user_ids': user_ids}
    )
    
    return response


def export_user_activity_csv(queryset):
    """Export user activity to CSV"""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="user_activity_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['User', 'Action', 'Resource Type', 'Resource ID', 'Timestamp', 'IP Address'])
    
    for log in queryset:
        writer.writerow([
            log.user.username if log.user else 'N/A',
            log.action,
            log.resource_type,
            log.resource_id,
            log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            log.ip_address
        ])
    
    return response


def export_user_activity_excel(queryset):
    """Export user activity to Excel"""
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename="user_activity_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx"'
    
    # For now, return CSV format
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['User', 'Action', 'Resource Type', 'Resource ID', 'Timestamp', 'IP Address'])
    
    for log in queryset:
        writer.writerow([
            log.user.username if log.user else 'N/A',
            log.action,
            log.resource_type,
            log.resource_id,
            log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            log.ip_address
        ])
    
    response.write(output.getvalue().encode('utf-8'))
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_financial(request):
    """Export financial data (placeholder)"""
    format_type = request.data.get('format', 'excel')
    date_range = request.data.get('date_range', {})
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="financial_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
    writer = csv.writer(response)
    writer.writerow(['Date', 'Type', 'Amount', 'Member', 'Description'])
    writer.writerow([datetime.now().strftime('%Y-%m-%d'), 'Tithe', '100.00', 'Sample Member', 'Monthly tithe'])
    
    # Log export activity
    file_size = f"{len(response.content) / 1024:.1f} KB"
    ExportHistory.objects.create(
        export_type='financial',
        format=format_type,
        created_by=request.user,
        file_size=file_size,
        filters_applied={'date_range': date_range}
    )
    
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_history(request):
    """Get export history"""
    exports = ExportHistory.objects.filter(created_by=request.user).order_by('-created_at')[:20]
    
    export_data = []
    for export in exports:
        export_data.append({
            'id': export.id,
            'export_type': export.export_type,
            'format': export.format,
            'created_at': export.created_at,
            'file_size': export.file_size,
            'download_count': export.download_count,
            'created_by': {
                'id': export.created_by.id,
                'username': export.created_by.username
            }
        })
    
    return Response(export_data)
