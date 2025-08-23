from django.db import migrations, models
from django.conf import settings

class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0009_contract_notes_alter_contract_start_date_and_more'),
    ]

    operations = [
        # Thay đổi enum status của Contract
        migrations.AlterField(
            model_name='contract',
            name='status',
            field=models.CharField(choices=[('ACTIVE', 'ACTIVE'), ('ENDED', 'ENDED'), ('SUSPENDED', 'SUSPENDED')], default='ACTIVE', max_length=10),
        ),
        
        # Thêm trường rental_request thủ công qua SQL
        migrations.RunSQL(
            """
            ALTER TABLE core_contract 
            ADD COLUMN rental_request_id integer NULL;
            """,
            reverse_sql="""
            ALTER TABLE core_contract 
            DROP COLUMN rental_request_id;
            """
        ),
    ]
