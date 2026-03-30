# 📋 Access Control Filtering - Implementation

## Requirements

For the access-control screen, you need 3 tabs:
1. **All** - Show all store managers (both active and inactive)
2. **Active** - Show only active store managers (`is_active = true`, `status = 'active'`)
3. **Inactive** - Show only inactive store managers (`is_active = false`, `status = 'inactive'`)

## ✅ What I Implemented

### 1. Filtering Endpoint
The `GET /api/access-control` endpoint now supports a `filter` query parameter:

**Endpoints:**
- `GET /api/access-control` - Returns all store managers
- `GET /api/access-control?filter=all` - Returns all store managers
- `GET /api/access-control?filter=active` - Returns only active store managers
- `GET /api/access-control?filter=inactive` - Returns only inactive store managers

### 2. Data Normalization
- Fixed `is_active` to always be boolean (not string)
- Fixed `status` to always be 'active' or 'inactive' (not null or 'pending')
- Normalized response data types

### 3. Response Format
```json
{
  "success": true,
  "data": {
    "store_managers": [...],
    "count": 8,
    "active_count": 2,
    "inactive_count": 6,
    "filter": "all"
  }
}
```

## 🔧 Fix Database Data First

**IMPORTANT:** Your database has invalid data:
- `is_active` is sometimes string ("true", "false", "pending")
- `status` is sometimes null

**Run this SQL to fix it:**

```sql
-- File: scripts/fix-invalid-status-data.sql
```

Or run this directly:

```sql
BEGIN;

-- Fix records where is_active is 'pending' or invalid
UPDATE users
SET 
    is_active = false,
    status = 'inactive',
    updated_at = CURRENT_TIMESTAMP
WHERE is_active::text = 'pending' OR is_active IS NULL;

-- Fix records where status is NULL
UPDATE users
SET 
    status = CASE 
        WHEN is_active = true OR is_active::text = 'true' THEN 'active'
        ELSE 'inactive'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE status IS NULL OR status = '';

-- Convert string booleans to actual booleans
UPDATE users
SET 
    is_active = CASE 
        WHEN is_active::text IN ('true', 't', '1') THEN true
        ELSE false
    END,
    status = CASE 
        WHEN is_active::text IN ('true', 't', '1') THEN 'active'
        ELSE 'inactive'
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE is_active::text NOT IN ('true', 'false');

COMMIT;
```

## 📝 Frontend Usage

### All Tab
```javascript
GET /api/access-control
// or
GET /api/access-control?filter=all
```

### Active Tab
```javascript
GET /api/access-control?filter=active
```

### Inactive Tab
```javascript
GET /api/access-control?filter=inactive
```

## ✅ After Fixing

After running the SQL fix and deploying:
- ✅ All records will have proper `is_active` (boolean)
- ✅ All records will have proper `status` ('active' or 'inactive')
- ✅ Filtering will work correctly
- ✅ Response data types will be consistent

## 🎯 Response Examples

### All Tab Response
```json
{
  "success": true,
  "data": {
    "store_managers": [
      { "is_active": true, "status": "active", ... },
      { "is_active": false, "status": "inactive", ... }
    ],
    "count": 8,
    "active_count": 2,
    "inactive_count": 6,
    "filter": "all"
  }
}
```

### Active Tab Response
```json
{
  "success": true,
  "data": {
    "store_managers": [
      { "is_active": true, "status": "active", ... }
    ],
    "count": 2,
    "active_count": 2,
    "inactive_count": 0,
    "filter": "active"
  }
}
```

### Inactive Tab Response
```json
{
  "success": true,
  "data": {
    "store_managers": [
      { "is_active": false, "status": "inactive", ... }
    ],
    "count": 6,
    "active_count": 0,
    "inactive_count": 6,
    "filter": "inactive"
  }
}
```









