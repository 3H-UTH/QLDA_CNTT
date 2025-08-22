# Reports API Documentation

## Overview
The Reports API provides comprehensive revenue tracking and arrears management for the rental management system. It allows property owners to analyze income and track unpaid invoices.

## Permissions
- **OWNER ONLY**: All report endpoints require OWNER role
- **TENANT**: No access to reports

## Endpoints

### 1. Revenue Report
**GET** `/api/reports/revenue/`

Generates revenue reports based on paid invoices within a specified date range.

**Query Parameters:**
- `from` (required): Start period in YYYY-MM format (e.g., "2025-01")
- `to` (required): End period in YYYY-MM format (e.g., "2025-08")

**Example Request:**
```
GET /api/reports/revenue/?from=2025-01&to=2025-08
```

**Response:**
```json
{
  "total_revenue": 42500000.00,
  "period_from": "2025-01",
  "period_to": "2025-08",
  "monthly_breakdown": [
    {
      "period": "2025-01",
      "revenue": 5000000.00,
      "paid_invoices_count": 3
    },
    {
      "period": "2025-02",
      "revenue": 6200000.00,
      "paid_invoices_count": 4
    },
    {
      "period": "2025-03",
      "revenue": 5800000.00,
      "paid_invoices_count": 4
    },
    {
      "period": "2025-04",
      "revenue": 6100000.00,
      "paid_invoices_count": 4
    },
    {
      "period": "2025-05",
      "revenue": 5900000.00,
      "paid_invoices_count": 4
    },
    {
      "period": "2025-06",
      "revenue": 6300000.00,
      "paid_invoices_count": 4
    },
    {
      "period": "2025-07",
      "revenue": 3600000.00,
      "paid_invoices_count": 2
    },
    {
      "period": "2025-08",
      "revenue": 3600000.00,
      "paid_invoices_count": 2
    }
  ]
}
```

**Features:**
- Calculates total revenue from all paid invoices in the period
- Provides month-by-month breakdown
- Shows count of paid invoices per month
- Automatically handles month transitions (including year changes)

### 2. Arrears Report
**GET** `/api/reports/arrears/`

Generates reports on unpaid and overdue invoices.

**Query Parameters:**
- `period` (optional): Specific period in YYYY-MM format to filter by

**Example Requests:**
```
GET /api/reports/arrears/                    # All unpaid invoices
GET /api/reports/arrears/?period=2025-08     # Unpaid invoices for August 2025
```

**Response:**
```json
{
  "summary": {
    "total_unpaid_amount": 15750000.00,
    "total_overdue_amount": 8500000.00,
    "unpaid_count": 3,
    "overdue_count": 2,
    "period_filter": "2025-08"
  },
  "unpaid_invoices": [
    {
      "invoice_id": 15,
      "contract_id": 3,
      "room_name": "Room A201",
      "tenant_name": "Jane Smith",
      "tenant_email": "jane@example.com",
      "period": "2025-08",
      "total": 5200000.00,
      "status": "OVERDUE",
      "issued_at": "2025-08-01T09:00:00Z",
      "due_date": "2025-08-15",
      "days_overdue": 7
    },
    {
      "invoice_id": 18,
      "contract_id": 5,
      "room_name": "Room B101",
      "tenant_name": "Bob Johnson",
      "tenant_email": "bob@example.com",
      "period": "2025-08",
      "total": 4800000.00,
      "status": "UNPAID",
      "issued_at": "2025-08-05T10:00:00Z",
      "due_date": "2025-09-04",
      "days_overdue": 0
    }
  ]
}
```

**Features:**
- Summary statistics for unpaid amounts and counts
- Detailed list of all unpaid/overdue invoices
- Automatic calculation of days overdue
- Tenant contact information for follow-up
- Can filter by specific period or show all

## Data Insights

### Revenue Report Insights
- **Total Revenue**: Sum of all paid invoices in the period
- **Monthly Trends**: Track income patterns over time
- **Payment Volume**: Number of invoices paid per month
- **Seasonal Analysis**: Compare different periods

### Arrears Report Insights
- **Outstanding Debt**: Total amount owed to the property
- **Risk Assessment**: Identify overdue vs. upcoming payments
- **Tenant Performance**: Track payment behavior
- **Collection Priority**: Sort by days overdue

## Use Cases

### Monthly Revenue Analysis
```
GET /api/reports/revenue/?from=2025-08&to=2025-08
```
Get revenue for a specific month.

### Quarterly Revenue Analysis
```
GET /api/reports/revenue/?from=2025-04&to=2025-06
```
Get Q2 revenue report.

### Annual Revenue Analysis
```
GET /api/reports/revenue/?from=2025-01&to=2025-12
```
Get full year revenue report.

### Current Month Arrears
```
GET /api/reports/arrears/?period=2025-08
```
See who hasn't paid for the current month.

### All Outstanding Debts
```
GET /api/reports/arrears/
```
Complete overview of all unpaid invoices.

## Error Responses

**400 Bad Request - Missing Parameters:**
```json
{
  "detail": "Both 'from' and 'to' parameters are required in YYYY-MM format"
}
```

**400 Bad Request - Invalid Format:**
```json
{
  "detail": "Period format must be YYYY-MM"
}
```

**400 Bad Request - Invalid Range:**
```json
{
  "detail": "From period cannot be later than to period"
}
```

**403 Forbidden - Not Owner:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

## Business Intelligence

### Key Performance Indicators (KPIs)
1. **Monthly Revenue Growth**: Compare month-over-month revenue
2. **Collection Rate**: Paid invoices / Total invoices
3. **Average Days to Pay**: Track payment timing
4. **Arrears Ratio**: Overdue amount / Total revenue

### Recommended Monitoring
- Run monthly revenue reports for financial planning
- Check arrears weekly for timely collections
- Monitor seasonal trends for budgeting
- Track tenant payment patterns for relationship management

### Automation Suggestions
- Set up automated monthly revenue reports
- Alert when arrears exceed thresholds
- Generate payment reminders for overdue invoices
- Create performance dashboards from report data
