# Debug: Delivery Boys Not Seeing Unassigned Orders

## Issue
Orders with `assigned_delivery_boy_id: null` are not showing in delivery boy's dashboard.

## Debugging Steps

### Step 1: Check Delivery Boy's Store ID

Run this SQL to check the delivery boy's store_id:
```sql
SELECT 
    id,
    name,
    mobile,
    store_id,
    status,
    is_active
FROM delivery_boys
WHERE id = <delivery_boy_id>;
```

**Expected**: `store_id` should match the order's `store_id` (`77f4e2fb-4607-447b-961d-064a61e6be1c`)

### Step 2: Check Order's Store ID

```sql
SELECT 
    id,
    order_number,
    store_id,
    assigned_delivery_boy_id,
    status,
    created_at
FROM orders
WHERE id IN (143, 144, 145);
```

**Expected**: `store_id` should be `77f4e2fb-4607-447b-961d-064a61e6be1c`

### Step 3: Verify Store User Exists

```sql
SELECT 
    id,
    name,
    role,
    admin_id
FROM users
WHERE id = '77f4e2fb-4607-447b-961d-064a61e6be1c';
```

**Expected**: Should return a user (admin or store_manager)

### Step 4: Check Admin Group

If the store is a store_manager, check its admin:
```sql
-- Get admin and all stores under that admin
SELECT 
    id,
    name,
    role,
    admin_id
FROM users
WHERE id = '77f4e2fb-4607-447b-961d-064a61e6be1c'
   OR admin_id = (
       SELECT admin_id FROM users WHERE id = '77f4e2fb-4607-447b-961d-064a61e6be1c'
   )
   OR id = (
       SELECT admin_id FROM users WHERE id = '77f4e2fb-4607-447b-961d-064a61e6be1c'
   );
```

### Step 5: Test the Query Directly

Run this query to see what orders should be returned:
```sql
-- Replace <delivery_boy_id> and <store_id> with actual values
SELECT o.*, 
       db.name as delivery_boy_name,
       u.name as store_name,
       c.area as customer_area
FROM orders o
LEFT JOIN delivery_boys db ON o.assigned_delivery_boy_id = db.id
LEFT JOIN users u ON o.store_id = u.id
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.status IN ('ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION')
  AND (
      (o.assigned_delivery_boy_id IS NULL AND o.store_id = ANY(ARRAY['77f4e2fb-4607-447b-961d-064a61e6be1c']::uuid[]))
      OR o.assigned_delivery_boy_id = <delivery_boy_id>
  )
ORDER BY o.created_at DESC;
```

### Step 6: Check Server Logs

When calling `GET /api/orders/ongoing` as a delivery boy, check server logs for:
```
Delivery boy order query {
  deliveryBoyId: <id>,
  storeId: '<uuid>',
  storeIds: ['<uuid>', ...]
}
```

## Common Issues

### Issue 1: Delivery Boy's store_id Doesn't Match Order's store_id

**Solution**: 
- Verify delivery boy was created with correct `store_id`
- Update if needed: `UPDATE delivery_boys SET store_id = '77f4e2fb-4607-447b-961d-064a61e6be1c' WHERE id = <delivery_boy_id>;`

### Issue 2: Store User Not Found

**Solution**:
- Verify the store exists in `users` table
- Check if `store_id` in `delivery_boys` references a valid `users.id`

### Issue 3: Admin Group Lookup Failing

**Solution**:
- The code now has fallback to use delivery boy's `store_id` directly
- Check server logs to see what `storeIds` array contains

### Issue 4: Order Status Not Matching

**Solution**:
- Verify order status is one of: `ASSIGNED`, `ACCEPTED`, `PICKED_UP`, `IN_TRANSIT`, `PAYMENT_COLLECTION`
- Orders with other statuses won't show in "ongoing orders"

## Quick Fix Test

Run this to manually verify the delivery boy can see orders:
```sql
-- Get delivery boy info
SELECT id, name, store_id FROM delivery_boys WHERE mobile = '<delivery_boy_mobile>';

-- Check if orders exist for that store
SELECT id, order_number, store_id, assigned_delivery_boy_id, status
FROM orders
WHERE store_id = '<delivery_boy_store_id>'
  AND assigned_delivery_boy_id IS NULL
  AND status = 'ASSIGNED';
```

## API Test

Test the endpoint directly:
```bash
GET /api/orders/ongoing
Authorization: Bearer <delivery_boy_jwt_token>
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "145",
        "order_number": "Inv-w9898",
        "assigned_delivery_boy_id": null,
        "is_unassigned": true,
        ...
      }
    ],
    "count": 2
  }
}
```

## Next Steps

1. **Check the database** using SQL queries above
2. **Check server logs** when calling the API
3. **Verify delivery boy's store_id** matches order's store_id
4. **Restart server** to ensure latest code is running
