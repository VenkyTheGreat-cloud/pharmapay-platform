# Troubleshooting: Device Token API 403 Error

## Issue Fixed: Route Order Conflict

The 403 error was caused by a **route order conflict**. The `/device-token` route was defined AFTER the `/:id` route, causing Express to match "device-token" as an ID parameter.

**Fix Applied**: Moved `/device-token` route BEFORE `/:id` route in `src/routes/deliveryBoyRoutes.js`

---

## Common Causes of 403 Error

### 1. Route Order Conflict ✅ FIXED
- **Problem**: `/device-token` was matched by `/:id` route
- **Solution**: Route order has been fixed

### 2. Wrong Role in JWT Token
- **Problem**: Token doesn't have `role: "delivery_boy"`
- **Check**: Decode your JWT token and verify the role
- **Solution**: Make sure you're logged in as a delivery boy

**How to check JWT token:**
```javascript
// Decode JWT token (without verification, just to see contents)
const token = "your_jwt_token_here";
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Role:', payload.role); // Should be "delivery_boy"
```

### 3. Token Expired
- **Problem**: JWT token has expired
- **Solution**: Login again to get a new token

### 4. Invalid Token Format
- **Problem**: Authorization header format is incorrect
- **Solution**: Use format: `Authorization: Bearer <token>`

---

## Verification Steps

### Step 1: Verify Route Order
The route should be defined BEFORE `/:id`:
```javascript
// ✅ Correct order
router.put('/device-token', ...);  // First
router.get('/:id', ...);            // After
```

### Step 2: Verify JWT Token Role
Decode your token and check:
```json
{
  "userId": 1,
  "role": "delivery_boy",  // ← Must be "delivery_boy"
  "email": "deliveryboy@example.com"
}
```

### Step 3: Test with cURL
```bash
curl -X PUT https://pharmapay-api.onrender.com/api/delivery-boys/device-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_DELIVERY_BOY_JWT_TOKEN" \
  -d '{
    "device_token": "your_fcm_token_here"
  }'
```

### Step 4: Check Server Logs
Look for these log messages:
- ✅ `Device token updated` - Success
- ❌ `Unauthorized access attempt` - Wrong role
- ❌ `Invalid token attempt` - Token issue

---

## Expected Behavior

### ✅ Success (200 OK)
```json
{
  "success": true,
  "data": {
    "device_token": "fcm_token_here"
  },
  "message": "Device token updated successfully"
}
```

### ❌ 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource"
  }
}
```

**Possible causes:**
1. Token doesn't have `role: "delivery_boy"`
2. Route order conflict (should be fixed now)
3. Token expired or invalid

---

## How to Get Delivery Boy Token

### Login as Delivery Boy
```http
POST /api/auth/login
Content-Type: application/json

{
  "mobileEmail": "deliveryboy@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // ← Use this token
    "user": {
      "id": 1,
      "role": "delivery_boy",  // ← Verify this
      ...
    }
  }
}
```

---

## Testing Checklist

- [ ] Route order is correct (`/device-token` before `/:id`)
- [ ] JWT token has `role: "delivery_boy"`
- [ ] Token is not expired
- [ ] Authorization header format: `Bearer <token>`
- [ ] Request body has `device_token` field
- [ ] Delivery boy exists in database
- [ ] Server has been restarted after route fix

---

## Next Steps After Fix

1. **Restart the server** to apply route order fix
2. **Test the API** with a delivery boy token
3. **Verify token is saved** in database:
   ```sql
   SELECT id, name, device_token 
   FROM delivery_boys 
   WHERE id = <delivery_boy_id>;
   ```

---

## Still Getting 403?

1. **Check server logs** for detailed error messages
2. **Verify token role** by decoding JWT
3. **Test with Postman/cURL** to isolate frontend issues
4. **Ensure server was restarted** after code changes

---

## Related Files

- Route definition: `src/routes/deliveryBoyRoutes.js`
- Controller: `src/controllers/deliveryBoyController.js`
- Middleware: `src/middleware/auth.js`
- API Documentation: `FCM_TOKEN_API_DOCUMENTATION.md`
