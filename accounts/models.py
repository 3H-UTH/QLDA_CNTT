from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    OWNER = "OWNER"
    TENANT = "TENANT"
    TECH = "TECH"
    ROLE_CHOICES = [(OWNER,"OWNER"), (TENANT,"TENANT"), (TECH,"TECH")]

    full_name = models.CharField(max_length=150, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=TENANT)

    # email duy nhất (tiện cho login bằng email)
    email = models.EmailField(unique=True)

    # username vẫn giữ (AbstractUser yêu cầu), nhưng bạn có thể set = email khi tạo
    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)
