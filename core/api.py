from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, RoomViewSet, ContractViewSet, MeterReadingViewSet, InvoiceViewSet, ReportsView, ArrearsReportView, TenantViewSet, RentalRequestViewSet
from accounts.views import UsernameTokenObtainPairView, RefreshTokenView, RegisterView

router = DefaultRouter()
router.register(r"rooms", RoomViewSet, basename="room")
router.register(r"rental-requests", RentalRequestViewSet, basename="rental-request")
router.register(r"contracts", ContractViewSet, basename="contract")
router.register(r"meter-readings", MeterReadingViewSet, basename="meter-reading")
router.register(r"invoices", InvoiceViewSet, basename="invoice")
router.register(r"tenants", TenantViewSet, basename="tenant")
router.register(r"payments", PaymentViewSet, basename="payment")
urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", UsernameTokenObtainPairView.as_view(), name="token_obtain_pair"),  
    path("auth/refresh/", RefreshTokenView.as_view(), name="token_refresh"),
    path("reports/revenue/", ReportsView.as_view(), name="revenue-report"),
    path("reports/arrears/", ArrearsReportView.as_view(), name="arrears-report"),  
    path("", include(router.urls)),
]
