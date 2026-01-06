# 📡 Updated API Endpoints for Frontend

## 🔴 **NEW APIs Created in This Session**

### 1. Delivery Boys Management (`/api/delivery-boys`)

**All endpoints require authentication (Bearer token)**
**Authorization: Admin or Store Manager**

#### Get All Delivery Boys
```
GET /api/delivery-boys
GET /api/delivery-boys?status=approved
GET /api/delivery-boys?is_active=true
GET /api/delivery-boys?store_id=UUID
```

**Response:**
```json
{
  "success": true,
  "data": {
    "delivery_boys": [
      {
        "id": "1",
        "name": "Delivery Boy Name",
        "mobile": "9876543210",
        "email": "boy@example.com",
        "address": "Address",
        "photo_url": null,
        "status": "pending",  // "pending", "approved", "rejected"
        "is_active": true,    // true or false
        "store_id": "UUID",
        "created_at": "2025-11-28T01:44:04.459Z",
        "updated_at": "2025-11-28T02:04:38.504Z",
        "store_name": "Store Name"
      }
    ],
    "count": 1,
    "active_count": 1,    // ⭐ NEW: For Active tab
    "inactive_count": 0   // ⭐ NEW: For Inactive tab
  }
}
```

#### Get Approved Delivery Boys
```
GET /api/delivery-boys/approved
```

**Response:** Same format as above, but only `status: "approved" AND is_active: true`

#### Get Delivery Boy by ID
```
GET /api/delivery-boys/:id
```

#### Create Delivery Boy
```
POST /api/delivery-boys
Authorization: Admin or Store Manager

Body:
{
  "name": "Name",
  "mobile": "9876543210",
  "email": "email@example.com",
  "address": "Address",
  "photo_url": "url" (optional),
  "store_id": "UUID" (optional, defaults to current user's store)
}
```

#### Update Delivery Boy
```
PUT /api/delivery-boys/:id
Authorization: Admin or Store Manager

Body:
{
  "name": "Updated Name",
  "mobile": "9876543210",
  "email": "email@example.com",
  "address": "Address",
  "photo_url": "url"
}
```

#### Delete Delivery Boy
```
DELETE /api/delivery-boys/:id
Authorization: Admin only
```

#### Approve Delivery Boy
```
PATCH /api/delivery-boys/:id/approve
Authorization: Admin only

Response:
{
  "success": true,
  "data": {
    "status": "approved",
    "is_active": true,
    ...
  },
  "message": "Delivery boy approved successfully"
}
```

#### Toggle Active Status ⭐ UPDATED
```
PATCH /api/delivery-boys/:id/toggle-active
Authorization: Admin only

Body (supports both formats):
{
  "isActive": true    // camelCase
}
// OR
{
  "is_active": true   // snake_case
}
// OR (no body - toggles automatically)

Response:
{
  "success": true,
  "data": {
    "status": "approved",    // ⭐ Automatically updated!
    "is_active": true,       // Updated
    ...
  },
  "message": "Delivery boy activated and approved successfully"
}
```

**Important:** 
- When `is_active: true` → `status` automatically becomes `"approved"`
- When `is_active: false` → `status` automatically becomes `"pending"`

---

### 2. Access Control - Store Managers (`/api/access-control`) ⭐ NEW

**All endpoints require authentication (Bearer token)**
**Authorization: Admin only**

#### Get All Store Managers
```
GET /api/access-control
```

**Response:**
```json
{
  "success": true,
  "data": {
    "store_managers": [
      {
        "id": "UUID",
        "name": "Manager Name",
        "store_name": "Store Name",
        "mobile": "9876543210",
        "email": "manager@example.com",
        "address": "Address",
        "role": "store_manager",
        "is_active": true,
        "created_at": "2025-11-28T01:44:04.459Z",
        "updated_at": "2025-11-28T02:04:38.504Z"
      }
    ],
    "count": 1
  }
}
```

#### Get Store Manager by ID
```
GET /api/access-control/:id
```

#### Create Store Manager
```
POST /api/access-control
Authorization: Admin only

Body:
{
  "name": "Manager Name",
  "store_name": "Store Name",
  "mobile": "9876543210",
  "email": "manager@example.com",
  "password": "password123",
  "address": "Address" (optional)
}

Required: name, mobile, email, password
```

#### Update Store Manager
```
PUT /api/access-control/:id
Authorization: Admin only

Body:
{
  "name": "Updated Name",
  "store_name": "Store Name",
  "mobile": "9876543210",
  "email": "email@example.com",
  "address": "Address"
}
```

#### Delete Store Manager
```
DELETE /api/access-control/:id
Authorization: Admin only
```

#### Toggle Active Status
```
PATCH /api/access-control/:id/toggle-active
Authorization: Admin only

Body:
{
  "isActive": true    // or "is_active": true
}
// OR no body (toggles automatically)
```

---

## 📝 Field Mapping Guide

### Delivery Boy Status Logic

| `status` field | `is_active` field | UI Display | Tab Category |
|---------------|-------------------|------------|--------------|
| `"pending"` | `false` | "Pending Approval" (yellow) | Inactive |
| `"pending"` | `true` | "Pending Approval" (yellow) | Active |
| `"approved"` | `true` | "Approved" (green) | Active |
| `"approved"` | `false` | "Approved" (green) | Inactive |
| `"rejected"` | `false` | "Rejected" (red) | Inactive |

**Important Notes:**
- **Status Column**: Use `status` field for display
- **Active/Inactive Tabs**: Use `is_active` field for filtering
- **Toggle Behavior**: When `is_active` changes, `status` automatically updates:
  - `is_active: true` → `status: "approved"`
  - `is_active: false` → `status: "pending"`

---

## 🔑 Authentication

All endpoints (except public auth endpoints) require:

```
Authorization: Bearer <access_token>
```

**Token obtained from:**
```
POST /api/auth/login
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "access_token_here",
    "refreshToken": "refresh_token_here",
    "user": { ... }
  }
}
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

---

## 🚀 Quick Reference

### Delivery Boys Tab Filtering

**Get all:**
```javascript
GET /api/delivery-boys
// Use data.count, data.active_count, data.inactive_count for tabs
```

**Filter by active status:**
```javascript
GET /api/delivery-boys?is_active=true   // Active tab
GET /api/delivery-boys?is_active=false  // Inactive tab
```

**Filter by approval status:**
```javascript
GET /api/delivery-boys?status=approved
GET /api/delivery-boys?status=pending
```

**Get only approved and active:**
```javascript
GET /api/delivery-boys/approved
```

---

## 🎯 Frontend Implementation Tips

1. **Tab Counts**: Use `active_count` and `inactive_count` from the response for tab badges
2. **Status Display**: Show `status` field in the Status column
3. **Toggle Active**: When toggling, both `status` and `is_active` will be updated automatically
4. **Field Names**: API accepts both `isActive` (camelCase) and `is_active` (snake_case) in request bodies
5. **Error Handling**: Check `success: false` and use `error.code` and `error.message` for user-friendly messages

---

## 📞 Base URL

**Production:**
```
https://sbb-medicare-api.onrender.com/api
```

**Development:**
```
http://localhost:5000/api
```






