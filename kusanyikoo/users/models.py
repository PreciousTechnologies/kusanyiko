from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('registrant', 'Registrant'),
        ('apostle', 'Apostle'),
        ('member', 'Member'),
    ]

    KANDA_CHOICES = [
        ('dar_es_salaam_na_pwani', 'Dar es Salaam na Pwani'),
        ('nyanda_za_juu_kusini', 'Nyanda za Juu Kusini'),
        ('kusini', 'Kusini'),
        ('kaskazini', 'Kaskazini'),
        ('magharibi_na_ziwa', 'Magharibi na Ziwa'),
        ('kati', 'Kati'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ]
    
    TANZANIA_REGIONS = [
        ('arusha', 'Arusha'),
        ('dar_es_salaam', 'Dar es Salaam'),
        ('dodoma', 'Dodoma'),
        ('geita', 'Geita'),
        ('iringa', 'Iringa'),
        ('kagera', 'Kagera'),
        ('katavi', 'Katavi'),
        ('kigoma', 'Kigoma'),
        ('kilimanjaro', 'Kilimanjaro'),
        ('lindi', 'Lindi'),
        ('manyara', 'Manyara'),
        ('mara', 'Mara'),
        ('mbeya', 'Mbeya'),
        ('morogoro', 'Morogoro'),
        ('mtwara', 'Mtwara'),
        ('mwanza', 'Mwanza'),
        ('njombe', 'Njombe'),
        ('pemba_north', 'Pemba North'),
        ('pemba_south', 'Pemba South'),
        ('pwani', 'Pwani'),
        ('rukwa', 'Rukwa'),
        ('ruvuma', 'Ruvuma'),
        ('shinyanga', 'Shinyanga'),
        ('simiyu', 'Simiyu'),
        ('singida', 'Singida'),
        ('songwe', 'Songwe'),
        ('tabora', 'Tabora'),
        ('tanga', 'Tanga'),
        ('unguja_north', 'Unguja North'),
        ('unguja_south', 'Unguja South'),
    ]
    
    DAR_ES_SALAAM_AREAS = [
        ('ilala', 'Ilala'),
        ('kinondoni', 'Kinondoni'),
        ('temeke', 'Temeke'),
        ('ubungo', 'Ubungo'),
        ('kigamboni', 'Kigamboni'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='admin')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    kanda = models.CharField(max_length=50, choices=KANDA_CHOICES, blank=True)
    country = models.CharField(max_length=100, blank=True)
    region = models.CharField(max_length=100, blank=True)  # For Tanzania regions or Dar es Salaam areas
    is_active = models.BooleanField(default=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    password_reset_token = models.CharField(max_length=100, blank=True, null=True)
    password_reset_token_expires = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return self.username
    
    def members_registered_count(self):
        """Return count of members registered by this user"""
        return self.member_set.filter(is_deleted=False).count()
    
    def is_locked(self):
        """Check if account is currently locked"""
        if self.account_locked_until:
            return timezone.now() < self.account_locked_until
        return False
    
    def lock_account(self, duration_minutes=30):
        """Lock account for specified duration"""
        self.account_locked_until = timezone.now() + timezone.timedelta(minutes=duration_minutes)
        self.save()
    
    def unlock_account(self):
        """Unlock account and reset failed login attempts"""
        self.account_locked_until = None
        self.failed_login_attempts = 0
        self.save()


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('read', 'Read'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('failed_login', 'Failed Login'),
        ('password_reset', 'Password Reset'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=100)  # 'user', 'member', etc.
    resource_id = models.CharField(max_length=100, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['resource_type', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.resource_type} - {self.timestamp}"
