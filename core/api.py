from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, ContractViewSet, MeterReadingViewSet
from accounts.views import UsernameTokenObtainPairView, RefreshTokenView, RegisterView  

router = DefaultRouter()
router.register(r"rooms", RoomViewSet, basename="room")
router.register(r"contracts", ContractViewSet, basename="contract")
router.register(r"meter-readings", MeterReadingViewSet, basename="meter-reading")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", UsernameTokenObtainPairView.as_view(), name="token_obtain_pair"),  
    path("auth/refresh/", RefreshTokenView.as_view(), name="token_refresh"),           
    path("", include(router.urls)),
]
