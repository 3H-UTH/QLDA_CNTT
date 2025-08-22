from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerRole(BasePermission):
    def has_permission(self, request, view):
        # Allow public access for reading (GET, HEAD, OPTIONS)
        if request.method in SAFE_METHODS:
            return True
        # Only owners can create/update/delete
        return getattr(request.user, "role", None) == "OWNER"


class IsOwnerOrTenantReadOnly(BasePermission):
    """
    OWNER: Có thể làm tất cả
    TENANT: Chỉ có thể đọc (GET) dữ liệu liên quan đến mình
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        user_role = getattr(request.user, "role", None)
        
        # OWNER có thể làm tất cả
        if user_role == "OWNER":
            return True
            
        # TENANT chỉ có thể đọc
        if user_role == "TENANT" and request.method in SAFE_METHODS:
            return True
            
        return False

    def has_object_permission(self, request, view, obj):
        user_role = getattr(request.user, "role", None)
        
        # OWNER có thể truy cập tất cả
        if user_role == "OWNER":
            return True
            
        # TENANT chỉ có thể xem dữ liệu của mình
        if user_role == "TENANT" and request.method in SAFE_METHODS:
            # Kiểm tra xem object có liên quan đến tenant này không
            if hasattr(obj, 'contract') and hasattr(obj.contract, 'tenant'):
                return obj.contract.tenant.user == request.user
            elif hasattr(obj, 'tenant'):
                return obj.tenant.user == request.user
                
        return False


class TenantSelfManagePermission(BasePermission):
    """
    Permission cho phép:
    - OWNER: Có thể làm tất cả với tenant
    - TENANT: Chỉ có thể xem và cập nhật profile của chính mình
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        user_role = getattr(request.user, "role", None)
        
        # OWNER có thể làm tất cả
        if user_role == "OWNER":
            return True
            
        # TENANT có thể GET, POST (tạo profile), PATCH/PUT (cập nhật profile của mình)
        if user_role == "TENANT":
            return request.method in ['GET', 'POST', 'PATCH', 'PUT']
            
        return False

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
            
        user_role = getattr(request.user, "role", None)
        
        # OWNER có thể truy cập tất cả
        if user_role == "OWNER":
            return True
            
        # TENANT chỉ có thể xem/sửa profile của chính mình
        if user_role == "TENANT":
            return obj.user == request.user
                
        return False
