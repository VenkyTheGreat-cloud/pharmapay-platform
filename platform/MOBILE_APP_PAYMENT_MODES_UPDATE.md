# Mobile App Payment Modes Update Guide

## Overview

The payment system has been simplified. The mobile app needs to be updated to support the new payment modes and enhanced SPLIT payment functionality.

---

## Changes Summary

### ✅ Removed
- **BANK_TRANSFER** - No longer supported

### ✅ Added
- **CREDIT** - New payment mode for credit transactions

### ✅ Updated
- **SPLIT** - Now supports multiple payment mode combinations (CASH+UPI+CARD, CASH+UPI, UPI+CARD, CASH+CARD, etc.)

### ✅ Kept
- **CASH** - Cash payments
- **CARD** - Card payments
- **UPI** - UPI payments

---

## New Payment Modes

| Payment Mode | Description | Use Case |
|--------------|-------------|----------|
| `CASH` | Cash payment | Physical cash received |
| `CARD` | Card payment | Debit/Credit card transaction |
| `UPI` | UPI payment | UPI apps (PhonePe, GooglePay, Paytm, etc.) |
| `CREDIT` | Credit payment | Credit transactions (new) |
| `SPLIT` | Split payment | Multiple payment modes in one transaction |

---

## API Changes

### 1. Single Payment Mode (CASH, CARD, UPI, CREDIT)

**Request Format (No Change):**
```json
POST /api/payments/collect
{
  "order_id": 123,
  "amount": 500.00,
  "payment_mode": "CASH"  // or "CARD", "UPI", "CREDIT"
}
```

**What Changed:**
- ❌ `"BANK_TRANSFER"` is no longer valid
- ✅ `"CREDIT"` is now a valid option

---

### 2. SPLIT Payment (Enhanced)

**Old Format (No Longer Supported):**
```json
// ❌ OLD - Don't use this anymore
{
  "order_id": 123,
  "amount": 1000.00,
  "payment_mode": "SPLIT",
  "cash_amount": 400.00,
  "bank_amount": 600.00
}
```

**New Format (Required):**
```json
// ✅ NEW - Use this format
{
  "order_id": 123,
  "amount": 1000.00,
  "payment_mode": "SPLIT",
  "splitPayments": [
    {
      "mode": "CASH",
      "amount": 300.00
    },
    {
      "mode": "UPI",
      "amount": 400.00,
      "transactionReference": "UPI123456789"
    },
    {
      "mode": "CARD",
      "amount": 300.00,
      "transactionReference": "CARD123456789"
    }
  ]
}
```

---

## Mobile App Implementation

### 1. Update Payment Mode Options

**Remove:**
- `BANK_TRANSFER` option from all dropdowns/selectors

**Add:**
- `CREDIT` option to payment mode selector

**Payment Mode List:**
```javascript
const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CREDIT', label: 'Credit' },  // ← NEW
  { value: 'SPLIT', label: 'Split Payment' }
];
```

---

### 2. Update SPLIT Payment UI

**Old UI (Remove):**
```javascript
// ❌ OLD - Simple cash/bank split
<View>
  <TextInput 
    placeholder="Cash Amount" 
    value={cashAmount}
    onChangeText={setCashAmount}
  />
  <TextInput 
    placeholder="Bank Amount" 
    value={bankAmount}
    onChangeText={setBankAmount}
  />
</View>
```

**New UI (Required):**
```javascript
// ✅ NEW - Multiple payment modes
const [splitPayments, setSplitPayments] = useState([
  { mode: 'CASH', amount: '', transactionReference: '' }
]);

const addSplitPayment = () => {
  setSplitPayments([...splitPayments, { 
    mode: 'CASH', 
    amount: '', 
    transactionReference: '' 
  }]);
};

const updateSplitPayment = (index, field, value) => {
  const updated = [...splitPayments];
  updated[index][field] = value;
  setSplitPayments(updated);
};

// Render UI
<View>
  {splitPayments.map((payment, index) => (
    <View key={index}>
      <Picker
        selectedValue={payment.mode}
        onValueChange={(value) => updateSplitPayment(index, 'mode', value)}
      >
        <Picker.Item label="Cash" value="CASH" />
        <Picker.Item label="Card" value="CARD" />
        <Picker.Item label="UPI" value="UPI" />
        <Picker.Item label="Credit" value="CREDIT" />
      </Picker>
      
      <TextInput
        placeholder="Amount"
        value={payment.amount}
        onChangeText={(value) => updateSplitPayment(index, 'amount', value)}
        keyboardType="numeric"
      />
      
      {(payment.mode === 'CARD' || payment.mode === 'UPI' || payment.mode === 'CREDIT') && (
        <TextInput
          placeholder="Transaction Reference (Optional)"
          value={payment.transactionReference}
          onChangeText={(value) => updateSplitPayment(index, 'transactionReference', value)}
        />
      )}
      
      {splitPayments.length > 1 && (
        <Button 
          title="Remove" 
          onPress={() => removeSplitPayment(index)} 
        />
      )}
    </View>
  ))}
  
  <Button title="Add Payment Mode" onPress={addSplitPayment} />
</View>
```

---

### 3. Update Payment Collection Function

**Old Function:**
```javascript
// ❌ OLD
const collectPayment = async (orderId, amount, paymentMode, cashAmount, bankAmount) => {
  const body = {
    order_id: orderId,
    amount: amount,
    payment_mode: paymentMode
  };
  
  if (paymentMode === 'SPLIT') {
    body.cash_amount = cashAmount;
    body.bank_amount = bankAmount;
  }
  
  // API call...
};
```

**New Function:**
```javascript
// ✅ NEW
const collectPayment = async (orderId, amount, paymentMode, splitPayments = []) => {
  const body = {
    order_id: orderId,
    amount: amount,
    payment_mode: paymentMode
  };
  
  // For SPLIT payment, send splitPayments array
  if (paymentMode === 'SPLIT') {
    // Validate split payments
    const total = splitPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    if (Math.abs(total - amount) > 0.01) {
      throw new Error('Split payments total must equal amount');
    }
    
    if (splitPayments.length < 2) {
      throw new Error('SPLIT payment requires at least 2 payment modes');
    }
    
    body.splitPayments = splitPayments.map(p => ({
      mode: p.mode,
      amount: parseFloat(p.amount),
      transactionReference: p.transactionReference || null
    }));
  }
  
  // API call...
  const response = await fetch(`${API_URL}/payments/collect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(body)
  });
  
  return response.json();
};
```

---

### 4. Complete React Native Example

```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Picker, ScrollView } from 'react-native';

const PaymentCollectionScreen = ({ orderId, totalAmount }) => {
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [amount, setAmount] = useState(totalAmount.toString());
  const [transactionReference, setTransactionReference] = useState('');
  
  // SPLIT payment state
  const [splitPayments, setSplitPayments] = useState([
    { mode: 'CASH', amount: '', transactionReference: '' }
  ]);

  const PAYMENT_MODES = ['CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT'];

  const addSplitPayment = () => {
    setSplitPayments([...splitPayments, { 
      mode: 'CASH', 
      amount: '', 
      transactionReference: '' 
    }]);
  };

  const removeSplitPayment = (index) => {
    if (splitPayments.length > 1) {
      setSplitPayments(splitPayments.filter((_, i) => i !== index));
    }
  };

  const updateSplitPayment = (index, field, value) => {
    const updated = [...splitPayments];
    updated[index][field] = value;
    setSplitPayments(updated);
  };

  const calculateSplitTotal = () => {
    return splitPayments.reduce((sum, p) => {
      return sum + parseFloat(p.amount || 0);
    }, 0);
  };

  const handleSubmit = async () => {
    try {
      const body = {
        order_id: orderId,
        amount: parseFloat(amount),
        payment_mode: paymentMode
      };

      // Add transaction reference for single payments
      if (paymentMode !== 'SPLIT' && paymentMode !== 'CASH') {
        body.transaction_reference = transactionReference;
      }

      // Handle SPLIT payment
      if (paymentMode === 'SPLIT') {
        const splitTotal = calculateSplitTotal();
        
        if (Math.abs(splitTotal - parseFloat(amount)) > 0.01) {
          alert('Split payments total must equal amount');
          return;
        }

        if (splitPayments.length < 2) {
          alert('SPLIT payment requires at least 2 payment modes');
          return;
        }

        body.splitPayments = splitPayments.map(p => ({
          mode: p.mode,
          amount: parseFloat(p.amount),
          transactionReference: p.transactionReference || null
        }));
      }

      const response = await fetch(`${API_URL}/payments/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Payment collected successfully');
        // Navigate back or refresh
      } else {
        alert(result.error?.message || 'Payment collection failed');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <ScrollView>
      <Text>Payment Mode</Text>
      <Picker
        selectedValue={paymentMode}
        onValueChange={setPaymentMode}
      >
        {PAYMENT_MODES.map(mode => (
          <Picker.Item key={mode} label={mode} value={mode} />
        ))}
      </Picker>

      <Text>Amount</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      {paymentMode === 'SPLIT' ? (
        <View>
          <Text>Split Payments</Text>
          {splitPayments.map((payment, index) => (
            <View key={index} style={{ marginVertical: 10 }}>
              <Text>Payment {index + 1}</Text>
              
              <Picker
                selectedValue={payment.mode}
                onValueChange={(value) => updateSplitPayment(index, 'mode', value)}
              >
                <Picker.Item label="Cash" value="CASH" />
                <Picker.Item label="Card" value="CARD" />
                <Picker.Item label="UPI" value="UPI" />
                <Picker.Item label="Credit" value="CREDIT" />
              </Picker>
              
              <TextInput
                placeholder="Amount"
                value={payment.amount}
                onChangeText={(value) => updateSplitPayment(index, 'amount', value)}
                keyboardType="numeric"
              />
              
              {(payment.mode === 'CARD' || payment.mode === 'UPI' || payment.mode === 'CREDIT') && (
                <TextInput
                  placeholder="Transaction Reference"
                  value={payment.transactionReference}
                  onChangeText={(value) => updateSplitPayment(index, 'transactionReference', value)}
                />
              )}
              
              {splitPayments.length > 1 && (
                <Button 
                  title="Remove" 
                  onPress={() => removeSplitPayment(index)} 
                />
              )}
            </View>
          ))}
          
          <Text>Total: {calculateSplitTotal()}</Text>
          <Button title="Add Payment Mode" onPress={addSplitPayment} />
        </View>
      ) : (
        <>
          {paymentMode !== 'CASH' && (
            <>
              <Text>Transaction Reference (Optional)</Text>
              <TextInput
                value={transactionReference}
                onChangeText={setTransactionReference}
                placeholder="Enter transaction reference"
              />
            </>
          )}
        </>
      )}

      <Button title="Collect Payment" onPress={handleSubmit} />
    </ScrollView>
  );
};

export default PaymentCollectionScreen;
```

---

### 5. Flutter Example

```dart
import 'package:flutter/material.dart';

class PaymentCollectionScreen extends StatefulWidget {
  final int orderId;
  final double totalAmount;

  const PaymentCollectionScreen({
    Key? key,
    required this.orderId,
    required this.totalAmount,
  }) : super(key: key);

  @override
  _PaymentCollectionScreenState createState() => _PaymentCollectionScreenState();
}

class _PaymentCollectionScreenState extends State<PaymentCollectionScreen> {
  String _paymentMode = 'CASH';
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _transactionRefController = TextEditingController();
  
  List<SplitPayment> _splitPayments = [
    SplitPayment(mode: 'CASH', amount: '', transactionReference: '')
  ];

  final List<String> _paymentModes = ['CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT'];

  @override
  void initState() {
    super.initState();
    _amountController.text = widget.totalAmount.toString();
  }

  void _addSplitPayment() {
    setState(() {
      _splitPayments.add(SplitPayment(
        mode: 'CASH',
        amount: '',
        transactionReference: ''
      ));
    });
  }

  void _removeSplitPayment(int index) {
    if (_splitPayments.length > 1) {
      setState(() {
        _splitPayments.removeAt(index);
      });
    }
  }

  double _calculateSplitTotal() {
    return _splitPayments.fold(0.0, (sum, p) {
      return sum + (double.tryParse(p.amount) ?? 0.0);
    });
  }

  Future<void> _handleSubmit() async {
    try {
      final body = <String, dynamic>{
        'order_id': widget.orderId,
        'amount': double.parse(_amountController.text),
        'payment_mode': _paymentMode,
      };

      if (_paymentMode != 'SPLIT' && _paymentMode != 'CASH') {
        body['transaction_reference'] = _transactionRefController.text;
      }

      if (_paymentMode == 'SPLIT') {
        final splitTotal = _calculateSplitTotal();
        final amount = double.parse(_amountController.text);
        
        if ((splitTotal - amount).abs() > 0.01) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Split payments total must equal amount'))
          );
          return;
        }

        if (_splitPayments.length < 2) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('SPLIT payment requires at least 2 payment modes'))
          );
          return;
        }

        body['splitPayments'] = _splitPayments.map((p) => {
          return {
            'mode': p.mode,
            'amount': double.parse(p.amount),
            'transactionReference': p.transactionReference.isEmpty ? null : p.transactionReference
          };
        }).toList();
      }

      // Make API call
      final response = await http.post(
        Uri.parse('$API_URL/payments/collect'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken'
        },
        body: jsonEncode(body),
      );

      final result = jsonDecode(response.body);
      
      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Payment collected successfully'))
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['error']?['message'] ?? 'Payment collection failed'))
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'))
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Collect Payment')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Payment Mode'),
            DropdownButton<String>(
              value: _paymentMode,
              items: _paymentModes.map((mode) {
                return DropdownMenuItem(
                  value: mode,
                  child: Text(mode),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _paymentMode = value!;
                });
              },
            ),
            
            SizedBox(height: 16),
            Text('Amount'),
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
            ),

            if (_paymentMode == 'SPLIT') ...[
              SizedBox(height: 16),
              Text('Split Payments'),
              ..._splitPayments.asMap().entries.map((entry) {
                final index = entry.key;
                final payment = entry.value;
                return Card(
                  child: Padding(
                    padding: EdgeInsets.all(8),
                    child: Column(
                      children: [
                        DropdownButton<String>(
                          value: payment.mode,
                          items: ['CASH', 'CARD', 'UPI', 'CREDIT'].map((mode) {
                            return DropdownMenuItem(
                              value: mode,
                              child: Text(mode),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              _splitPayments[index].mode = value!;
                            });
                          },
                        ),
                        TextField(
                          decoration: InputDecoration(labelText: 'Amount'),
                          keyboardType: TextInputType.number,
                          onChanged: (value) {
                            setState(() {
                              _splitPayments[index].amount = value;
                            });
                          },
                        ),
                        if (payment.mode != 'CASH')
                          TextField(
                            decoration: InputDecoration(labelText: 'Transaction Reference'),
                            onChanged: (value) {
                              setState(() {
                                _splitPayments[index].transactionReference = value;
                              });
                            },
                          ),
                        if (_splitPayments.length > 1)
                          ElevatedButton(
                            onPressed: () => _removeSplitPayment(index),
                            child: Text('Remove'),
                          ),
                      ],
                    ),
                  ),
                );
              }).toList(),
              ElevatedButton(
                onPressed: _addSplitPayment,
                child: Text('Add Payment Mode'),
              ),
              Text('Total: ${_calculateSplitTotal()}'),
            ] else ...[
              if (_paymentMode != 'CASH') ...[
                SizedBox(height: 16),
                Text('Transaction Reference (Optional)'),
                TextField(
                  controller: _transactionRefController,
                  decoration: InputDecoration(
                    hintText: 'Enter transaction reference'
                  ),
                ),
              ],
            ],

            SizedBox(height: 24),
            ElevatedButton(
              onPressed: _handleSubmit,
              child: Text('Collect Payment'),
            ),
          ],
        ),
      ),
    );
  }
}

class SplitPayment {
  String mode;
  String amount;
  String transactionReference;

  SplitPayment({
    required this.mode,
    required this.amount,
    required this.transactionReference,
  });
}
```

---

## Validation Rules

### Single Payment (CASH, CARD, UPI, CREDIT)
- ✅ `payment_mode` must be one of: `CASH`, `CARD`, `UPI`, `CREDIT`
- ✅ `amount` must be greater than 0
- ✅ `transaction_reference` is optional (recommended for CARD, UPI, CREDIT)

### SPLIT Payment
- ✅ `payment_mode` must be `SPLIT`
- ✅ `splitPayments` array is required
- ✅ `splitPayments` must have at least 2 items
- ✅ Each item must have:
  - `mode`: One of `CASH`, `CARD`, `UPI`, `CREDIT`
  - `amount`: Greater than 0
  - `transactionReference`: Optional (recommended for CARD, UPI, CREDIT)
- ✅ Sum of all `splitPayments[].amount` must equal `amount`

---

## Migration Checklist

- [ ] Remove `BANK_TRANSFER` from all payment mode selectors
- [ ] Add `CREDIT` to payment mode selectors
- [ ] Update SPLIT payment UI to support multiple payment modes
- [ ] Update payment collection API calls to use new `splitPayments` format
- [ ] Remove old `cash_amount` and `bank_amount` fields for SPLIT
- [ ] Test all payment modes (CASH, CARD, UPI, CREDIT, SPLIT)
- [ ] Test SPLIT with various combinations:
  - [ ] CASH + UPI
  - [ ] CASH + CARD
  - [ ] UPI + CARD
  - [ ] CASH + UPI + CARD
  - [ ] CASH + UPI + CARD + CREDIT
- [ ] Update error messages
- [ ] Update UI labels and help text

---

## Testing Examples

### Test 1: Single CASH Payment
```json
POST /api/payments/collect
{
  "order_id": 123,
  "amount": 500.00,
  "payment_mode": "CASH"
}
```

### Test 2: Single UPI Payment
```json
POST /api/payments/collect
{
  "order_id": 123,
  "amount": 500.00,
  "payment_mode": "UPI",
  "transaction_reference": "UPI123456789"
}
```

### Test 3: Single CREDIT Payment
```json
POST /api/payments/collect
{
  "order_id": 123,
  "amount": 500.00,
  "payment_mode": "CREDIT",
  "transaction_reference": "CREDIT123456789"
}
```

### Test 4: SPLIT - CASH + UPI
```json
POST /api/payments/collect
{
  "order_id": 123,
  "amount": 1000.00,
  "payment_mode": "SPLIT",
  "splitPayments": [
    {"mode": "CASH", "amount": 400.00},
    {"mode": "UPI", "amount": 600.00, "transactionReference": "UPI123456789"}
  ]
}
```

### Test 5: SPLIT - CASH + UPI + CARD
```json
POST /api/payments/collect
{
  "order_id": 123,
  "amount": 1500.00,
  "payment_mode": "SPLIT",
  "splitPayments": [
    {"mode": "CASH", "amount": 500.00},
    {"mode": "UPI", "amount": 600.00, "transactionReference": "UPI123456789"},
    {"mode": "CARD", "amount": 400.00, "transactionReference": "CARD123456789"}
  ]
}
```

---

## Important Notes

1. **Backward Compatibility**: The old SPLIT format (`cash_amount` + `bank_amount`) is **no longer supported**. All SPLIT payments must use the new `splitPayments` array format.

2. **Transaction References**: For CARD, UPI, and CREDIT payments, transaction references are optional but recommended for audit trail.

3. **Amount Validation**: The sum of split payments must exactly equal the total amount (within 0.01 tolerance for floating point).

4. **Minimum Split Payments**: SPLIT payment requires at least 2 payment modes. Single payment should use the direct payment mode (CASH, CARD, UPI, or CREDIT).

5. **Error Handling**: The API will return validation errors if:
   - Invalid payment mode
   - Split payments don't sum to total amount
   - Less than 2 payment modes in SPLIT
   - Invalid payment mode in splitPayments array

---

## Support

If you encounter any issues during implementation, please refer to:
- API documentation: `/api/payments/collect` endpoint
- Backend logs for detailed error messages
- Database migration script: `scripts/update-payment-modes-simplified.sql`
