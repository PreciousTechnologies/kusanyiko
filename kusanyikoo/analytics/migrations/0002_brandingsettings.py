from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='BrandingSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('app_name', models.CharField(default="Efatha Leaders' Camp", max_length=120)),
                ('app_subtitle', models.CharField(default="EFATHA Leaders' Camp Registration • Kibaha", max_length=180)),
                ('landing_header_title', models.CharField(default="Efatha Leaders' Camp", max_length=120)),
                ('landing_header_subtitle', models.CharField(default='Kibaha Leadership Registration Portal', max_length=180)),
                ('landing_hero_prefix', models.CharField(default='Welcome to', max_length=80)),
                ('landing_hero_highlight', models.CharField(default="Efatha Leaders' Camp", max_length=120)),
                ('landing_hero_suffix', models.CharField(default='Registration', max_length=80)),
                ('landing_description', models.TextField(default='Register church leaders for the Kibaha camp where spiritual services are ministered by Apostle and Prophet Josephat Elias Mwingira at Precious Centre, Kibaha.')),
                ('ministry_lead', models.CharField(default='Apostle and Prophet Josephat Elias Mwingira', max_length=180)),
                ('camp_location', models.CharField(default='Precious Centre, Kibaha', max_length=120)),
                ('camp_start_date', models.CharField(default='October 6, 2025', max_length=80)),
                ('camp_end_date', models.CharField(default='October 12, 2025', max_length=80)),
                ('registration_status_label', models.CharField(default='Camp Registration Active', max_length=80)),
                ('admin_dashboard_subtitle', models.CharField(default="EFATHA Leaders' Camp Dashboard", max_length=180)),
                ('registrant_dashboard_subtitle', models.CharField(default="EFATHA Leaders' Camp • Your registration dashboard", max_length=180)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Branding Settings',
                'verbose_name_plural': 'Branding Settings',
            },
        ),
    ]
