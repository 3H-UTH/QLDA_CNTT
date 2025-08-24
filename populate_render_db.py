import os
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent.parent
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rental.settings')

# Configure Django for production database
os.environ['DATABASE_URL'] = 'postgresql://qlda_cntt_user:h7fXXiWBBOPhF3sFO7fXiKvKdxFk9t4F@dpg-d211263ipnbc38cq9sg-a.singapore-postgres.render.com/qlda_cntt?sslmode=require'

django.setup()

from django.contrib.auth import get_user_model
from core.models import Room, Contract, Invoice, Payment
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

def create_sample_data():
    print('🚀 Bắt đầu tạo dữ liệu mẫu trên database Render...')
    
    # Tạo user admin
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@3hrental.com',
            'first_name': 'Admin',
            'last_name': 'System',
            'role': 'ADMIN',
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f'✓ Tạo admin user: {admin_user.username}')
    else:
        print(f'Admin user đã tồn tại: {admin_user.username}')

    # Tạo landlord users
    landlords_data = [
        {
            'username': 'landlord1',
            'email': 'landlord1@3hrental.com',
            'first_name': 'Nguyễn',
            'last_name': 'Văn A',
            'phone': '0901234567',
            'role': 'LANDLORD'
        },
        {
            'username': 'landlord2',
            'email': 'landlord2@3hrental.com',
            'first_name': 'Trần',
            'last_name': 'Thị B',
            'phone': '0902345678',
            'role': 'LANDLORD'
        }
    ]
    
    landlords = []
    for data in landlords_data:
        user, created = User.objects.get_or_create(
            username=data['username'],
            defaults=data
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f'✓ Tạo landlord: {user.username}')
        landlords.append(user)

    # Tạo tenant users
    tenants_data = [
        {
            'username': 'tenant1',
            'email': 'tenant1@gmail.com',
            'first_name': 'Lê',
            'last_name': 'Văn C',
            'phone': '0903456789',
            'role': 'TENANT',
            'id_number': '123456789',
            'address': '123 Đường ABC, Quận 1, TP.HCM',
            'occupation': 'Nhân viên văn phòng',
            'workplace': 'Công ty XYZ'
        },
        {
            'username': 'tenant2',
            'email': 'tenant2@gmail.com',
            'first_name': 'Phạm',
            'last_name': 'Thị D',
            'phone': '0904567890',
            'role': 'TENANT',
            'id_number': '987654321',
            'address': '456 Đường DEF, Quận 2, TP.HCM',
            'occupation': 'Sinh viên',
            'workplace': 'Đại học ABC'
        },
        {
            'username': 'tenant3',
            'email': 'tenant3@gmail.com',
            'first_name': 'Hoàng',
            'last_name': 'Văn E',
            'phone': '0905678901',
            'role': 'TENANT',
            'id_number': '456789123',
            'address': '789 Đường GHI, Quận 3, TP.HCM',
            'occupation': 'Kỹ sư',
            'workplace': 'Công ty DEF'
        }
    ]
    
    tenants = []
    for data in tenants_data:
        user, created = User.objects.get_or_create(
            username=data['username'],
            defaults=data
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f'✓ Tạo tenant: {user.username}')
        tenants.append(user)

    # Tạo rooms
    rooms_data = [
        {
            'name': 'Phòng A101',
            'description': 'Phòng trọ đầy đủ tiện nghi, điều hòa, tủ lạnh, máy giặt',
            'address': '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
            'price': Decimal('3500000'),
            'area': 25.0,
            'landlord': landlords[0],
            'status': 'RENTED',
            'owner_name': 'Nguyễn Văn A',
            'owner_phone': '0901234567',
            'owner_email': 'landlord1@3hrental.com'
        },
        {
            'name': 'Phòng A102',
            'description': 'Phòng trọ sạch sẽ, an ninh tốt, gần trường học',
            'address': '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
            'price': Decimal('3200000'),
            'area': 22.0,
            'landlord': landlords[0],
            'status': 'AVAILABLE',
            'owner_name': 'Nguyễn Văn A',
            'owner_phone': '0901234567',
            'owner_email': 'landlord1@3hrental.com'
        },
        {
            'name': 'Phòng B201',
            'description': 'Phòng studio cao cấp, view đẹp, đầy đủ nội thất',
            'address': '456 Lê Văn Việt, Quận 9, TP.HCM',
            'price': Decimal('4500000'),
            'area': 30.0,
            'landlord': landlords[1],
            'status': 'RENTED',
            'owner_name': 'Trần Thị B',
            'owner_phone': '0902345678',
            'owner_email': 'landlord2@3hrental.com'
        },
        {
            'name': 'Phòng B202',
            'description': 'Phòng trọ bình dân, giá rẻ, gần chợ và bến xe',
            'address': '456 Lê Văn Việt, Quận 9, TP.HCM',
            'price': Decimal('2800000'),
            'area': 18.0,
            'landlord': landlords[1],
            'status': 'MAINTENANCE',
            'owner_name': 'Trần Thị B',
            'owner_phone': '0902345678',
            'owner_email': 'landlord2@3hrental.com'
        },
        {
            'name': 'Phòng C301',
            'description': 'Phòng trọ cao cấp, ban công rộng, thoáng mát',
            'address': '789 Võ Văn Tần, Quận 3, TP.HCM',
            'price': Decimal('5000000'),
            'area': 35.0,
            'landlord': landlords[0],
            'status': 'AVAILABLE',
            'owner_name': 'Nguyễn Văn A',
            'owner_phone': '0901234567',
            'owner_email': 'landlord1@3hrental.com'
        }
    ]
    
    rooms = []
    for data in rooms_data:
        room, created = Room.objects.get_or_create(
            name=data['name'],
            defaults=data
        )
        if created:
            print(f'✓ Tạo phòng: {room.name}')
        rooms.append(room)

    # Tạo contracts cho rooms đang được thuê
    rented_rooms = [room for room in rooms if room.status == 'RENTED']
    if len(rented_rooms) >= 2 and len(tenants) >= 2:
        contracts_data = [
            {
                'room': rented_rooms[0],
                'tenant': tenants[0],
                'start_date': timezone.now().date() - timedelta(days=90),
                'end_date': timezone.now().date() + timedelta(days=275),
                'monthly_rent': rented_rooms[0].price,
                'status': 'ACTIVE',
                'notes': 'Hợp đồng thuê phòng A101, đã đóng tiền cọc 1 tháng'
            },
            {
                'room': rented_rooms[1],
                'tenant': tenants[1],
                'start_date': timezone.now().date() - timedelta(days=60),
                'end_date': timezone.now().date() + timedelta(days=305),
                'monthly_rent': rented_rooms[1].price,
                'status': 'ACTIVE',
                'notes': 'Hợp đồng thuê phòng B201, gia hạn từ hợp đồng cũ'
            }
        ]
        
        contracts = []
        for data in contracts_data:
            contract, created = Contract.objects.get_or_create(
                room=data['room'],
                tenant=data['tenant'],
                defaults=data
            )
            if created:
                print(f'✓ Tạo hợp đồng: {contract.room.name} - {contract.tenant.get_full_name()}')
            contracts.append(contract)

        # Tạo invoices
        for contract in contracts:
            # Tạo 3 hóa đơn: 2 tháng trước (đã thanh toán), 1 tháng trước (đã thanh toán), tháng hiện tại (chưa thanh toán)
            for i in range(3):
                month_offset = 2 - i  # 2, 1, 0 (tháng trước -> tháng hiện tại)
                invoice_date = timezone.now().date().replace(day=1) - timedelta(days=month_offset * 30)
                due_date = invoice_date + timedelta(days=30)
                
                invoice, created = Invoice.objects.get_or_create(
                    contract=contract,
                    invoice_date=invoice_date,
                    defaults={
                        'due_date': due_date,
                        'room_rent': contract.monthly_rent,
                        'water_cost': Decimal('150000'),
                        'electricity_cost': Decimal('200000'),
                        'other_fees': Decimal('50000') if i == 0 else Decimal('0'),
                        'total_amount': contract.monthly_rent + Decimal('150000') + Decimal('200000') + (Decimal('50000') if i == 0 else Decimal('0')),
                        'status': 'PAID' if i < 2 else 'PENDING',
                        'notes': f'Hóa đơn tháng {invoice_date.month}/{invoice_date.year}'
                    }
                )
                
                if created:
                    print(f'✓ Tạo hóa đơn: {contract.room.name} - {invoice_date.month}/{invoice_date.year}')
                    
                    # Tạo payment cho hóa đơn đã thanh toán
                    if invoice.status == 'PAID':
                        payment, payment_created = Payment.objects.get_or_create(
                            invoice=invoice,
                            defaults={
                                'amount': invoice.total_amount,
                                'payment_date': invoice_date + timedelta(days=5),
                                'payment_method': 'CASH' if i % 2 == 0 else 'BANK_TRANSFER',
                                'notes': f'Thanh toán hóa đơn tháng {invoice_date.month}/{invoice_date.year}'
                            }
                        )
                        if payment_created:
                            print(f'✓ Tạo thanh toán: {payment.amount:,}đ cho hóa đơn {invoice_date.month}/{invoice_date.year}')

    print('\n🎉 Hoàn thành tạo dữ liệu mẫu trên database Render!')
    print('\nThông tin đăng nhập:')
    print('👤 Admin: admin / admin123')
    print('🏠 Landlord: landlord1 / password123')
    print('🏠 Landlord: landlord2 / password123')
    print('👥 Tenant: tenant1 / password123')
    print('👥 Tenant: tenant2 / password123')
    print('👥 Tenant: tenant3 / password123')

if __name__ == '__main__':
    try:
        create_sample_data()
    except Exception as e:
        print(f'❌ Lỗi: {e}')
        import traceback
        traceback.print_exc()
