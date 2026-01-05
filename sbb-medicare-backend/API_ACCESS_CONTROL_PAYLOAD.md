# POST /api/access-control - Create Store Manager

## Endpoint
```
POST https://sbb-medicare-api.onrender.com/api/access-control
```

## Authentication
- **Required**: Yes
- **Header**: `Authorization: Bearer <JWT_TOKEN>`
- **Role Required**: `admin` only

## Request Payload

### Required Fields
- `name` (string): Store manager's full name
- `mobile` (string): Mobile number (must be unique)
- `email` (string): Email address (must be unique, will be lowercased)
- `password` (string): Password (will be hashed automatically)

### Optional Fields
- `store_name` (string): Name of the store (nullable)
- `address` (string): Address (nullable)

## Example Payload

### Minimal (Required fields only)
```json
{
  "name": "John Doe",
  "mobile": "9876543210",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

### Complete (All fields)
```json
{
  "name": "John Doe",
  "mobile": "9876543210",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "store_name": "ABC Medical Store",
  "address": "123 Main Street, City, State, PIN"
}
```

## Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "John Doe",
    "store_name": "ABC Medical Store",
    "mobile": "9876543210",
    "email": "john.doe@example.com",
    "address": "123 Main Street, City, State, PIN",
    "role": "store_manager",
    "is_active": true,
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T10:30:00.000Z"
  },
  "message": "Store manager created successfully"
}
```

## Error Responses

### 400 - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name, mobile, email, and password are required"
  }
}
```

### 401 - Unauthorized (Missing/Invalid Token)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Access denied"
  }
}
```

### 403 - Forbidden (Not Admin Role)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required"
  }
}
```

### 409 - Duplicate Email
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "Email already registered"
  }
}
```

### 409 - Duplicate Mobile
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_MOBILE",
    "message": "Mobile number already registered"
  }
}
```

## cURL Example
```bash
curl -X POST https://sbb-medicare-api.onrender.com/api/access-control \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "name": "John Doe",
    "mobile": "9876543210",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "store_name": "ABC Medical Store",
    "address": "123 Main Street"
  }'
```

## JavaScript/Fetch Example
```javascript
const response = await fetch('https://sbb-medicare-api.onrender.com/api/access-control', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${yourJwtToken}`
  },
  body: JSON.stringify({
    name: "John Doe",
    mobile: "9876543210",
    email: "john.doe@example.com",
    password: "SecurePassword123!",
    store_name: "ABC Medical Store",
    address: "123 Main Street"
  })
});

const data = await response.json();
console.log(data);
```

## Notes
1. The `role` field is automatically set to `'store_manager'` - you don't need to include it
2. The `is_active` field is automatically set to `true` - you don't need to include it
3. Email is automatically lowercased
4. Password is automatically hashed (bcrypt)
5. All string fields are trimmed automatically
6. Mobile and Email must be unique across all users





