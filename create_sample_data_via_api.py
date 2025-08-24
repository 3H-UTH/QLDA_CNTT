import requests
import json

# Base URL của API
BASE_URL = 'https://qlda-cntt.onrender.com/api'

def register_user(username, email, password, full_name, role='TENANT', **extra_fields):
    """Đăng ký user qua API"""
    url = f'{BASE_URL}/auth/register/'
    data = {
        'username': username,
        'email': email,
        'password': password,
        'password_confirm': password,  # Thêm password_confirm
        'full_name': full_name,
        'role': role,
        **extra_fields
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 201:
            print(f'✓ Tạo thành công user: {username}')
            return response.json()
        else:
            print(f'❌ Lỗi tạo user {username}: {response.status_code}')
            print(f'   Response: {response.text}')
            return None
    except Exception as e:
        print(f'❌ Lỗi kết nối khi tạo user {username}: {e}')
        return None

def login_user(username, password):
    """Đăng nhập để lấy token"""
    url = f'{BASE_URL}/auth/login/'
    data = {
        'username': username,
        'password': password
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            result = response.json()
            print(f'✓ Đăng nhập thành công: {username}')
            return result.get('access')
        else:
            print(f'❌ Lỗi đăng nhập {username}: {response.status_code}')
            return None
    except Exception as e:
        print(f'❌ Lỗi kết nối khi đăng nhập {username}: {e}')
        return None

def create_room(token, room_data):
    """Tạo phòng qua API"""
    url = f'{BASE_URL}/rooms/'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, json=room_data, headers=headers)
        if response.status_code == 201:
            print(f'✓ Tạo thành công phòng: {room_data["name"]}')
            return response.json()
        else:
            print(f'❌ Lỗi tạo phòng {room_data["name"]}: {response.status_code}')
            print(f'   Response: {response.text}')
            return None
    except Exception as e:
        print(f'❌ Lỗi kết nối khi tạo phòng {room_data["name"]}: {e}')
        return None

def main():
    print('🚀 Bắt đầu tạo dữ liệu mẫu qua API...')
    
    # Tạo admin user
    admin_data = register_user(
        username='admin',
        email='admin@3hrental.com',
        password='AdminSecure123!',
        full_name='Admin System',
        role='OWNER'  # Sử dụng OWNER thay vì ADMIN
    )
    
    # Tạo landlord users
    landlord1_data = register_user(
        username='landlord1',
        email='landlord1@3hrental.com',
        password='LandlordSecure123!',
        full_name='Nguyễn Văn A',
        role='OWNER',  # Sử dụng OWNER thay vì LANDLORD
        phone='0901234567'
    )
    
    landlord2_data = register_user(
        username='landlord2',
        email='landlord2@3hrental.com',
        password='LandlordSecure456!',
        full_name='Trần Thị B',
        role='OWNER',  # Sử dụng OWNER thay vì LANDLORD
        phone='0902345678'
    )
    # Tạo tenant users
    tenant1_data = register_user(
        username='tenant1',
        email='tenant1@gmail.com',
        password='TenantSecure123!',
        full_name='Lê Văn C',
        role='TENANT',
        phone='0903456789',
        id_number='123456789',
        address='123 Đường ABC, Quận 1, TP.HCM',
        occupation='Nhân viên văn phòng',
        workplace='Công ty XYZ'
    )
    
    tenant2_data = register_user(
        username='tenant2',
        email='tenant2@gmail.com',
        password='TenantSecure456!',
        full_name='Phạm Thị D',
        role='TENANT',
        phone='0904567890',
        id_number='987654321',
        address='456 Đường DEF, Quận 2, TP.HCM',
        occupation='Sinh viên',
        workplace='Đại học ABC'
    )
    
    tenant3_data = register_user(
        username='tenant3',
        email='tenant3@gmail.com',
        password='TenantSecure789!',
        full_name='Hoàng Văn E',
        role='TENANT',
        phone='0905678901',
        id_number='456789123',
        address='789 Đường GHI, Quận 3, TP.HCM',
        occupation='Kỹ sư',
        workplace='Công ty DEF'
    )
    
    # Đăng nhập với landlord1 để tạo phòng
    if landlord1_data:
        landlord1_token = login_user('landlord1', 'LandlordSecure123!')
        if landlord1_token:
            # Tạo phòng cho landlord1
            rooms_landlord1 = [
                {
                    'name': 'Phòng A101',
                    'detail': 'Phòng trọ đầy đủ tiện nghi, điều hòa, tủ lạnh, máy giặt',
                    'address': '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
                    'base_price': '3500000',
                    'area_m2': 25.0,
                    'status': 'EMPTY',
                    'owner_name': 'Nguyễn Văn A',
                    'owner_phone': '0901234567',
                    'owner_email': 'landlord1@3hrental.com'
                },
                {
                    'name': 'Phòng A102',
                    'detail': 'Phòng trọ sạch sẽ, an ninh tốt, gần trường học',
                    'address': '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
                    'base_price': '3200000',
                    'area_m2': 22.0,
                    'status': 'EMPTY',
                    'owner_name': 'Nguyễn Văn A',
                    'owner_phone': '0901234567',
                    'owner_email': 'landlord1@3hrental.com'
                },
                {
                    'name': 'Phòng C301',
                    'detail': 'Phòng trọ cao cấp, ban công rộng, thoáng mát',
                    'address': '789 Võ Văn Tần, Quận 3, TP.HCM',
                    'base_price': '5000000',
                    'area_m2': 35.0,
                    'status': 'EMPTY',
                    'owner_name': 'Nguyễn Văn A',
                    'owner_phone': '0901234567',
                    'owner_email': 'landlord1@3hrental.com'
                }
            ]
            
            for room_data in rooms_landlord1:
                create_room(landlord1_token, room_data)
    
    # Đăng nhập với landlord2 để tạo phòng
    if landlord2_data:
        landlord2_token = login_user('landlord2', 'LandlordSecure456!')
        if landlord2_token:
            # Tạo phòng cho landlord2
            rooms_landlord2 = [
                {
                    'name': 'Phòng B201',
                    'detail': 'Phòng studio cao cấp, view đẹp, đầy đủ nội thất',
                    'address': '456 Lê Văn Việt, Quận 9, TP.HCM',
                    'base_price': '4500000',
                    'area_m2': 30.0,
                    'status': 'EMPTY',
                    'owner_name': 'Trần Thị B',
                    'owner_phone': '0902345678',
                    'owner_email': 'landlord2@3hrental.com'
                },
                {
                    'name': 'Phòng B202',
                    'detail': 'Phòng trọ bình dân, giá rẻ, gần chợ và bến xe',
                    'address': '456 Lê Văn Việt, Quận 9, TP.HCM',
                    'base_price': '2800000',
                    'area_m2': 18.0,
                    'status': 'MAINT',
                    'owner_name': 'Trần Thị B',
                    'owner_phone': '0902345678',
                    'owner_email': 'landlord2@3hrental.com'
                }
            ]
            
            for room_data in rooms_landlord2:
                create_room(landlord2_token, room_data)
    
    print('\n🎉 Hoàn thành tạo dữ liệu mẫu qua API!')
    print('\nThông tin đăng nhập:')
    print('👤 Admin: admin / AdminSecure123!')
    print('🏠 Landlord: landlord1 / LandlordSecure123!')
    print('🏠 Landlord: landlord2 / LandlordSecure456!') 
    print('👥 Tenant: tenant1 / TenantSecure123!')
    print('👥 Tenant: tenant2 / TenantSecure456!')
    print('👥 Tenant: tenant3 / TenantSecure789!')
    print('\nBạn có thể đăng nhập vào website để tạo thêm hợp đồng và hóa đơn!')

if __name__ == '__main__':
    main()
