from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.http import HttpResponse
import csv
from .models import Member
from .serializers import MemberSerializer


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


def build_kanda_scope_query(kanda_key):
    areas = KANDA_AREAS.get(kanda_key, [])
    scope_q = Q()

    for area in areas:
        scope_q |= Q(region__iexact=area)
        scope_q |= Q(center_area__iexact=area)
        scope_q |= Q(zone__iexact=area)

    return scope_q


class MemberListCreateView(generics.ListCreateAPIView):
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Member.objects.filter(is_deleted=False)
        
        # Filter by created_by based on user role or explicit filter
        created_by_param = self.request.query_params.get('created_by')
        if user.role == 'registrant':
            # Registrants can only see their own members
            queryset = queryset.filter(created_by=user)
        elif user.role == 'apostle':
            if not user.kanda:
                return queryset.none()

            scope_q = build_kanda_scope_query(user.kanda)
            queryset = queryset.filter(scope_q)
        elif created_by_param:
            # Admins can filter by specific user if requested
            try:
                created_by_id = int(created_by_param)
                queryset = queryset.filter(created_by_id=created_by_id)
            except (ValueError, TypeError):
                pass
        
        # Apply additional filters from query parameters
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(middle_name__icontains=search) |
                Q(mobile_no__icontains=search) |
                Q(email__icontains=search)
            )
        
        gender = self.request.query_params.get('gender')
        if gender:
            queryset = queryset.filter(gender=gender)
        
        region = self.request.query_params.get('region')
        if region:
            queryset = queryset.filter(region__icontains=region)

        center_area = self.request.query_params.get('center_area')
        if center_area:
            queryset = queryset.filter(center_area__icontains=center_area)
        
        country = self.request.query_params.get('country')
        if country:
            queryset = queryset.filter(country__icontains=country)
        
        saved = self.request.query_params.get('saved')
        if saved is not None:
            saved_bool = saved.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(saved=saved_bool)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        try:
            result = super().create(request, *args, **kwargs)
            return result
        except Exception as e:
            print(f"❌ Error creating member: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to create member: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def list(self, request, *args, **kwargs):
        """Override list to add total count to response"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get total count before pagination
        total_count = queryset.count()
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                'results': serializer.data,
                'total_count': total_count
            })

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'total_count': total_count
        })


class MemberDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Member.objects.filter(is_deleted=False)
        
        # Filter by created_by based on user role
        if user.role == 'registrant':
            # Registrants can only access their own members
            queryset = queryset.filter(created_by=user)
        elif user.role == 'apostle':
            if not user.kanda:
                return queryset.none()

            scope_q = build_kanda_scope_query(user.kanda)
            queryset = queryset.filter(scope_q)
        # Admins can access all members
        
        return queryset
    
    def perform_destroy(self, instance):
        # Soft delete - just mark as deleted
        instance.is_deleted = True
        instance.save()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_members(request):
    """Export members to CSV format"""
    user = request.user
    
    # Get queryset based on user role
    if user.role == 'admin':
        queryset = Member.objects.filter(is_deleted=False)
    elif user.role == 'apostle':
        if not user.kanda:
            queryset = Member.objects.none()
        else:
            scope_q = build_kanda_scope_query(user.kanda)
            queryset = Member.objects.filter(scope_q, is_deleted=False)
    else:
        queryset = Member.objects.filter(created_by=user, is_deleted=False)
    
    # Create HTTP response with CSV content type
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="members_export.csv"'
    
    writer = csv.writer(response)
    
    # Write header row
    writer.writerow([
        'First Name', 'Middle Name', 'Last Name', 'Gender', 'Age', 
        'Marital Status', 'Saved', 'Church Registration Number',
        'Country', 'Region', 'Center/Area', 'Zone', 'Cell',
        'Mobile Number', 'Email', 'Postal Address',
        'Church Position', 'Visitors Count', 'Origin', 
        'Residence', 'Career', 'Attending Date', 'Created Date'
    ])
    
    # Write data rows
    for member in queryset:
        writer.writerow([
            member.first_name,
            member.middle_name or '',
            member.last_name,
            member.gender,
            member.age,
            member.marital_status,
            'Yes' if member.saved else 'No',
            member.church_registration_number,
            member.country,
            member.region,
            member.center_area,
            member.zone,
            member.cell,
            member.mobile_no,
            member.email or '',
            member.postal_address or '',
            member.church_position or '',
            member.visitors_count,
            member.origin,
            member.residence,
            member.career or '',
            member.attending_date.strftime('%Y-%m-%d') if member.attending_date else '',
            member.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        ])
    
    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def public_member_search(request):
    """
    Public endpoint for searching members without authentication
    """
    search_term = request.query_params.get('search', '').strip()
    
    if not search_term:
        return Response([], status=status.HTTP_200_OK)
    
    # Search members with basic information only
    queryset = Member.objects.filter(is_deleted=False)
    queryset = queryset.filter(
        Q(first_name__icontains=search_term) |
        Q(last_name__icontains=search_term) |
        Q(middle_name__icontains=search_term) |
        Q(mobile_no__icontains=search_term) |
        Q(email__icontains=search_term)
    )
    
    # Limit results for performance
    queryset = queryset[:50]
    
    serializer = MemberSerializer(queryset, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)
