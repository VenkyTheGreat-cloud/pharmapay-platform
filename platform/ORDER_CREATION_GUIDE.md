# Order Creation Guide

## Current Order Creation Flow

### Step-by-Step Process

#### **Step 1: Authentication & Authorization**
- **Endpoint**: `POST /api/orders`
- **Required Role**: `admin` or `store_manager`
- **Authentication**: Bearer token required
- **Store Access**: Automatically uses the authenticated user's store (`store_id` from token)

#### **Step 2: Request Validation**
The following fields are validated:

**Required Fields:**
- `orderNumber` (string) - Order number/ID (must be unique, manually entered)
- `customerId` (string/number) - Customer ID
- `deliveryBoyId` (string/number) - Delivery Boy ID
- `totalAmount` (number) - Total order amount

**Items Array Structure:**
Each item in the `items` array must have:
- `name` (string) - Item name (required)
- `quantity` (integer) - Quantity (minimum 1, required)
- `price` (float) - Price per unit (minimum 0, required)

**Optional Fields:**
- `customerComments` (string) - Additional comments for the order

#### **Step 3: Business Logic Validation**

1. **Customer Validation:**
   - Customer must exist in database
   - Customer must belong to the authenticated user's store
   - Error if customer not found: `404 NOT_FOUND`
   - Error if customer doesn't belong to store: `403 FORBIDDEN`

2. **Delivery Boy Validation:**
   - Delivery boy must exist in database
   - Delivery boy must be `approved` (status = 'approved')
   - Delivery boy must be `active` (is_active = true)
   - Error if delivery boy not found: `404 NOT_FOUND`
   - Error if not approved: `400 DELIVERY_BOY_NOT_APPROVED`
   - Error if not active: `400 DELIVERY_BOY_NOT_AVAILABLE`

3. **Total Amount:**
   - Provided directly in the request (not calculated)

#### **Step 4: Database Operations (Transaction)**

1. **Generate Order Number:**
   - Uses database function: `generate_order_number(store_id)`
   - Format: Store-specific unique order number

2. **Create Order Record:**
   - Inserts into `orders` table with:
     - `order_number` (from request - manually entered)
     - `customer_id` (from request)
     - `assigned_delivery_boy_id` (from request)
     - `store_id` (from authenticated user)
     - `customer_name` (from customer record)
     - `customer_phone` (from customer record)
     - `customer_address` (from customer record)
     - `customer_lat` (from customer record)
     - `customer_lng` (from customer record)
     - `total_amount` (calculated)
     - `status` = `'ASSIGNED'` (default)
     - `customer_comments` (from request, optional)
     - `assigned_at` = Current timestamp

3. **Create Order Items:**
   - Inserts all items into `order_items` table
   - Each item includes:
     - `order_id` (from created order)
     - `name` (from request)
     - `quantity` (from request)
     - `price` (from request)
     - `total` (calculated: quantity * price)

4. **Create Status History:**
   - Inserts into `order_status_history` table:
     - `order_id` (from created order)
     - `status` = `'ASSIGNED'`
     - `changed_by` = store_id (UUID)
     - `notes` = 'Order created and assigned'

#### **Step 5: Response**
Returns the created order with all items:

```json
{
  "success": true,
  "data": {
    "id": 4,
    "order_number": "ORD-2025-001",
    "customer_id": 1,
    "assigned_delivery_boy_id": 2,
    "store_id": "uuid-here",
    "customer_name": "John Doe",
    "customer_phone": "9876543210",
    "customer_address": "123 Main St",
    "customer_lat": 12.9716,
    "customer_lng": 77.5946,
    "total_amount": "150.00",
    "status": "ASSIGNED",
    "customer_comments": "Handle with care",
    "assigned_at": "2025-01-15T10:30:00.000Z",
    "created_at": "2025-01-15T10:30:00.000Z",
    "items": [
      {
        "id": 1,
        "order_id": 4,
        "name": "Medicine A",
        "quantity": 2,
        "price": "50.00",
        "total": "100.00"
      },
      {
        "id": 2,
        "order_id": 4,
        "name": "Medicine B",
        "quantity": 1,
        "price": "50.00",
        "total": "50.00"
      }
    ]
  },
  "message": "Order created successfully"
}
```

---

## API Request Format

### **Endpoint**
```
POST /api/orders
```

### **Headers**
```
Authorization: Bearer <admin_or_store_manager_token>
Content-Type: application/json
```

### **Request Body Example**
```json
{
  "orderNumber": "ORD-2025-001",
  "customerId": 1,
  "deliveryBoyId": 2,
  "totalAmount": 171.00,
  "customerComments": "Please deliver before 6 PM"
}
```

### **Field Details**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerId` | number/string | ✅ Yes | ID of the customer (must belong to your store) |
| `deliveryBoyId` | number/string | ✅ Yes | ID of the delivery boy (must be approved and active) |
| `items` | array | ✅ Yes | Array of order items (minimum 1 item) |
| `items[].name` | string | ✅ Yes | Name of the item |
| `items[].quantity` | integer | ✅ Yes | Quantity (must be ≥ 1) |
| `items[].price` | float | ✅ Yes | Price per unit (must be ≥ 0) |
| `customerComments` | string | ❌ No | Optional comments for the order |

---

## Validation Rules

### **Route-Level Validation** (Express Validator)
- `orderNumber`: Not empty, trimmed
- `customerId`: Not empty
- `deliveryBoyId`: Not empty
- `totalAmount`: Float, minimum 0.01

### **Business Logic Validation**
1. ✅ Order number is unique (not already exists)
2. ✅ Customer exists and belongs to store
3. ✅ Delivery boy exists, is approved, and is active
4. ✅ Total amount is positive

---

## Error Responses

### **400 Bad Request**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "At least one item is required"
  }
}
```

### **403 Forbidden**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Customer does not belong to your store"
  }
}
```

### **404 Not Found**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Customer not found"
  }
}
```

### **400 Delivery Boy Issues**
```json
{
  "success": false,
  "error": {
    "code": "DELIVERY_BOY_NOT_APPROVED",
    "message": "Delivery boy is not approved"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "DELIVERY_BOY_NOT_AVAILABLE",
    "message": "Delivery boy is not active"
  }
}
```

---

## Order Status After Creation

When an order is created, it is automatically:
- ✅ **Status**: `ASSIGNED`
- ✅ **Assigned to**: The delivery boy specified in `deliveryBoyId`
- ✅ **Assigned at**: Current timestamp
- ✅ **Payment Status**: `PENDING` (default)
- ✅ **Status History**: Record created with 'Order created and assigned'

### **Next Steps After Creation**

1. **Delivery Boy Action:**
   - Delivery boy receives the order with status `ASSIGNED`
   - Delivery boy can:
     - **Accept**: `POST /api/orders/:id/accept` → Status becomes `ACCEPTED`
     - **Reject**: `POST /api/orders/:id/reject` → Status becomes `REJECTED`

2. **If Accepted:**
   - Order proceeds to: `ACCEPTED` → `PICKED_UP` → `IN_TRANSIT` → `PAYMENT_COLLECTION` → `DELIVERED`

3. **If Rejected:**
   - Store manager can reassign to another delivery boy
   - Order status changes back to `ASSIGNED` when reassigned

---

## Complete Example

### **Request**
```http
POST /api/orders
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "orderNumber": "ORD-2025-010",
  "customerId": 5,
  "deliveryBoyId": 3,
  "totalAmount": 67.25,
  "customerComments": "Urgent delivery needed"
}
```

### **Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "order_number": "ORD-2025-010",
    "customer_id": 5,
    "assigned_delivery_boy_id": 3,
    "store_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "customer_name": "Jane Smith",
    "customer_phone": "9876543210",
    "customer_address": "456 Oak Avenue",
    "customer_lat": "12.9352",
    "customer_lng": "77.6245",
    "total_amount": "67.25",
    "status": "ASSIGNED",
    "payment_status": "PENDING",
    "customer_comments": "Urgent delivery needed",
    "assigned_at": "2025-01-15T14:30:00.000Z",
    "created_at": "2025-01-15T14:30:00.000Z",
    "payment_summary": {
      "total_amount": 67.25,
      "total_paid": 0.00,
      "remaining_amount": 67.25,
      "payment_status": "PENDING",
      "is_fully_paid": false
    }
  },
  "message": "Order created successfully"
}
```

---

## Summary

**Current Order Creation Process:**
1. ✅ Admin/Store Manager creates order via API with manual order number
2. ✅ Order number is validated for uniqueness
3. ✅ Order is automatically assigned to delivery boy
4. ✅ Order status is set to `ASSIGNED`
5. ✅ Payment status is set to `PENDING`
6. ✅ Delivery boy receives notification (status = ASSIGNED)
7. ✅ Delivery boy can accept or reject the order
8. ✅ If accepted, order proceeds through delivery flow
9. ✅ If rejected, store manager can reassign to another delivery boy

**Key Points:**
- Order number is manually entered (not auto-generated)
- Order number must be unique
- Order is created and assigned in one step
- Customer and delivery boy are validated before creation
- Total amount is provided directly (not calculated from items)
- All operations are in a database transaction (atomic)
- Status history is automatically created
- Payment summary is automatically calculated

