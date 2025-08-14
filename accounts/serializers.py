from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from core.models import Tenant
User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=True)
    full_name = serializers.CharField(required=True, min_length=2)
    class Meta:
        model = User
        fields = ["email", "full_name", "role", "password", "password_confirm"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email đã được sử dụng.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Mật khẩu nhập lại không khớp."})
        # áp dụng validator mặc định của Django (độ dài, độ mạnh… nếu đã cấu hình)
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.username = user.email
        user.set_password(password)
        user.save()

        # 🔗 Tự tạo Tenant profile nếu user là TENANT
        if user.role == "TENANT":
            Tenant.objects.get_or_create(user=user)

        return user

    def validate_full_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Họ và tên không được để trống.")
        if len(value) < 2:
            raise serializers.ValidationError("Họ và tên phải có ít nhất 2 ký tự.")
        return value
    
