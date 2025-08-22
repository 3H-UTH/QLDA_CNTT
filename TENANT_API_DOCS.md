# Tenant API Documentation

## Overview
The Tenant API provides comprehensive tenant management functionality for the rental management system. It allows property owners to view and manage tenant information.

## Permissions
- **OWNER**: Full access (read, create, update, delete)
- **TENANT**: Read-only access via SAFE_METHODS (GET, HEAD, OPTIONS)

## Model Fields
- `id`: Auto-generated primary key
- `user`: OneToOne relationship with User model
- `id_number`: CCCD/CMND number
- `phone`: Phone number
- `address`: Address
- `emergency_contact`: Emergency contact information

## Endpoints

### 1. List Tenants
**GET** `/api/tenants/`

**Query Parameters:**
- `user`: Filter by user ID
- `search`: Search in full name, email, phone, or ID number
- `ordering`: Order by id or user__full_name

**Response:**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": 5,
      "user_info": {
        "id": 5,
        "full_name": "Nguyen Van A",
        "email": "nguyenvana@example.com",
        "role": "TENANT",
        "is_active": true
      },
      "full_name": "Nguyen Van A",
      "email": "nguyenvana@example.com",
      "id_number": "123456789",
      "phone": "0901234567",
      "address": "123 Nguyen Trai, Q1, TPHCM",
      "emergency_contact": "0987654321 - Nguyen Van B"
    }
  ]
}
```

### 2. Get Tenant Details
**GET** `/api/tenants/{id}/`

**Response:** Same as individual tenant object above.

### 3. Create Tenant
**POST** `/api/tenants/`

**Note**: Tenants are usually created automatically when users register with TENANT role.

**Request Body:**
```json
{
  "user": 5,
  "id_number": "123456789",
  "phone": "0901234567", 
  "address": "123 Nguyen Trai, Q1, TPHCM",
  "emergency_contact": "0987654321 - Nguyen Van B"
}
```

### 4. Update Tenant
**PUT/PATCH** `/api/tenants/{id}/`

**Request Body:** Any fields you want to update (except user field which is read-only).

### 5. Delete Tenant
**DELETE** `/api/tenants/{id}/`

Permanently deletes the tenant record.

## Usage Examples

### Search Tenants
```
GET /api/tenants/?search=nguyen
```
Searches in full name, email, phone, and ID number.

### Filter by User
```
GET /api/tenants/?user=5
```
Gets tenant profile for specific user ID.

### Order Results
```
GET /api/tenants/?ordering=user__full_name
GET /api/tenants/?ordering=-id
```

## Integration with Other Models

### Automatic Tenant Creation
When a user registers with role "TENANT", a Tenant profile is automatically created:
```python
# In accounts/serializers.py
if user.role == "TENANT":
    Tenant.objects.get_or_create(user=user)
```

### Relationship with Contracts
```python
# Tenants can have multiple contracts
tenant = Tenant.objects.get(id=1)
contracts = tenant.contracts.all()
```

### Access in Views
```python
# In views, you can access tenant through user
if request.user.role == "TENANT":
    tenant = request.user.tenant_profile
```

## Validation Rules

### ID Number
- Must be at least 9 characters if provided
- Used for CCCD/CMND identification

### Phone Number
- Must contain only digits, spaces, hyphens, and plus signs
- Validates basic phone number format

### User Field
- Read-only in updates
- Must reference an existing User with TENANT role

## Error Responses

**400 Bad Request:**
```json
{
  "id_number": ["CCCD/CMND phải có ít nhất 9 số."],
  "phone": ["Số điện thoại không hợp lệ."]
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

## Best Practices

### For Property Owners
1. Use search to quickly find tenants
2. Keep emergency contact information updated
3. Verify ID numbers for legal compliance

### For System Integration
1. Always create Tenant profiles for TENANT users
2. Use the user relationship for authentication checks
3. Include user info in API responses for convenience

### Performance Optimization
1. Use `select_related("user")` to avoid N+1 queries
2. Filter by user ID when possible for faster lookups
3. Use search functionality instead of client-side filtering

## Related APIs
- **User Management**: `/api/auth/` endpoints
- **Contracts**: `/api/contracts/` (filtered by tenant)
- **Invoices**: `/api/invoices/` (filtered by tenant contracts)

The Tenant API provides a solid foundation for managing tenant information while maintaining proper security and validation! 🏠👥
