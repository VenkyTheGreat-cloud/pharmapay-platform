# Delivery Boy Registration Update

## Changes Made

Updated delivery boy registration to work exactly like admin registration:
- ✅ **Email is now REQUIRED** (not optional)
- ✅ **Login works with EITHER email OR mobile**
- ✅ **Duplicate email check** added
- ✅ **Better validation** for email format

## Registration API

### Endpoint
```
POST /api/auth/register
```

### Request Body (All Fields Required)
```json
{
  "name": "John Doe",
  "mobile": "9876543210",
  "email": "john@example.com",
  "password": "password123",
  "address": "123 Main Street"
}
```

**Required Fields:**
- `name` - Full name
- `mobile` - Mobile number (must be unique)
- `email` - Email address (must be unique, valid format)
- `password` - Password (minimum 6 characters)

**Optional Fields:**
- `address` - Address

### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "mobile": "9876543210",
    "email": "john@example.com",
    "status": "pending"
  },
  "message": "Registration successful. Pending approval."
}
```

### Error Responses

**400 Bad Request - Missing Fields:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name, mobile, email, and password are required"
  }
}
```

**400 Bad Request - Invalid Email:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format"
  }
}
```

**409 Conflict - Duplicate Mobile:**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_MOBILE",
    "message": "Mobile number already registered"
  }
}
```

**409 Conflict - Duplicate Email:**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "Email already registered"
  }
}
```

## Login API

### Endpoint
```
POST /api/auth/login
```

### Login with Email
```json
{
  "mobileEmail": "john@example.com",
  "password": "password123"
}
```

### Login with Mobile
```json
{
  "mobileEmail": "9876543210",
  "password": "password123"
}
```

**Both work!** The system automatically detects if it's an email or mobile number.

## Complete Flow

### 1. Registration (Mobile App)
```javascript
const register = async () => {
  const response = await fetch('https://sbb-medicare-api.onrender.com/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'John Doe',
      mobile: '9876543210',
      email: 'john@example.com',  // ✅ Now required
      password: 'password123',
      address: '123 Main Street'
    })
  });

  const result = await response.json();
  // Account created with status: "pending"
};
```

### 2. Admin Approves
```javascript
// Admin approves the delivery boy
POST /api/delivery-boys/:id/approve
```

### 3. Login (After Approval)
```javascript
// Can login with EITHER email OR mobile
const login = async () => {
  // Option 1: Login with email
  const response = await fetch('https://sbb-medicare-api.onrender.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mobileEmail: 'john@example.com',  // ✅ Works with email
      password: 'password123'
    })
  });

  // Option 2: Login with mobile (also works!)
  const response2 = await fetch('https://sbb-medicare-api.onrender.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mobileEmail: '9876543210',  // ✅ Works with mobile
      password: 'password123'
    })
  });
};
```

## Key Features

✅ **Email Required** - Just like admin registration  
✅ **Login with Email** - Works perfectly  
✅ **Login with Mobile** - Also works perfectly  
✅ **Duplicate Checks** - Both email and mobile are checked  
✅ **Email Validation** - Format is validated  
✅ **Same as Admin** - Consistent experience  

## Testing

### Test Registration
```bash
curl -X POST https://sbb-medicare-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "mobile": "9998887776",
    "email": "test@example.com",
    "password": "password123",
    "address": "Test Address"
  }'
```

### Test Login with Email
```bash
curl -X POST https://sbb-medicare-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "mobileEmail": "test@example.com",
    "password": "password123"
  }'
```

### Test Login with Mobile
```bash
curl -X POST https://sbb-medicare-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "mobileEmail": "9998887776",
    "password": "password123"
  }'
```

## Summary

Now delivery boy registration works exactly like admin registration:
- ✅ Email is required
- ✅ Login works with email OR mobile
- ✅ Duplicate email/mobile checks
- ✅ Proper validation

The delivery boy can register with both email and mobile, and login with either one!


