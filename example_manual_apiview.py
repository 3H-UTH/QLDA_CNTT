# So sánh: Cách viết thủ công với APIView

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

class ContractListCreateAPIView(APIView):
    """Cách viết thủ công - phải tự xử lý mọi thứ"""
    
    def get(self, request):
        """GET /api/contracts/ - Danh sách hợp đồng"""
        from core.models import Contract
        from core.serializers import ContractSerializer
        
        contracts = Contract.objects.select_related("room","tenant","tenant__user").order_by("-id")
        serializer = ContractSerializer(contracts, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """POST /api/contracts/ - Tạo hợp đồng mới"""
        from core.serializers import ContractCreateSerializer, ContractSerializer
        
        serializer = ContractCreateSerializer(data=request.data)
        if serializer.is_valid():
            contract = serializer.save()
            return Response(
                ContractSerializer(contract).data, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContractDetailAPIView(APIView):
    """Chi tiết, cập nhật, xóa hợp đồng"""
    
    def get_object(self, pk):
        from core.models import Contract
        return get_object_or_404(Contract, pk=pk)
    
    def get(self, request, pk):
        """GET /api/contracts/{id}/ - Chi tiết hợp đồng"""
        from core.serializers import ContractSerializer
        
        contract = self.get_object(pk)
        serializer = ContractSerializer(contract)
        return Response(serializer.data)
    
    def put(self, request, pk):
        """PUT /api/contracts/{id}/ - Cập nhật toàn bộ"""
        from core.serializers import ContractSerializer
        
        contract = self.get_object(pk)
        serializer = ContractSerializer(contract, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        """PATCH /api/contracts/{id}/ - Cập nhật một phần"""
        from core.serializers import ContractSerializer
        
        contract = self.get_object(pk)
        serializer = ContractSerializer(contract, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """DELETE /api/contracts/{id}/ - Xóa hợp đồng"""
        contract = self.get_object(pk)
        contract.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Cần phải khai báo URL thủ công:
# urlpatterns = [
#     path('contracts/', ContractListCreateAPIView.as_view()),
#     path('contracts/<int:pk>/', ContractDetailAPIView.as_view()),
# ]
