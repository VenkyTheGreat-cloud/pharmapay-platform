# Frontend Integration Guide - SBB Medicare Backend APIs

## Base URL
```
Production: https://sbb-medicare-api.onrender.com
Local: http://localhost:3000
```

## Authentication
All APIs require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. ORDER APIs

### 1.1 Create Order
**Endpoint:** `POST /api/orders`  
**Access:** Admin, Store Manager  
**Description:** Create a new order with optional return items

**Request Body:**
```json
{
  "orderNumber": "ORD-001",
  "customerId": "uuid-of-customer",
  "totalAmount": 1000.50,
  "paidAmount": 500.00,              // Optional
  "paymentMode": "CASH",            // Optional: CASH, CARD, UPI, BANK_TRANSFER
  "transactionReference": "TXN123",  // Optional
  "customerComments": "Handle with care",
  "returnItems": false,             // Optional: Legacy boolean (true/false)
  "returnItemsList": [              // Optional: Array of return items
    {
      "name": "Item Name 1",
      "quantity": 2
    },
    {
      "name": "Item Name 2",
      "quantity": 1
    }
  ],
  "returnAdjustAmount": 150.00      // Optional: Amount to deduct from total
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "order_number": "ORD-001",
    "customer_id": "uuid",
    "customer_name": "John Doe",
    "customer_phone": "9876543210",
    "total_amount": "1000.50",
    "return_items": true,
    "return_adjust_amount": "150.00",
    "status": "ASSIGNED",
    "payment_status": "PARTIAL",
    "return_items_list": [
      {
        "id": 1,
        "name": "Item Name 1",
        "quantity": 2
      }
    ],
    "payment_summary": {
      "total_amount": 1000.50,
      "return_adjust_amount": 150.00,
      "total_paid": 500.00,
      "remaining_amount": 350.50,
      "payment_status": "PARTIAL",
      "is_fully_paid": false
    }
  },
  "message": "Order created successfully"
}
```

**Important Notes:**
- If `returnItemsList` is provided, `returnAdjustAmount` must be > 0
- `returnItemsList` takes precedence over `returnItems` boolean
- `paidAmount` cannot exceed `totalAmount - returnAdjustAmount`
- If `paidAmount` is provided, `paymentMode` is required

---

### 1.2 Update Order
**Endpoint:** `PUT /api/orders/:id`  
**Access:** Admin, Store Manager  
**Description:** Update order details including return items

**Request Body (all fields optional):**
```json
{
  "orderNumber": "ORD-001-UPDATED",
  "customerId": "uuid",
  "customerName": "John Doe",
  "customerPhone": "9876543210",
  "totalAmount": 1200.00,
  "customerLat": 12.9716,
  "customerLng": 77.5946,
  "returnItems": true,
  "returnItemsList": [
    {
      "name": "Updated Item",
      "quantity": 3
    }
  ],
  "returnAdjustAmount": 200.00
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "order_number": "ORD-001-UPDATED",
    "total_amount": "1200.00",
    "return_items_list": [
      {
        "id": 2,
        "name": "Updated Item",
        "quantity": 3
      }
    ],
    "payment_summary": { ... }
  },
  "message": "Order updated successfully"
}
```

---

### 1.3 Get All Orders
**Endpoint:** `GET /api/orders`  
**Access:** All roles (filtered by role)  
**Description:** Get paginated list of orders with filters

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 500)
- `status` (optional): ASSIGNED, ACCEPTED, REJECTED, PICKED_UP, IN_TRANSIT, PAYMENT_COLLECTION, DELIVERED, CANCELLED
- `date` (optional): YYYY-MM-DD (single date)
- `date_from` (optional): YYYY-MM-DD (start date for range)
- `date_to` (optional): YYYY-MM-DD (end date for range)

**Example:**
```
GET /api/orders?page=1&limit=500&date_from=2026-01-20&date_to=2026-01-20
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 123,
        "order_number": "ORD-001",
        "customer_name": "John Doe",
        "total_amount": "1000.50",
        "return_items": true,
        "return_adjust_amount": "150.00",
        "status": "ASSIGNED",
        "items": [
          {
            "id": 1,
            "name": "Product A",
            "quantity": 2,
            "price": 500.25,
            "total": 1000.50
          }
        ],
        "return_items_list": [
          {
            "id": 1,
            "name": "Return Item",
            "quantity": 1
          }
        ],
        "payment_summary": {
          "total_amount": 1000.50,
          "return_adjust_amount": 150.00,
          "total_paid": 500.00,
          "remaining_amount": 350.50,
          "payment_status": "PARTIAL",
          "is_fully_paid": false
        }
      }
    ]
  },
  "pagination": {
    "total": 59,
    "page": 1,
    "limit": 500,
    "totalPages": 1
  }
}
```

---

### 1.4 Get Pending Orders Till Yesterday
**Endpoint:** `GET /api/orders/pending-till-yesterday`  
**Access:** All roles  
**Description:** Get all orders created before today that are not DELIVERED

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 123,
        "order_number": "ORD-001",
        "status": "ASSIGNED",
        "total_amount": "1000.50",
        "return_items_list": [],
        "payment_summary": { ... }
      }
    ]
  },
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 1.5 Export Orders to Excel
**Endpoint:** `GET /api/orders/export/excel`  
**Access:** Admin, Store Manager  
**Description:** Download orders as Excel file

**Query Parameters (Option 1 - Single Date with Time Range):**
- `date`: YYYY-MM-DD (required)
- `from_time`: HH:MM or HH:MM:SS (required, 24-hour format)
- `to_time`: HH:MM or HH:MM:SS (required, 24-hour format)

**Example:**
```
GET /api/orders/export/excel?date=2026-01-28&from_time=09:00&to_time=18:00
```

**Query Parameters (Option 2 - Date Range):**
- `date_from`: YYYY-MM-DD (required)
- `date_to`: YYYY-MM-DD (required)

**Example:**
```
GET /api/orders/export/excel?date_from=2026-01-20&date_to=2026-01-28
```

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download with filename like: `orders_20260128_0900_to_1800_1234567890.xlsx`

**Excel Columns:**
- Order ID, Order Number, Customer Name, Customer Phone, Customer Address
- Store Name, Delivery Boy, Delivery Boy Mobile
- Total Amount, Return Adjust Amount, Total Paid, Remaining Amount
- Payment Status, Order Status, Payment Mode
- Items (formatted string), Return Items (formatted string)
- Order Created At, Assigned At, Delivered At
- Notes, Customer Comments

**Important Notes:**
- If `from_time > to_time`, the system assumes `to_time` is on the next day
- Time format: 24-hour format (e.g., 09:00, 18:30, 23:59)

---

### 1.6 Get Order by ID
**Endpoint:** `GET /api/orders/:id`  
**Access:** All roles (filtered by store access)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "order_number": "ORD-001",
    "return_items_list": [
      {
        "id": 1,
        "name": "Return Item",
        "quantity": 2
      }
    ],
    "payment_summary": { ... }
  }
}
```

---

### 1.7 Update Order Status
**Endpoint:** `PUT /api/orders/:id/status`  
**Access:** All roles (based on status transition rules)

**Request Body:**
```json
{
  "status": "ACCEPTED"  // ASSIGNED, ACCEPTED, REJECTED, PICKED_UP, IN_TRANSIT, PAYMENT_COLLECTION, DELIVERED, CANCELLED
}
```

**Important:** When a delivery boy changes status back to `ASSIGNED`, the order is automatically unassigned and becomes visible to all delivery boys.

---

## 2. CUSTOMER REGISTRY APIs

### 2.1 Create Customer Registry Entry
**Endpoint:** `POST /api/customer-registry`  
**Access:** Admin, Store Manager  
**Description:** Register a customer with mobile number and optional name

**Request Body:**
```json
{
  "mobile": "9876543210",           // Required: 10 digits
  "name": "John Doe",               // Optional
  "registry_date": "2026-01-28T10:30:00Z"  // Optional: ISO 8601 datetime (defaults to current time)
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "mobile": "9876543210",
    "name": "John Doe",
    "registry_date": "2026-01-28T10:30:00.000Z",
    "created_at": "2026-01-28T17:31:38.517Z",
    "updated_at": "2026-01-28T17:31:38.517Z"
  },
  "message": "Customer registry entry created successfully"
}
```

**Important Notes:**
- Only `mobile` is mandatory (must be exactly 10 digits)
- `name` is optional (can be null or empty)
- `registry_date` accepts ISO 8601 format or will default to current timestamp

---

### 2.2 Get All Customer Registry Entries
**Endpoint:** `GET /api/customer-registry`  
**Access:** All roles (filtered by store access)

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `mobile` (optional): Filter by mobile number
- `date` (optional): YYYY-MM-DD (single date)
- `date_from` (optional): YYYY-MM-DD
- `date_to` (optional): YYYY-MM-DD
- `search` (optional): Search in name or mobile

**Response (200):**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": 1,
        "mobile": "9876543210",
        "name": "John Doe",
        "registry_date": "2026-01-28T10:30:00.000Z"
      }
    ]
  },
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 2.3 Get Registered Customers with Order Status
**Endpoint:** `GET /api/customer-registry/with-orders`  
**Access:** All roles (filtered by store access)  
**Description:** Get all customers registered on a specific date, with order creation status

**Query Parameters:**
- `date`: YYYY-MM-DD (required)

**Example:**
```
GET /api/customer-registry/with-orders?date=2026-01-28
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-28",
    "customers": [
      {
        "registry_id": 1,
        "customer_name": "John Doe",
        "customer_mobile": "9876543210",
        "registry_date": "2026-01-28T10:30:00.000Z",
        "registry_date_time": "2026-01-28T10:30:00.000Z",
        "has_order": true,
        "order": {
          "order_id": 123,
          "order_number": "ORD-001",
          "order_created_at": "2026-01-28T14:20:00.000Z",
          "order_created_date_time": "2026-01-28T14:20:00.000Z",
          "total_amount": 1000.50,
          "order_status": "ASSIGNED"
        }
      },
      {
        "registry_id": 2,
        "customer_name": "Jane Smith",
        "customer_mobile": "9876543211",
        "registry_date": "2026-01-28T11:00:00.000Z",
        "registry_date_time": "2026-01-28T11:00:00.000Z",
        "has_order": false,
        "order": null
      }
    ],
    "total_registered": 2,
    "total_with_orders": 1,
    "total_without_orders": 1
  },
  "message": "Registered customers with order status retrieved successfully"
}
```

**Important Notes:**
- Returns unique mobile numbers per date (no duplicates)
- Checks if any order was created on the same date for the registered mobile number
- `has_order: true` means at least one order was created on that date with the same mobile number

---

### 2.4 Get Customer Registry Entry by ID
**Endpoint:** `GET /api/customer-registry/:id`  
**Access:** All roles (filtered by store access)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "mobile": "9876543210",
    "name": "John Doe",
    "registry_date": "2026-01-28T10:30:00.000Z"
  },
  "message": "Customer registry entry retrieved successfully"
}
```

---

### 2.5 Update Customer Registry Entry
**Endpoint:** `PUT /api/customer-registry/:id`  
**Access:** Admin, Store Manager

**Request Body (all fields optional):**
```json
{
  "mobile": "9876543210",
  "name": "John Doe Updated",
  "registry_date": "2026-01-28T10:30:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "mobile": "9876543210",
    "name": "John Doe Updated",
    "registry_date": "2026-01-28T10:30:00.000Z"
  },
  "message": "Customer registry entry updated successfully"
}
```

---

### 2.6 Delete Customer Registry Entry
**Endpoint:** `DELETE /api/customer-registry/:id`  
**Access:** Admin, Store Manager

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Customer registry entry deleted successfully"
}
```

---

## 3. ERROR RESPONSES

All APIs return errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mobile number is required and must be 10 digits"
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `FORBIDDEN`: Access denied
- `UNAUTHORIZED`: Authentication required
- `DUPLICATE_ORDER_NUMBER`: Order number already exists

---

## 4. DATE/TIME FORMATS

### Date Formats Accepted:
- `YYYY-MM-DD` (e.g., `2026-01-28`)
- `DD/MM/YYYY` (e.g., `28/01/2026`)
- `DD-MM-YYYY` (e.g., `28-01-2026`)
- ISO datetime: `2026-01-28T10:30:00Z` or `2026-01-28T10:30:00.000Z`

### Time Formats Accepted:
- `HH:MM` (e.g., `09:00`, `18:30`)
- `HH:MM:SS` (e.g., `09:00:00`, `18:30:45`)
- 24-hour format only

---

## 5. FRONTEND INTEGRATION CHECKLIST

### Order Management
- [ ] Create order form with return items support (array format)
- [ ] Display return items list in order details
- [ ] Show return adjust amount in payment summary
- [ ] Update order functionality for store managers
- [ ] Export to Excel button with date/time picker
- [ ] Pending orders till yesterday view
- [ ] Handle order status changes (especially ASSIGNED unassignment)

### Customer Registry
- [ ] Customer registration form (mobile mandatory, name optional)
- [ ] Date/time picker for registry_date
- [ ] List view with pagination and filters
- [ ] Customer registry with order status view
- [ ] Edit/Delete customer registry entries

### UI/UX Recommendations
- [ ] Date picker component (accepts multiple formats)
- [ ] Time picker component (24-hour format)
- [ ] Return items dynamic list (add/remove items)
- [ ] Payment summary display component
- [ ] Excel download progress indicator
- [ ] Error handling and validation messages
- [ ] Loading states for async operations

---

## 6. EXAMPLE FRONTEND CODE SNIPPETS

### Create Order with Return Items
```javascript
const createOrder = async (orderData) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      orderNumber: orderData.orderNumber,
      customerId: orderData.customerId,
      totalAmount: orderData.totalAmount,
      paidAmount: orderData.paidAmount || 0,
      paymentMode: orderData.paymentMode,
      returnItemsList: orderData.returnItemsList || [], // Array format
      returnAdjustAmount: orderData.returnAdjustAmount || 0
    })
  });
  return await response.json();
};
```

### Export Orders to Excel
```javascript
const exportOrdersToExcel = async (date, fromTime, toTime) => {
  const url = `/api/orders/export/excel?date=${date}&from_time=${fromTime}&to_time=${toTime}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `orders_${date}_${fromTime}_${toTime}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  }
};
```

### Get Registered Customers with Orders
```javascript
const getRegisteredCustomersWithOrders = async (date) => {
  const response = await fetch(`/api/customer-registry/with-orders?date=${date}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

---

## 7. TESTING ENDPOINTS

### Test Create Order
```bash
curl -X POST https://sbb-medicare-api.onrender.com/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-TEST-001",
    "customerId": "customer-uuid",
    "totalAmount": 1000.50,
    "returnItemsList": [
      {"name": "Item 1", "quantity": 2}
    ],
    "returnAdjustAmount": 150.00
  }'
```

### Test Export Excel
```bash
curl -X GET "https://sbb-medicare-api.onrender.com/api/orders/export/excel?date=2026-01-28&from_time=09:00&to_time=18:00" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output orders.xlsx
```

---

## Support
For any API-related questions or issues, please refer to the backend team or check the API logs.
