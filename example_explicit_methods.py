# File ví dụ: Cách viết rõ ràng các phương thức API

from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Contract
from .serializers import ContractSerializer, ContractCreateSerializer

class ContractViewSetExplicit(viewsets.ModelViewSet):
    queryset = Contract.objects.all()
    
    def get_serializer_class(self):
        return ContractCreateSerializer if self.action == "create" else ContractSerializer
    
    # GET /api/contracts/ - Danh sách hợp đồng
    def list(self, request):
        """Lấy danh sách tất cả hợp đồng"""
        contracts = self.get_queryset()
        serializer = self.get_serializer(contracts, many=True)
        return Response(serializer.data)
    
    # POST /api/contracts/ - Tạo hợp đồng mới
    def create(self, request):
        """Tạo hợp đồng mới"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            contract = serializer.save()
            return Response(
                ContractSerializer(contract).data, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # GET /api/contracts/{id}/ - Chi tiết hợp đồng
    def retrieve(self, request, pk=None):
        """Lấy chi tiết 1 hợp đồng"""
        contract = self.get_object()
        serializer = self.get_serializer(contract)
        return Response(serializer.data)
    
    # PUT /api/contracts/{id}/ - Cập nhật toàn bộ hợp đồng
    def update(self, request, pk=None):
        """Cập nhật toàn bộ thông tin hợp đồng"""
        contract = self.get_object()
        serializer = self.get_serializer(contract, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # PATCH /api/contracts/{id}/ - Cập nhật một phần hợp đồng
    def partial_update(self, request, pk=None):
        """Cập nhật một phần thông tin hợp đồng"""
        contract = self.get_object()
        serializer = self.get_serializer(contract, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # DELETE /api/contracts/{id}/ - Xóa hợp đồng
    def destroy(self, request, pk=None):
        """Xóa hợp đồng"""
        contract = self.get_object()
        contract.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
