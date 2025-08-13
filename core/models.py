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
