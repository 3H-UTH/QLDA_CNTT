from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated 
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import Room, Contract, MeterReading, Invoice, Payment, RentalRequest
from django.contrib.auth import get_user_model
from .serializers import (
    RoomSerializer, ContractSerializer, ContractCreateSerializer, 
    MeterReadingSerializer, InvoiceSerializer, InvoiceGenerateSerializer,
    TenantSerializer, PaymentSerializer, RentalRequestSerializer, RentalRequestCreateSerializer
)
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiParameter
from .permissions import IsOwnerRole, TenantSelfManagePermission, ContractPermission
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
import re

User = get_user_model()

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

# ---------- RENTAL REQUESTS ----------
@extend_schema_view(
    list=extend_schema(tags=["Rental Requests"]),
    retrieve=extend_schema(tags=["Rental Requests"]),
    create=extend_schema(tags=["Rental Requests"]),
    update=extend_schema(tags=["Rental Requests"]),
    partial_update=extend_schema(tags=["Rental Requests"]),
    destroy=extend_schema(tags=["Rental Requests"]),
)
class RentalRequestViewSet(viewsets.ModelViewSet):
    queryset = RentalRequest.objects.select_related("room", "tenant").order_by("-created_at")
    permission_classes = [IsAuthenticated]  # Cần chi tiết hơn để phân quyền đúng
    
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["status", "room", "tenant"]
    search_fields = ["room__name", "tenant__full_name", "tenant__email", "notes"]
    ordering_fields = ["created_at", "viewing_time", "id"]
    
    def get_serializer_class(self):
        if self.action == "create":
            return RentalRequestCreateSerializer
        return RentalRequestSerializer
    
    def get_queryset(self):
        """Filter requests based on user role"""
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
            
        # OWNER can see all requests
        if getattr(user, 'role', None) == 'OWNER':
            return queryset
            
        # TENANT can only see their own requests
        if getattr(user, 'role', None) == 'TENANT':
            return queryset.filter(tenant=user)
            
        return queryset.none()
    
    def perform_create(self, serializer):
        """Set tenant to current user for tenant requests"""
        serializer.save(tenant=self.request.user)
    
    @extend_schema(tags=["Rental Requests"])
    @action(detail=True, methods=["post"], url_path="accept")
    def accept_request(self, request, pk=None):
        """Chấp nhận yêu cầu xem nhà"""
        rental_request = self.get_object()
        
        # Chỉ chủ nhà mới có thể chấp nhận yêu cầu
        if getattr(request.user, 'role', None) != 'OWNER':
            return Response({"detail": "Bạn không có quyền thực hiện hành động này"}, status=status.HTTP_403_FORBIDDEN)
        
        # Chỉ chấp nhận yêu cầu đang ở trạng thái PENDING
        if rental_request.status != RentalRequest.PENDING:
            return Response({"detail": "Chỉ có thể chấp nhận yêu cầu đang ở trạng thái chờ xử lý"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Cập nhật trạng thái thành ACCEPTED
        rental_request.status = RentalRequest.ACCEPTED
        rental_request.save(update_fields=["status", "updated_at"])
        
        return Response({"detail": "Yêu cầu xem nhà đã được chấp nhận"}, status=status.HTTP_200_OK)
    
    @extend_schema(tags=["Rental Requests"])
    @action(detail=True, methods=["post"], url_path="decline")
    def decline_request(self, request, pk=None):
        """Từ chối yêu cầu xem nhà"""
        rental_request = self.get_object()
        
        # Chỉ chủ nhà mới có thể từ chối yêu cầu
        if getattr(request.user, 'role', None) != 'OWNER':
            return Response({"detail": "Bạn không có quyền thực hiện hành động này"}, status=status.HTTP_403_FORBIDDEN)
        
        # Chỉ từ chối yêu cầu đang ở trạng thái PENDING
        if rental_request.status != RentalRequest.PENDING:
            return Response({"detail": "Chỉ có thể từ chối yêu cầu đang ở trạng thái chờ xử lý"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Cập nhật trạng thái thành DECLINED
        rental_request.status = RentalRequest.DECLINED
        rental_request.save(update_fields=["status", "updated_at"])
        
        return Response({"detail": "Yêu cầu xem nhà đã bị từ chối"}, status=status.HTTP_200_OK)
    
    @extend_schema(tags=["Rental Requests"])
    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_request(self, request, pk=None):
        """Hủy yêu cầu xem nhà (chỉ tenant mới thực hiện được)"""
        rental_request = self.get_object()
        
        # Kiểm tra quyền - chỉ tenant tạo yêu cầu mới được hủy
        if request.user != rental_request.tenant:
            return Response({"detail": "Bạn không có quyền hủy yêu cầu này"}, status=status.HTTP_403_FORBIDDEN)
        
        # Chỉ hủy yêu cầu đang ở trạng thái PENDING
        if rental_request.status != RentalRequest.PENDING:
            return Response({"detail": "Chỉ có thể hủy yêu cầu đang ở trạng thái chờ xử lý"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Cập nhật trạng thái thành CANCELED
        rental_request.status = RentalRequest.CANCELED
        rental_request.save(update_fields=["status", "updated_at"])
        
        return Response({"detail": "Yêu cầu xem nhà đã được hủy"}, status=status.HTTP_200_OK)


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
    queryset = Contract.objects.select_related("room", "tenant", "rental_request").order_by("-created_at")
    permission_classes = [ContractPermission]

    # Filter backends + fields
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["status", "room", "tenant", "billing_cycle"]  # ?status=ACTIVE&room=3
    search_fields = ["room__name", "tenant__full_name", "tenant__email"]
    ordering_fields = ["start_date", "end_date", "deposit", "created_at", "id"]

    def get_queryset(self):
        """Filter contracts based on user role"""
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
            
        # OWNER can see all contracts
        if getattr(user, 'role', None) == 'OWNER':
            return queryset
            
        # TENANT can only see their own contracts
        if getattr(user, 'role', None) == 'TENANT':
            return queryset.filter(tenant=user)
            
        return queryset.none()

    def get_serializer_class(self):
        return ContractCreateSerializer if self.action == "create" else ContractSerializer

    def perform_create(self, serializer):
        """Create contract with appropriate data"""
        # Chỉ có OWNER mới được tạo hợp đồng chính thức
        if getattr(self.request.user, 'role', None) != 'OWNER':
            return Response({"detail": "Chỉ chủ nhà mới có quyền tạo hợp đồng"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer.save()

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
    
    
# ---------- INVOICES ----------
@extend_schema_view(
    list=extend_schema(tags=["Invoices"]),
    retrieve=extend_schema(tags=["Invoices"]),
    create=extend_schema(tags=["Invoices"]),
    update=extend_schema(tags=["Invoices"]),
    partial_update=extend_schema(tags=["Invoices"]),
    destroy=extend_schema(tags=["Invoices"]),
)
class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("contract", "contract__room", "contract__tenant").order_by("-issued_at")
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["contract", "period", "status"]
    search_fields = ["contract__room__name", "contract__tenant__full_name", "period"]
    ordering_fields = ["issued_at", "due_date", "total", "status"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # TENANT chỉ xem hóa đơn của mình
        if getattr(user, "role", None) == "TENANT":
            queryset = queryset.filter(contract__tenant=user)
        
        return queryset

    def get_permissions(self):
        # OWNER có thể tạo/sửa/xóa, TENANT chỉ xem
        if self.action in ["create", "update", "partial_update", "destroy", "generate", "send", "cancel"]:
            return [IsOwnerRole()]
        return [IsAuthenticated()]

    @extend_schema(
        tags=["Invoices"],
        request=InvoiceGenerateSerializer,
        responses={201: InvoiceSerializer}
    )
    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        """Tạo hóa đơn tự động từ hợp đồng và meter reading"""
        serializer = InvoiceGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        contract = serializer.validated_data["contract"]
        period = serializer.validated_data["period"]
        service_cost = serializer.validated_data.get("service_cost", 0)
        due_days = serializer.validated_data.get("due_days", 30)
        
        # Tính tiền phòng
        room_price = contract.room.base_price
        
        # Tính tiền điện và nước từ MeterReading
        elec_cost = 0
        water_cost = 0
        
        try:
            meter_reading = MeterReading.objects.get(contract=contract, period=period)
            elec_usage = meter_reading.elec_curr - meter_reading.elec_prev
            water_usage = meter_reading.water_curr - meter_reading.water_prev
            elec_cost = elec_usage * meter_reading.elec_price
            water_cost = water_usage * meter_reading.water_price
        except MeterReading.DoesNotExist:
            # Nếu chưa có meter reading, có thể để 0 hoặc báo lỗi
            pass
        
        # Tạo hóa đơn
        invoice = Invoice.objects.create(
            contract=contract,
            period=period,
            room_price=room_price,
            elec_cost=elec_cost,
            water_cost=water_cost,
            service_cost=service_cost,
            issued_at=timezone.now(),
            due_date=timezone.now().date() + timedelta(days=due_days),
            status=Invoice.UNPAID
        )
        
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

    @extend_schema(tags=["Invoices"])
    @action(detail=True, methods=["patch"], url_path="send")
    def send(self, request, pk=None):
        """Đánh dấu hóa đơn đã gửi (có thể thêm chức năng gửi email)"""
        invoice = self.get_object()
        
        if invoice.status != Invoice.UNPAID:
            return Response(
                {"detail": "Chỉ có thể gửi hóa đơn chưa thanh toán."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ở đây có thể thêm logic gửi email
        # send_invoice_email(invoice)
        
        return Response(
            {"detail": "Hóa đơn đã được gửi thành công.", "invoice": InvoiceSerializer(invoice).data},
            status=status.HTTP_200_OK
        )

    @extend_schema(tags=["Invoices"])
    @action(detail=True, methods=["patch"], url_path="cancel")
    def cancel(self, request, pk=None):
        """Hủy hóa đơn"""
        invoice = self.get_object()
        
        if invoice.status == Invoice.PAID:
            return Response(
                {"detail": "Không thể hủy hóa đơn đã thanh toán."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        invoice.delete()
        return Response(
            {"detail": "Hóa đơn đã được hủy thành công."}, 
            status=status.HTTP_200_OK
        )

    @extend_schema(tags=["Invoices"])
    @action(detail=True, methods=["patch"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        """Đánh dấu hóa đơn đã thanh toán"""
        invoice = self.get_object()
        
        if invoice.status == Invoice.PAID:
            return Response(
                {"detail": "Hóa đơn đã được thanh toán rồi."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        invoice.status = Invoice.PAID
        invoice.save(update_fields=["status", "updated_at"])
        
        return Response(
            {"detail": "Hóa đơn đã được đánh dấu thanh toán.", "invoice": InvoiceSerializer(invoice).data},
            status=status.HTTP_200_OK
        )

    @extend_schema(tags=["Invoices"])
    @action(detail=True, methods=["patch"], url_path="mark-overdue")
    def mark_overdue(self, request, pk=None):
        """Đánh dấu hóa đơn quá hạn"""
        invoice = self.get_object()
        
        if invoice.status != Invoice.UNPAID:
            return Response(
                {"detail": "Chỉ có thể đánh dấu quá hạn cho hóa đơn chưa thanh toán."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        invoice.status = Invoice.OVERDUE
        invoice.save(update_fields=["status", "updated_at"])
        
        return Response(
            {"detail": "Hóa đơn đã được đánh dấu quá hạn.", "invoice": InvoiceSerializer(invoice).data},
            status=status.HTTP_200_OK
        )


# ---------- REPORTS ----------
class ReportsView(APIView):
    """
    API endpoints for generating various reports
    """
    permission_classes = [IsOwnerRole]

    @extend_schema(
        tags=["Reports"],
        parameters=[
            OpenApiParameter(name="from", description="Start period (YYYY-MM)", required=True, type=str),
            OpenApiParameter(name="to", description="End period (YYYY-MM)", required=True, type=str),
        ]
    )
    def get(self, request):
        """
        Revenue report endpoint
        GET /api/reports/revenue?from=YYYY-MM&to=YYYY-MM
        """
        from_period = request.query_params.get('from')
        to_period = request.query_params.get('to')
        
        # Validate parameters
        if not from_period or not to_period:
            return Response(
                {"detail": "Both 'from' and 'to' parameters are required in YYYY-MM format"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate period format
        period_pattern = r'^\d{4}-\d{2}$'
        if not re.match(period_pattern, from_period) or not re.match(period_pattern, to_period):
            return Response(
                {"detail": "Period format must be YYYY-MM"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate period range
        if from_period > to_period:
            return Response(
                {"detail": "From period cannot be later than to period"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get paid invoices in the date range
        paid_invoices = Invoice.objects.filter(
            status=Invoice.PAID,
            period__gte=from_period,
            period__lte=to_period
        )
        
        # Calculate total revenue
        total_revenue = paid_invoices.aggregate(
            total=Sum('total')
        )['total'] or 0
        
        # Monthly breakdown
        monthly_breakdown = []
        current_period = from_period
        
        while current_period <= to_period:
            month_invoices = paid_invoices.filter(period=current_period)
            month_revenue = month_invoices.aggregate(total=Sum('total'))['total'] or 0
            month_count = month_invoices.count()
            
            monthly_breakdown.append({
                "period": current_period,
                "revenue": float(month_revenue),
                "paid_invoices_count": month_count
            })
            
            # Move to next month
            year, month = map(int, current_period.split('-'))
            if month == 12:
                year += 1
                month = 1
            else:
                month += 1
            current_period = f"{year:04d}-{month:02d}"
        
        return Response({
            "total_revenue": float(total_revenue),
            "period_from": from_period,
            "period_to": to_period,
            "monthly_breakdown": monthly_breakdown
        })


class ArrearsReportView(APIView):
    """
    API endpoint for arrears (unpaid invoices) report
    """
    permission_classes = [IsOwnerRole]

    @extend_schema(
        tags=["Reports"],
        parameters=[
            OpenApiParameter(
                name="period",
                description="Specific period to check (YYYY-MM format). If not provided, shows all unpaid invoices",
                required=False,
                type=str
            ),
        ]
    )
    def get(self, request):
        """
        Arrears report endpoint
        GET /api/reports/arrears?period=YYYY-MM
        """
        period = request.query_params.get('period')
        
        # Validate period format if provided
        if period:
            period_pattern = r'^\d{4}-\d{2}$'
            if not re.match(period_pattern, period):
                return Response(
                    {"detail": "Period format must be YYYY-MM"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Base query for unpaid and overdue invoices
        base_query = Invoice.objects.filter(
            Q(status=Invoice.UNPAID) | Q(status=Invoice.OVERDUE)
        ).select_related(
            'contract', 'contract__room', 'contract__tenant'
        )
        
        # Apply period filter if provided
        if period:
            base_query = base_query.filter(period=period)
        
        # Get summary statistics
        unpaid_invoices = base_query.filter(status=Invoice.UNPAID)
        overdue_invoices = base_query.filter(status=Invoice.OVERDUE)
        
        unpaid_amount = unpaid_invoices.aggregate(total=Sum('total'))['total'] or 0
        overdue_amount = overdue_invoices.aggregate(total=Sum('total'))['total'] or 0
        
        # Prepare detailed invoice list
        all_unpaid = base_query.order_by('due_date')
        today = timezone.now().date()
        
        invoice_details = []
        for invoice in all_unpaid:
            days_overdue = 0
            if invoice.due_date < today:
                days_overdue = (today - invoice.due_date).days
            
            invoice_details.append({
                "invoice_id": invoice.id,
                "contract_id": invoice.contract.id,
                "room_name": invoice.contract.room.name,
                "tenant_name": invoice.contract.tenant.full_name,
                "tenant_email": invoice.contract.tenant.email,
                "period": invoice.period,
                "total": float(invoice.total),
                "status": invoice.status,
                "issued_at": invoice.issued_at.isoformat(),
                "due_date": invoice.due_date.isoformat(),
                "days_overdue": days_overdue
            })
        
        return Response({
            "summary": {
                "total_unpaid_amount": float(unpaid_amount),
                "total_overdue_amount": float(overdue_amount),
                "unpaid_count": unpaid_invoices.count(),
                "overdue_count": overdue_invoices.count(),
                "period_filter": period or "All periods"
            },
            "unpaid_invoices": invoice_details
        })
    
@extend_schema(tags=["Tenants"])
class TenantViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(role=User.TENANT).order_by("id")
    serializer_class = TenantSerializer
    permission_classes = [TenantSelfManagePermission]  # Cho phép tenant tự quản lý profile

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["is_active"]     # ?is_active=true
    search_fields = ["full_name","email","phone","id_number"]  # ?search=nguyen
    ordering_fields = ["id","full_name"]

    def get_queryset(self):
        """TENANT chỉ thấy được chính mình, OWNER thấy tất cả tenant"""
        queryset = super().get_queryset()
        user = self.request.user
        
        if getattr(user, "role", None) == "TENANT":
            # TENANT chỉ thấy chính mình
            queryset = queryset.filter(id=user.id)
        # OWNER thấy tất cả tenant
        
        return queryset


@extend_schema_view(
    list=extend_schema(tags=["Payments"]),
    retrieve=extend_schema(tags=["Payments"]),
    create=extend_schema(tags=["Payments"]),
    update=extend_schema(tags=["Payments"]),
    partial_update=extend_schema(tags=["Payments"]),
    destroy=extend_schema(tags=["Payments"]),
)
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("invoice").all()
    serializer_class = PaymentSerializer
    permission_classes = [IsOwnerRole]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["invoice", "method", "status"]
    ordering_fields = ["paid_at", "amount", "id"]
    search_fields = ["note"]
