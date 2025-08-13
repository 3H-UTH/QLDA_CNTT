from rest_framework import serializers
from .models import Room, Contract, Tenant

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = "__all__"

class ContractCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contract
        fields = ["id","room","tenant","start_date","end_date","deposit","billing_cycle","status"]
        read_only_fields = ["status"]

    def validate(self, attrs):
        room: Room = attrs["room"]
        if room.status != getattr(Room, "EMPTY", "EMPTY"):
            raise serializers.ValidationError("Room is not empty")
        return attrs    
    def create(self, validated_data):
        contract = super().create(validated_data)
        # cập nhật trạng thái phòng -> RENTED
        room = contract.room
        room.status = getattr(Room, "RENTED", "RENTED")
        room.save(update_fields=["status"])
        return contract
    
class ContractSerializer(serializers.ModelSerializer):
    room_name   = serializers.CharField(source="room.name", read_only=True)
    tenant_name = serializers.CharField(source="tenant.user.full_name", read_only=True)

    class Meta:
        model = Contract
        fields = ["id","room","room_name","tenant","tenant_name","start_date","end_date","deposit","billing_cycle","status"]