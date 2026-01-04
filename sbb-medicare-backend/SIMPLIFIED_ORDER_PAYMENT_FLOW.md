# Simplified Order Creation & Payment Collection Flow

## Overview
This document describes the updated order creation and payment collection flow that removes the medicine/item list requirement and focuses on total amount and payment tracking.

## Key Changes

### 1. Order Creation (Simplified)
- **No items list required** - Only total amount is captured
- **Fields**: `customerId`, `deliveryBoyId`, `totalAmount`, `customerComments` (optional)
- **Auto-calculated**: Pending amount = Total Amount - Paid Amount

### 2. Payment Collection
- **Multiple payments per order** - Supports partial payments
- **Payment modes**: CASH, CARD, UPI, BANK_TRANSFER, SPLIT
- **Payment status**: PENDING, PARTIAL, PAID
- **Auto-completion**: Order marked as DELIVERED when fully paid

### 3. Delivery Photo
- **Photo upload** - Delivery/payment proof can be uploaded
- **Visible to**: Admin, Store Manager, Delivery Boy
- **Linked to**: Order ID

---

## API Endpoints

### 1. Create Order (Simplified)

**Endpoint:** `POST /api/orders`

**Request Body:**
```json
{
  "orderNumber": "ORD-2025-010",
  "customerId": 1,
  "deliveryBoyId": 2,
  "totalAmount": 500.00,
  "customerComments": "Urgent delivery"
}
```

**Required Fields:**
- `orderNumber` (string) - Order number/ID (must be unique)
- `customerId` (number) - Customer ID
- `deliveryBoyId` (number) - Delivery Boy ID
- `totalAmount` (number) - Total order amount

**Optional Fields:**
- `customerComments` (string) - Additional comments

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "order_number": "ORD-2025-010",
    "customer_id": 1,
    "assigned_delivery_boy_id": 2,
    "total_amount": "500.00",
    "status": "ASSIGNED",
    "payment_status": "PENDING",
    "payment_summary": {
      "total_amount": 500.00,
      "total_paid": 0.00,
      "remaining_amount": 500.00,
      "payment_status": "PENDING",
      "is_fully_paid": false
    }
  },
  "message": "Order created successfully"
}
```

---

### 2. Collect Payment

**Endpoint:** `POST /api/payments/collect`

**Request Body:**
```json
{
  "order_id": 10,
  "amount": 300.00,
  "payment_mode": "CASH",
  "transaction_reference": "TXN123456" // Optional
}
```

**Payment Modes:**
- `CASH` - Cash payment
- `CARD` - Card payment
- `UPI` - UPI payment
- `BANK_TRANSFER` - Bank transfer
- `SPLIT` - Split payment (requires `cash_amount` and `bank_amount`)

**Response (Partial Payment):**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": 5,
      "order_id": 10,
      "payment_mode": "CASH",
      "cash_amount": "300.00",
      "bank_amount": "0.00",
      "status": "CONFIRMED"
    },
    "payment_summary": {
      "total_amount": 500.00,
      "total_paid": 300.00,
      "remaining_amount": 200.00,
      "payment_status": "PARTIAL",
      "is_fully_paid": false
    }
  },
  "message": "Payment collected successfully. Remaining amount: 200.00"
}
```

**Response (Full Payment):**
```json
{
  "success": true,
  "data": {
    "payment": { ... },
    "payment_summary": {
      "total_amount": 500.00,
      "total_paid": 500.00,
      "remaining_amount": 0.00,
      "payment_status": "PAID",
      "is_fully_paid": true
    }
  },
  "message": "Payment collected successfully. Order is now fully paid."
}
```

---

### 3. Split Payment

**Endpoint:** `POST /api/payments/split`

**Request Body:**
```json
{
  "order_id": 10,
  "cash_amount": 200.00,
  "bank_amount": 300.00,
  "transaction_reference": "TXN123456" // Optional
}
```

---

### 4. Upload Delivery Photo

**Endpoint:** `POST /api/orders/:id/delivery-photo`

**Request:** Multipart form data
- `photo` (file) - Image file (JPEG, PNG, PDF)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "order_number": "ORD-2025-010",
    "delivery_photo_url": "/uploads/photo-1234567890.jpg",
    ...
  },
  "message": "Delivery photo uploaded successfully"
}
```

---

### 5. Get Order Details

**Endpoint:** `GET /api/orders/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "order_number": "ORD-2025-010",
    "total_amount": "500.00",
    "payment_status": "PARTIAL",
    "delivery_photo_url": "/uploads/photo-1234567890.jpg",
    "payment_summary": {
      "total_amount": 500.00,
      "total_paid": 300.00,
      "remaining_amount": 200.00,
      "payment_status": "PARTIAL",
      "is_fully_paid": false
    },
    "payments": [
      {
        "id": 5,
        "payment_mode": "CASH",
        "cash_amount": "300.00",
        "bank_amount": "0.00",
        "receipt_photo_url": "/uploads/receipt-123.jpg",
        "created_at": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

## Delivery Boy View

### Order Information Displayed:
1. **Total Order Amount** - Full amount to be collected
2. **Amount Already Paid** - Sum of all previous payments
3. **Amount Pending** - Remaining amount to collect
4. **Payment Status** - PENDING / PARTIAL / PAID
5. **Delivery Photo** - If uploaded

### Actions Available:
1. **Collect Payment** - Record partial or full payment
2. **Split Payment** - Accept part cash + part online
3. **Upload Photo** - Capture delivery/payment proof
4. **View Payment History** - See all payments for the order

---

## Payment Status Flow

```
PENDING → PARTIAL → PAID
   ↓         ↓        ↓
  No      Some    Full
Payment  Payment  Payment
```

### Status Transitions:
- **PENDING**: No payments made (total_paid = 0)
- **PARTIAL**: Some payment made (0 < total_paid < total_amount)
- **PAID**: Full payment received (total_paid >= total_amount)
  - Order automatically marked as **DELIVERED** when fully paid

---

## Database Migration

**IMPORTANT**: Run the migration script before deploying:

```bash
psql -U postgres -d sbb_medicare -f scripts/update-order-payment-flow.sql
```

**Changes:**
1. Adds `delivery_photo_url` column to `orders` table
2. Updates `payment_status` constraint to include `PARTIAL`
3. Updates `payment_mode` constraints to include `CARD` and `UPI`
4. Allows multiple payments per order

---

## Example Flow

### Step 1: Create Order
```json
POST /api/orders
{
  "orderNumber": "ORD-2025-001",
  "customerId": 1,
  "deliveryBoyId": 2,
  "totalAmount": 1000.00
}
```
**Result:** Order created with `payment_status: PENDING`, `remaining_amount: 1000.00`

### Step 2: First Payment (Partial)
```json
POST /api/payments/collect
{
  "order_id": 10,
  "amount": 400.00,
  "payment_mode": "UPI"
}
```
**Result:** `payment_status: PARTIAL`, `remaining_amount: 600.00`

### Step 3: Second Payment (Partial)
```json
POST /api/payments/collect
{
  "order_id": 10,
  "amount": 300.00,
  "payment_mode": "CASH"
}
```
**Result:** `payment_status: PARTIAL`, `remaining_amount: 300.00`

### Step 4: Final Payment (Full)
```json
POST /api/payments/collect
{
  "order_id": 10,
  "amount": 300.00,
  "payment_mode": "CARD"
}
```
**Result:** `payment_status: PAID`, `remaining_amount: 0.00`, `status: DELIVERED`

### Step 5: Upload Delivery Photo
```bash
POST /api/orders/10/delivery-photo
Content-Type: multipart/form-data
photo: [file]
```
**Result:** `delivery_photo_url` updated

---

## Summary

✅ **Order Creation**: Simplified - only total amount required  
✅ **Payment Collection**: Supports multiple partial payments  
✅ **Payment Modes**: CASH, CARD, UPI, BANK_TRANSFER, SPLIT  
✅ **Payment Status**: PENDING, PARTIAL, PAID  
✅ **Photo Upload**: Delivery/payment proof photos  
✅ **Auto-Completion**: Order marked DELIVERED when fully paid  
✅ **Payment Summary**: Always shows paid/remaining amounts  

