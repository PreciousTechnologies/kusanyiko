from django.db import migrations, models


def update_apostle_role(apps, schema_editor):
    User = apps.get_model('users', 'User')
    User.objects.filter(role='member').update(role='member')


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_alter_user_role'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('admin', 'Admin'),
                    ('registrant', 'Registrant'),
                    ('apostle', 'Apostle'),
                    ('member', 'Member'),
                ],
                default='admin',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='kanda',
            field=models.CharField(
                blank=True,
                choices=[
                    ('dar_es_salaam_na_pwani', 'Dar es Salaam na Pwani'),
                    ('nyanda_za_juu_kusini', 'Nyanda za Juu Kusini'),
                    ('kusini', 'Kusini'),
                    ('kaskazini', 'Kaskazini'),
                    ('magharibi_na_ziwa', 'Magharibi na Ziwa'),
                    ('kati', 'Kati'),
                ],
                max_length=50,
            ),
        ),
        migrations.RunPython(update_apostle_role, migrations.RunPython.noop),
    ]
