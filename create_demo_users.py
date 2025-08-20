#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rental.settings')

django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_demo_users():
    # Create admin user
    if not User.objects.filter(email='admin@example.com').exists():
        admin_user = User.objects.create_user(
            username='admin_user',
            email='admin@example.com',
            password='Admin12345!',
            full_name='Administrator',
            role='OWNER'
        )
        print(f"Created admin user: {admin_user.email}")
    else:
        print("Admin user already exists")

    # Create tenant user
    if not User.objects.filter(email='huy@example.com').exists():
        tenant_user = User.objects.create_user(
            username='huy_nguyen',
            email='huy@example.com',
            password='Huy12345!',
            full_name='Nguyễn Văn Huy',
            role='TENANT'
        )
        print(f"Created tenant user: {tenant_user.email}")
    else:
        print("Tenant user already exists")

if __name__ == '__main__':
    create_demo_users()
    print("Demo users created successfully!")
