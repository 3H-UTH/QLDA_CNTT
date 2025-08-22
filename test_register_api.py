#!/usr/bin/env python
"""
Test script to test register API and check if tenant profile is auto-created
"""
import os
import sys
import django
import requests
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rental.settings')
django.setup()

from accounts.models import User
from core.models import Tenant
from django.test import Client

def test_register_api():
    print("Testing register API with auto tenant profile creation...")
    
    # Sử dụng Django test client
    client = Client()
    
    # Data để đăng ký
    register_data = {
        'username': 'apitestuser',
        'email': 'apitestuser@example.com',
        'password': 'testpass123',
        'password_confirm': 'testpass123',
        'full_name': 'API Test User',
        'role': 'TENANT'
    }
    
    try:
        # Xóa user test nếu đã tồn tại
        User.objects.filter(username='apitestuser').delete()
        
        # Gọi API register
        response = client.post('/api/auth/register/', 
                             data=json.dumps(register_data),
                             content_type='application/json')
        
        print(f"Register API response status: {response.status_code}")
        
        if response.status_code == 201:
            response_data = response.json()
            print(f"✓ User registered via API: {response_data['user']['username']}")
            user_id = response_data['user']['id']
            
            # Kiểm tra user trong database
            user = User.objects.get(id=user_id)
            print(f"✓ User found in DB: {user.username} (Role: {user.role})")
            
            # Kiểm tra tenant profile
            try:
                tenant = Tenant.objects.get(user=user)
                print(f"✓ Tenant profile auto-created via API: {tenant} (ID: {tenant.id})")
                print("✅ SUCCESS: Register API automatically creates tenant profile!")
                
                # Cleanup
                user.delete()
                print("✓ Test user cleaned up")
                return True
                
            except Tenant.DoesNotExist:
                print("❌ FAILED: Tenant profile was NOT created via API")
                user.delete()
                return False
        else:
            print(f"❌ Register API failed: {response.content.decode()}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    success = test_register_api()
    sys.exit(0 if success else 1)
