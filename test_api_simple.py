import requests
import json

# Test API register
url = "http://127.0.0.1:8000/api/auth/register/"

data = {
    "username": "apitest999",
    "email": "apitest999@example.com", 
    "password": "testpass123",
    "password_confirm": "testpass123",
    "full_name": "API Test User 999",
    "role": "TENANT"
}

try:
    print("Testing register API...")
    response = requests.post(url, json=data)
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        print("✅ Register API successful!")
        response_data = response.json()
        user_id = response_data.get('user', {}).get('id')
        if user_id:
            # Test get tenant profile
            tenant_url = f"http://127.0.0.1:8000/api/tenants/{user_id}/"
            # Get access token from response
            access_token = response_data.get('access')
            if access_token:
                headers = {'Authorization': f'Bearer {access_token}'}
                tenant_response = requests.get(tenant_url, headers=headers)
                print(f"\nTenant profile check - Status: {tenant_response.status_code}")
                if tenant_response.status_code == 200:
                    print("✅ Tenant profile auto-created and accessible!")
                    print(f"Tenant data: {tenant_response.text}")
                else:
                    print(f"❌ Error getting tenant profile: {tenant_response.text}")
            else:
                print("No access token in response")
    else:
        print(f"❌ Register failed: {response.text}")
        
except Exception as e:
    print(f"Error: {e}")
