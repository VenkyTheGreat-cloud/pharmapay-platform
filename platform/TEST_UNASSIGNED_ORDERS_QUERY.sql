-- Test Query: Check if unassigned orders are visible to delivery boys
-- Replace the values below with actual IDs from your database

-- Step 1: Find a delivery boy and their store_id
SELECT 
    db.id as delivery_boy_id,
    db.name as delivery_boy_name,
    db.store_id as delivery_boy_store_id
FROM delivery_boys db
WHERE db.status = 'approved' 
  AND db.is_active = true
LIMIT 1;

-- Step 2: Get all store IDs for the admin group
-- Replace '<delivery_boy_store_id>' with the store_id from Step 1
WITH delivery_boy_store AS (
    SELECT store_id FROM delivery_boys WHERE id = <delivery_boy_id>
),
admin_id AS (
    SELECT 
        CASE 
            WHEN u.role = 'admin' THEN u.id
            ELSE COALESCE(u.admin_id, u.id)
        END as admin_id
    FROM users u
    CROSS JOIN delivery_boy_store dbs
    WHERE u.id = dbs.store_id
)
SELECT id as store_id
FROM users
WHERE id = (SELECT admin_id FROM admin_id)
   OR admin_id = (SELECT admin_id FROM admin_id);

-- Step 3: Check unassigned orders that should be visible
-- Replace '<delivery_boy_id>' and store_ids array with actual values
SELECT 
    o.id,
    o.order_number,
    o.store_id,
    o.assigned_delivery_boy_id,
    o.status,
    o.created_at,
    CASE 
        WHEN o.assigned_delivery_boy_id IS NULL THEN 'UNASSIGNED - Should be visible'
        WHEN o.assigned_delivery_boy_id = <delivery_boy_id> THEN 'ASSIGNED TO THIS DELIVERY BOY'
        ELSE 'ASSIGNED TO OTHER'
    END as visibility_status
FROM orders o
WHERE o.status IN ('ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'PAYMENT_COLLECTION')
  AND (
      (o.assigned_delivery_boy_id IS NULL AND o.store_id = ANY(ARRAY['77f4e2fb-4607-447b-961d-064a61e6be1c']::uuid[]))
      OR o.assigned_delivery_boy_id = <delivery_boy_id>
  )
ORDER BY o.created_at DESC;

-- Step 4: Verify order store_id matches delivery boy's admin group
SELECT 
    o.id as order_id,
    o.order_number,
    o.store_id as order_store_id,
    db.id as delivery_boy_id,
    db.store_id as delivery_boy_store_id,
    u.id as store_user_id,
    u.role as store_user_role,
    u.admin_id as store_user_admin_id,
    CASE 
        WHEN o.store_id = db.store_id THEN 'MATCH - Same store'
        WHEN o.store_id IN (
            SELECT id FROM users 
            WHERE id = (SELECT CASE WHEN u2.role = 'admin' THEN u2.id ELSE u2.admin_id END 
                       FROM users u2 WHERE u2.id = db.store_id)
               OR admin_id = (SELECT CASE WHEN u2.role = 'admin' THEN u2.id ELSE u2.admin_id END 
                             FROM users u2 WHERE u2.id = db.store_id)
        ) THEN 'MATCH - Same admin group'
        ELSE 'NO MATCH - Different admin group'
    END as match_status
FROM orders o
CROSS JOIN delivery_boys db
LEFT JOIN users u ON db.store_id = u.id
WHERE o.assigned_delivery_boy_id IS NULL
  AND o.status = 'ASSIGNED'
  AND db.status = 'approved'
  AND db.is_active = true
ORDER BY o.created_at DESC
LIMIT 10;
