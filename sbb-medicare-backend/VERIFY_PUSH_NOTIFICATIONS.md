# Verify Push Notifications Are Working

## Current Implementation Status

✅ **Push notification code is implemented** in order creation:
- Location: `src/controllers/orderController.js` (lines 519-534)
- Service: `src/services/pushNotificationService.js`
- Triggered when: Order is created

## How to Verify It's Working

### Step 1: Check Server Logs on Startup

When server starts, you should see:
```
✅ Firebase initialized from file: src/config/firebase-service-account.json
✅ Firebase Admin SDK initialized successfully
```

If you see:
```
⚠️ Firebase service account file not found
⚠️ Push notifications will be logged only
```
→ Firebase is not configured, notifications will only be logged (not actually sent)

### Step 2: Check Server Logs When Creating Order

When you create an order, check server logs for:

**If Firebase is configured:**
```
✅ Push notification sent successfully
   - adminId: <uuid>
   - total: <number>
   - successful: <number>
   - failed: <number>
```

**If Firebase is NOT configured:**
```
⚠️ Push notification logged (Firebase not configured)
   - deliveryBoyId: <id>
   - title: "New Order Available"
   - body: "New order created for..."
```

**If there's an error:**
```
❌ Failed to send push notification
   - orderId: <id>
   - adminId: <uuid>
   - error: <error message>
```

### Step 3: Verify Delivery Boys Have Device Tokens

Run this SQL:
```sql
-- Check delivery boys under an admin with device tokens
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

**Expected**: Delivery boys should have `device_token` values (not NULL)

### Step 4: Test Order Creation

1. **Create an order** (as admin/store manager)
2. **Check server logs** immediately after creation
3. **Look for** push notification logs

## Common Issues

### Issue 1: Firebase Not Initialized

**Symptoms**: Logs show "Firebase not configured"

**Solution**:
1. Verify Firebase JSON file exists at `src/config/firebase-service-account.json`
2. Check server startup logs
3. Restart server if needed

### Issue 2: No Device Tokens Registered

**Symptoms**: Logs show "No delivery boys with device tokens found"

**Solution**:
1. Delivery boys must register their device tokens via `PUT /api/delivery-boys/device-token`
2. Check database: `SELECT id, name, device_token FROM delivery_boys WHERE device_token IS NOT NULL;`
3. Ensure delivery boys are calling the device token API after login

### Issue 3: Firebase Credentials Invalid

**Symptoms**: Logs show Firebase errors

**Solution**:
1. Verify Firebase JSON file is valid
2. Check Firebase project is active
3. Verify service account has proper permissions

### Issue 4: Admin ID Not Found

**Symptoms**: Logs show "No stores found for admin"

**Solution**:
1. Verify the admin ID is correct
2. Check if stores exist under that admin
3. Verify `User.getStoreIdsForAdmin()` returns correct store IDs

## Quick Test

### Test 1: Check Firebase Initialization
```bash
# Restart server and check logs
npm start
# Look for: "Firebase initialized from file..."
```

### Test 2: Check Device Tokens
```sql
SELECT COUNT(*) as delivery_boys_with_tokens
FROM delivery_boys
WHERE device_token IS NOT NULL
  AND status = 'approved'
  AND is_active = true;
```

### Test 3: Create Test Order
1. Create an order
2. Immediately check server logs
3. Look for push notification messages

## Expected Behavior

### When Order is Created:

1. **Order is saved to database**
2. **Push notification is triggered**:
   - Gets all delivery boys under admin
   - Filters for approved, active delivery boys with device tokens
   - Sends notification to each delivery boy
3. **Server logs show results**:
   - Total delivery boys found
   - Successful notifications
   - Failed notifications

### Notification Content:
- **Title**: "New Order Available"
- **Body**: "New order created for [customer_area]. Please accept it."
- **Data**: 
  - `type: "NEW_ORDER"`
  - `order_id: <order_id>`
  - `order_number: <order_number>`
  - `customer_area: <area>`

## Debugging Steps

1. ✅ **Check Firebase initialization** (server startup logs)
2. ✅ **Check device tokens** (database query)
3. ✅ **Check server logs** when creating order
4. ✅ **Verify admin ID** is correct
5. ✅ **Test with one delivery boy** first (register token, create order)

## Next Steps

If notifications are not working:

1. **Check server logs** - This will tell you exactly what's wrong
2. **Verify Firebase setup** - Ensure JSON file is in place
3. **Register device tokens** - Delivery boys must call the device token API
4. **Test with one delivery boy** - Simplify to isolate the issue
