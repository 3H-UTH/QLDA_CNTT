#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rental.settings')
django.setup()

from django.db import connection

def add_contract_fields():
    """Add contract_image and monthly_rent fields to Contract table"""
    with connection.cursor() as cursor:
        try:
            # Add monthly_rent field
            cursor.execute("""
                ALTER TABLE core_contract 
                ADD COLUMN monthly_rent DECIMAL(12, 2) DEFAULT 0 NOT NULL
            """)
            print("✓ Added monthly_rent field")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("• monthly_rent field already exists")
            else:
                print(f"Error adding monthly_rent: {e}")
        
        try:
            # Add contract_image field  
            cursor.execute("""
                ALTER TABLE core_contract 
                ADD COLUMN contract_image VARCHAR(100) NULL
            """)
            print("✓ Added contract_image field")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("• contract_image field already exists")
            else:
                print(f"Error adding contract_image: {e}")
                
        try:
            # Add updated_at field if it doesn't exist
            cursor.execute("""
                ALTER TABLE core_contract 
                ADD COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
            """)
            print("✓ Added updated_at field")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("• updated_at field already exists")
            else:
                print(f"Error adding updated_at: {e}")
        
        # Show current table structure
        cursor.execute("DESCRIBE core_contract")
        columns = cursor.fetchall()
        print("\nCurrent core_contract table structure:")
        for col in columns:
            print(f"  {col[0]:<20} {col[1]:<15} {'NULL' if col[2] == 'YES' else 'NOT NULL':<8} {col[3] or ''}")

if __name__ == '__main__':
    add_contract_fields()
