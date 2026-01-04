# 🔧 Fix Toggle Active Issue

## Problem
When toggling `is_active` to `true`, the GET API still shows:
- `is_active: false`
- `status: 'pending'` (wrong - should be 'active' or 'inactive')

## What I Fixed

### 1. Controller Method ✅
Changed from `User.update()` to `User.toggleActive()` which properly syncs status.

**File:** `src/controllers/accessControlController.js`

### 2. Update Method ✅
The `update()` method already syncs status when `is_active` is updated.

**File:** `src/models/User.js`

### 3. Fix Existing Data ⏳
Run this SQL to fix any existing records with wrong status values:

```sql
-- Fix wrong status values
UPDATE users
SET status = CASE 
    WHEN is_active = true THEN 'active'
    WHEN is_active = false THEN 'inactive'
    ELSE 'inactive'
END
WHERE status IS NULL 
   OR status = ''
   OR status NOT IN ('active', 'inactive')
   OR (is_active = true AND status != 'active')
   OR (is_active = false AND status != 'inactive');
```

**Or use:** `scripts/fix-wrong-status-values.sql`

## Status Values

For **store managers (users table):**
- ✅ `'active'` = is_active: true
- ✅ `'inactive'` = is_active: false
- ❌ `'pending'` = WRONG (this is for delivery_boys only)

## Next Steps

1. ✅ **Deploy the code changes** (controller now uses toggleActive)
2. ⏳ **Run the SQL fix** to correct existing data
3. ✅ **Test the toggle** - should work correctly now

## After Fix

When you toggle `is_active` to `true`:
- ✅ `is_active` will be `true`
- ✅ `status` will be `'active'`
- ✅ GET API will show correct values

When you toggle `is_active` to `false`:
- ✅ `is_active` will be `false`
- ✅ `status` will be `'inactive'`
- ✅ GET API will show correct values




