#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rental.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Room

User = get_user_model()

def create_test_data():
    # Create owner user if not exists
    owner, created = User.objects.get_or_create(
        username='owner1',
        defaults={
            'email': 'owner@test.com',
            'first_name': 'Chủ',
            'last_name': 'Trọ',
            'role': 'OWNER'
        }
    )
    
    if created:
        owner.set_password('password123')
        owner.save()
        print(f"Created owner user: {owner.username}")
    else:
        print(f"Owner user already exists: {owner.username}")
    
    # Create some test rooms
    rooms_data = [
        {
            'name': 'Phòng 101',
            'address': '123 Nguyễn Văn A, Q1, TP.HCM',
            'base_price': 3000000,
            'status': 'EMPTY',
            'detail': 'Phòng đơn có điều hòa, wifi miễn phí',
            'area_m2': 25.0,
            'bedrooms': 1,
            'bathrooms': 1
        },
        {
            'name': 'Phòng 102',
            'address': '123 Nguyễn Văn A, Q1, TP.HCM',
            'base_price': 3500000,
            'status': 'EMPTY',
            'detail': 'Phòng đôi có ban công, view đẹp',
            'area_m2': 30.0,
            'bedrooms': 1,
            'bathrooms': 1
        },
        {
            'name': 'Phòng 201',
            'address': '456 Trần Hưng Đạo, Q1, TP.HCM',
            'base_price': 4000000,
            'status': 'RENTED',
            'detail': 'Phòng cao cấp có bếp riêng',
            'area_m2': 35.0,
            'bedrooms': 2,
            'bathrooms': 1
        }
    ]
    
    for room_data in rooms_data:
        room, created = Room.objects.get_or_create(
            name=room_data['name'],
            defaults=room_data
        )
        
        if created:
            print(f"Created room: {room.name}")
        else:
            print(f"Room already exists: {room.name}")
    
    print("Test data creation completed!")

if __name__ == '__main__':
    create_test_data()
