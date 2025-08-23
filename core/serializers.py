from rest_framework import serializers
from .models import Room, Contract, MeterReading, Invoice, Payment, RentalRequest
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from decimal import Decimal

User = get_user_model()

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

class RentalRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RentalRequest
        fields = ["id", "room", "tenant", "notes", "viewing_time", "status"]
        read_only_fields = ["status", "tenant"]

    def validate(self, attrs):
        room: Room = attrs["room"]
        
        # Kiểm tra thời gian xem nhà
        viewing_time = attrs.get("viewing_time")
        if viewing_time:
            from django.utils import timezone
            now = timezone.now()
            min_time = now + timezone.timedelta(minutes=30)
            
            if viewing_time < min_time:
                raise serializers.ValidationError(
                    {"viewing_time": "Thời gian xem nhà phải cách thời điểm hiện tại ít nhất 30 phút."}
                )
        
        # Check if room is available for viewing
        if room.status not in [getattr(Room, "EMPTY", "EMPTY")]:
            raise serializers.ValidationError({"room": "Phòng này hiện không còn trống"})
            
        # Check if there's already a pending request for this room by this user
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            existing_request = RentalRequest.objects.filter(
                room=room,
                tenant=request.user,
                status=RentalRequest.PENDING
            ).exists()
            if existing_request:
                raise serializers.ValidationError({"room": "Bạn đã có yêu cầu xem phòng này đang chờ xử lý"})
        
        return attrs
        
    def create(self, validated_data):
        # Đảm bảo trạng thái là PENDING
        validated_data['status'] = RentalRequest.PENDING
        return super().create(validated_data)


class RentalRequestSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source="tenant.full_name", read_only=True)
    tenant_phone = serializers.CharField(source="tenant.phone", read_only=True)
    tenant_email = serializers.EmailField(source="tenant.email", read_only=True)
    room_name = serializers.CharField(source="room.name", read_only=True)
    room_price = serializers.DecimalField(source="room.base_price", max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = RentalRequest
        fields = "__all__"


class ContractCreateSerializer(serializers.ModelSerializer):
    rental_request_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Contract
        fields = ["id", "room", "tenant", "start_date", "end_date", "monthly_rent", "deposit", "billing_cycle", "status", "notes", "contract_image", "rental_request_id"]
        read_only_fields = ["status"]

    def validate(self, attrs):
        room: Room = attrs["room"]
        
        # Xác nhận phòng có trống không
        if room.status not in [getattr(Room, "EMPTY", "EMPTY")]:
            raise serializers.ValidationError({"room": "Phòng này hiện không còn trống"})
        
        # Kiểm tra ngày bắt đầu và kết thúc
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({"end_date": "Ngày kết thúc phải sau ngày bắt đầu"})
        
        # Xác thực rental_request_id nếu được cung cấp
        rental_request_id = attrs.pop('rental_request_id', None)
        if rental_request_id:
            try:
                rental_request = RentalRequest.objects.get(id=rental_request_id)
                # Cho phép tạo hợp đồng từ cả PENDING và ACCEPTED
                if rental_request.status not in [RentalRequest.PENDING, RentalRequest.ACCEPTED]:
                    raise serializers.ValidationError({"rental_request_id": "Chỉ có thể tạo hợp đồng từ yêu cầu chờ xử lý hoặc đã được chấp nhận"})
                attrs['rental_request'] = rental_request
            except RentalRequest.DoesNotExist:
                raise serializers.ValidationError({"rental_request_id": "Yêu cầu xem nhà không tồn tại"})
        
        return attrs
        
    def create(self, validated_data):
        # Đảm bảo trạng thái là ACTIVE
        validated_data['status'] = Contract.ACTIVE
        
        # Lấy rental_request nếu có
        rental_request = validated_data.get('rental_request')
        
        contract = super().create(validated_data)
        
        # Cập nhật trạng thái phòng thành RENTED
        room = contract.room
        room.status = getattr(Room, "RENTED", "RENTED")
        room.save(update_fields=["status"])
        
        # Cập nhật trạng thái rental_request nếu có
        if rental_request:
            rental_request.status = RentalRequest.ACCEPTED
            rental_request.save(update_fields=["status"])
            
        return contract
    
class ContractSerializer(serializers.ModelSerializer):
    tenant_name  = serializers.CharField(source="tenant.full_name", read_only=True)
    tenant_phone = serializers.CharField(source="tenant.phone", read_only=True)
    tenant_email = serializers.EmailField(source="tenant.email", read_only=True)
    room_name = serializers.CharField(source="room.name", read_only=True)
    
    class Meta:
        model = Contract
        fields = ["id","room","tenant","tenant_name","tenant_phone","tenant_email","room_name","monthly_rent","start_date","end_date","deposit","billing_cycle","status","notes","contract_image"]



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
    """Serializer cho User với role TENANT"""
    
    class Meta:
        model = User
        fields = [
            "id", "full_name", "email", "role", "is_active",
            "id_number", "phone", "address", "emergency_contact",
            "occupation", "workplace", "emergency_phone", "emergency_relationship"
        ]
        read_only_fields = ["email", "role"]

    def validate_id_number(self, value):
        if value and len(value) < 9:
            raise serializers.ValidationError("CCCD/CMND phải có ít nhất 9 số.")
        return value

    def validate_phone(self, value):
        if value and not value.replace("+", "").replace("-", "").replace(" ", "").isdigit():
            raise serializers.ValidationError("Số điện thoại không hợp lệ.")
        return value
    

class PaymentSerializer(serializers.ModelSerializer):
    invoice_total = serializers.DecimalField(source="invoice.total", max_digits=12, decimal_places=2, read_only=True)
    class Meta:
        model = Payment
        fields = ["id","invoice","invoice_total","amount","method","status","paid_at","note"]
        read_only_fields = ["paid_at"]

    def validate(self, attrs):
        inv: Invoice = attrs["invoice"]
        if inv.status in ("CANCELLED",):
            raise serializers.ValidationError({"invoice": "Hóa đơn đã bị hủy."})
        # optional: không cho tạo payment nếu đã PAID
        return attrs

    def create(self, validated_data):
        payment = super().create(validated_data)
        self._recompute_invoice_status(payment.invoice)
        return payment

    def update(self, instance, validated_data):
        res = super().update(instance, validated_data)
        self._recompute_invoice_status(instance.invoice)
        return res

    def _recompute_invoice_status(self, invoice: Invoice):
        paid = sum(p.amount for p in invoice.payments.filter(status="CONFIRMED"))
        # nếu cần làm tròn: paid = Decimal(paid).quantize(Decimal("0.01"))
        if paid >= invoice.total and invoice.status not in ("CANCELLED",):
            invoice.status = "PAID"
        elif invoice.status == "PAID" and paid < invoice.total:
            invoice.status = "UNPAID"
        invoice.save(update_fields=["status"])
