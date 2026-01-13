# Delivery Boy Registration & Approval Guide

## Overview

This guide explains how delivery boys register from the mobile app and how admins approve their accounts.

## Registration Flow

### 1. Delivery Boy Registration (Mobile App)

**Endpoint:** `POST /api/auth/register`

**Authentication:** Not required (public endpoint)

**Request Body:**
```json
{
  "name": "John Doe",
  "mobile": "9876543210",
  "email": "john@example.com",
  "password": "password123",
  "address": "123 Main Street, City"
}
```

**Required Fields:**
- `name` (string) - Delivery boy's full name
- `mobile` (string) - Mobile number (must be unique)
- `password` (string) - Password for login (minimum 6 characters)
- `email` (string, optional) - Email address
- `address` (string, optional) - Address

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "mobile": "9876543210",
    "status": "pending"
  },
  "message": "Registration successful. Pending approval."
}
```

**Error Responses:**

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

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name and mobile are required"
  }
}
```

### 2. Account Status After Registration

After registration, the delivery boy account has:
- `status`: `"pending"` (awaiting admin approval)
- `is_active`: `false` (cannot login until approved)
- `password_hash`: Set (password is stored)

**Important:** Delivery boys **cannot login** until admin approves their account.

---

## Admin Approval Flow

### 1. View Pending Delivery Boys

**Endpoint:** `GET /api/delivery-boys?status=pending`

**Authentication:** Required (admin or store_manager)

**Response:**
```json
{
  "success": true,
  "data": {
    "delivery_boys": [
      {
        "id": 1,
        "name": "John Doe",
        "mobile": "9876543210",
        "email": "john@example.com",
        "address": "123 Main Street",
        "status": "pending",
        "is_active": false,
        "created_at": "2025-01-15T10:30:00.000Z"
      }
    ],
    "count": 1
  }
}
```

### 2. Approve Delivery Boy

**Endpoint:** `POST /api/delivery-boys/:id/approve`

**Authentication:** Required (admin only)

**Request Body:** (Optional)
```json
{
  "store_id": "uuid-here"  // Optional: Assign to specific store
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "mobile": "9876543210",
    "email": "john@example.com",
    "address": "123 Main Street",
    "status": "approved",
    "is_active": true,
    "store_id": "uuid-here",
    "updated_at": "2025-01-15T11:00:00.000Z"
  },
  "message": "Delivery boy approved successfully"
}
```

**What happens on approval:**
- `status` changes from `"pending"` to `"approved"`
- `is_active` changes from `false` to `true`
- Delivery boy can now login
- Optionally assigned to a store (`store_id`)

### 3. Reject Delivery Boy (Optional)

**Endpoint:** `PUT /api/delivery-boys/:id`

**Authentication:** Required (admin only)

**Request Body:**
```json
{
  "status": "rejected"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "rejected",
    "is_active": false
  },
  "message": "Delivery boy updated successfully"
}
```

---

## Complete Workflow

### Step 1: Delivery Boy Registers (Mobile App)

```javascript
// Mobile App - Registration
const registerDeliveryBoy = async () => {
  const response = await fetch('https://sbb-medicare-api.onrender.com/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'John Doe',
      mobile: '9876543210',
      email: 'john@example.com',
      password: 'password123',
      address: '123 Main Street, City'
    })
  });

  const result = await response.json();
  
  if (result.success) {
    alert('Registration successful! Waiting for admin approval.');
    // Show message: "Your account is pending approval. You will be notified once approved."
  } else {
    alert('Registration failed: ' + result.error.message);
  }
};
```

### Step 2: Admin Views Pending Requests

```javascript
// Admin Dashboard - View Pending
const getPendingDeliveryBoys = async () => {
  const token = localStorage.getItem('adminToken');
  
  const response = await fetch(
    'https://sbb-medicare-api.onrender.com/api/delivery-boys?status=pending',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  const result = await response.json();
  return result.data.delivery_boys;
};
```

### Step 3: Admin Approves

```javascript
// Admin Dashboard - Approve
const approveDeliveryBoy = async (deliveryBoyId, storeId = null) => {
  const token = localStorage.getItem('adminToken');
  
  const response = await fetch(
    `https://sbb-medicare-api.onrender.com/api/delivery-boys/${deliveryBoyId}/approve`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        store_id: storeId  // Optional
      })
    }
  );

  const result = await response.json();
  
  if (result.success) {
    alert('Delivery boy approved successfully!');
    // Refresh the list
  }
};
```

### Step 4: Delivery Boy Logs In (After Approval)

```javascript
// Mobile App - Login (after approval)
const login = async () => {
  const response = await fetch('https://sbb-medicare-api.onrender.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mobileEmail: '9876543210',  // Can use mobile or email
      password: 'password123'
    })
  });

  const result = await response.json();
  
  if (result.success) {
    // Save token
    localStorage.setItem('accessToken', result.data.token);
    // Navigate to dashboard
  } else {
    if (result.error.code === 'NOT_APPROVED') {
      alert('Your account is still pending approval.');
    } else {
      alert('Login failed: ' + result.error.message);
    }
  }
};
```

---

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Delivery boy registration |
| `/api/delivery-boys?status=pending` | GET | Yes | Get pending delivery boys |
| `/api/delivery-boys/:id/approve` | POST | Yes (Admin) | Approve delivery boy |
| `/api/delivery-boys/:id` | PUT | Yes (Admin) | Update delivery boy (reject) |
| `/api/auth/login` | POST | No | Login (after approval) |

---

## Status Flow

```
Registration
    ↓
status: "pending"
is_active: false
    ↓
Admin Approves
    ↓
status: "approved"
is_active: true
    ↓
Can Login ✅
```

---

## Error Handling

### Registration Errors

1. **DUPLICATE_MOBILE** - Mobile number already exists
   - Solution: Use different mobile number or login if already registered

2. **VALIDATION_ERROR** - Missing required fields
   - Solution: Ensure name, mobile, and password are provided

### Login Errors (Before Approval)

1. **NOT_APPROVED** - Account not approved yet
   - Message: "Delivery boy account is not approved yet. Please contact administrator."
   - Solution: Wait for admin approval

2. **INACTIVE_USER** - Account is inactive
   - Message: "User account is inactive. Please contact administrator."
   - Solution: Contact admin to activate account

---

## Mobile App Implementation Example

### Registration Screen

```jsx
import React, { useState } from 'react';

const DeliveryBoyRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://sbb-medicare-api.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        // Show success message
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div>
        <h2>Registration Successful!</h2>
        <p>Your account is pending approval. You will be notified once approved.</p>
        <button onClick={() => navigation.navigate('Login')}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Full Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      <input
        placeholder="Mobile Number"
        value={formData.mobile}
        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
        required
      />
      <input
        placeholder="Email (Optional)"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        type="email"
      />
      <input
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        type="password"
        required
        minLength={6}
      />
      <input
        placeholder="Address (Optional)"
        value={formData.address}
        onChange={(e) => setFormData({...formData, address: e.target.value})}
      />
      {error && <div style={{color: 'red'}}>{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default DeliveryBoyRegistration;
```

---

## Admin Dashboard Implementation

### Pending Delivery Boys List

```jsx
import React, { useState, useEffect } from 'react';

const PendingDeliveryBoys = () => {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingDeliveryBoys();
  }, []);

  const fetchPendingDeliveryBoys = async () => {
    const token = localStorage.getItem('adminToken');
    
    const response = await fetch(
      'https://sbb-medicare-api.onrender.com/api/delivery-boys?status=pending',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const result = await response.json();
    if (result.success) {
      setDeliveryBoys(result.data.delivery_boys);
    }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    const token = localStorage.getItem('adminToken');
    
    const response = await fetch(
      `https://sbb-medicare-api.onrender.com/api/delivery-boys/${id}/approve`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    if (result.success) {
      alert('Delivery boy approved!');
      fetchPendingDeliveryBoys(); // Refresh list
    }
  };

  return (
    <div>
      <h2>Pending Delivery Boys</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveryBoys.map(db => (
              <tr key={db.id}>
                <td>{db.name}</td>
                <td>{db.mobile}</td>
                <td>{db.email}</td>
                <td>
                  <button onClick={() => handleApprove(db.id)}>
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PendingDeliveryBoys;
```

---

## Notes

1. **Password is required** during registration - delivery boys set their own password
2. **Account is pending** after registration - cannot login until approved
3. **Admin must approve** - changes status to "approved" and activates account
4. **Store assignment** - Admin can optionally assign delivery boy to a store during approval
5. **Login after approval** - Delivery boy can login using mobile/email and password






