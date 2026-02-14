# Payment Modes Reference

## Available Payment Modes

The system supports **5 payment modes**:

| Payment Mode | Description | Use Case | Amount Storage |
|--------------|-------------|----------|----------------|
| `CASH` | Cash payment | Physical cash received | Stored in `cash_amount` |
| `CARD` | Card payment | Debit/Credit card transaction | Stored in `bank_amount` |
| `UPI` | UPI payment | UPI apps (PhonePe, GooglePay, Paytm, etc.) | Stored in `bank_amount` |
| `BANK_TRANSFER` | Bank transfer | Direct bank transfer/NEFT/RTGS | Stored in `bank_amount` |
| `SPLIT` | Split payment | Part cash + part online payment | Stored in both `cash_amount` and `bank_amount` |

---

## Database Schema

### Orders Table
```sql
payment_mode VARCHAR(20) CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT') OR payment_mode IS NULL)
```

### Payments Table
```sql
payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT'))
cash_amount DECIMAL(10,2) DEFAULT 0
bank_amount DECIMAL(10,2) DEFAULT 0
```

---

## API Usage

### 1. CASH Payment

**Request:**
```json
{
  "paidAmount": 500.00,
  "paymentMode": "CASH"
}
```

**Storage:**
- `cash_amount`: 500.00
- `bank_amount`: 0.00

---

### 2. CARD Payment

**Request:**
```json
{
  "paidAmount": 500.00,
  "paymentMode": "CARD",
  "transactionReference": "TXN123456789"
}
```

**Storage:**
- `cash_amount`: 0.00
- `bank_amount`: 500.00

---

### 3. UPI Payment

**Request:**
```json
{
  "paidAmount": 500.00,
  "paymentMode": "UPI",
  "transactionReference": "UPI123456789"
}
```

**Storage:**
- `cash_amount`: 0.00
- `bank_amount`: 500.00

---

### 4. BANK_TRANSFER Payment

**Request:**
```json
{
  "paidAmount": 500.00,
  "paymentMode": "BANK_TRANSFER",
  "transactionReference": "NEFT123456789"
}
```

**Storage:**
- `cash_amount`: 0.00
- `bank_amount`: 500.00

**Note:** The API also accepts `"BANK"` as input, which is automatically normalized to `"BANK_TRANSFER"`.

---

### 5. SPLIT Payment

**Request:**
```json
{
  "paidAmount": 500.00,
  "paymentMode": "SPLIT",
  "cashAmount": 200.00,
  "bankAmount": 300.00
}
```

**Storage:**
- `cash_amount`: 200.00
- `bank_amount`: 300.00

**Validation:**
- Both `cashAmount` and `bankAmount` are required
- `cashAmount + bankAmount` must equal `paidAmount`
- Both amounts must be greater than 0

**Example:**
```json
{
  "paidAmount": 1000.00,
  "paymentMode": "SPLIT",
  "cashAmount": 400.00,    // Customer paid 400 in cash
  "bankAmount": 600.00     // Customer paid 600 via UPI/Card
}
```

---

## Endpoints Supporting Payment Modes

### 1. Create Order (`POST /api/orders`)
- **Supported modes:** `CASH`, `CARD`, `UPI`, `BANK_TRANSFER`
- **Note:** `SPLIT` is not supported in order creation (use payment collection endpoint)

**Validation:**
```javascript
body('paymentMode').optional().isIn(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER'])
```

---

### 2. Update Order (`PUT /api/orders/:id`)
- **Supported modes:** `CASH`, `CARD`, `UPI`, `BANK_TRANSFER`
- Used for adding additional payments to existing orders

**Validation:**
```javascript
body('paymentMode').optional().isIn(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER'])
```

---

### 3. Collect Payment (`POST /api/payments/collect`)
- **Supported modes:** `CASH`, `CARD`, `UPI`, `BANK_TRANSFER`, `SPLIT`
- **Full support for all 5 modes**

**Validation:**
```javascript
// Accepts all 5 modes
if (!['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT'].includes(payment_mode)) {
  return error('Payment mode must be CASH, CARD, UPI, BANK_TRANSFER, or SPLIT');
}
```

---

### 4. Create Payment (`POST /api/payments`)
- **Supported modes:** `CASH`, `CARD`, `UPI`, `BANK_TRANSFER`, `SPLIT`
- **Full support for all 5 modes**

---

## Payment Amount Storage Logic

### For CASH:
```javascript
cash_amount = paidAmount
bank_amount = 0
```

### For CARD, UPI, BANK_TRANSFER:
```javascript
cash_amount = 0
bank_amount = paidAmount
```

### For SPLIT:
```javascript
cash_amount = cashAmount (from request)
bank_amount = bankAmount (from request)
// Total = cash_amount + bank_amount
```

---

## Validation Rules

### 1. Payment Mode Required
- `paymentMode` is **required** when `paidAmount > 0`
- `paymentMode` can be `null` when `paidAmount = 0` (pending payment)

### 2. Transaction Reference
- **Optional** for all payment modes
- **Recommended** for online payments (`CARD`, `UPI`, `BANK_TRANSFER`)
- Helps track and verify transactions

### 3. Split Payment Validation
- Both `cashAmount` and `bankAmount` are **required**
- Both must be **greater than 0**
- `cashAmount + bankAmount` must equal `paidAmount`

---

## Code Examples

### Order Creation with Payment
```javascript
// CASH payment
POST /api/orders
{
  "orderNumber": "ORD-001",
  "customerId": 1,
  "totalAmount": 1000.00,
  "paidAmount": 500.00,
  "paymentMode": "CASH"
}

// UPI payment
POST /api/orders
{
  "orderNumber": "ORD-002",
  "customerId": 1,
  "totalAmount": 1000.00,
  "paidAmount": 1000.00,
  "paymentMode": "UPI",
  "transactionReference": "UPI123456789"
}
```

### Payment Collection
```javascript
// CASH payment
POST /api/payments/collect
{
  "order_id": 123,
  "amount": 500.00,
  "payment_mode": "CASH"
}

// SPLIT payment
POST /api/payments/collect
{
  "order_id": 123,
  "amount": 1000.00,
  "payment_mode": "SPLIT",
  "cash_amount": 400.00,
  "bank_amount": 600.00
}
```

---

## Reports and Analytics

### Payment Mode Filtering
All payment reports support filtering by payment mode:

```javascript
GET /api/payments?payment_mode=CASH
GET /api/payments?payment_mode=UPI
GET /api/payments?payment_mode=SPLIT
```

### Sales Report Breakdown
The sales report includes:
- Total cash collected (`total_cash_collected`)
- Total bank collected (`total_bank_collected`)
- Breakdown by payment mode

---

## Summary

| Feature | CASH | CARD | UPI | BANK_TRANSFER | SPLIT |
|---------|------|------|-----|---------------|-------|
| **Order Creation** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Order Update** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Payment Collection** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Transaction Reference** | Optional | Recommended | Recommended | Recommended | Optional |
| **Amount Storage** | `cash_amount` | `bank_amount` | `bank_amount` | `bank_amount` | Both |

---

## Notes

1. **Case Insensitive:** Payment modes are automatically converted to uppercase (`CASH`, `CARD`, etc.)

2. **Normalization:** 
   - `"BANK"` → `"BANK_TRANSFER"`
   - `"bank"` → `"BANK_TRANSFER"`
   - `"cash"` → `"CASH"`

3. **Default:** If `paymentMode` is not provided, it defaults to `"CASH"` in payment collection endpoints

4. **SPLIT Payment:** Only available in payment collection endpoints, not in order creation/update

5. **Transaction Reference:** Always optional but recommended for online payments for audit trail
