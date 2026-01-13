# Order Status Change: Back to ASSIGNED - Unassignment Feature

## Overview
When a delivery boy changes an order status back to `ASSIGNED` (from `ACCEPTED` or any other status), the order is automatically **unassigned** and becomes available to **all delivery boys** under the same admin again.

## Behavior

### When Order Status Changes to ASSIGNED:

1. **If order is currently assigned to a delivery boy**:
   - `assigned_delivery_boy_id` is set to `NULL`
   - `assigned_at` is updated to current timestamp
   - Order becomes visible to all delivery boys under the admin
   - Status history records the unassignment

2. **If order is already unassigned**:
   - No change to `assigned_delivery_boy_id`
   - Status is updated to `ASSIGNED`
   - Order remains visible to all delivery boys

## Flow Example

### Scenario 1: Delivery Boy Accepts Order
1. Order created: `status = ASSIGNED`, `assigned_delivery_boy_id = NULL` → **Visible to all delivery boys**
2. Delivery Boy A accepts: `status = ACCEPTED`, `assigned_delivery_boy_id = A` → **Only visible to Delivery Boy A**
3. Delivery Boy A changes status back to ASSIGNED: `status = ASSIGNED`, `assigned_delivery_boy_id = NULL` → **Visible to all delivery boys again**

### Scenario 2: Delivery Boy Rejects Order
1. Order created: `status = ASSIGNED`, `assigned_delivery_boy_id = NULL` → **Visible to all delivery boys**
2. Delivery Boy A accepts: `status = ACCEPTED`, `assigned_delivery_boy_id = A` → **Only visible to Delivery Boy A**
3. Delivery Boy A rejects: `status = ASSIGNED`, `assigned_delivery_boy_id = NULL` → **Visible to all delivery boys again** (via reject endpoint)

### Scenario 3: Status Change via updateStatus
1. Order accepted: `status = ACCEPTED`, `assigned_delivery_boy_id = A` → **Only visible to Delivery Boy A**
2. Delivery Boy A changes status to ASSIGNED: `status = ASSIGNED`, `assigned_delivery_boy_id = NULL` → **Visible to all delivery boys again**

## API Usage

### Change Status Back to ASSIGNED
```http
PUT /api/orders/:id/status
Authorization: Bearer <delivery_boy_token>
Content-Type: application/json

{
  "status": "ASSIGNED",
  "notes": "Changing back to assigned status"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 145,
    "status": "ASSIGNED",
    "assigned_delivery_boy_id": null,  // ← Unassigned
    "assigned_at": "2026-01-13T08:00:00.000Z",
    ...
  }
}
```

## Status History

When an order is unassigned (status changed to ASSIGNED), the status history will include:
```
"Order status changed to ASSIGNED. Unassigned from [Delivery Boy Name] - now available to all delivery boys."
```

## Implementation Details

### Code Location
- **File**: `src/models/Order.js`
- **Method**: `Order.updateStatus()`

### Logic
```javascript
// If status is being changed to ASSIGNED and order is currently assigned to a delivery boy,
// unassign it (set assigned_delivery_boy_id to NULL) so it becomes available to all delivery boys
if (status === 'ASSIGNED' && order.assigned_delivery_boy_id !== null) {
    updateQuery += `, assigned_delivery_boy_id = NULL, assigned_at = CURRENT_TIMESTAMP`;
}
```

## Testing

### Test Case 1: Accept then Change to ASSIGNED
1. Create order (unassigned)
2. Delivery Boy A accepts order
3. Verify order only visible to Delivery Boy A
4. Delivery Boy A changes status to ASSIGNED
5. Verify order visible to all delivery boys again

### Test Case 2: Multiple Status Changes
1. Order: ASSIGNED → ACCEPTED → PICKED_UP → ASSIGNED
2. When changed back to ASSIGNED, order should be unassigned
3. Verify `assigned_delivery_boy_id = NULL`

## Related Features

- **Accept Order**: `POST /api/orders/:id/accept` - Assigns order to delivery boy
- **Reject Order**: `POST /api/orders/:id/reject` - Unassigns order (sets to ASSIGNED)
- **Update Status**: `PUT /api/orders/:id/status` - Can change status, unassigns if changed to ASSIGNED

## Notes

- ✅ Order becomes visible to all delivery boys when unassigned
- ✅ Status history records the unassignment with delivery boy name
- ✅ Works for any status transition to ASSIGNED (ACCEPTED → ASSIGNED, PICKED_UP → ASSIGNED, etc.)
- ✅ Only unassigns if order was previously assigned to a delivery boy
