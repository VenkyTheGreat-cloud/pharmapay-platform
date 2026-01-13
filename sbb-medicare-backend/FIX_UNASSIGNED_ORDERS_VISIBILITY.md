# Fix: Unassigned Orders Not Visible to Delivery Boys

## Problem
Orders created without assigning a delivery boy (`assigned_delivery_boy_id = NULL`) are not showing in delivery boys' dashboard.

## Root Cause Analysis

The query logic is correct, but there might be issues with:
1. **Store ID matching** - Delivery boy's store_id might not match order's store_id
2. **Admin group lookup** - The admin group might not be found correctly
3. **UUID type handling** - PostgreSQL UUID comparison might have issues

## Fixes Applied

### 1. Enhanced Logging
Added detailed logging to track:
- Delivery boy's store_id
- Store IDs array from admin group
- Query results (count of unassigned vs assigned orders)

### 2. Improved Store ID Matching
- Ensures delivery boy's store_id is always in the storeIds array
- Handles UUID string comparison properly
- Added fallback if admin group lookup fails

### 3. Query Verification
The query should show:
- Unassigned orders where `store_id` matches any store in the admin group
- Orders assigned to the specific delivery boy

## Testing Steps

### Step 1: Check Server Logs
When calling `GET /api/orders/ongoing` as a delivery boy, check logs for:

```
Delivery boy order query - controller {
  deliveryBoyId: <id>,
  storeId: '<uuid>',
  storeIds: ['<uuid>', ...],
  storeIdsCount: <number>
}

Delivery boy orders result {
  ordersCount: <number>,
  unassignedCount: <number>,  // Should be > 0
  assignedCount: <number>
}
```

### Step 2: Verify Database
Run this SQL to check if orders should be visible:

```sql
-- Get delivery boy info
SELECT id, name, store_id 
FROM delivery_boys 
WHERE id = <delivery_boy_id>;

-- Check unassigned orders for that store
SELECT id, order_number, store_id, assigned_delivery_boy_id, status
FROM orders
WHERE store_id = '<delivery_boy_store_id>'
  AND assigned_delivery_boy_id IS NULL
  AND status = 'ASSIGNED';
```

### Step 3: Test the Query Directly
```sql
-- Replace values with actual IDs
SELECT o.*
FROM orders o
WHERE o.status IN ('ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION')
  AND (
      (o.assigned_delivery_boy_id IS NULL 
       AND o.store_id = ANY(ARRAY['77f4e2fb-4607-447b-961d-064a61e6be1c']::uuid[]))
      OR o.assigned_delivery_boy_id = <delivery_boy_id>
  )
ORDER BY o.created_at DESC;
```

## Common Issues & Solutions

### Issue 1: Delivery Boy's store_id Doesn't Match Order's store_id

**Check:**
```sql
SELECT 
    db.id as delivery_boy_id,
    db.store_id as delivery_boy_store_id,
    o.id as order_id,
    o.store_id as order_store_id,
    CASE 
        WHEN db.store_id = o.store_id THEN 'MATCH'
        ELSE 'NO MATCH'
    END as match_status
FROM delivery_boys db
CROSS JOIN orders o
WHERE db.id = <delivery_boy_id>
  AND o.assigned_delivery_boy_id IS NULL
  AND o.status = 'ASSIGNED';
```

**Solution**: Update delivery boy's store_id if needed:
```sql
UPDATE delivery_boys 
SET store_id = '77f4e2fb-4607-447b-961d-064a61e6be1c'
WHERE id = <delivery_boy_id>;
```

### Issue 2: Admin Group Not Found

**Check:**
```sql
-- Get admin for a store
SELECT 
    u.id,
    u.name,
    u.role,
    u.admin_id,
    CASE 
        WHEN u.role = 'admin' THEN u.id
        ELSE u.admin_id
    END as admin_id_calculated
FROM users u
WHERE u.id = '77f4e2fb-4607-447b-961d-064a61e6be1c';

-- Get all stores under that admin
SELECT id, name, role, admin_id
FROM users
WHERE id = '<admin_id>'
   OR admin_id = '<admin_id>';
```

### Issue 3: Order Status Not Matching

**Check:**
```sql
SELECT id, order_number, status, assigned_delivery_boy_id
FROM orders
WHERE id IN (143, 144, 145);
```

**Expected**: Status should be `ASSIGNED` (or one of: `ACCEPTED`, `PICKED_UP`, `IN_TRANSIT`, `PAYMENT_COLLECTION`)

## Quick Fix Test

1. **Restart Server**:
   ```bash
   Ctrl + C
   npm start
   ```

2. **Check Logs** when calling the API:
   - Look for `Delivery boy order query - controller`
   - Verify `storeIds` array includes the order's `store_id`
   - Check `unassignedCount` in results

3. **Verify in Database**:
   ```sql
   -- Check if delivery boy's store_id matches order's store_id
   SELECT 
       (SELECT store_id FROM delivery_boys WHERE id = <delivery_boy_id>) as delivery_boy_store_id,
       (SELECT store_id FROM orders WHERE id = 145) as order_store_id,
       CASE 
           WHEN (SELECT store_id FROM delivery_boys WHERE id = <delivery_boy_id>) = 
                (SELECT store_id FROM orders WHERE id = 145)
           THEN 'MATCH - Should be visible'
           ELSE 'NO MATCH - Check store_id'
       END as status;
   ```

## Expected Behavior

After the fix:
- ✅ Unassigned orders (`assigned_delivery_boy_id = NULL`) should be visible to ALL delivery boys under the same admin
- ✅ Orders assigned to a specific delivery boy should only be visible to that delivery boy
- ✅ Server logs should show the query details and results

## Files Changed

1. `src/models/Order.js` - Added logging to query
2. `src/controllers/orderController.js` - Enhanced logging and store_id matching

## Next Steps

1. **Restart server** to apply changes
2. **Test the API** and check server logs
3. **Verify database** using SQL queries above
4. **Check delivery boy's store_id** matches order's store_id
