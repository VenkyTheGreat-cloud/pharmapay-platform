# Store Manager Dashboard - API Integration Guide

## Base URL
```
Production: https://sbb-medicare-api.onrender.com
Development: http://localhost:5000
```

## Authentication
All APIs require Bearer token authentication:
```
Authorization: Bearer <access_token>
```

---

## 1. Create Order (Updated)

### Endpoint
```
POST /api/orders
```

### Request Body
```json
{
  "orderNumber": "ORD-2025-001",
  "customerId": 1,
  "deliveryBoyId": 2,
  "totalAmount": 500.00,
  "paidAmount": 200.00,              // Optional: Amount already paid
  "paymentMode": "UPI",              // Required if paidAmount > 0
  "transactionReference": "TXN123",  // Optional: Transaction ID
  "customerComments": "Urgent delivery"
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 10,
    "order_number": "ORD-2025-001",
    "customer_id": 1,
    "assigned_delivery_boy_id": 2,
    "total_amount": "500.00",
    "status": "ASSIGNED",
    "payment_status": "PARTIAL",
    "payment_mode": "UPI",
    "payment_summary": {
      "total_amount": 500.00,
      "total_paid": 200.00,
      "remaining_amount": 300.00,
      "payment_status": "PARTIAL",
      "is_fully_paid": false
    }
  },
  "message": "Order created successfully"
}
```

---

## 2. Get All Orders

### Endpoint
```
GET /api/orders?page=1&limit=50&status=ASSIGNED&date=2025-01-15
```

### Query Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | 1 |
| `limit` | number | Items per page (default: 50) | 50 |
| `status` | string | Filter by status | ASSIGNED, ACCEPTED, REJECTED, etc. |
| `date` | string | Filter by date (YYYY-MM-DD) | 2025-01-15 |
| `payment_status` | string | Filter by payment status | PENDING, PARTIAL, PAID |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 10,
        "order_number": "ORD-2025-001",
        "customer_name": "John Doe",
        "customer_phone": "9876543210",
        "total_amount": "500.00",
        "status": "ASSIGNED",
        "payment_status": "PARTIAL",
        "payment_summary": {
          "total_amount": 500.00,
          "total_paid": 200.00,
          "remaining_amount": 300.00,
          "payment_status": "PARTIAL",
          "is_fully_paid": false
        },
        "delivery_photo_url": null,
        "created_at": "2025-01-15T10:30:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 50
  }
}
```

---

## 3. Get Order by ID

### Endpoint
```
GET /api/orders/:id
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 10,
    "order_number": "ORD-2025-001",
    "customer_id": 1,
    "customer_name": "John Doe",
    "customer_phone": "9876543210",
    "customer_address": "123 Main Street",
    "assigned_delivery_boy_id": 2,
    "delivery_boy_name": "Delivery Boy Name",
    "total_amount": "500.00",
    "status": "ASSIGNED",
    "payment_status": "PARTIAL",
    "payment_mode": "UPI",
    "delivery_photo_url": "/uploads/photo-123.jpg",
    "customer_comments": "Urgent delivery",
    "payment_summary": {
      "total_amount": 500.00,
      "total_paid": 200.00,
      "remaining_amount": 300.00,
      "payment_status": "PARTIAL",
      "is_fully_paid": false
    },
    "payments": [
      {
        "id": 5,
        "payment_mode": "UPI",
        "cash_amount": "0.00",
        "bank_amount": "200.00",
        "transaction_reference": "TXN123",
        "created_at": "2025-01-15T10:30:00.000Z"
      }
    ],
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## 4. Get Today's Orders

### Endpoint
```
GET /api/orders/today
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "total": 10
  }
}
```

---

## 5. Get Ongoing Orders

### Endpoint
```
GET /api/orders/ongoing
```

### Response (200 OK)
Returns orders with status: ASSIGNED, ACCEPTED, PICKED_UP, IN_TRANSIT, PAYMENT_COLLECTION

---

## 6. Assign Order to Delivery Boy

### Endpoint
```
POST /api/orders/:id/assign
```

### Request Body
```json
{
  "deliveryBoyId": 2
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "assignedBy": "uuid-of-store-manager",
    "assignedByName": "Store Manager Name",
    "assignedTime": "2025-01-15T10:30:00.000Z"
  },
  "message": "Order assigned successfully"
}
```

---

## 7. Get All Customers

### Endpoint
```
GET /api/customers?page=1&limit=50&search=john
```

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `search` | string | Search by name or mobile |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": 1,
        "name": "John Doe",
        "mobile": "9876543210",
        "address": "123 Main Street",
        "customer_lat": "12.9716",
        "customer_lng": "77.5946",
        "order_count": 5
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 50
  }
}
```

---

## 8. Get Customer by ID

### Endpoint
```
GET /api/customers/:id
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "mobile": "9876543210",
    "address": "123 Main Street",
    "customer_lat": "12.9716",
    "customer_lng": "77.5946",
    "order_count": 5
  }
}
```

---

## 9. Create Customer

### Endpoint
```
POST /api/customers
```

### Request Body
```json
{
  "name": "John Doe",
  "mobile": "9876543210",
  "address": "123 Main Street",
  "customerLat": 12.9716,
  "customerLng": 77.5946
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "mobile": "9876543210",
    "address": "123 Main Street"
  },
  "message": "Customer created successfully"
}
```

---

## 10. Get All Delivery Boys

### Endpoint
```
GET /api/delivery-boys?status=approved&is_active=true
```

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (pending, approved, rejected) |
| `is_active` | boolean | Filter by active status |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "delivery_boys": [
      {
        "id": 2,
        "name": "Delivery Boy Name",
        "mobile": "9876543210",
        "email": "dboy@example.com",
        "status": "approved",
        "is_active": true
      }
    ],
    "total": 10
  }
}
```

---

## 11. Get Approved Delivery Boys

### Endpoint
```
GET /api/delivery-boys/approved
```

### Response (200 OK)
Returns only approved and active delivery boys

---

## 12. Get Dashboard Statistics

### Endpoint
```
GET /api/orders/dashboard?date_from=2025-01-01&date_to=2025-01-31
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date_from` | string | Yes | Start date (YYYY-MM-DD) |
| `date_to` | string | Yes | End date (YYYY-MM-DD) |

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "total_orders": 100,
    "delivered_orders": 80,
    "assigned_orders": 10,
    "picked_up_orders": 5,
    "total_revenue": 50000.00,
    "pending_payments": 5000.00
  }
}
```

---

## 13. Get Customer Orders

### Endpoint
```
GET /api/customers/:id/orders
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 10,
        "order_number": "ORD-2025-001",
        "total_amount": "500.00",
        "status": "DELIVERED",
        "payment_status": "PAID",
        "created_at": "2025-01-15T10:30:00.000Z"
      }
    ],
    "count": 5
  }
}
```

---

## 14. Update Order Status (Optional - usually done by delivery boy)

### Endpoint
```
PUT /api/orders/:id/status
```

### Request Body
```json
{
  "status": "CANCELLED",
  "notes": "Customer cancelled"
}
```

---

## 15. Search Orders by Customer Mobile

### Endpoint
```
GET /api/orders/customer/:mobile
```

### Response (200 OK)
Returns all orders for the customer with the given mobile number

---

## Complete Integration Flow Example

### Step 1: Get Customers (for dropdown)
```javascript
GET /api/customers?limit=100
```

### Step 2: Get Delivery Boys (for dropdown)
```javascript
GET /api/delivery-boys/approved
```

### Step 3: Create Order
```javascript
POST /api/orders
{
  "orderNumber": "ORD-2025-001",
  "customerId": 1,
  "deliveryBoyId": 2,
  "totalAmount": 500.00,
  "paidAmount": 200.00,
  "paymentMode": "UPI",
  "transactionReference": "TXN123"
}
```

### Step 4: Display Orders List
```javascript
GET /api/orders?page=1&limit=50
```

### Step 5: View Order Details
```javascript
GET /api/orders/:id
```

---

## Error Responses

All APIs return errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message description"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `FORBIDDEN` - Access denied
- `DUPLICATE_ORDER_NUMBER` - Order number already exists
- `DELIVERY_BOY_NOT_APPROVED` - Delivery boy not approved
- `DELIVERY_BOY_NOT_AVAILABLE` - Delivery boy not active

---

## Payment Modes

Valid payment modes:
- `CASH` - Cash payment
- `CARD` - Card payment
- `UPI` - UPI payment
- `BANK_TRANSFER` - Bank transfer
- `SPLIT` - Split payment (part cash + part online)

---

## Order Statuses

- `ASSIGNED` - Order assigned to delivery boy
- `ACCEPTED` - Delivery boy accepted the order
- `REJECTED` - Delivery boy rejected the order
- `PICKED_UP` - Order picked up from store
- `IN_TRANSIT` - Order in transit
- `PAYMENT_COLLECTION` - Collecting payment
- `DELIVERED` - Order delivered
- `CANCELLED` - Order cancelled

---

## Payment Statuses

- `PENDING` - No payment made
- `PARTIAL` - Partial payment made
- `PAID` - Full payment received

---

## Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Create Order | POST | `/api/orders` |
| Get All Orders | GET | `/api/orders` |
| Get Order | GET | `/api/orders/:id` |
| Assign Order | POST | `/api/orders/:id/assign` |
| Get Customers | GET | `/api/customers` |
| Get Customer | GET | `/api/customers/:id` |
| Create Customer | POST | `/api/customers` |
| Get Delivery Boys | GET | `/api/delivery-boys` |
| Get Approved DBs | GET | `/api/delivery-boys/approved` |
| Dashboard Stats | GET | `/api/orders/dashboard` |

---

## Frontend Integration Checklist

- [ ] Authentication: Store JWT token
- [ ] Create Order Form: Customer, Delivery Boy, Amount, Payment details
- [ ] Orders List: Display with filters (status, date, payment status)
- [ ] Order Details: Show full order info with payment summary
- [ ] Customer Management: List, search, create customers
- [ ] Delivery Boy Selection: Show only approved/active delivery boys
- [ ] Dashboard: Display statistics and charts
- [ ] Error Handling: Show user-friendly error messages
- [ ] Loading States: Show loading indicators
- [ ] Success Messages: Confirm actions

---

## Testing Endpoints

Use these endpoints to test the integration:

1. **Health Check**: `GET /health`
2. **Get Config**: `GET /api/config`
3. **Login**: `POST /api/auth/login` (to get token)

---

For detailed API documentation, see:
- `API_DOCUMENTATION_ORDER_CREATION.md` - Order creation details
- `ORDER_CREATION_WITH_PAYMENT_EXAMPLES.md` - Payment examples




