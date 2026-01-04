# Order Creation API - Quick Reference

## Endpoint
```
POST /api/orders
```

## Request Format

```json
{
  "orderNumber": "ORD-2025-001",      // Required: Unique order number
  "customerId": 1,                    // Required: Customer ID
  "deliveryBoyId": 2,                 // Required: Delivery Boy ID
  "totalAmount": 500.00,              // Required: Total amount (> 0)
  "paidAmount": 200.00,               // Optional: Amount already paid (≤ totalAmount)
  "paymentMode": "UPI",               // Conditional: Required if paidAmount > 0
  "transactionReference": "TXN123",   // Optional: Transaction reference
  "customerComments": "Optional"      // Optional: Comments
}
```

**Payment Modes:** `CASH`, `CARD`, `UPI`, `BANK_TRANSFER`

## Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

## Success Response (201)
```json
{
  "success": true,
  "data": {
    "id": 10,
    "order_number": "ORD-2025-001",
    "total_amount": "500.00",
    "status": "ASSIGNED",
    "payment_status": "PENDING",
    "payment_summary": {
      "total_amount": 500.00,
      "total_paid": 0.00,
      "remaining_amount": 500.00,
      "payment_status": "PENDING",
      "is_fully_paid": false
    }
  },
  "message": "Order created successfully"
}
```

## Common Errors

| Status | Code | Message |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Order number is required |
| 409 | DUPLICATE_ORDER_NUMBER | Order number already exists |
| 404 | NOT_FOUND | Customer/Delivery boy not found |
| 403 | FORBIDDEN | Customer doesn't belong to your store |
| 400 | DELIVERY_BOY_NOT_APPROVED | Delivery boy is not approved |
| 400 | DELIVERY_BOY_NOT_AVAILABLE | Delivery boy is not active |

## JavaScript Example
```javascript
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    orderNumber: 'ORD-2025-001',
    customerId: 1,
    deliveryBoyId: 2,
    totalAmount: 500.00
  })
});

const result = await response.json();
```

