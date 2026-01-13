# Database Migration Instructions - Update Foreign Keys to UUID

## ⚠️ Important: Back up your database first!

```bash
pg_dump -U postgres -d sbb_medicare > backup_before_migration.sql
```

## Step 1: Check Current State

Run this to see what data exists:
```bash
psql -U postgres -d sbb_medicare -f scripts/check-data-before-migration.sql
```

## Step 2: Choose Migration Method

### Option A: Simple Migration (Recommended if foreign keys are mostly NULL or empty)

Use this if:
- Foreign key columns are mostly NULL
- Tables are new/empty
- You don't need to preserve existing foreign key values

```bash
psql -U postgres -d sbb_medicare -f scripts/migrate-foreign-keys-to-uuid-simple.sql
```

**What it does:**
- Sets all existing BIGINT foreign key values to NULL
- Converts columns to UUID type
- Recreates foreign key constraints
- **Preserves all other data in the tables**

### Option B: Safe Migration (If you have valid UUID values to preserve)

Use this if:
- Foreign key columns already contain valid UUID strings
- You want to preserve existing relationships

```bash
psql -U postgres -d sbb_medicare -f scripts/migrate-foreign-keys-to-uuid-safe.sql
```

**What it does:**
- Validates UUID format before conversion
- Only converts valid UUIDs
- Sets invalid values to NULL
- **More complex but safer**

## Step 3: Verify Migration

After running migration, verify:
```sql
SELECT 
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN data_type = 'uuid' THEN '✅ Correct'
        ELSE '❌ Wrong'
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

## Tables Being Updated

1. **delivery_boys.store_id** → UUID
2. **customers.store_id** → UUID
3. **orders.store_id** → UUID
4. **refresh_tokens.user_id** → UUID
5. **order_status_history.changed_by** → UUID

## What Gets Preserved

✅ All table data (rows) - **PRESERVED**
✅ All other columns - **PRESERVED**
✅ Primary keys - **PRESERVED**
⚠️ Foreign key values - Set to NULL (can be updated manually after)

## After Migration

If foreign keys were set to NULL, you may need to:

1. **Update delivery_boys.store_id:**
```sql
UPDATE delivery_boys 
SET store_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE store_id IS NULL;
```

2. **Update customers.store_id:**
```sql
UPDATE customers 
SET store_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE store_id IS NULL;
```

3. **Update orders.store_id:**
```sql
UPDATE orders 
SET store_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE store_id IS NULL;
```

## Rollback

If something goes wrong:
```sql
ROLLBACK;
```

Or restore from backup:
```bash
psql -U postgres -d sbb_medicare < backup_before_migration.sql
```









