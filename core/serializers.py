from rest_framework import serializers
from .models import Room, Contract, MeterReading, Invoice, Tenant
from drf_spectacular.utils import extend_schema_field
from decimal import Decimal

class RoomSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    additional_images = serializers.CharField(required=False, allow_blank=True, write_only=True)
    
    class Meta:
        model = Room
        fields = "__all__"
        extra_kwargs = {
            'images': {'read_only': True},  # images field chỉ đọc, sẽ được tạo từ additional_images
        }
        
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
    
    def create(self, validated_data):
        additional_images_json = validated_data.pop('additional_images', None)
        
        # Tạo room trước
        room = super().create(validated_data)
        
        # Xử lý nhiều ảnh
        self._process_images(room, additional_images_json)
        
        return room
    
    def update(self, instance, validated_data):
        additional_images_json = validated_data.pop('additional_images', None)
        
        # Cập nhật room
        room = super().update(instance, validated_data)
        
        # Xử lý nhiều ảnh nếu có
        if additional_images_json is not None:
            self._process_images(room, additional_images_json)
        
        return room
    
    def _process_images(self, room, additional_images_json):
        """Xử lý và lưu danh sách ảnh"""
        import json
        
        # Bắt đầu với ảnh chính nếu có
        all_images = []
        if room.image:
            all_images.append(room.image.url)
        
        # Thêm các ảnh bổ sung
        if additional_images_json:
            try:
                additional_images = json.loads(additional_images_json)
                if isinstance(additional_images, list):
                    all_images.extend(additional_images)
            except json.JSONDecodeError:
                pass
        
        # Lưu vào field images
        room.images = all_images
        room.save(update_fields=['images'])

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
    

class InvoiceSerializer(serializers.ModelSerializer):
    contract_info = serializers.SerializerMethodField(read_only=True)
    room_name = serializers.CharField(source="contract.room.name", read_only=True)
    tenant_name = serializers.CharField(source="contract.tenant.user.full_name", read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            "id", "contract", "contract_info", "room_name", "tenant_name",
            "period", "room_price", "elec_cost", "water_cost", "service_cost", 
            "total", "status", "issued_at", "due_date", "created_at", "updated_at"
        ]
        read_only_fields = ["total", "created_at", "updated_at"]

    @extend_schema_field(serializers.DictField())
    def get_contract_info(self, obj):
        return {
            "id": obj.contract.id,
            "room_name": obj.contract.room.name,
            "tenant_name": obj.contract.tenant.user.full_name,
            "tenant_email": obj.contract.tenant.user.email
        }

    def validate_period(self, value):
        if len(value) != 7 or value[4] != "-" or not (value[:4].isdigit() and value[5:7].isdigit()):
            raise serializers.ValidationError("Định dạng phải là YYYY-MM (ví dụ 2025-08).")
        return value

    def validate(self, attrs):
        contract = attrs.get("contract")
        if contract and contract.status != Contract.ACTIVE:
            raise serializers.ValidationError({"contract": "Hợp đồng không ở trạng thái ACTIVE."})
        
        # Validate due_date is after issued_at
        issued_at = attrs.get("issued_at")
        due_date = attrs.get("due_date")
        if issued_at and due_date and due_date <= issued_at.date():
            raise serializers.ValidationError({"due_date": "Ngày đến hạn phải sau ngày phát hành."})
            
        return attrs


class InvoiceGenerateSerializer(serializers.Serializer):
    contract = serializers.PrimaryKeyRelatedField(queryset=Contract.objects.filter(status=Contract.ACTIVE))
    period = serializers.CharField(max_length=7)
    service_cost = serializers.DecimalField(max_digits=12, decimal_places=2, default=0, required=False)
    due_days = serializers.IntegerField(default=30, required=False, help_text="Số ngày để thanh toán")

    def validate_period(self, value):
        if len(value) != 7 or value[4] != "-" or not (value[:4].isdigit() and value[5:7].isdigit()):
            raise serializers.ValidationError("Định dạng phải là YYYY-MM (ví dụ 2025-08).")
        return value

    def validate(self, attrs):
        contract = attrs["contract"]
        period = attrs["period"]
        
        # Check if invoice already exists for this contract and period
        if Invoice.objects.filter(contract=contract, period=period).exists():
            raise serializers.ValidationError("Hóa đơn cho hợp đồng và kỳ này đã tồn tại.")
            
        return attrs


class TenantSerializer(serializers.ModelSerializer):
    user_info = serializers.SerializerMethodField(read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    
    class Meta:
        model = Tenant
        fields = [
            "id", "user", "user_info", "full_name", "email",
            "id_number", "phone", "address", "emergency_contact"
        ]
        read_only_fields = ["user"]

    @extend_schema_field(serializers.DictField())
    def get_user_info(self, obj):
        return {
            "id": obj.user.id,
            "full_name": obj.user.full_name,
            "email": obj.user.email,
            "role": obj.user.role,
            "is_active": obj.user.is_active
        }

    def validate_id_number(self, value):
        if value and len(value) < 9:
            raise serializers.ValidationError("CCCD/CMND phải có ít nhất 9 số.")
        return value

    def validate_phone(self, value):
        if value and not value.replace("+", "").replace("-", "").replace(" ", "").isdigit():
            raise serializers.ValidationError("Số điện thoại không hợp lệ.")
        return value