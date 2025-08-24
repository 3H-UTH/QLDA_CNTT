import requests
import json

# Base URL của API
BASE_URL = 'https://qlda-cntt.onrender.com/api'

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
    print('🏠 Bắt đầu tạo phòng qua API...')
    
    # Đăng nhập với landlord1 để tạo phòng
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

    print('\n🎉 Hoàn thành tạo phòng qua API!')
    print('\nDữ liệu đã được tạo:')
    print('🏠 5 phòng trọ cho 2 landlord')
    print('👥 6 users (1 admin, 2 landlord, 3 tenant)')
    print('\nBạn có thể đăng nhập vào website để xem dữ liệu và tạo thêm hợp đồng!')

if __name__ == '__main__':
    main()
