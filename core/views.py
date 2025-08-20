from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated 
from django_filters.rest_framework import DjangoFilterBackend
from .models import Room, Contract, MeterReading
from .serializers import RoomSerializer, ContractSerializer, ContractCreateSerializer, MeterReadingSerializer
from drf_spectacular.utils import extend_schema_view, extend_schema
from .permissions import IsOwnerRole

# ---------- ROOMS ----------
@extend_schema_view(
    list=extend_schema(tags=["Rooms"]),
    retrieve=extend_schema(tags=["Rooms"]),
    create=extend_schema(tags=["Rooms"]),
    update=extend_schema(tags=["Rooms"]),
    partial_update=extend_schema(tags=["Rooms"]),
    destroy=extend_schema(tags=["Rooms"]),
)
class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by("id")
    serializer_class = RoomSerializer
    permission_classes = [IsOwnerRole]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    search_fields = ["name"]                          
    ordering_fields = ["id", "area_m2", "base_price", "name"]  

# ---------- CONTRACTS ----------
@extend_schema_view(
    list=extend_schema(tags=["Contracts"]),
    retrieve=extend_schema(tags=["Contracts"]),
    create=extend_schema(tags=["Contracts"]),
    update=extend_schema(tags=["Contracts"]),
    partial_update=extend_schema(tags=["Contracts"]),
    destroy=extend_schema(tags=["Contracts"]),
)
class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.select_related("room","tenant","tenant__user").order_by("-id")
    permission_classes = [IsOwnerRole]

    # ✅ filter backends + fields ở CẤP CLASS
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["status", "room", "tenant", "billing_cycle"]  # ?status=ACTIVE&room=3
    search_fields = ["room__name", "tenant__user__full_name", "tenant__user__email"]
    ordering_fields = ["start_date", "end_date", "deposit", "id"]

    def get_serializer_class(self):
        return ContractCreateSerializer if self.action == "create" else ContractSerializer

    @extend_schema(tags=["Contracts"])
    @action(detail=True, methods=["post"], url_path="end")
    def end_contract(self, request, pk=None):
        contract = self.get_object()
        if contract.status != Contract.ACTIVE:
            return Response({"detail": "Hợp đồng không ở trạng thái ACTIVE."}, status=400)
        contract.status = Contract.ENDED
        contract.save(update_fields=["status"])
        # trả phòng về EMPTY
        room = contract.room
        room.status = getattr(room, "EMPTY", "EMPTY")
        room.save(update_fields=["status"])
        return Response(ContractSerializer(contract).data, status=200)

@extend_schema_view(
    list=extend_schema(tags=["Readings"]),
    retrieve=extend_schema(tags=["Readings"]),
    create=extend_schema(tags=["Readings"]),
    update=extend_schema(tags=["Readings"]),
    partial_update=extend_schema(tags=["Readings"]),
    destroy=extend_schema(tags=["Readings"]),
)
class MeterReadingViewSet(viewsets.ModelViewSet):
    queryset = MeterReading.objects.select_related("contract").order_by("-created_at")
    serializer_class = MeterReadingSerializer
    permission_classes = [IsAuthenticated]

    filterset_fields = ["contract", "period"]
    search_fields = ["period"]
    ordering_fields = ["created_at", "period"]