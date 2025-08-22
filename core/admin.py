from django.contrib import admin
from .models import Room, Contract, MeterReading, Invoice


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'base_price', 'status', 'area_m2', 'bedrooms', 'bathrooms']
    list_filter = ['status', 'bedrooms', 'bathrooms']
    search_fields = ['name', 'address']
    ordering = ['name']


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ['id', 'room', 'tenant', 'start_date', 'end_date', 'status', 'deposit']
    list_filter = ['status', 'billing_cycle', 'start_date']
    search_fields = ['room__name', 'tenant__full_name']
    ordering = ['-start_date']


@admin.register(MeterReading)
class MeterReadingAdmin(admin.ModelAdmin):
    list_display = ['contract', 'period', 'elec_prev', 'elec_curr', 'water_prev', 'water_curr', 'created_at']
    list_filter = ['period', 'created_at']
    search_fields = ['contract__room__name', 'period']
    ordering = ['-created_at']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'contract', 'period', 'total', 'status', 'issued_at', 'due_date']
    list_filter = ['status', 'issued_at', 'due_date']
    search_fields = ['contract__room__name', 'contract__tenant__user__full_name', 'period']
    ordering = ['-issued_at']
    readonly_fields = ['total', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('contract', 'period', 'status')
        }),
        ('Costs', {
            'fields': ('room_price', 'elec_cost', 'water_cost', 'service_cost', 'total')
        }),
        ('Dates', {
            'fields': ('issued_at', 'due_date', 'created_at', 'updated_at')
        }),
    )
