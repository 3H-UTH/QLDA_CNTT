from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0009_contract_notes_alter_contract_start_date_and_more'),
    ]

    operations = [
        # Thay đổi enum status của Contract
        migrations.AlterField(
            model_name='contract',
            name='status',
            field=models.CharField(choices=[('ACTIVE', 'ACTIVE'), ('ENDED', 'ENDED'), ('SUSPENDED', 'SUSPENDED')], default='ACTIVE', max_length=10),
        ),
        
        # Thêm foreign key constraint bằng SQL thủ công
        migrations.RunSQL(
            """
            ALTER TABLE core_contract 
            ADD CONSTRAINT fk_rental_request 
            FOREIGN KEY (rental_request_id) 
            REFERENCES core_rentalrequest (id)
            ON DELETE SET NULL;
            """,
            reverse_sql="""
            ALTER TABLE core_contract 
            DROP FOREIGN KEY fk_rental_request;
            """
        ),
    ]
