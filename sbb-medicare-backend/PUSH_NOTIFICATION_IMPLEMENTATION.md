# Push Notification & Order Assignment Implementation

## Overview
This document describes the implementation of push notifications and the new order assignment flow where orders are created without a specific delivery boy and made available to all delivery boys under an admin.

## Changes Summary

### 1. Database Changes

#### Added `device_token` Column to `delivery_boys` Table
- **File**: `scripts/add-device-token-to-delivery-boys.sql`
- **Purpose**: Store FCM device tokens for push notifications
- **Migration**: Run the SQL script to add the column:
  ```sql
  ALTER TABLE delivery_boys 
  ADD COLUMN IF NOT EXISTS device_token VARCHAR(500);
  ```

### 2. Push Notification Service

#### Created Push Notification Service
- **File**: `src/services/pushNotificationService.js`
- **Purpose**: Handle sending push notifications to delivery boys
- **Features**:
  - Send notifications to a single delivery boy
  - Send notifications to all delivery boys under an admin
  - Specialized method for new order notifications
- **Note**: Currently logs notifications. To implement actual FCM:
  1. Install `firebase-admin`: `npm install firebase-admin`
  2. Set up Firebase Cloud Messaging credentials
  3. Initialize Firebase Admin SDK
  4. Replace the `sendToDeliveryBoy` method with actual FCM calls

### 3. Order Creation Changes

#### Removed `deliveryBoyId` Requirement
- **File**: `src/controllers/orderController.js`, `src/routes/orderRoutes.js`
- **Changes**:
  - `deliveryBoyId` is no longer required in order creation request
  - Orders are created with `assigned_delivery_boy_id = NULL`
  - Orders are visible to all delivery boys under the admin
- **API**: `POST /api/orders`
  - **Removed**: `deliveryBoyId` field
  - **Behavior**: Order is created and assigned to all delivery boys under the admin

#### Push Notification on Order Creation
- When an order is created, push notifications are sent to all approved and active delivery boys under the admin
- Notification message: "New order created for {customer_area}. Please accept it."

### 4. Order Listing for Delivery Boys

#### Updated to Show Unassigned Orders
- **File**: `src/models/Order.js`, `src/controllers/orderController.js`
- **Changes**:
  - Delivery boys now see:
    1. Unassigned orders (`assigned_delivery_boy_id IS NULL`) for their admin group
    2. Orders assigned to them (`assigned_delivery_boy_id = deliveryBoyId`)
  - Added `is_unassigned` flag in response to indicate if order is available for acceptance
- **API**: `GET /api/orders/ongoing` (for delivery boys)

### 5. Accept Order Flow

#### Modified Accept Endpoint
- **File**: `src/models/Order.js`, `src/controllers/orderController.js`
- **Changes**:
  - Delivery boys can now accept unassigned orders
  - When accepted, order is assigned to the accepting delivery boy
  - Order immediately disappears from other delivery boys' lists
  - Status changes from `ASSIGNED` to `ACCEPTED`
- **API**: `POST /api/orders/:id/accept`
- **Behavior**:
  - Accepts unassigned orders or orders already assigned to the delivery boy
  - Assigns order to the delivery boy
  - Updates status to `ACCEPTED`

### 6. Reject Order Flow

#### Modified Reject Endpoint
- **File**: `src/models/Order.js`, `src/controllers/orderController.js`
- **Changes**:
  - When a delivery boy rejects an order, it is unassigned (`assigned_delivery_boy_id = NULL`)
  - Order becomes available again to all delivery boys under the admin
  - Status changes back to `ASSIGNED`
- **API**: `POST /api/orders/:id/reject`
- **Behavior**:
  - Unassigns the order (sets `assigned_delivery_boy_id` to `NULL`)
  - Makes order available again to all delivery boys

### 7. Device Token Management

#### Added Device Token Update Endpoint
- **File**: `src/models/DeliveryBoy.js`, `src/controllers/deliveryBoyController.js`, `src/routes/deliveryBoyRoutes.js`
- **API**: `PUT /api/delivery-boys/device-token`
- **Authorization**: Delivery boy only (updates their own token)
- **Request Body**:
  ```json
  {
    "device_token": "fcm_device_token_here"
  }
  ```
- **Purpose**: Allow delivery boys to register/update their FCM device token for push notifications

## API Changes

### Order Creation
**Before:**
```json
POST /api/orders
{
  "orderNumber": "INV-001",
  "customerId": 1,
  "deliveryBoyId": 5,  // Required
  "totalAmount": 100
}
```

**After:**
```json
POST /api/orders
{
  "orderNumber": "INV-001",
  "customerId": 1,
  // deliveryBoyId removed - not required
  "totalAmount": 100
}
```

### Order Listing for Delivery Boys
**Response includes:**
- Unassigned orders (available for acceptance)
- Orders assigned to the delivery boy
- `is_unassigned` flag to indicate availability

### Accept Order
- Can now accept unassigned orders
- Automatically assigns order to accepting delivery boy

### Reject Order
- Unassigns order (makes it available again)
- Order becomes visible to all delivery boys under admin

## Setup Instructions

### 1. Run Database Migration
```sql
-- Execute the migration script
\i scripts/add-device-token-to-delivery-boys.sql
```

### 2. Install Firebase Admin SDK (Optional - for actual push notifications)
```bash
npm install firebase-admin
```

### 3. Configure Firebase (Optional)
- Set up Firebase Cloud Messaging project
- Download service account key
- Set environment variable: `FIREBASE_SERVICE_ACCOUNT_KEY` (path to JSON file)
- Update `src/services/pushNotificationService.js` to use actual FCM

### 4. Update Device Token
Delivery boys should call the device token endpoint after login:
```bash
PUT /api/delivery-boys/device-token
Authorization: Bearer <delivery_boy_token>
{
  "device_token": "fcm_token_from_mobile_app"
}
```

## Testing Checklist

- [ ] Run database migration
- [ ] Create order without `deliveryBoyId` - should succeed
- [ ] Verify push notification is logged (or sent if FCM configured)
- [ ] Login as delivery boy and update device token
- [ ] Verify delivery boy sees unassigned orders in `/api/orders/ongoing`
- [ ] Accept an unassigned order - should assign to delivery boy
- [ ] Verify order disappears from other delivery boys' lists
- [ ] Reject an accepted order - should unassign and make available again
- [ ] Verify order appears in all delivery boys' lists after rejection

## Notes

1. **Push Notifications**: Currently implemented as logging. To enable actual push notifications, configure Firebase and update the service.
2. **Order Visibility**: Orders are visible to all delivery boys under the same admin group (admin + all stores under that admin).
3. **Order Assignment**: When a delivery boy accepts an order, it is immediately assigned to them and hidden from others.
4. **Order Rejection**: When rejected, the order becomes unassigned and available to all delivery boys again.

## Future Enhancements

1. Implement actual FCM push notifications
2. Add notification preferences (enable/disable)
3. Add notification history/logs
4. Support for different notification types (order updates, payment reminders, etc.)
5. Batch notification sending for better performance
