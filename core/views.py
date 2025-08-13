from rest_framework import viewsets, filters
from .models import Room
from .serializers import RoomSerializer
from drf_spectacular.utils import extend_schema, extend_schema_view

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
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "status"]
