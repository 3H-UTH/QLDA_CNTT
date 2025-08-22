from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class User(AbstractUser):
    OWNER = "OWNER"
    TENANT = "TENANT"
    TECH = "TECH"
    ROLE_CHOICES = [(OWNER,"OWNER"), (TENANT,"TENANT"), (TECH,"TECH")]

    full_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=TENANT)

    # email duy nhất (tiện cho login bằng email)
    email = models.EmailField(unique=True)

    # username vẫn giữ (AbstractUser yêu cầu), chỉ set = email khi username trống
    def save(self, *args, **kwargs):
        # Chỉ set username = email nếu username thực sự trống
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)


@receiver(post_save, sender=User)
def create_tenant_profile(sender, instance, created, **kwargs):
    """Tự động tạo Tenant profile khi User mới có role TENANT được tạo"""
    if created and instance.role == User.TENANT:
        from core.models import Tenant
        Tenant.objects.create(user=instance)
