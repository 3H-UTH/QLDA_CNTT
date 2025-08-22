from rest_framework import serializers
from .models import Room, Contract, MeterReading
from drf_spectacular.utils import extend_schema_field
from decimal import Decimal

class RoomSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Room
        fields = "__all__"
        
    def validate_bedrooms(self, value):
        if value < 1:
            raise serializers.ValidationError("Số phòng ngủ phải ít nhất là 1")
        return value
        
    def validate_bathrooms(self, value):
        if value < 1:
            raise serializers.ValidationError("Số phòng tắm phải ít nhất là 1")
        return value
        
    def validate_base_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Giá thuê phải lớn hơn 0")
        return value

class ContractCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contract
        fields = ["id","room","tenant","start_date","end_date","deposit","billing_cycle","status"]
        read_only_fields = ["status"]

    def validate(self, attrs):
        room: Room = attrs["room"]
        if room.status != getattr(Room, "EMPTY", "EMPTY"):
            raise serializers.ValidationError("Room is not empty")
        return attrs    
    def create(self, validated_data):
        contract = super().create(validated_data)
        # cập nhật trạng thái phòng -> RENTED
        room = contract.room
        room.status = getattr(Room, "RENTED", "RENTED")
        room.save(update_fields=["status"])
        return contract
    
class ContractSerializer(serializers.ModelSerializer):
    tenant_name  = serializers.CharField(source="tenant.user.full_name", read_only=True)
    tenant_phone = serializers.CharField(source="tenant.phone", read_only=True)
    tenant_email = serializers.EmailField(source="tenant.user.email", read_only=True)
    class Meta:
        model = Contract
        fields = ["id","room","tenant","tenant_name","tenant_phone","tenant_email","start_date","end_date","deposit","billing_cycle","status"]



class MeterReadingSerializer(serializers.ModelSerializer):
    kwh = serializers.SerializerMethodField(read_only=True)
    m3  = serializers.SerializerMethodField(read_only=True)
    elec_cost  = serializers.SerializerMethodField(read_only=True)
    water_cost = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MeterReading
        fields = [
            "id","contract","period",
            "elec_prev","elec_curr","water_prev","water_curr",
            "elec_price","water_price",
            "kwh","m3","elec_cost","water_cost","created_at"
        ]

    def validate(self, attrs):
        if attrs["elec_curr"] < attrs["elec_prev"]:
            raise serializers.ValidationError({"elec_curr":"Chỉ số điện mới không được nhỏ hơn chỉ số cũ."})
        if attrs["water_curr"] < attrs["water_prev"]:
            raise serializers.ValidationError({"water_curr":"Chỉ số nước mới không được nhỏ hơn chỉ số cũ."})
        # kỳ phải kiểu YYYY-MM
        period = attrs["period"]
        if len(period) != 7 or period[4] != "-" or not (period[:4].isdigit() and period[5:7].isdigit()):
            raise serializers.ValidationError({"period":"Định dạng phải là YYYY-MM (ví dụ 2025-08)."})
        return attrs

    @extend_schema_field(serializers.DecimalField(max_digits=10, decimal_places=2))
    def get_kwh(self, obj):  # sản lượng điện
        return obj.elec_curr - obj.elec_prev

    @extend_schema_field(serializers.DecimalField(max_digits=10, decimal_places=2))
    def get_m3(self, obj):   # sản lượng nước
        return obj.water_curr - obj.water_prev

    @extend_schema_field(serializers.DecimalField(max_digits=10, decimal_places=2))
    def get_elec_cost(self, obj):
        return (obj.elec_curr - obj.elec_prev) * obj.elec_price

    @extend_schema_field(serializers.DecimalField(max_digits=10, decimal_places=2))
    def get_water_cost(self, obj):
        return (obj.water_curr - obj.water_prev) * obj.water_price
    
    def validate(self, attrs):
        attrs = super().validate(attrs)
        contract = attrs["contract"]
        if contract.status != Contract.ACTIVE:
            raise serializers.ValidationError({"contract":"Hợp đồng không ở trạng thái ACTIVE."})
        return attrs