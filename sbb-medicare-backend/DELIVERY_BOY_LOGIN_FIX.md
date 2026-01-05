# Delivery Boy Login Fix

## Summary
Delivery boys can now login with email/mobile and password, just like admin and store managers.

## Changes Made

### 1. Database Schema Update
- Added `password_hash VARCHAR(255)` column to `delivery_boys` table
- Updated `database/schema.sql` to include password_hash

**Run this SQL to add the column:**
```sql
ALTER TABLE delivery_boys 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
```

### 2. DeliveryBoy Model Updates
- Added `findByEmail()` method
- Added `findByEmailOrMobile()` method  
- Updated `create()` to accept `password_hash`
- Updated `findById()` to explicitly select `password_hash`

### 3. Delivery Boy Controller Updates
- `createDeliveryBoy()` now accepts `password` field and hashes it automatically
- `updateDeliveryBoy()` now accepts `password` field and hashes it automatically
- Password hash is never returned in API responses (security)

### 4. Auth Service Updates
- `login()` now checks both `users` and `delivery_boys` tables
- Validates delivery boy status (must be 'approved')
- Validates delivery boy is active (`is_active = true`)
- Checks if password is set
- Returns appropriate role (`delivery_boy`) in JWT token

### 5. Error Handling
Added new error codes:
- `NOT_APPROVED` - Delivery boy account not approved yet
- `NO_PASSWORD_SET` - No password configured for account

## API Usage

### Create Delivery Boy (with password)
```json
POST /api/delivery-boys
Authorization: Bearer <admin_token>

{
  "name": "Delivery Boy Name",
  "mobile": "9876543210",
  "email": "deliveryboy@gmail.com",
  "password": "admin123",
  "address": "Address",
  "photo_url": "url" (optional)
}
```

### Update Delivery Boy Password
```json
PUT /api/delivery-boys/:id
Authorization: Bearer <admin_token>

{
  "password": "newpassword123"
}
```

### Login as Delivery Boy
```json
POST /api/auth/login

{
  "mobileEmail": "deliveryboy@gmail.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "user": {
      "id": 1,
      "name": "Delivery Boy Name",
      "mobile": "9876543210",
      "email": "deliveryboy@gmail.com",
      "address": "Address",
      "role": "delivery_boy",
      "status": "approved",
      "photo_url": "url"
    }
  }
}
```

## Requirements for Login

1. **Password must be set** - Admin creates delivery boy with password
2. **Status must be 'approved'** - Admin must approve the delivery boy
3. **is_active must be true** - Delivery boy must be activated

## Troubleshooting

### Error: "NOT_APPROVED"
- Delivery boy status is not 'approved'
- Solution: Approve the delivery boy from admin dashboard

### Error: "INACTIVE_USER"
- Delivery boy `is_active` is false
- Solution: Activate the delivery boy from admin dashboard

### Error: "NO_PASSWORD_SET"
- Password was not set during creation
- Solution: Update delivery boy and set password

### Error: "INVALID_CREDENTIALS"
- Email/mobile not found OR password is incorrect
- Solution: Verify credentials or reset password

## Database Migration

If you have existing delivery_boys without passwords, you can set them using:

```sql
-- Add column (if not exists)
ALTER TABLE delivery_boys 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Set password for specific delivery boy (password: admin123)
UPDATE delivery_boys 
SET password_hash = '$2a$10$HtLuIFuLUOp/epG1Y0K/Nuxp6U799TvTSWI3DxJaTAHStWiBpzanO'
WHERE email = 'deliveryboy@gmail.com';
```

## Notes

- Passwords are automatically hashed using bcrypt (10 rounds)
- Password hash is never returned in API responses
- Delivery boys use the same login endpoint as admin/store managers
- Refresh tokens are NOT stored for delivery boys (only access tokens)





