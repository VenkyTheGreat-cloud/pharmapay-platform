# Database Update Checklist

## Tables That Need UUID Foreign Keys (if users.id is UUID)

Since your `users.id` is **UUID**, these tables must have UUID foreign keys:

### ✅ Tables That Reference `users(id)`

1. **`delivery_boys`**
   - Column: `store_id`
   - Should be: `UUID` (not BIGINT)
   - Current schema: ✅ Already UUID in schema.sql

2. **`customers`**
   - Column: `store_id`
   - Should be: `UUID` (not BIGINT)
   - Current schema: ✅ Already UUID in schema.sql

3. **`orders`**
   - Column: `store_id`
   - Should be: `UUID` (not BIGINT)
   - Current schema: ✅ Already UUID in schema.sql

4. **`refresh_tokens`**
   - Column: `user_id`
   - Should be: `UUID` (not BIGINT)
   - Current schema: ✅ Already UUID in schema.sql

5. **`order_status_history`**
   - Column: `changed_by`
   - Should be: `UUID` (not BIGINT)
   - Current schema: ✅ Already UUID in schema.sql

## Migration Steps

### Option 1: Full Migration Script (Recommended if tables are empty)

Run the complete migration script:
```bash
psql -U postgres -d sbb_medicare -f scripts/migrate-to-uuid-foreign-keys.sql
```

This will:
- ✅ Drop and recreate all dependent tables with UUID foreign keys
- ✅ Preserve your `users` table (with existing data)
- ✅ Create all indexes and triggers

### Option 2: Check Current State

First, check which tables need updates:

```sql
-- Check all foreign keys to users table
SELECT 
    tc.table_name, 
    kcu.column_name, 
    c.data_type,
    CASE 
        WHEN c.data_type = 'uuid' THEN '✅ Correct'
        ELSE '❌ Needs Update - Should be UUID'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.columns c 
    ON c.table_name = tc.table_name 
    AND c.column_name = kcu.column_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'users'
    AND ccu.column_name = 'id'
ORDER BY tc.table_name;
```

## Quick Verification Query

```sql
-- Check all tables that reference users.id
SELECT 
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'uuid' THEN '✅ OK'
        WHEN data_type = 'bigint' THEN '❌ WRONG - Must be UUID'
        ELSE '⚠️ UNKNOWN'
    END as status
FROM information_schema.columns
WHERE column_name IN ('store_id', 'user_id', 'changed_by')
    AND table_name IN (
        'delivery_boys',
        'customers', 
        'orders',
        'refresh_tokens',
        'order_status_history'
    )
ORDER BY table_name, column_name;
```

## Required Updates Summary

| Table | Column | Current Type | Required Type | Status |
|-------|--------|--------------|---------------|--------|
| `delivery_boys` | `store_id` | ? | UUID | ⚠️ Check |
| `customers` | `store_id` | ? | UUID | ⚠️ Check |
| `orders` | `store_id` | ? | UUID | ⚠️ Check |
| `refresh_tokens` | `user_id` | ? | UUID | ⚠️ Check |
| `order_status_history` | `changed_by` | ? | UUID | ⚠️ Check |

## Important Notes

1. **⚠️ Data Loss Warning**: The migration script will **DROP and RECREATE** tables. If you have data in these tables, you'll lose it unless you:
   - Export data first
   - Or modify the script to preserve data

2. **✅ Users Table**: Your `users` table will **NOT be touched** - all existing data remains safe.

3. **✅ Functions**: The `generate_order_number` function is already updated to handle UUID.







