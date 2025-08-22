# Generated manually for migrating tenant data

from django.db import migrations

def migrate_tenant_data(apps, schema_editor):
    """Migrate data from core_tenant to accounts_user"""
    # Get model references for the migration
    User = apps.get_model('accounts', 'User')
    
    # Use raw SQL to safely get tenant data from old table
    from django.db import connection
    
    with connection.cursor() as cursor:
        # Check if core_tenant table exists (MySQL version)
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'core_tenant';
        """)
        
        table_exists = cursor.fetchone()[0] > 0
        
        if table_exists:
            # Get all tenant data
            cursor.execute("""
                SELECT user_id, id_number, phone, address, emergency_contact, 
                       occupation, workplace, emergency_phone, emergency_relationship
                FROM core_tenant;
            """)
            
            tenant_data = cursor.fetchall()
            
            # Update users with tenant data
            for row in tenant_data:
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
                    print(f"User {user_id} not found, skipping...")
                    continue
            print(f"Migrated {len(tenant_data)} tenant records")
        else:
            print("core_tenant table does not exist, skipping data migration")

def reverse_migrate_tenant_data(apps, schema_editor):
    """Reverse migration - clear the new fields"""
    User = apps.get_model('accounts', 'User')
    
    User.objects.filter(role='TENANT').update(
        id_number='',
        phone='',
        address='',
        emergency_contact='',
        occupation='',
        workplace='',
        emergency_phone='',
        emergency_relationship=''
    )

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_address_user_emergency_contact_and_more'),
        ('core', '0008_alter_contract_tenant_delete_tenant'),
    ]

    operations = [
        migrations.RunPython(migrate_tenant_data, reverse_migrate_tenant_data),
    ]
