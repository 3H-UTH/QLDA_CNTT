# Generated manually to handle column conflicts on production

from django.db import migrations, models
from django.utils import timezone


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        # Use RunSQL to safely add columns
        migrations.RunSQL(
            """
            ALTER TABLE core_room 
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
            """,
            reverse_sql="""
            ALTER TABLE core_room 
            DROP COLUMN IF EXISTS created_at;
            """
        ),
        migrations.RunSQL(
            """
            ALTER TABLE core_room 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
            """,
            reverse_sql="""
            ALTER TABLE core_room 
            DROP COLUMN IF EXISTS updated_at;
            """
        ),
    ]
