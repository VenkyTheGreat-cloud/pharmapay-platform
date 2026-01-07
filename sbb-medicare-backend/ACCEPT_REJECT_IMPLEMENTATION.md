# Accept/Reject Order Implementation

## Overview
Added functionality for delivery boys to accept or reject orders after they are assigned. This allows better order management and reassignment capabilities.

## Changes Made

### 1. Database Schema Update
- **File**: `scripts/add-accept-reject-status.sql`
- Added `ACCEPTED` and `REJECTED` statuses to the orders table
- Updated `database/schema.sql` to include new statuses in CHECK constraint

**New Status Flow:**
- `ASSIGNED` → Can be `ACCEPTED`, `REJECTED`, or `CANCELLED`
- `ACCEPTED` → Can proceed to `PICKED_UP` or `CANCELLED`
- `REJECTED` → Can be reassigned (becomes `ASSIGNED` again)

### 2. Order Model Updates (`src/models/Order.js`)

#### New Methods:
- `Order.accept(orderId, deliveryBoyId, notes)` - Accepts an assigned order
- `Order.reject(orderId, deliveryBoyId, reason)` - Rejects an assigned order

#### Updated Methods:
- `Order.assign()` - Now allows reassignment of REJECTED orders
- `Order.updateStatus()` - Updated status transition rules:
  - `ASSIGNED` → `['ACCEPTED', 'REJECTED', 'CANCELLED']`
  - `ACCEPTED` → `['PICKED_UP', 'CANCELLED']`
  - `REJECTED` → `['ASSIGNED']` (when reassigned)
- `Order.getOngoingOrders()` - Now includes `ACCEPTED` status
- `Order.getOngoingOrdersForDeliveryBoy()` - Now includes `ACCEPTED` status

### 3. Controller Updates (`src/controllers/orderController.js`)

#### New Endpoints:
- `acceptOrder` - Delivery boy accepts an assigned order
- `rejectOrder` - Delivery boy rejects an assigned order

#### Updated:
- `assignOrder` - Now validates that order is in `ASSIGNED` or `REJECTED` status before assignment

### 4. Route Updates (`src/routes/orderRoutes.js`)

#### New Routes:
- `POST /api/orders/:id/accept` - Accept order (delivery boy only)
- `POST /api/orders/:id/reject` - Reject order (delivery boy only)

#### Updated:
- `PUT /api/orders/:id/status` - Validation now includes `ACCEPTED` and `REJECTED` statuses

## API Usage

### Accept Order
```http
POST /api/orders/:id/accept
Authorization: Bearer <delivery_boy_token>
Content-Type: application/json

{
  "notes": "Optional notes" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "order_number": "ORD-2025-001",
    "status": "ACCEPTED",
    ...
  },
  "message": "Order accepted successfully"
}
```

### Reject Order
```http
POST /api/orders/:id/reject
Authorization: Bearer <delivery_boy_token>
Content-Type: application/json

{
  "reason": "Too far from current location" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "order_number": "ORD-2025-001",
    "status": "REJECTED",
    ...
  },
  "message": "Order rejected. Store manager can reassign to another delivery boy."
}
```

### Reassign Rejected Order
```http
POST /api/orders/:id/assign
Authorization: Bearer <admin/store_manager_token>
Content-Type: application/json

{
  "deliveryBoyId": 5
}
```

## Order Status Flow

```
ASSIGNED
  ├─→ ACCEPTED → PICKED_UP → IN_TRANSIT → PAYMENT_COLLECTION → DELIVERED
  ├─→ REJECTED → (can be reassigned) → ASSIGNED
  └─→ CANCELLED
```

## Database Migration

**IMPORTANT**: Run the migration script before deploying:

```bash
psql -U postgres -d sbb_medicare -f scripts/add-accept-reject-status.sql
```

Or manually execute:
```sql
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('ASSIGNED', 'ACCEPTED', 'REJECTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION', 'DELIVERED', 'CANCELLED'));
```

## Testing Checklist

- [ ] Run database migration
- [ ] Test accepting an assigned order (delivery boy)
- [ ] Test rejecting an assigned order (delivery boy)
- [ ] Test that only assigned orders can be accepted/rejected
- [ ] Test that rejected orders can be reassigned
- [ ] Test that accepted orders can proceed to PICKED_UP
- [ ] Test that non-delivery-boys cannot accept/reject orders
- [ ] Test that delivery boys can only accept/reject their own assigned orders
- [ ] Verify status history is recorded correctly

## Notes

- Delivery boys can only accept/reject orders assigned to them
- Rejected orders remain in the system and can be reassigned by store managers/admins
- Status history tracks all accept/reject actions with delivery boy names
- Accepted orders follow the normal delivery flow (PICKED_UP → IN_TRANSIT → etc.)




