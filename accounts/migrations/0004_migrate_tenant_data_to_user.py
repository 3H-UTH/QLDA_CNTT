"""
Migrate data from core_tenant to accounts_user
"""
from django.db import migrations


def migrate_tenant_data(apps, schema_editor):
    """Migrate tenant data to user model"""
    # Get models
    User = apps.get_model('accounts', 'User')
    
    # Since Tenant model might not exist anymore, we'll use raw SQL
    from django.db import connection
    
    with connection.cursor() as cursor:
        # Check if core_tenant table exists
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'core_tenant'
        """)
        
        if cursor.fetchone()[0] > 0:
            # Get all tenant data
            cursor.execute("""
                SELECT ct.user_id, ct.id_number, ct.phone, ct.address, ct.emergency_contact,
                       ct.occupation, ct.workplace, ct.emergency_phone, ct.emergency_relationship
                FROM core_tenant ct
            """)
            
            # Update users with tenant data
            for row in cursor.fetchall():
                user_id, id_number, phone, address, emergency_contact, occupation, workplace, emergency_phone, emergency_relationship = row
                
                try:
                    user = User.objects.get(id=user_id)
                    user.id_number = id_number or ''
                    user.phone = phone or ''
                    user.address = address or ''
                    user.emergency_contact = emergency_contact or ''
                    user.occupation = occupation or ''
                    user.workplace = workplace or ''
                    user.emergency_phone = emergency_phone or ''
                    user.emergency_relationship = emergency_relationship or ''
                    user.save()
                    print(f"Migrated data for user {user_id}")
                except User.DoesNotExist:
                    print(f"User {user_id} not found, skipping")


def reverse_migrate_tenant_data(apps, schema_editor):
    """Reverse migration - not implemented"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_migrate_tenant_data'),
    ]

    operations = [
        migrations.RunPython(migrate_tenant_data, reverse_migrate_tenant_data),
    ]
