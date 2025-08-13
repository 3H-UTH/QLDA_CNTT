from django.db import models

class Building(models.Model):
    name = models.CharField(max_length=120)
    address = models.CharField(max_length=255)

class Room(models.Model):
    EMPTY = "EMPTY"; RENTED = "RENTED"; MAINT = "MAINT"
    STATUS_CHOICES = [(EMPTY,"EMPTY"), (RENTED,"RENTED"), (MAINT,"MAINT")]
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name="rooms")
    name = models.CharField(max_length=50)
    area_m2 = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    base_price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=EMPTY)


class Tenant(models.Model): 
    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="tenant_profile")
    id_number = models.CharField(max_length=50, blank=True, unique=True)

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
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name="readings")
    period = models.CharField(max_length=7)  # YYYY-MM
    elec_prev = models.IntegerField()
    elec_curr = models.IntegerField()
    water_prev = models.IntegerField()
    water_curr = models.IntegerField()
    elec_price = models.DecimalField(max_digits=12, decimal_places=2, default=3500)
    water_price = models.DecimalField(max_digits=12, decimal_places=2, default=7000)

    class Meta:
        unique_together = ("contract","period")
