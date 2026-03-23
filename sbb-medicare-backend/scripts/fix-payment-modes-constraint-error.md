# Fix Payment Modes Constraint Error

## Common Error Causes

When executing the payment modes migration, you might encounter these errors:

### Error 1: Constraint Already Exists
```
ERROR: constraint "orders_payment_mode_check" already exists
```

**Solution**: The constraint name might already exist. Use the step-by-step script to find and drop the existing constraint first.

### Error 2: Existing Data Violates Constraint
```
ERROR: check constraint "orders_payment_mode_check" is violated by some row
```

**Solution**: There are existing records with `BANK_TRANSFER` that need to be updated first.

### Error 3: Constraint Name Different
```
ERROR: constraint "orders_payment_mode_check" does not exist
```

**Solution**: The constraint might have a different name. Find the actual name first.

---

## Step-by-Step Fix

### Step 1: Check Current State

```sql
-- Check current constraints
SELECT 
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND pg_get_constraintdef(oid) LIKE '%payment_mode%';

SELECT 
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
AND pg_get_constraintdef(oid) LIKE '%payment_mode%';
```

### Step 2: Check for BANK_TRANSFER Records

```sql
-- Check if there are any BANK_TRANSFER records
SELECT COUNT(*) FROM orders WHERE payment_mode = 'BANK_TRANSFER';
SELECT COUNT(*) FROM payments WHERE payment_mode = 'BANK_TRANSFER';
```

### Step 3: Update BANK_TRANSFER Records (if any exist)

```sql
-- Convert BANK_TRANSFER to CARD
UPDATE orders 
SET payment_mode = 'CARD' 
WHERE payment_mode = 'BANK_TRANSFER';

UPDATE payments 
SET payment_mode = 'CARD' 
WHERE payment_mode = 'BANK_TRANSFER';
```

### Step 4: Find Actual Constraint Names

```sql
-- Find the actual constraint name for orders
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'orders'::regclass 
AND pg_get_constraintdef(oid) LIKE '%payment_mode%';

-- Find the actual constraint name for payments
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'payments'::regclass 
AND pg_get_constraintdef(oid) LIKE '%payment_mode%';
```

### Step 5: Drop Constraints Using Actual Names

```sql
-- Replace <actual_name> with the name from Step 4
ALTER TABLE orders DROP CONSTRAINT IF EXISTS <actual_name>;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS <actual_name>;
```

### Step 6: Add New Constraints

```sql
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT') OR payment_mode IS NULL);

ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT'));
```

---

## Alternative: Drop All Payment Mode Constraints

If you're still having issues, you can drop ALL constraints related to payment_mode:

```sql
-- Drop all payment_mode constraints from orders
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'orders'::regclass 
        AND pg_get_constraintdef(oid) LIKE '%payment_mode%'
    LOOP
        EXECUTE 'ALTER TABLE orders DROP CONSTRAINT IF EXISTS ' || r.conname;
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END $$;

-- Drop all payment_mode constraints from payments
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'payments'::regclass 
        AND pg_get_constraintdef(oid) LIKE '%payment_mode%'
    LOOP
        EXECUTE 'ALTER TABLE payments DROP CONSTRAINT IF EXISTS ' || r.conname;
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END $$;
```

Then add the new constraints:

```sql
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT') OR payment_mode IS NULL);

ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT'));
```

---

## Quick Fix Script

If you want a single script that handles everything:

```sql
-- 1. Update existing BANK_TRANSFER records
UPDATE orders SET payment_mode = 'CARD' WHERE payment_mode = 'BANK_TRANSFER';
UPDATE payments SET payment_mode = 'CARD' WHERE payment_mode = 'BANK_TRANSFER';

-- 2. Drop all payment_mode constraints
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Orders
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'orders'::regclass 
        AND pg_get_constraintdef(oid) LIKE '%payment_mode%'
    LOOP
        EXECUTE 'ALTER TABLE orders DROP CONSTRAINT IF EXISTS ' || r.conname;
    END LOOP;
    
    -- Payments
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'payments'::regclass 
        AND pg_get_constraintdef(oid) LIKE '%payment_mode%'
    LOOP
        EXECUTE 'ALTER TABLE payments DROP CONSTRAINT IF EXISTS ' || r.conname;
    END LOOP;
END $$;

-- 3. Add new constraints
ALTER TABLE orders ADD CONSTRAINT orders_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT') OR payment_mode IS NULL);

ALTER TABLE payments ADD CONSTRAINT payments_payment_mode_check 
    CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT'));
```

---

## Verify Success

After running the migration, verify:

```sql
-- Check constraints
SELECT 
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
AND conname = 'orders_payment_mode_check';

SELECT 
    conname, 
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
AND conname = 'payments_payment_mode_check';

-- Check for any remaining BANK_TRANSFER
SELECT COUNT(*) FROM orders WHERE payment_mode = 'BANK_TRANSFER';
SELECT COUNT(*) FROM payments WHERE payment_mode = 'BANK_TRANSFER';
```

All counts should be 0, and constraints should show CREDIT (not BANK_TRANSFER).
