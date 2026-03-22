from rest_framework import serializers

from .models import BrandingSettings


class BrandingSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandingSettings
        fields = '__all__'
        read_only_fields = ['id', 'updated_at']
