from django.urls import path
from .views import RegisterView, EmailTokenObtainPairView, RefreshTokenView
urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/",    EmailTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/",  RefreshTokenView.as_view(),         name="token_refresh"),
]