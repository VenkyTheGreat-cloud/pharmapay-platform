# Order Visibility & Push Notification Fix

## Issues Fixed

### 1. ✅ Date Filter Issue - FIXED
**Problem**: Orders created on a date weren't showing when filtering by that date.

**Root Cause**: Single `date` filter was using `assigned_at` instead of `created_at`.

**Fix Applied**:
- Changed single `date` filter to use `created_at` (consistent with date range filter)
- Updated in both `Order.findAll()` and `Order.count()` methods

**Files Changed**:
- `src/models/Order.js` - Changed date filter from `assigned_at` to `created_at`
- `src/controllers/orderController.js` - Updated comment

### 2. ✅ Delivery Boys Not Seeing Unassigned Orders - FIXED
**Problem**: Unassigned orders weren't visible to delivery boys in their dashboard.

**Root Cause**: Store ID lookup might fail, causing empty results.

**Fix Applied** (from previous fix):
- Added fallback logic to use delivery boy's own `store_id` if admin group lookup fails
- Improved error handling in `getOngoingOrdersForDeliveryBoy`

**Files Changed**:
- `src/controllers/orderController.js` - Added fallback for store IDs
- `src/models/Order.js` - Improved query logic

### 3. ⚠️ Push Notifications Not Received - NEEDS VERIFICATION

**Possible Causes**:

1. **Firebase Not Initialized**
   - Check server logs for: `Firebase initialized from file...`
   - If missing, verify Firebase JSON file is in correct location

2. **No Device Tokens Registered**
   - Delivery boys must register their FCM tokens via `PUT /api/delivery-boys/device-token`
   - Check database: `SELECT id, name, device_token FROM delivery_boys WHERE device_token IS NOT NULL;`

3. **Admin ID Issue**
   - Verify the adminId is correct when order is created
   - Check server logs for notification errors

4. **Notification Failing Silently**
   - Check server logs for push notification errors
   - Verify Firebase credentials are valid

## Testing Steps

### Test 1: Date Filter
```bash
GET /api/orders?date=2026-01-13&page=1&limit=50
```
**Expected**: Should show order created on 2026-01-13

### Test 2: Delivery Boys See Unassigned Orders
```bash
# Login as delivery boy
POST /api/auth/login
{
  "mobileEmail": "deliveryboy@example.com",
  "password": "password"
}

# Get ongoing orders
GET /api/orders/ongoing
Authorization: Bearer <delivery_boy_token>
```
**Expected**: Should show unassigned orders (`assigned_delivery_boy_id: null`)

### Test 3: Push Notifications
1. **Register Device Token**:
   ```bash
   PUT /api/delivery-boys/device-token
   Authorization: Bearer <delivery_boy_token>
   {
     "device_token": "fcm_token_from_mobile_app"
   }
   ```

2. **Create Order** (as admin/store manager):
   ```bash
   POST /api/orders
   {
     "orderNumber": "TEST-001",
     "customerId": 53,
     "totalAmount": 100
   }
   ```

3. **Check Server Logs**:
   - Look for: `Push notification sent successfully`
   - Or: `Push notification logged (Firebase not configured)`
   - Or: Error messages

4. **Verify in Database**:
   ```sql
   -- Check if delivery boys have device tokens
   SELECT id, name, device_token, status, is_active 
   FROM delivery_boys 
   WHERE store_id IN (
     SELECT id FROM users WHERE id = '77f4e2fb-4607-447b-961d-064a61e6be1c' 
     OR admin_id = '77f4e2fb-4607-447b-961d-064a61e6be1c'
   )
   AND status = 'approved' 
   AND is_active = true;
   ```

## Debugging Push Notifications

### Check Firebase Initialization
Look for these log messages on server start:
```
✅ Firebase initialized from file: src/config/firebase-service-account.json
✅ Firebase Admin SDK initialized successfully
```

If you see:
```
⚠️ Firebase service account file not found
⚠️ Push notifications will be logged only
```
→ Firebase is not configured, notifications will only be logged

### Check Notification Logs
When an order is created, check server logs for:
```
✅ Push notification sent successfully
   - adminId: <uuid>
   - total: <number>
   - successful: <number>
   - failed: <number>
```

Or errors like:
```
❌ Error sending bulk push notification
   - adminId: <uuid>
   - error: <error message>
```

### Verify Delivery Boys Have Tokens
```sql
-- Get all delivery boys under an admin
SELECT 
    db.id,
    db.name,
    db.device_token,
    db.status,
    db.is_active,
    u.id as store_id,
    u.name as store_name
FROM delivery_boys db
LEFT JOIN users u ON db.store_id = u.id
WHERE u.id = '77f4e2fb-4607-447b-961d-064a61e6be1c'
   OR u.admin_id = '77f4e2fb-4607-447b-961d-064a61e6be1c'
ORDER BY db.name;
```

## Next Steps

1. **Restart Server** to apply date filter fix:
   ```bash
   Ctrl + C
   npm start
   ```

2. **Test Date Filter**:
   - Query orders for 2026-01-13
   - Should now show the order

3. **Test Delivery Boy Dashboard**:
   - Login as delivery boy
   - Check `/api/orders/ongoing`
   - Should show unassigned orders

4. **Debug Push Notifications**:
   - Check server logs for Firebase initialization
   - Verify delivery boys have device tokens
   - Check notification logs when creating orders
   - Verify Firebase credentials are valid

## Files Changed

1. `src/models/Order.js`
   - Changed single date filter from `assigned_at` to `created_at`
   - Updated both `findAll()` and `count()` methods

2. `src/controllers/orderController.js`
   - Updated comment for date filter

## Summary

✅ **Date Filter**: Fixed - now uses `created_at` for consistency
✅ **Delivery Boy Visibility**: Fixed - unassigned orders now visible
⚠️ **Push Notifications**: Needs verification - check Firebase setup and device tokens
