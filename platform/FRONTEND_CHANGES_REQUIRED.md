# Frontend Changes Required

This document outlines all frontend changes needed for Admin Dashboard, Store Manager Dashboard, and Mobile App (Delivery Boy) based on the new multi-tenant architecture.

---

## 📱 Mobile App (Delivery Boy) - Registration Changes

### 1. Registration Form - Add Admin Selection Dropdown

**Location:** Delivery Boy Registration Screen

**Changes Required:**

#### Step 1: Fetch Admins List on Page Load
```javascript
// Add this API call when registration page loads
const fetchAdmins = async () => {
  try {
    const response = await fetch('https://your-api-url.com/api/auth/admins-stores', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      setAdminsList(result.data.admins_and_stores);
      // If only one admin, auto-select it
      if (result.data.count === 1) {
        setSelectedAdminId(result.data.admins_and_stores[0].id);
      }
    }
  } catch (error) {
    console.error('Error fetching admins:', error);
    // Show error message to user
  }
};

// Call on component mount
useEffect(() => {
  fetchAdmins();
}, []);
```

#### Step 2: Add Dropdown in Registration Form
```jsx
<View style={styles.formGroup}>
  <Text style={styles.label}>Select Admin *</Text>
  <Picker
    selectedValue={selectedAdminId}
    onValueChange={(itemValue) => setSelectedAdminId(itemValue)}
    style={styles.picker}
  >
    <Picker.Item label="Select Admin" value="" />
    {adminsList.map((admin) => (
      <Picker.Item 
        key={admin.id} 
        label={`${admin.name}${admin.store_name ? ` - ${admin.store_name}` : ''}`} 
        value={admin.id} 
      />
    ))}
  </Picker>
  {!selectedAdminId && <Text style={styles.errorText}>Please select an admin</Text>}
</View>
```

#### Step 3: Update Registration API Call
```javascript
const handleRegister = async () => {
  // Validation
  if (!selectedAdminId) {
    Alert.alert('Error', 'Please select an admin');
    return;
  }
  
  if (!name || !mobile || !email || !password) {
    Alert.alert('Error', 'Please fill all required fields');
    return;
  }
  
  try {
    const response = await fetch('https://your-api-url.com/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        address: address || '',
        store_id: selectedAdminId  // ⚠️ REQUIRED: Add this field
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      Alert.alert(
        'Success', 
        'Registration successful! Your account is pending approval. You will be notified once approved.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      Alert.alert('Error', result.error?.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    Alert.alert('Error', 'Registration failed. Please try again.');
  }
};
```

**Required Fields in Registration:**
- ✅ Name
- ✅ Mobile
- ✅ Email
- ✅ Password
- ✅ Address (optional)
- ✅ **store_id** (NEW - Required - Selected from dropdown)

---

## 👨‍💼 Admin Dashboard Changes

### 1. Delivery Boys List - No Changes Needed
- Admin can see ALL delivery boys (no filtering needed)
- Existing UI/functionality remains the same

### 2. Orders List - Optional Store Filter
- Admin sees ALL orders by default
- **Optional Enhancement:** Add a store filter dropdown to filter orders by specific store
```jsx
// Optional: Add store filter
<Select
  placeholder="Filter by Store (Optional)"
  value={selectedStoreId}
  onChange={setSelectedStoreId}
>
  <option value="">All Stores</option>
  {stores.map(store => (
    <option key={store.id} value={store.id}>{store.name}</option>
  ))}
</Select>

// API call with optional filter
const fetchOrders = async () => {
  const url = selectedStoreId 
    ? `/api/orders?storeId=${selectedStoreId}`
    : '/api/orders';
  // ... rest of the code
};
```

### 3. Customers List - Optional Store Filter
- Admin sees ALL customers by default
- **Optional Enhancement:** Add a store filter dropdown (similar to orders)

### 4. Store Managers Management - No Changes
- Admin can create, view, update, delete store managers
- Existing functionality remains the same

---

## 🏪 Store Manager Dashboard Changes

### 1. Delivery Boys List - No Changes Needed
- Store managers now see ALL delivery boys (shared across all stores)
- Existing UI/functionality remains the same
- **Note:** Previously they might have seen only their store's delivery boys, now they see all

### 2. Orders List - No Changes Needed
- Store managers now see ALL orders from all stores (shared view)
- Existing UI/functionality remains the same
- **Note:** Previously they might have seen only their store's orders, now they see all

### 3. Customers List - No Changes Needed
- Store managers see only their own customers (filtered automatically)
- Existing UI/functionality remains the same
- **Note:** This behavior remains unchanged

### 4. Access Control - Remove/Hide (If Present)
- Store managers should NOT have access to store manager management
- If there's a menu item or route for this, remove it or hide it for store managers
- Store managers cannot see other store managers

**Example:**
```jsx
// In navigation/menu component
{user.role === 'admin' && (
  <MenuItem to="/access-control">
    Store Managers
  </MenuItem>
)}
```

---

## 🔐 Authentication & Authorization

### No Changes Required
- Login flow remains the same
- Token refresh remains the same
- Profile endpoints remain the same

---

## 📊 Data Visibility Summary

### Super Admin (role: 'admin')
| Resource | Visibility | Filter |
|----------|-----------|--------|
| Delivery Boys | ✅ All | Optional: by store_id |
| Orders | ✅ All | Optional: by store_id |
| Customers | ✅ All | Optional: by store_id |
| Store Managers | ✅ All | - |

### Store Manager (role: 'store_manager')
| Resource | Visibility | Filter |
|----------|-----------|--------|
| Delivery Boys | ✅ All | None (shared view) |
| Orders | ✅ All | None (shared view) |
| Customers | ✅ Own Only | Auto-filtered by store_id |
| Store Managers | ❌ None | Cannot access |

### Delivery Boy (role: 'delivery_boy')
| Resource | Visibility | Filter |
|----------|-----------|--------|
| Orders | ✅ Assigned Only | Auto-filtered by assigned_delivery_boy_id |
| Profile | ✅ Own Only | - |

---

## 🚨 Important Notes

### 1. Registration Endpoint Change
- **BREAKING CHANGE:** `store_id` is now **REQUIRED** in registration
- Mobile app MUST include admin selection dropdown
- Registration will fail if `store_id` is not provided

### 2. API Endpoints

#### New Endpoint (Public)
```
GET /api/auth/admins-stores
```
Returns list of active super admins for registration dropdown.

**Response:**
```json
{
  "success": true,
  "data": {
    "admins_and_stores": [
      {
        "id": "uuid-here",
        "name": "Admin Name",
        "store_name": "Store Name",
        "mobile": "1234567890",
        "email": "admin@example.com",
        "role": "admin",
        "is_active": true,
        "status": "active"
      }
    ],
    "count": 1
  }
}
```

#### Updated Endpoint
```
POST /api/auth/register
```
**New Required Field:** `store_id`

**Request Body:**
```json
{
  "name": "John Doe",
  "mobile": "9876543210",
  "email": "john@example.com",
  "password": "password123",
  "address": "123 Main St",
  "store_id": "uuid-here"  // ⚠️ REQUIRED
}
```

### 3. Error Handling

**Registration Errors:**
- `VALIDATION_ERROR: Store/Admin selection is required` - User didn't select admin
- `NOT_FOUND: Selected admin not found` - Invalid admin ID
- `VALIDATION_ERROR: Only super admin can be selected` - Selected user is not an admin
- `VALIDATION_ERROR: Selected admin is not active` - Selected admin is inactive

**Handle these errors in UI:**
```javascript
if (result.error?.code === 'VALIDATION_ERROR') {
  if (result.error.message.includes('Store/Admin selection')) {
    // Show error on dropdown
    setAdminError('Please select an admin');
  }
}
```

---

## ✅ Checklist for Frontend Team

### Mobile App (Delivery Boy)
- [ ] Add admin dropdown to registration form
- [ ] Fetch admins list on registration page load
- [ ] Add `store_id` to registration API call
- [ ] Add validation for admin selection
- [ ] Update error messages
- [ ] Test registration flow
- [ ] Handle case when no admins available

### Admin Dashboard
- [ ] Verify all delivery boys are visible
- [ ] Verify all orders are visible
- [ ] Verify all customers are visible
- [ ] (Optional) Add store filter for orders
- [ ] (Optional) Add store filter for customers
- [ ] Test store manager management

### Store Manager Dashboard
- [ ] Verify all delivery boys are visible (shared view)
- [ ] Verify all orders are visible (shared view)
- [ ] Verify only own customers are visible
- [ ] Remove/hide store manager management access
- [ ] Test all functionality

---

## 🧪 Testing Scenarios

### Mobile App Testing
1. **Registration with Admin Selection:**
   - Select admin from dropdown
   - Submit registration
   - Verify success message
   - Verify delivery boy is created with correct `store_id`

2. **Registration without Admin Selection:**
   - Try to submit without selecting admin
   - Verify validation error

3. **No Admins Available:**
   - Test when API returns empty list
   - Show appropriate message to user

### Admin Dashboard Testing
1. **View All Data:**
   - Verify all delivery boys visible
   - Verify all orders visible
   - Verify all customers visible

2. **Optional Filters:**
   - Test store filter on orders (if implemented)
   - Test store filter on customers (if implemented)

### Store Manager Dashboard Testing
1. **Shared View:**
   - Verify all delivery boys visible (from all stores)
   - Verify all orders visible (from all stores)

2. **Isolated View:**
   - Verify only own customers visible
   - Verify cannot access store manager management

---

## 📝 Example Code Snippets

### React Native (Mobile App)
```jsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const DeliveryBoyRegistration = ({ navigation }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [adminsList, setAdminsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch('https://your-api-url.com/api/auth/admins-stores');
      const result = await response.json();
      
      if (result.success) {
        setAdminsList(result.data.admins_and_stores);
        if (result.data.count === 1) {
          setSelectedAdminId(result.data.admins_and_stores[0].id);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load admins. Please try again.');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedAdminId) {
      Alert.alert('Error', 'Please select an admin');
      return;
    }

    if (!name || !mobile || !email || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://your-api-url.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          mobile,
          email,
          password,
          address,
          store_id: selectedAdminId
        })
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Success',
          'Registration successful! Your account is pending approval.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Error', result.error?.message || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingAdmins) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading admins...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Name *"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Mobile *"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
      />
      <TextInput
        placeholder="Email *"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
        multiline
      />
      
      <Text style={styles.label}>Select Admin *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedAdminId}
          onValueChange={setSelectedAdminId}
          style={styles.picker}
        >
          <Picker.Item label="Select Admin" value="" />
          {adminsList.map((admin) => (
            <Picker.Item
              key={admin.id}
              label={`${admin.name}${admin.store_name ? ` - ${admin.store_name}` : ''}`}
              value={admin.id}
            />
          ))}
        </Picker>
      </View>

      <TouchableOpacity
        onPress={handleRegister}
        disabled={loading}
        style={[styles.button, loading && styles.buttonDisabled]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
```

### React (Admin/Store Dashboard)
```jsx
// Example: Conditional menu rendering
const NavigationMenu = ({ user }) => {
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/delivery-boys">Delivery Boys</Link>
      <Link to="/orders">Orders</Link>
      <Link to="/customers">Customers</Link>
      
      {/* Only show for Super Admin */}
      {user.role === 'admin' && (
        <Link to="/access-control">Store Managers</Link>
      )}
    </nav>
  );
};
```

---

## 🆘 Support

If you encounter any issues during implementation, check:
1. API endpoint URLs are correct
2. `store_id` is included in registration payload
3. Admin selection validation is working
4. Error messages are properly displayed
5. Network requests are successful (check browser/device console)

---

**Last Updated:** Based on backend changes for multi-tenant architecture
**Version:** 1.0



