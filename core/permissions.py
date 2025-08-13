from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerRole(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return getattr(request.user, "role", None) == "OWNER"
