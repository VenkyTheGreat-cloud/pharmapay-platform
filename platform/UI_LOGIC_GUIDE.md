# Delivery Boys UI Logic Guide

## Field Definitions

### `status` (Approval Workflow)
- **"pending"**: Delivery boy has registered but not yet approved by admin
- **"approved"**: Admin has approved the delivery boy
- **"rejected"**: Admin has rejected the delivery boy

### `is_active` (Operational Status)
- **true**: Delivery boy is currently active and can work
- **false**: Delivery boy is currently inactive/deactivated

## UI Display Logic

### Status Column
**Use: `status` field**
- Display the approval status:
  - `status: "pending"` → Show "Pending Approval" (yellow badge)
  - `status: "approved"` → Show "Approved" (green badge)
  - `status: "rejected"` → Show "Rejected" (red badge)

### Active/Inactive Tabs
**Use: `is_active` field**

**Option 1: Simple (Recommended)**
- **"Active" tab**: Show all where `is_active === true`
- **"Inactive" tab**: Show all where `is_active === false`

**Option 2: Combined Logic (Stricter)**
- **"Active" tab**: Show only where `status === "approved" AND is_active === true`
- **"Inactive" tab**: Show all where `status !== "approved" OR is_active === false`

### Your Current Case
```json
{
  "status": "pending",
  "is_active": true
}
```

**For Status Column:**
- Show: **"Pending Approval"** (yellow badge)

**For Active Tab (Option 1 - Simple):**
- ✅ **Include** - Because `is_active === true`

**For Active Tab (Option 2 - Stricter):**
- ❌ **Exclude** - Because `status !== "approved"` (even though `is_active === true`)

## Recommended Approach

**Use Option 1 (Simple):**
- Active/Inactive tabs should filter by `is_active` only
- Status column shows `status` field
- This allows flexibility: a delivery boy can be pending but temporarily activated, or approved but deactivated

## API Usage

**Get all delivery boys:**
```
GET /api/delivery-boys
```

**Get only active delivery boys:**
```
GET /api/delivery-boys?is_active=true
```

**Get only approved and active:**
```
GET /api/delivery-boys/approved
```

The response now includes counts:
```json
{
  "success": true,
  "data": {
    "delivery_boys": [...],
    "count": 1,
    "active_count": 1,
    "inactive_count": 0
  }
}
```

## Workflow

1. **Registration**: `status: "pending"`, `is_active: false`
2. **Admin Approval**: `status: "approved"`, `is_active: true` (via `/approve` endpoint)
3. **Admin Toggle**: Change `is_active` without changing `status` (via `/toggle-active` endpoint)









