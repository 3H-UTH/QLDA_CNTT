#!/usr/bin/env python
"""
Direct test using Django models
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

def test_signal_with_real_register():
    print("Testing signal with real register-like scenario...")
    
    # Xóa user test nếu tồn tại
    User.objects.filter(username='signaltest').delete()
    
    try:
        # Tạo user như trong RegisterSerializer.create()
        validated_data = {
            'username': 'signaltest',
            'email': 'signaltest@example.com',
            'full_name': 'Signal Test User',
            'role': User.TENANT
        }
        password = 'testpass123'
        
        # Tạo user (giống như trong RegisterSerializer.create)
        user = User(**validated_data)
        user.set_password(password)
        user.save()  # Signal sẽ được trigger ở đây
        
        print(f"✓ User created: {user.username} (ID: {user.id}, Role: {user.role})")
        
        # Kiểm tra tenant profile
        try:
            tenant = Tenant.objects.get(user=user)
            print(f"✓ Tenant profile found: {tenant} (ID: {tenant.id})")
            print("✅ SUCCESS: Signal automatically created tenant profile!")
            
            # Cleanup
            user.delete()
            print("✓ Test data cleaned up")
            return True
            
        except Tenant.DoesNotExist:
            print("❌ FAILED: No tenant profile created by signal")
            user.delete()
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    success = test_signal_with_real_register()
    print(f"\nResult: {'PASS' if success else 'FAIL'}")
