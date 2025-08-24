# Generated manually to handle column conflicts on production

from django.db import migrations, models
from django.utils import timezone


def add_fields_if_not_exists(apps, schema_editor):
    """Add datetime fields only if they don't exist"""
    from django.db import connection
    
    with connection.cursor() as cursor:
        # Check if created_at column exists
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = 'core_room' AND column_name = 'created_at';
        """)
        
        created_at_exists = cursor.fetchone()[0] > 0
        
        # Check if updated_at column exists
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = 'core_room' AND column_name = 'updated_at';
        """)
        
        updated_at_exists = cursor.fetchone()[0] > 0
        
        # Add columns only if they don't exist
        if not created_at_exists:
            cursor.execute("""
                ALTER TABLE core_room 
                ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
            """)
            
        if not updated_at_exists:
            cursor.execute("""
                ALTER TABLE core_room 
                ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
            """)


def reverse_add_fields(apps, schema_editor):
    """Remove the datetime fields"""
    from django.db import connection
    
    with connection.cursor() as cursor:
        try:
            cursor.execute("ALTER TABLE core_room DROP COLUMN IF EXISTS created_at;")
            cursor.execute("ALTER TABLE core_room DROP COLUMN IF EXISTS updated_at;")
        except Exception:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            add_fields_if_not_exists,
            reverse_add_fields,
        ),
    ]
