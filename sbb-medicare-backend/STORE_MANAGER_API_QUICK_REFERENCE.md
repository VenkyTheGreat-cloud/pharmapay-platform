# Store Manager Dashboard - API Quick Reference

## Essential APIs for Order Management

### 1. Create Order ⭐ (Updated)
```
POST /api/orders
Body: {
  "orderNumber": "ORD-2025-001",
  "customerId": 1,
  "deliveryBoyId": 2,
  "totalAmount": 500.00,
  "paidAmount": 200.00,        // Optional
  "paymentMode": "UPI",       // Required if paidAmount > 0
  "transactionReference": "TXN123"  // Optional
}
```

### 2. Get All Orders
```
GET /api/orders?page=1&limit=50&status=ASSIGNED
```

### 3. Get Order Details
```
GET /api/orders/:id
```

### 4. Assign Order
```
POST /api/orders/:id/assign
Body: { "deliveryBoyId": 2 }
```

---

## Supporting APIs

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create customer
- `GET /api/customers/:id/orders` - Get customer orders

### Delivery Boys
- `GET /api/delivery-boys` - List all delivery boys
- `GET /api/delivery-boys/approved` - Get approved delivery boys

### Dashboard
- `GET /api/orders/dashboard?date_from=2025-01-01&date_to=2025-01-31` - Statistics
- `GET /api/orders/today` - Today's orders
- `GET /api/orders/ongoing` - Ongoing orders

---

## Payment Modes
`CASH`, `CARD`, `UPI`, `BANK_TRANSFER`

## Payment Status
`PENDING`, `PARTIAL`, `PAID`

---

**Full Documentation**: See `STORE_MANAGER_API_DOCUMENTATION.md`



