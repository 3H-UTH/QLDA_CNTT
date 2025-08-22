#!/usr/bin/env python
"""
Test script to create a new tenant user and check if tenant profile is auto-created
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rental.settings')
django.setup()

from accounts.models import User
from core.models import Tenant

def test_create_tenant():
    print("Testing auto-creation of tenant profile...")
    
    # Tạo user mới với role TENANT
    try:
        # Xóa user test nếu đã tồn tại
        User.objects.filter(username='testuser123').delete()
        
        # Tạo user mới
        user = User.objects.create_user(
            username='testuser123',
            email='testuser123@example.com',
            password='testpass123',
            full_name='Test User',
            role=User.TENANT
        )
        print(f"✓ Created user: {user.username} (ID: {user.id}, Role: {user.role})")
        
        # Kiểm tra xem tenant profile có được tạo tự động không
        try:
            tenant = Tenant.objects.get(user=user)
            print(f"✓ Tenant profile auto-created: {tenant} (ID: {tenant.id})")
            print("✅ SUCCESS: Tenant profile was automatically created!")
            
            # Cleanup
            user.delete()
            print("✓ Test user cleaned up")
            
        except Tenant.DoesNotExist:
            print("❌ FAILED: Tenant profile was NOT created automatically")
            
            # Cleanup
            user.delete()
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_create_tenant()
    sys.exit(0 if success else 1)
