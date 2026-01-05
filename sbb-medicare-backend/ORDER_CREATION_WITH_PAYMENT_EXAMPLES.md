# Order Creation with Initial Payment - Examples

## Overview
When creating an order, you can optionally specify if the customer has already made a payment. The system will automatically:
- Create a payment record
- Calculate remaining balance
- Set payment status (PENDING, PARTIAL, or PAID)
- Mark order as DELIVERED if fully paid

---

## Example 1: Order with No Payment

**Request:**
```json
{
  "orderNumber": "ORD-2025-001",
  "customerId": 1,
  "deliveryBoyId": 2,
  "totalAmount": 500.00,
  "customerComments": "Deliver in morning"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_number": "ORD-2025-001",
    "total_amount": "500.00",
    "payment_status": "PENDING",
    "payment_mode": null,
    "payment_summary": {
      "total_amount": 500.00,
      "total_paid": 0.00,
      "remaining_amount": 500.00,
      "payment_status": "PENDING",
      "is_fully_paid": false
    }
  }
}
```

---

## Example 2: Order with Partial Payment (Cash)

**Request:**
```json
{
  "orderNumber": "ORD-2025-002",
  "customerId": 1,
  "deliveryBoyId": 2,
  "totalAmount": 500.00,
  "paidAmount": 200.00,
  "paymentMode": "CASH",
  "customerComments": "Customer paid 200 cash"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_number": "ORD-2025-002",
    "total_amount": "500.00",
    "payment_status": "PARTIAL",
    "payment_mode": "CASH",
    "payment_summary": {
      "total_amount": 500.00,
      "total_paid": 200.00,
      "remaining_amount": 300.00,
      "payment_status": "PARTIAL",
      "is_fully_paid": false
    }
  }
}
```

---

## Example 3: Order with Partial Payment (UPI)

**Request:**
```json
{
  "orderNumber": "ORD-2025-003",
  "customerId": 1,
  "deliveryBoyId": 2,
  "totalAmount": 1000.00,
  "paidAmount": 500.00,
  "paymentMode": "UPI",
  "transactionReference": "UPI123456789",
  "customerComments": "Paid via UPI"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_number": "ORD-2025-003",
    "total_amount": "1000.00",
    "payment_status": "PARTIAL",
    "payment_mode": "UPI",
    "payment_summary": {
      "total_amount": 1000.00,
      "total_paid": 500.00,
      "remaining_amount": 500.00,
      "payment_status": "PARTIAL",
      "is_fully_paid": false
    }
  }
}
```

---

## Example 4: Order with Full Payment (Card)

**Request:**
```json
{
  "orderNumber": "ORD-2025-004",
  "customerId": 1,
  "deliveryBoyId": 2,
  "totalAmount": 750.00,
  "paidAmount": 750.00,
  "paymentMode": "CARD",
  "transactionReference": "TXN987654321",
  "customerComments": "Fully paid via card"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_number": "ORD-2025-004",
    "total_amount": "750.00",
    "status": "DELIVERED",
    "payment_status": "PAID",
    "payment_mode": "CARD",
    "payment_summary": {
      "total_amount": 750.00,
      "total_paid": 750.00,
      "remaining_amount": 0.00,
      "payment_status": "PAID",
      "is_fully_paid": true
    }
  }
}
```

**Note:** When fully paid, order status is automatically set to `DELIVERED`.

---

## Payment Mode Options

| Mode | Description | Use Case |
|------|-------------|----------|
| `CASH` | Cash payment | Physical cash received |
| `CARD` | Card payment | Debit/Credit card transaction |
| `UPI` | UPI payment | UPI apps (PhonePe, GooglePay, etc.) |
| `BANK_TRANSFER` | Bank transfer | Direct bank transfer |

---

## Validation Rules

1. **paidAmount**:
   - Must be ≥ 0
   - Cannot exceed `totalAmount`
   - If provided, `paymentMode` is required

2. **paymentMode**:
   - Required when `paidAmount > 0`
   - Must be one of: `CASH`, `CARD`, `UPI`, `BANK_TRANSFER`

3. **transactionReference**:
   - Optional
   - Recommended for online payments (CARD, UPI, BANK_TRANSFER)
   - Helps track transactions

---

## Payment Status Logic

```
paidAmount = 0          → payment_status: "PENDING"
0 < paidAmount < total → payment_status: "PARTIAL"
paidAmount >= total    → payment_status: "PAID" (order → DELIVERED)
```

---

## Remaining Balance Calculation

```
remaining_amount = total_amount - total_paid
```

**Examples:**
- Total: 500, Paid: 0 → Remaining: 500
- Total: 500, Paid: 200 → Remaining: 300
- Total: 500, Paid: 500 → Remaining: 0

---

## Frontend Form Example

```jsx
const OrderForm = () => {
  const [formData, setFormData] = useState({
    orderNumber: '',
    customerId: '',
    deliveryBoyId: '',
    totalAmount: '',
    paidAmount: '',
    paymentMode: '',
    transactionReference: '',
    customerComments: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      orderNumber: formData.orderNumber,
      customerId: parseInt(formData.customerId),
      deliveryBoyId: parseInt(formData.deliveryBoyId),
      totalAmount: parseFloat(formData.totalAmount),
      ...(formData.paidAmount && {
        paidAmount: parseFloat(formData.paidAmount),
        paymentMode: formData.paymentMode,
        ...(formData.transactionReference && {
          transactionReference: formData.transactionReference
        })
      }),
      ...(formData.customerComments && {
        customerComments: formData.customerComments
      })
    };

    // Send to API
    await createOrder(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic fields */}
      <input name="orderNumber" required />
      <input name="customerId" type="number" required />
      <input name="deliveryBoyId" type="number" required />
      <input name="totalAmount" type="number" step="0.01" required />
      
      {/* Payment fields */}
      <input 
        name="paidAmount" 
        type="number" 
        step="0.01"
        onChange={(e) => {
          setFormData({...formData, paidAmount: e.target.value});
          // Show payment mode field if paid amount > 0
        }}
      />
      
      {formData.paidAmount && parseFloat(formData.paidAmount) > 0 && (
        <>
          <select name="paymentMode" required>
            <option value="">Select Payment Mode</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
          <input name="transactionReference" placeholder="Transaction ID (Optional)" />
        </>
      )}
      
      <textarea name="customerComments" />
      <button type="submit">Create Order</button>
    </form>
  );
};
```

---

## Summary

✅ **No Payment**: Don't include `paidAmount` → Status: `PENDING`  
✅ **Partial Payment**: Include `paidAmount` < `totalAmount` → Status: `PARTIAL`  
✅ **Full Payment**: Include `paidAmount` = `totalAmount` → Status: `PAID`, Order: `DELIVERED`  
✅ **Payment Mode**: Required when `paidAmount > 0`  
✅ **Remaining Balance**: Automatically calculated as `totalAmount - paidAmount`


