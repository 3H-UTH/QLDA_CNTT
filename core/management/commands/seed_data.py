# Place this file at: core/management/commands/seed_data.py
# Make sure these folders exist with __init__.py files:
# core/
#   management/
#     __init__.py
#     commands/
#       __init__.py
#       seed_data.py   <-- this file

from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone

from core.models import Building, Room


class Command(BaseCommand):
    help = "Seed initial data: users, building, rooms. Use --fresh to wipe relevant tables first."

    def add_arguments(self, parser):
        parser.add_argument(
            "--fresh",
            action="store_true",
            help="Delete existing seedable data before seeding",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()

        if options.get("fresh"):
            self.stdout.write(self.style.WARNING("[fresh] Deleting Rooms & Buildings..."))
            Room.objects.all().delete()
            Building.objects.all().delete()
            # Do not delete users by default; uncomment if desired
            # User.objects.exclude(is_superuser=True).delete()

        # --- Users ---
        owner_email = "owner@example.com"
        tenant_email = "tenant@example.com"
        tech_email = "tech@example.com"
        admin_email = "admin@example.com"

        owner, _ = User.objects.get_or_create(
            email=owner_email,
            defaults={
                "username": owner_email,  # in case username is required
                "full_name": "Chủ Trọ Demo",
                "role": getattr(User, "OWNER", "OWNER"),
            },
        )
        if not owner.has_usable_password():
            owner.set_password("Owner12345!")
            owner.save(update_fields=["password"])

        tenant, _ = User.objects.get_or_create(
            email=tenant_email,
            defaults={
                "username": tenant_email,
                "full_name": "Người Thuê Demo",
                "role": getattr(User, "TENANT", "TENANT"),
            },
        )
        if not tenant.has_usable_password():
            tenant.set_password("Tenant12345!")
            tenant.save(update_fields=["password"])

        tech, _ = User.objects.get_or_create(
            email=tech_email,
            defaults={
                "username": tech_email,
                "full_name": "Kỹ Thuật Demo",
                "role": getattr(User, "TECH", "TECH"),
            },
        )
        if not tech.has_usable_password():
            tech.set_password("Tech12345!")
            tech.save(update_fields=["password"])

        admin, created_admin = User.objects.get_or_create(
            email=admin_email,
            defaults={
                "username": admin_email,
                "full_name": "Quản trị viên",
                "role": getattr(User, "OWNER", "OWNER"),
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created_admin:
            admin.set_password("Admin12345!")
            admin.save()
        elif not admin.is_superuser:
            admin.is_superuser = True
            admin.is_staff = True
            admin.save(update_fields=["is_superuser", "is_staff"]) 

        # --- Building & Rooms ---
        b1, _ = Building.objects.get_or_create(
            name="Khu A",
            defaults={"address": "123 Đ. ABC, Q.1, TP.HCM"},
        )

        Room.objects.get_or_create(
            building=b1, name="A101",
            defaults={"area_m2": 18, "base_price": 2500000, "status": getattr(Room, "EMPTY", "EMPTY")},
        )
        Room.objects.get_or_create(
            building=b1, name="A102",
            defaults={"area_m2": 20, "base_price": 2700000, "status": getattr(Room, "RENTED", "RENTED")},
        )
        Room.objects.get_or_create(
            building=b1, name="A103",
            defaults={"area_m2": 22, "base_price": 3000000, "status": getattr(Room, "MAINT", "MAINT")},
        )

        self.stdout.write(self.style.SUCCESS("Seed complete!"))
        self.stdout.write(self.style.SUCCESS("\nUsers created/ensured:"))
        self.stdout.write(f"  - admin@example.com / Admin12345! (is_superuser)")
        self.stdout.write(f"  - owner@example.com / Owner12345!")
        self.stdout.write(f"  - tenant@example.com / Tenant12345!")
        self.stdout.write(f"  - tech@example.com   / Tech12345!")
        self.stdout.write(self.style.SUCCESS("\nBuildings & Rooms created/ensured for 'Khu A'."))
        self.stdout.write("\nLogin admin: http://localhost:8000/admin/")
