from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from drf_spectacular.utils import extend_schema, extend_schema_view

User = get_user_model()

# ====== Serializer ======
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=True)
    full_name = serializers.CharField(required=True, min_length=2)
    username = serializers.CharField(required=True, min_length=3)

    class Meta:
        model = User
        fields = ["username", "email", "full_name", "role", "password", "password_confirm"]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Tên người dùng đã được sử dụng.")
        
        # Validate username format (only letters, numbers, underscore)
        import re
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError("Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới.")
        return value

    def validate_full_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Họ tên không được để trống.")
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Họ tên phải có ít nhất 2 ký tự.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email đã được sử dụng.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Mật khẩu nhập lại không khớp."})
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User(**validated_data)
        # Không ghi đè username nữa, giữ nguyên username từ frontend
        user.set_password(password)
        user.save()
        return user

# ====== Auth (login/refresh) ======
class UsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'username'  # Sử dụng username thay vì email
    
    @classmethod
    def get_token(cls, user):
        return super().get_token(user)
    
    def validate(self, attrs):
        # Đăng nhập bằng username và password
        data = super().validate(attrs)
        
        # Thêm thông tin user vào response
        data.update({
            'user': {
                'id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'full_name': self.user.full_name,
                'role': self.user.role,
            }
        })
        return data

@extend_schema(tags=["Auth"])
class UsernameTokenObtainPairView(TokenObtainPairView):
    serializer_class = UsernameTokenObtainPairSerializer

@extend_schema(tags=["Auth"])
class RefreshTokenView(TokenRefreshView):
    pass

@extend_schema(tags=["Auth"], request=RegisterSerializer)
class RegisterView(APIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer  # Thêm dòng này để fix warning

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)
        user = s.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
            },
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)