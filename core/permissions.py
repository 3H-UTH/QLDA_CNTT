from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerRole(BasePermission):
    def has_permission(self, request, view):
        # Allow public access for reading (GET, HEAD, OPTIONS)
        if request.method in SAFE_METHODS:
            return True
        # Only owners can create/update/delete
        return getattr(request.user, "role", None) == "OWNER"
