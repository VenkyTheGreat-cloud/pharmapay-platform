# Dashboard Access Control

## Overview

The system now enforces role-based dashboard access to prevent unauthorized access:
- **Admin users** can only access the **admin dashboard**
- **Store managers** can only access the **store dashboard**
- **Delivery boys** can access the mobile app (no dashboard restriction)

## Implementation

### Login Endpoint

The login endpoint now accepts an optional `dashboardType` parameter to validate dashboard access.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "mobileEmail": "admin@example.com",
  "password": "password123",
  "dashboardType": "admin"  // or "store"
}
```

### Validation Rules

1. **Admin trying to login to Store Dashboard:**
   - **Result:** ❌ **403 Forbidden**
   - **Error:** `DASHBOARD_ACCESS_DENIED`
   - **Message:** "Admin users cannot access the store dashboard. Please use the admin dashboard."

2. **Store Manager trying to login to Admin Dashboard:**
   - **Result:** ❌ **403 Forbidden**
   - **Error:** `DASHBOARD_ACCESS_DENIED`
   - **Message:** "Store managers cannot access the admin dashboard. Please use the store dashboard."

3. **Admin logging into Admin Dashboard:**
   - **Result:** ✅ **200 OK** - Login successful

4. **Store Manager logging into Store Dashboard:**
   - **Result:** ✅ **200 OK** - Login successful

5. **No dashboardType specified:**
   - **Result:** ✅ **200 OK** - Login successful (backward compatible)
   - **Note:** For security, it's recommended to always specify `dashboardType`

## Frontend Integration

### Admin Dashboard Login

```javascript
// Admin Dashboard Login
const loginResponse = await fetch('https://sbb-medicare-api.onrender.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mobileEmail: 'admin@example.com',
    password: 'password123',
    dashboardType: 'admin'  // Required for admin dashboard
  })
});

if (loginResponse.status === 403) {
  const error = await loginResponse.json();
  if (error.error.code === 'DASHBOARD_ACCESS_DENIED') {
    alert('You cannot access this dashboard. Please use the admin dashboard.');
  }
}
```

### Store Dashboard Login

```javascript
// Store Dashboard Login
const loginResponse = await fetch('https://sbb-medicare-api.onrender.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mobileEmail: 'store@example.com',
    password: 'password123',
    dashboardType: 'store'  // Required for store dashboard
  })
});

if (loginResponse.status === 403) {
  const error = await loginResponse.json();
  if (error.error.code === 'DASHBOARD_ACCESS_DENIED') {
    alert('You cannot access this dashboard. Please use the store dashboard.');
  }
}
```

## OTP Login

The OTP verification endpoint also supports `dashboardType`:

**Endpoint:** `POST /api/auth/otp/verify`

**Request Body:**
```json
{
  "mobile": "9876543210",
  "otp": "123456",
  "dashboardType": "store"  // Optional
}
```

## Error Responses

### 403 Forbidden - Dashboard Access Denied

```json
{
  "success": false,
  "error": {
    "code": "DASHBOARD_ACCESS_DENIED",
    "message": "Admin users cannot access the store dashboard. Please use the admin dashboard."
  }
}
```

## Backward Compatibility

- If `dashboardType` is not provided, login will succeed (backward compatible)
- However, for security, it's **recommended** to always specify `dashboardType` in production

## Testing

### Test Case 1: Admin → Store Dashboard (Should Fail)
```bash
curl -X POST https://sbb-medicare-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "mobileEmail": "admin@example.com",
    "password": "password123",
    "dashboardType": "store"
  }'
```

**Expected:** 403 Forbidden

### Test Case 2: Admin → Admin Dashboard (Should Succeed)
```bash
curl -X POST https://sbb-medicare-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "mobileEmail": "admin@example.com",
    "password": "password123",
    "dashboardType": "admin"
  }'
```

**Expected:** 200 OK

### Test Case 3: Store Manager → Admin Dashboard (Should Fail)
```bash
curl -X POST https://sbb-medicare-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "mobileEmail": "store@example.com",
    "password": "password123",
    "dashboardType": "admin"
  }'
```

**Expected:** 403 Forbidden

### Test Case 4: Store Manager → Store Dashboard (Should Succeed)
```bash
curl -X POST https://sbb-medicare-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "mobileEmail": "store@example.com",
    "password": "password123",
    "dashboardType": "store"
  }'
```

**Expected:** 200 OK

## Security Benefits

1. **Prevents unauthorized access** to dashboards
2. **Clear error messages** guide users to the correct dashboard
3. **Logging** tracks unauthorized access attempts
4. **Backward compatible** - existing integrations continue to work

## Logging

All dashboard access attempts are logged:
- Successful logins include `dashboardType` in logs
- Failed attempts log the reason (admin trying store dashboard, etc.)

Example log entry:
```
Login failed - admin trying to access store dashboard
{
  userId: "...",
  email: "admin@example.com",
  role: "admin",
  dashboardType: "store"
}
```




