# Database Setup for Order Creation & Push Notifications

## Quick Setup

Run this SQL script to set up the database:

```sql
\i scripts/setup-push-notifications-and-order-assignment.sql
```

Or run the commands manually:

## Required Database Changes

### 1. Add Device Token Column (Required)

**Purpose**: Store FCM device tokens for push notifications

```sql
-- Add device_token column to delivery_boys table
ALTER TABLE delivery_boys 
ADD COLUMN IF NOT EXISTS device_token VARCHAR(500);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_delivery_boys_device_token 
ON delivery_boys(device_token) 
WHERE device_token IS NOT NULL;
```

**File**: `scripts/add-device-token-to-delivery-boys.sql`

### 2. Verify Orders Table (Already Supports NULL)

**Good News**: The `orders` table already allows `assigned_delivery_boy_id` to be `NULL`!

The column definition is:
```sql
assigned_delivery_boy_id BIGINT REFERENCES delivery_boys(id) ON DELETE SET NULL
```

The `ON DELETE SET NULL` means the column can be `NULL`, so **no changes needed**.

### 3. Verify Status Constraint (Should Already Include ACCEPTED/REJECTED)

Check if your orders table has the correct status values:

```sql
-- Check current status constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname LIKE '%status%';
```

**Expected statuses**: `'ASSIGNED', 'ACCEPTED', 'REJECTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION', 'DELIVERED', 'CANCELLED'`

If `ACCEPTED` and `REJECTED` are missing, run:

```sql
-- Update status constraint to include ACCEPTED and REJECTED
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('ASSIGNED', 'ACCEPTED', 'REJECTED', 'PICKED_UP', 'IN_TRANSIT', 
                      'PAYMENT_COLLECTION', 'DELIVERED', 'CANCELLED'));
```

## Complete Setup Script

All changes in one file: `scripts/setup-push-notifications-and-order-assignment.sql`

## Verification

After running the setup, verify everything is correct:

```sql
-- 1. Check device_token column exists
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'delivery_boys' 
AND column_name = 'device_token';

-- 2. Check orders can have NULL assigned_delivery_boy_id
SELECT 
    COUNT(*) as total_orders,
    COUNT(assigned_delivery_boy_id) as assigned_orders,
    COUNT(*) - COUNT(assigned_delivery_boy_id) as unassigned_orders
FROM orders;

-- 3. Check status constraint
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname = 'orders_status_check';
```

## Summary

### ✅ Required Changes:
1. **Add `device_token` column** to `delivery_boys` table
   - Run: `scripts/add-device-token-to-delivery-boys.sql`

### ✅ Already Supported (No Changes Needed):
1. **Orders can have `NULL` assigned_delivery_boy_id** - Already supported
2. **Status constraint** - Should already include ACCEPTED/REJECTED

### 📝 Frontend Changes Needed:

1. **Order Creation**:
   - Remove `deliveryBoyId` from order creation request
   - Order will be created and visible to all delivery boys under admin

2. **Order Listing (Delivery Boys)**:
   - Show unassigned orders (`assigned_delivery_boy_id IS NULL`)
   - Show orders assigned to the delivery boy
   - Use `is_unassigned` flag from API response

3. **Accept/Reject Orders**:
   - Delivery boys can accept unassigned orders
   - When accepted, order is assigned to that delivery boy
   - When rejected, order becomes unassigned again

4. **Device Token Registration**:
   - Call `PUT /api/delivery-boys/device-token` after login
   - Send FCM device token from mobile app

## API Changes Summary

### Order Creation
**Before:**
```json
POST /api/orders
{
  "orderNumber": "INV-001",
  "customerId": 1,
  "deliveryBoyId": 5,  // ❌ Remove this
  "totalAmount": 100
}
```

**After:**
```json
POST /api/orders
{
  "orderNumber": "INV-001",
  "customerId": 1,
  // deliveryBoyId removed - not required
  "totalAmount": 100
}
```

### Order Listing Response
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "order_number": "INV-001",
        "assigned_delivery_boy_id": null,  // null = unassigned
        "is_unassigned": true,  // ✅ New flag
        "status": "ASSIGNED",
        ...
      }
    ]
  }
}
```

### Accept Order
```json
POST /api/orders/:id/accept
Authorization: Bearer <delivery_boy_token>
```

### Reject Order
```json
POST /api/orders/:id/reject
Authorization: Bearer <delivery_boy_token>
{
  "reason": "Too far from my location"
}
```

### Register Device Token
```json
PUT /api/delivery-boys/device-token
Authorization: Bearer <delivery_boy_token>
{
  "device_token": "fcm_token_from_mobile_app"
}
```

## Next Steps

1. ✅ Run database migration: `scripts/setup-push-notifications-and-order-assignment.sql`
2. ✅ Update frontend to remove `deliveryBoyId` from order creation
3. ✅ Update frontend to show unassigned orders
4. ✅ Implement accept/reject functionality
5. ✅ Register device tokens from mobile app
6. ✅ Test push notifications
