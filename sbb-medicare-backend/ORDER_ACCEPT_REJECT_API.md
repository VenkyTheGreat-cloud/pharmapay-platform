# Order Accept/Reject API Documentation

## Important Notes

⚠️ **The endpoint is `/accept`, NOT `/approve`**

---

## 1. Accept Order

### Endpoint
```
POST /api/orders/:id/accept
```

**NOT:** `POST /api/orders/:id/approve` ❌

### Authentication
- **Required**: Yes
- **Role**: `delivery_boy` only
- **Header**: `Authorization: Bearer <delivery_boy_token>`

### Request Body (Optional)
```json
{
  "notes": "Optional notes"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 11,
    "order_number": "ORD-2025-001",
    "status": "ACCEPTED",
    "items": [],
    ...
  },
  "message": "Order accepted successfully"
}
```

### Error Responses

**403 Forbidden - Not a delivery boy**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only delivery boys can accept orders"
  }
}
```

**403 Forbidden - Order not assigned to you**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Order not assigned to you"
  }
}
```

**400 Bad Request - Invalid status**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Order must be in ASSIGNED status to accept"
  }
}
```

---

## 2. Reject Order

### Endpoint
```
POST /api/orders/:id/reject
```

### Authentication
- **Required**: Yes
- **Role**: `delivery_boy` only
- **Header**: `Authorization: Bearer <delivery_boy_token>`

### Request Body (Optional)
```json
{
  "reason": "Too far from current location"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 11,
    "order_number": "ORD-2025-001",
    "status": "REJECTED",
    ...
  },
  "message": "Order rejected. Store manager can reassign to another delivery boy."
}
```

### Error Responses

**400 Bad Request - Invalid status**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot reject order. Current status is: ACCEPTED. Only orders with status ASSIGNED can be rejected."
  }
}
```

**403 Forbidden - Order not assigned to you**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Order not assigned to you"
  }
}
```

---

## Order Status Requirements

### To Accept Order:
- Order status must be: `ASSIGNED`
- Order must be assigned to the delivery boy making the request

### To Reject Order:
- Order status must be: `ASSIGNED`
- Order must be assigned to the delivery boy making the request

---

## Common Issues

### Issue 1: 404 on `/approve`
**Problem**: Using wrong endpoint  
**Solution**: Use `/accept` instead of `/approve`

**Wrong:**
```
POST /api/orders/11/approve ❌
```

**Correct:**
```
POST /api/orders/11/accept ✅
```

### Issue 2: INVALID_STATUS_TRANSITION on reject
**Problem**: Order is not in `ASSIGNED` status  
**Possible reasons:**
- Order already accepted (status = `ACCEPTED`)
- Order already delivered (status = `DELIVERED`)
- Order already rejected (status = `REJECTED`)
- Order cancelled (status = `CANCELLED`)

**Solution**: 
1. Check order status first: `GET /api/orders/11`
2. Only orders with status `ASSIGNED` can be rejected
3. If order is already `ACCEPTED`, it cannot be rejected (must proceed with delivery)

---

## Status Flow

```
ASSIGNED
  ├─→ ACCEPT (POST /api/orders/:id/accept) → ACCEPTED
  ├─→ REJECT (POST /api/orders/:id/reject) → REJECTED
  └─→ CANCELLED
```

**Once ACCEPTED:**
- Cannot reject anymore
- Must proceed: ACCEPTED → PICKED_UP → IN_TRANSIT → DELIVERED

**If REJECTED:**
- Store manager can reassign: `POST /api/orders/:id/assign`
- Reassignment changes status back to `ASSIGNED`

---

## Example Usage

### Accept Order
```javascript
// Correct endpoint
POST /api/orders/11/accept
Authorization: Bearer <delivery_boy_token>
Content-Type: application/json

{
  "notes": "Will pick up in 30 minutes"
}
```

### Reject Order
```javascript
POST /api/orders/11/reject
Authorization: Bearer <delivery_boy_token>
Content-Type: application/json

{
  "reason": "Too far from current location"
}
```

---

## Quick Reference

| Action | Endpoint | Method | Role Required |
|--------|----------|--------|---------------|
| Accept Order | `/api/orders/:id/accept` | POST | delivery_boy |
| Reject Order | `/api/orders/:id/reject` | POST | delivery_boy |
| Check Order Status | `/api/orders/:id` | GET | All authenticated |

**Remember:** Use `/accept`, not `/approve`!



