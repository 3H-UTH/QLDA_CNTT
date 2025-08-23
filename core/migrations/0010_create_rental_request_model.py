from django.db import migrations, models
import django.utils.timezone
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0009_contract_notes_alter_contract_start_date_and_more'),
    ]

    operations = [
        # Đầu tiên, tạo bảng RentalRequest mới
        migrations.CreateModel(
            name='RentalRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notes', models.TextField(blank=True, default='', help_text='Lời nhắn từ tenant khi gửi yêu cầu xem nhà')),
                ('status', models.CharField(choices=[('PENDING', 'PENDING'), ('ACCEPTED', 'ACCEPTED'), ('DECLINED', 'DECLINED'), ('CANCELED', 'CANCELED')], default='PENDING', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Thời điểm gửi yêu cầu')),
                ('viewing_time', models.DateTimeField(help_text='Thời gian đề xuất xem nhà')),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('room', models.ForeignKey(on_delete=models.deletion.PROTECT, related_name='rental_requests', to='core.room')),
                ('tenant', models.ForeignKey(limit_choices_to={'role': 'TENANT'}, on_delete=models.deletion.PROTECT, related_name='rental_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        
        # Thêm trường nullable rental_request vào Contract
        migrations.AddField(
            model_name='contract',
            name='rental_request',
            field=models.OneToOneField(blank=True, help_text='Yêu cầu xem nhà dẫn đến hợp đồng này', null=True, on_delete=models.deletion.SET_NULL, related_name='resulting_contract', to='core.rentalrequest'),
        ),
        
        # Thay đổi các enum status của Contract 
        migrations.AlterField(
            model_name='contract',
            name='status',
            field=models.CharField(choices=[('ACTIVE', 'ACTIVE'), ('ENDED', 'ENDED'), ('SUSPENDED', 'SUSPENDED')], default='ACTIVE', max_length=10),
        ),
        
        # Add created_at field
        migrations.AddField(
            model_name='contract',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now, help_text='Thời điểm tạo hợp đồng'),
        ),
    ]
