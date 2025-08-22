from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    OWNER = "OWNER"
    TENANT = "TENANT"
    TECH = "TECH"
    ROLE_CHOICES = [(OWNER,"OWNER"), (TENANT,"TENANT"), (TECH,"TECH")]

    full_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=TENANT)

    # email duy nhất (tiện cho login bằng email)
    email = models.EmailField(unique=True)

    # Thông tin từ Tenant model (chỉ cho user có role TENANT)
    id_number = models.CharField("CCCD/CMND", max_length=50, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    emergency_contact = models.CharField("Người liên hệ khẩn cấp", max_length=255, blank=True)
    
    # Thông tin bổ sung
    occupation = models.CharField("Nghề nghiệp", max_length=100, blank=True)
    workplace = models.CharField("Nơi làm việc", max_length=255, blank=True)
    emergency_phone = models.CharField("SĐT người liên hệ khẩn cấp", max_length=20, blank=True)
    emergency_relationship = models.CharField("Mối quan hệ với người liên hệ", max_length=50, blank=True)

    # username vẫn giữ (AbstractUser yêu cầu), chỉ set = email khi username trống
    def save(self, *args, **kwargs):
        # Chỉ set username = email nếu username thực sự trống
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)
