from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, ContractViewSet
from accounts.views import EmailTokenObtainPairView, RefreshTokenView  # Thay đổi import

router = DefaultRouter()
router.register(r"rooms", RoomViewSet, basename="room")
router.register(r"contracts", ContractViewSet, basename="contract")

urlpatterns = [
    path("auth/login/", EmailTokenObtainPairView.as_view(), name="token_obtain_pair"),  # Sử dụng view custom
    path("auth/refresh/", RefreshTokenView.as_view(), name="token_refresh"),            # Sử dụng view custom
    path("", include(router.urls)),

]
