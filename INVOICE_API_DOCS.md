# Invoice API Documentation

## Overview
The Invoice API provides comprehensive invoice management for the rental management system. It supports creating, viewing, updating, and managing payment status of invoices.

## Permissions
- **OWNER**: Full access to all invoice operations
- **TENANT**: Read-only access to their own invoices only

## Endpoints

### 1. List Invoices
**GET** `/api/invoices/`

**Query Parameters:**
- `contract`: Filter by contract ID
- `period`: Filter by period (YYYY-MM format)
- `status`: Filter by status (UNPAID/PAID/OVERDUE)
- `search`: Search in room name, tenant name, or period
- `ordering`: Order by issued_at, due_date, total, or status

**Response:**
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/invoices/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "contract": 1,
      "contract_info": {
        "id": 1,
        "room_name": "Room A101",
        "tenant_name": "John Doe",
        "tenant_email": "john@example.com"
      },
      "room_name": "Room A101",
      "tenant_name": "John Doe",
      "period": "2025-08",
      "room_price": "5000000.00",
      "elec_cost": "150000.00",
      "water_cost": "75000.00",
      "service_cost": "100000.00",
      "total": "5325000.00",
      "status": "UNPAID",
      "issued_at": "2025-08-22T10:00:00Z",
      "due_date": "2025-09-21",
      "created_at": "2025-08-22T10:00:00Z",
      "updated_at": "2025-08-22T10:00:00Z"
    }
  ]
}
```

### 2. Get Invoice Details
**GET** `/api/invoices/{id}/`

**Response:** Same as individual invoice object above.

### 3. Create Invoice Manually
**POST** `/api/invoices/`

**Request Body:**
```json
{
  "contract": 1,
  "period": "2025-08",
  "room_price": "5000000.00",
  "elec_cost": "150000.00",
  "water_cost": "75000.00",
  "service_cost": "100000.00",
  "due_date": "2025-09-21"
}
```

### 4. Generate Invoice Automatically
**POST** `/api/invoices/generate/`

Automatically calculates costs from room base price and meter readings.

**Request Body:**
```json
{
  "contract": 1,
  "period": "2025-08",
  "service_cost": "100000.00",
  "due_days": 30
}
```

**Response:**
```json
{
  "id": 2,
  "contract": 1,
  "contract_info": {
    "id": 1,
    "room_name": "Room A101",
    "tenant_name": "John Doe",
    "tenant_email": "john@example.com"
  },
  "room_name": "Room A101",
  "tenant_name": "John Doe",
  "period": "2025-08",
  "room_price": "5000000.00",
  "elec_cost": "150000.00",
  "water_cost": "75000.00",
  "service_cost": "100000.00",
  "total": "5325000.00",
  "status": "UNPAID",
  "issued_at": "2025-08-22T10:00:00Z",
  "due_date": "2025-09-21",
  "created_at": "2025-08-22T10:00:00Z",
  "updated_at": "2025-08-22T10:00:00Z"
}
```

### 5. Update Invoice
**PATCH** `/api/invoices/{id}/`

**Request Body:** Any fields you want to update (except total, created_at, updated_at).

### 6. Send Invoice
**PATCH** `/api/invoices/{id}/send/`

Marks invoice as sent (can be extended to send email notifications).

**Response:**
```json
{
  "detail": "Hóa đơn đã được gửi thành công.",
  "invoice": { /* invoice object */ }
}
```

### 7. Mark Invoice as Paid
**PATCH** `/api/invoices/{id}/mark-paid/`

Changes invoice status from UNPAID/OVERDUE to PAID.

**Response:**
```json
{
  "detail": "Hóa đơn đã được đánh dấu thanh toán.",
  "invoice": { /* invoice object */ }
}
```

### 8. Mark Invoice as Overdue
**PATCH** `/api/invoices/{id}/mark-overdue/`

Changes invoice status from UNPAID to OVERDUE.

**Response:**
```json
{
  "detail": "Hóa đơn đã được đánh dấu quá hạn.",
  "invoice": { /* invoice object */ }
}
```

### 9. Cancel/Delete Invoice
**PATCH** `/api/invoices/{id}/cancel/`

Deletes the invoice (only if not paid).

**Response:**
```json
{
  "detail": "Hóa đơn đã được hủy thành công."
}
```

### 10. Delete Invoice
**DELETE** `/api/invoices/{id}/`

Permanently deletes the invoice.

## Status Workflow

1. **UNPAID**: Initial status when invoice is created
2. **PAID**: Invoice has been paid by tenant
3. **OVERDUE**: Invoice is past due date and still unpaid

## Automatic Features

### Total Calculation
The `total` field is automatically calculated as:
```
total = room_price + elec_cost + water_cost + service_cost
```

### Auto-Generate from Meter Readings
The `generate` endpoint automatically:
1. Gets room base price from contract
2. Calculates electricity cost from meter readings
3. Calculates water cost from meter readings
4. Adds service cost (if provided)
5. Sets due date based on due_days parameter

### Overdue Detection
Use the management command to automatically mark overdue invoices:
```bash
python manage.py mark_overdue_invoices
python manage.py mark_overdue_invoices --dry-run  # preview only
```

## Validation Rules

1. **Period Format**: Must be YYYY-MM (e.g., "2025-08")
2. **Contract Status**: Contract must be ACTIVE
3. **Unique Constraint**: One invoice per contract per period
4. **Due Date**: Must be after issued date
5. **Payment Status**: Can only mark PAID once, cannot cancel PAID invoices

## Error Responses

**400 Bad Request:**
```json
{
  "detail": "Hóa đơn cho hợp đồng và kỳ này đã tồn tại."
}
```

**403 Forbidden:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found:**
```json
{
  "detail": "Not found."
}
```
