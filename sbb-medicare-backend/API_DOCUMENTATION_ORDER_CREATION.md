# Order Creation API Documentation

## Create Order

### Endpoint
```
POST /api/orders
```

### Authentication
- **Required**: Yes
- **Type**: Bearer Token
- **Header**: `Authorization: Bearer <token>`
- **Roles**: `admin` or `store_manager`

---

## Request

### Headers
```
Content-Type: application/json
Authorization: Bearer <your_access_token>
```

### Request Body

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `orderNumber` | string | ✅ Yes | Order number/ID (must be unique) | "ORD-2025-001" |
| `customerId` | number/string | ✅ Yes | Customer ID | 1 |
| `deliveryBoyId` | number/string | ✅ Yes | Delivery Boy ID | 2 |
| `totalAmount` | number | ✅ Yes | Total order amount (must be > 0) | 500.00 |
| `paidAmount` | number | ❌ No | Amount already paid by customer (must be ≤ totalAmount) | 200.00 |
| `paymentMode` | string | ⚠️ Conditional | Payment mode (required if paidAmount > 0) | "CASH", "CARD", "UPI", "BANK_TRANSFER" |
| `transactionReference` | string | ❌ No | Transaction reference/ID (for online payments) | "TXN123456" |
| `customerComments` | string | ❌ No | Optional comments for the order | "Urgent delivery" |

### Request Examples

**Example 1: Order with no initial payment**
```json
{
  "orderNumber": "ORD-2025-001",
  "customerId": 1,
  "deliveryBoyId": 2,
  "totalAmount": 500.00,
  "customerComments": "Please deliver before 6 PM"
}
```

**Example 2: Order with partial payment**
```json
{
  "orderNumber": "ORD-2025-002",
  "customerId": 1,
  "deliveryBoyId": 2,
  "totalAmount": 500.00,
  "paidAmount": 200.00,
  "paymentMode": "UPI",
  "transactionReference": "TXN123456",
  "customerComments": "Partial payment made"
}
```

**Example 3: Order with full payment**
```json
{
  "orderNumber": "ORD-2025-003",
  "customerId": 1,
  "deliveryBoyId": 2,
  "totalAmount": 500.00,
  "paidAmount": 500.00,
  "paymentMode": "CARD",
  "transactionReference": "TXN789012",
  "customerComments": "Fully paid"
}
```

---

## Response

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": 10,
    "order_number": "ORD-2025-001",
    "customer_id": 1,
    "assigned_delivery_boy_id": 2,
    "store_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "customer_name": "John Doe",
    "customer_phone": "9876543210",
    "customer_address": "123 Main Street",
    "customer_lat": "12.9716",
    "customer_lng": "77.5946",
    "total_amount": "500.00",
    "status": "ASSIGNED",
    "payment_status": "PENDING",
    "payment_mode": null,
    "customer_comments": "Please deliver before 6 PM",
    "assigned_at": "2025-01-15T10:30:00.000Z",
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T10:30:00.000Z",
    "delivery_photo_url": null,
    "payment_summary": {
      "total_amount": 500.00,
      "total_paid": 200.00,
      "remaining_amount": 300.00,
      "payment_status": "PARTIAL",
      "is_fully_paid": false
    }
  },
  "message": "Order created successfully"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Order ID (auto-generated) |
| `order_number` | string | Order number (as provided) |
| `customer_id` | number | Customer ID |
| `assigned_delivery_boy_id` | number | Delivery Boy ID |
| `store_id` | string (UUID) | Store ID |
| `customer_name` | string | Customer name |
| `customer_phone` | string | Customer phone |
| `customer_address` | string | Customer address |
| `customer_lat` | string | Customer latitude |
| `customer_lng` | string | Customer longitude |
| `total_amount` | string | Total order amount |
| `status` | string | Order status: `ASSIGNED`, `ACCEPTED`, `REJECTED`, `PICKED_UP`, `IN_TRANSIT`, `PAYMENT_COLLECTION`, `DELIVERED`, `CANCELLED` |
| `payment_status` | string | Payment status: `PENDING`, `PARTIAL`, `PAID` |
| `payment_mode` | string/null | Payment mode: `CASH`, `CARD`, `UPI`, `BANK_TRANSFER`, `SPLIT`, or `null` |
| `customer_comments` | string/null | Customer comments |
| `assigned_at` | string (ISO 8601) | Assignment timestamp |
| `created_at` | string (ISO 8601) | Creation timestamp |
| `updated_at` | string (ISO 8601) | Last update timestamp |
| `delivery_photo_url` | string/null | Delivery photo URL (if uploaded) |
| `payment_summary` | object | Payment summary object |
| `payment_summary.total_amount` | number | Total order amount |
| `payment_summary.total_paid` | number | Total amount paid so far |
| `payment_summary.remaining_amount` | number | Remaining amount to be paid |
| `payment_summary.payment_status` | string | Current payment status |
| `payment_summary.is_fully_paid` | boolean | Whether order is fully paid |

---

## Error Responses

### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Order number is required"
  }
}
```

**Possible validation errors:**
- `"Order number is required"`
- `"Total amount is required and must be greater than 0"`
- `"Customer ID is required"`
- `"Delivery boy ID is required"`
- `"Paid amount cannot be negative"`
- `"Paid amount cannot exceed total amount"`
- `"Payment mode is required when paid amount is provided"`
- `"Payment mode must be CASH, CARD, UPI, or BANK_TRANSFER"`

### 409 Conflict - Duplicate Order Number

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ORDER_NUMBER",
    "message": "Order number already exists. Please use a different order number."
  }
}
```

### 403 Forbidden - Access Denied

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Customer does not belong to your store"
  }
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Customer not found"
  }
}
```

**Or:**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Delivery boy not found"
  }
}
```

### 400 Bad Request - Delivery Boy Issues

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

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Access token required"
  }
}
```

---

## Example Code

### JavaScript/TypeScript (Fetch API)

```javascript
const createOrder = async (orderData) => {
  try {
    const response = await fetch('https://your-api-domain.com/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        orderNumber: orderData.orderNumber,
        customerId: orderData.customerId,
        deliveryBoyId: orderData.deliveryBoyId,
        totalAmount: orderData.totalAmount,
        customerComments: orderData.customerComments || null
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Order created:', result.data);
      return result.data;
    } else {
      console.error('Error:', result.error);
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
};

// Usage
const order = await createOrder({
  orderNumber: 'ORD-2025-001',
  customerId: 1,
  deliveryBoyId: 2,
  totalAmount: 500.00,
  customerComments: 'Urgent delivery'
});
```

### JavaScript/TypeScript (Axios)

```javascript
import axios from 'axios';

const createOrder = async (orderData) => {
  try {
    const response = await axios.post(
      'https://your-api-domain.com/api/orders',
      {
        orderNumber: orderData.orderNumber,
        customerId: orderData.customerId,
        deliveryBoyId: orderData.deliveryBoyId,
        totalAmount: orderData.totalAmount,
        customerComments: orderData.customerComments || null
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    return response.data.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      console.error('Error:', error.response.data.error);
      throw new Error(error.response.data.error.message);
    } else {
      // Request failed
      console.error('Request failed:', error.message);
      throw error;
    }
  }
};
```

### React Example

```jsx
import { useState } from 'react';

const CreateOrderForm = () => {
  const [formData, setFormData] = useState({
    orderNumber: '',
    customerId: '',
    deliveryBoyId: '',
    totalAmount: '',
    customerComments: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderNumber: formData.orderNumber,
          customerId: parseInt(formData.customerId),
          deliveryBoyId: parseInt(formData.deliveryBoyId),
          totalAmount: parseFloat(formData.totalAmount),
          customerComments: formData.customerComments || null
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Order created successfully!');
        // Reset form or redirect
        setFormData({
          orderNumber: '',
          customerId: '',
          deliveryBoyId: '',
          totalAmount: '',
          customerComments: ''
        });
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Order Number"
        value={formData.orderNumber}
        onChange={(e) => setFormData({...formData, orderNumber: e.target.value})}
        required
      />
      <input
        type="number"
        placeholder="Customer ID"
        value={formData.customerId}
        onChange={(e) => setFormData({...formData, customerId: e.target.value})}
        required
      />
      <input
        type="number"
        placeholder="Delivery Boy ID"
        value={formData.deliveryBoyId}
        onChange={(e) => setFormData({...formData, deliveryBoyId: e.target.value})}
        required
      />
      <input
        type="number"
        step="0.01"
        placeholder="Total Amount"
        value={formData.totalAmount}
        onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
        required
      />
      <textarea
        placeholder="Customer Comments (Optional)"
        value={formData.customerComments}
        onChange={(e) => setFormData({...formData, customerComments: e.target.value})}
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Order'}
      </button>
    </form>
  );
};
```

---

## Important Notes

1. **Order Number Uniqueness**: The `orderNumber` must be unique. If you try to create an order with an existing order number, you'll get a `409 Conflict` error.

2. **Initial Payment**: 
   - If `paidAmount` is provided, a payment record is automatically created
   - `paymentMode` is **required** when `paidAmount > 0`
   - `paidAmount` cannot exceed `totalAmount`
   - If `paidAmount >= totalAmount`, order is marked as fully paid and status becomes `DELIVERED`

3. **Payment Status Calculation**:
   - `PENDING`: No payment made (`paidAmount = 0` or not provided)
   - `PARTIAL`: Partial payment made (`0 < paidAmount < totalAmount`)
   - `PAID`: Full payment made (`paidAmount >= totalAmount`)

4. **Order Status**: 
   - New orders are created with `status: "ASSIGNED"` (unless fully paid, then `DELIVERED`)
   - Ready for delivery boy to accept or reject

5. **Payment Summary**: The response includes a `payment_summary` object that shows:
   - `total_amount`: Full order amount
   - `total_paid`: Amount paid (from `paidAmount` if provided)
   - `remaining_amount`: `total_amount - total_paid`
   - `payment_status`: `PENDING`, `PARTIAL`, or `PAID`
   - `is_fully_paid`: `true` if `total_paid >= total_amount`

5. **Customer & Delivery Boy Validation**: 
   - Customer must exist and belong to the authenticated user's store
   - Delivery boy must exist, be approved, and be active

---

## Related Endpoints

- **Get Order**: `GET /api/orders/:id`
- **Get All Orders**: `GET /api/orders`
- **Accept Order**: `POST /api/orders/:id/accept` (Delivery Boy)
- **Reject Order**: `POST /api/orders/:id/reject` (Delivery Boy)
- **Collect Payment**: `POST /api/payments/collect` (Delivery Boy)
- **Upload Delivery Photo**: `POST /api/orders/:id/delivery-photo` (Multipart form data)

---

## Base URL
```
Production: https://sbb-medicare-api.onrender.com
Development: http://localhost:5000
```

---

## Support
For any issues or questions, contact the backend development team.

