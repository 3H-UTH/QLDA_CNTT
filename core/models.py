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
    image = models.ImageField(upload_to='rooms/', blank=True, null=True, help_text="Hình ảnh chính của phòng")
    images = models.JSONField(default=list, blank=True, help_text="Danh sách tất cả hình ảnh của phòng (base64)")
    
    # Thông tin liên hệ chủ nhà
    owner_name = models.CharField(max_length=100, blank=True, default='', help_text="Tên chủ nhà")
    owner_phone = models.CharField(max_length=20, blank=True, default='', help_text="Số điện thoại chủ nhà")
    owner_email = models.EmailField(blank=True, default='', help_text="Email liên hệ chủ nhà")
    
    # Metadata với default values
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.base_price}đ"

    class Meta:
        ordering = ['name']



class Contract(models.Model):
    PENDING = "PENDING"; ACTIVE = "ACTIVE"; ENDED = "ENDED"; SUSPENDED = "SUSPENDED"
    STATUS = [(PENDING,"PENDING"),(ACTIVE,"ACTIVE"),(ENDED,"ENDED"),(SUSPENDED,"SUSPENDED")]

    room = models.ForeignKey("core.Room", on_delete=models.PROTECT, related_name="contracts")
    tenant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="contracts", limit_choices_to={'role': 'TENANT'})
    start_date = models.DateField(null=True, blank=True)
    end_date   = models.DateField(blank=True, null=True)
    deposit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    billing_cycle = models.CharField(max_length=10, default="MONTHLY")
    status = models.CharField(max_length=10, choices=STATUS, default=PENDING)
    notes = models.TextField(blank=True, default='', help_text="Ghi chú từ tenant khi gửi yêu cầu")

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

class Payment(models.Model):
    CASH = "CASH"
    BANK = "BANK"
    ONLINE = "ONLINE"
    METHODS = [(CASH, "Tiền mặt"), (BANK, "Chuyển khoản"), (ONLINE, "Online")]

    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    FAILED = "FAILED"
    STATUSES = [(PENDING, "Chờ xác nhận"), (CONFIRMED, "Đã xác nhận"), (FAILED, "Thất bại")]

    invoice = models.ForeignKey("core.Invoice", on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=10, choices=METHODS, default=BANK)
    status = models.CharField(max_length=10, choices=STATUSES, default=CONFIRMED)
    paid_at = models.DateTimeField(auto_now_add=True)
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-paid_at"]
