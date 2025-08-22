from django.db import models
from django.utils import timezone
from django.conf import settings



class Room(models.Model):
    EMPTY = "EMPTY"; RENTED = "RENTED"; MAINT = "MAINT"
    STATUS_CHOICES = [(EMPTY,"EMPTY"), (RENTED,"RENTED"), (MAINT,"MAINT")]
    
    name = models.CharField(max_length=50)
    area_m2 = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    base_price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=EMPTY)
    
    # Thêm các trường mới
    bedrooms = models.PositiveIntegerField(default=1, help_text="Số phòng ngủ")
    bathrooms = models.PositiveIntegerField(default=1, help_text="Số phòng tắm")
    address = models.CharField(max_length=255, blank=True, default='', help_text="Địa chỉ phòng")
    detail = models.TextField(blank=True, default='', help_text="Mô tả chi tiết về phòng")
    image = models.ImageField(upload_to='rooms/', blank=True, null=True, help_text="Hình ảnh phòng")
    
    # Metadata với default values
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.base_price}đ"

    class Meta:
        ordering = ['name']



class Tenant(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tenant_profile")
    id_number = models.CharField("CCCD/CMND", max_length=50, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    emergency_contact = models.CharField("Người liên hệ khẩn cấp", max_length=255, blank=True)
    
    # Thêm các trường thông tin bổ sung
    occupation = models.CharField("Nghề nghiệp", max_length=100, blank=True)
    workplace = models.CharField("Nơi làm việc", max_length=255, blank=True)
    emergency_phone = models.CharField("SĐT người liên hệ khẩn cấp", max_length=20, blank=True)
    emergency_relationship = models.CharField("Mối quan hệ với người liên hệ", max_length=50, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.full_name or self.user.email


class Contract(models.Model):
    ACTIVE = "ACTIVE"; ENDED = "ENDED"; SUSPENDED = "SUSPENDED"
    STATUS = [(ACTIVE,"ACTIVE"),(ENDED,"ENDED"),(SUSPENDED,"SUSPENDED")]

    room = models.ForeignKey("core.Room", on_delete=models.PROTECT, related_name="contracts")
    tenant = models.ForeignKey("core.Tenant", on_delete=models.PROTECT, related_name="contracts")
    start_date = models.DateField()
    end_date   = models.DateField(blank=True, null=True)
    deposit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    billing_cycle = models.CharField(max_length=10, default="MONTHLY")
    status = models.CharField(max_length=10, choices=STATUS, default=ACTIVE)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["room"], condition=models.Q(status="ACTIVE"),
                name="uniq_active_contract_per_room"
            )
        ]

class MeterReading(models.Model):
    contract = models.ForeignKey("core.Contract", on_delete=models.CASCADE, related_name="readings")
    period = models.CharField(max_length=7)  # "YYYY-MM"
    elec_prev = models.IntegerField()
    elec_curr = models.IntegerField()
    water_prev = models.IntegerField()
    water_curr = models.IntegerField()
    elec_price = models.DecimalField(max_digits=12, decimal_places=2, default=3500)
    water_price = models.DecimalField(max_digits=12, decimal_places=2, default=7000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("contract", "period")  # mỗi hợp đồng–kỳ chỉ 1 bản ghi

    def __str__(self):
        return f"{self.contract_id} - {self.period}"


class Invoice(models.Model):
    UNPAID = "UNPAID"
    PAID = "PAID" 
    OVERDUE = "OVERDUE"
    STATUS_CHOICES = [
        (UNPAID, "UNPAID"),
        (PAID, "PAID"),
        (OVERDUE, "OVERDUE")
    ]
    
    contract = models.ForeignKey("core.Contract", on_delete=models.CASCADE, related_name="invoices")
    period = models.CharField(max_length=7, help_text="Kỳ thanh toán (YYYY-MM)")
    room_price = models.DecimalField(max_digits=12, decimal_places=2, help_text="Tiền phòng")
    elec_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Tiền điện")
    water_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Tiền nước")
    service_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Phí dịch vụ")
    total = models.DecimalField(max_digits=12, decimal_places=2, help_text="Tổng tiền")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=UNPAID)
    issued_at = models.DateTimeField(default=timezone.now, help_text="Ngày phát hành")
    due_date = models.DateField(help_text="Ngày đến hạn thanh toán")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("contract", "period")  # mỗi hợp đồng–kỳ chỉ 1 hóa đơn
        ordering = ["-issued_at"]

    def save(self, *args, **kwargs):
        # Tự động tính tổng tiền khi lưu
        self.total = self.room_price + self.elec_cost + self.water_cost + self.service_cost
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invoice {self.id} - {self.contract} - {self.period} - {self.total}đ"
