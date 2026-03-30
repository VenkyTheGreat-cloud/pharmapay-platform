# Change Password API Documentation

## Overview

The change password API allows authenticated users (admin, store managers, and delivery boys) to change their password by providing their old password and a new password.

## Endpoint

```
POST /api/auth/change-password
```

## Authentication

**Required:** Yes  
**Header:** `Authorization: Bearer <access_token>`

## Request Body

```json
{
  "oldPassword": "current_password",
  "newPassword": "new_password_123"
}
```

**Alternative Field Names (Also Supported):**
```json
{
  "current_password": "current_password",
  "new_password": "new_password_123"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `oldPassword` or `current_password` | string | Yes | Current password of the user |
| `newPassword` or `new_password` | string | Yes | New password (minimum 6 characters) |

**Note:** You can use either camelCase (`oldPassword`, `newPassword`) or snake_case (`current_password`, `new_password`). Both formats are supported.

### Validation Rules

- `newPassword` must be at least 6 characters long
- `oldPassword` must match the current password
- User must be authenticated

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": null,
  "message": "Password changed successfully"
}
```

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "New password must be at least 6 characters"
  }
}
```

#### 400 Bad Request - No Password Set

```json
{
  "success": false,
  "error": {
    "code": "NO_PASSWORD_SET",
    "message": "No password set for this account"
  }
}
```

#### 401 Unauthorized - Invalid Password

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "Old password is incorrect"
  }
}
```

#### 404 Not Found - User Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

## Usage Examples

### Store Manager Change Password

```javascript
// Store Manager changing password
const changePassword = async (oldPassword, newPassword) => {
  const response = await fetch('https://pharmapay-api.onrender.com/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      oldPassword: oldPassword,
      newPassword: newPassword
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Password changed successfully');
    // Optionally logout and redirect to login
  } else {
    console.error('Error:', result.error.message);
  }
  
  return result;
};

// Usage
changePassword('oldPassword123', 'newPassword456');
```

### Admin Change Password

```javascript
// Same endpoint works for admin
const response = await fetch('https://pharmapay-api.onrender.com/api/auth/change-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    oldPassword: 'adminOldPass',
    newPassword: 'adminNewPass'
  })
});
```

### Delivery Boy Change Password

```javascript
// Same endpoint works for delivery boys
const response = await fetch('https://pharmapay-api.onrender.com/api/auth/change-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${deliveryBoyToken}`
  },
  body: JSON.stringify({
    oldPassword: 'oldPass',
    newPassword: 'newPass'
  })
});
```

## cURL Examples

### Store Manager

```bash
curl -X POST https://pharmapay-api.onrender.com/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "oldPassword": "current_password",
    "newPassword": "new_password_123"
  }'
```

### Admin

```bash
curl -X POST https://pharmapay-api.onrender.com/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -d '{
    "oldPassword": "adminOldPass",
    "newPassword": "adminNewPass"
  }'
```

## Frontend Integration (React Example)

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const ChangePasswordForm = () => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        'https://pharmapay-api.onrender.com/api/auth/change-password',
        {
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Password changed successfully!');
        // Optionally logout and redirect
        setTimeout(() => {
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error.message);
      } else {
        setError('Failed to change password. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Old Password:</label>
        <input
          type="password"
          name="oldPassword"
          value={formData.oldPassword}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>New Password:</label>
        <input
          type="password"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          required
          minLength={6}
        />
      </div>
      <div>
        <label>Confirm New Password:</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
      <button type="submit">Change Password</button>
    </form>
  );
};

export default ChangePasswordForm;
```

## Security Notes

1. **Password Requirements:**
   - Minimum 6 characters
   - No maximum length enforced (but recommended to keep it reasonable)

2. **Authentication:**
   - User must be logged in (valid access token required)
   - Old password must be verified before allowing change

3. **Password Hashing:**
   - Passwords are hashed using bcrypt before storage
   - Old password is verified using bcrypt comparison

4. **Best Practices:**
   - After password change, consider logging out the user
   - Require re-authentication for sensitive operations
   - Show success message and redirect to login

## Supported Roles

- ✅ **Admin** - Can change password
- ✅ **Store Manager** - Can change password
- ✅ **Delivery Boy** - Can change password

## Error Handling

All errors are logged on the server side for security monitoring. Common errors:

1. **Invalid old password** - User entered wrong current password
2. **Password too short** - New password doesn't meet minimum length
3. **User not found** - Token is valid but user doesn't exist (rare)
4. **No password set** - Account was created without password (delivery boys)

## Testing

### Test Case 1: Valid Password Change
```bash
# Login first to get token
TOKEN="your_access_token"

curl -X POST https://pharmapay-api.onrender.com/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "currentPass",
    "newPassword": "newPass123"
  }'
```

**Expected:** 200 OK with success message

### Test Case 2: Wrong Old Password
```bash
curl -X POST https://pharmapay-api.onrender.com/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "wrongPassword",
    "newPassword": "newPass123"
  }'
```

**Expected:** 401 Unauthorized - Invalid password

### Test Case 3: Password Too Short
```bash
curl -X POST https://pharmapay-api.onrender.com/api/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "currentPass",
    "newPassword": "123"
  }'
```

**Expected:** 400 Bad Request - Validation error

## Notes

- The endpoint works for all user roles (admin, store_manager, delivery_boy)
- Password is hashed using bcrypt before storage
- Old password verification is required for security
- No password history or complexity requirements are enforced (can be added if needed)

