# Contacts Screen - Integration Guide

## Overview
Complete implementation guide for integrating the Contacts screen into another dashboard. This screen allows users to register customer contacts and view registered customers with their order status for a selected date.

---

## 📋 Table of Contents
1. [API Endpoints](#api-endpoints)
2. [Component Code](#component-code)
3. [Dependencies](#dependencies)
4. [UI Specifications](#ui-specifications)
5. [Integration Steps](#integration-steps)

---

## 🔌 API Endpoints

### 1. Create Customer Registry
**Endpoint:** `POST /api/customer-registry`  
**Authorization:** `Bearer <token>`  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "mobile": "9876543210",
  "name": "John Doe",
  "registry_date": "2026-01-21T15:45:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "mobile": "9876543210",
    "name": "John Doe",
    "registry_date": "2026-01-21T15:45:00Z",
    "created_at": "2026-01-21T15:45:00Z"
  }
}
```

### 2. Get Customers with Orders
**Endpoint:** `GET /api/customer-registry/with-orders?date=2026-01-20`  
**Authorization:** `Bearer <token>`

**Query Parameters:**
- `date` (required): Date in `YYYY-MM-DD` format

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-01-20",
    "customers": [
      {
        "registry_id": 1,
        "customer_name": "John Doe",
        "customer_mobile": "9876543210",
        "registry_date": "2026-01-20T14:30:00.000Z",
        "registry_date_time": "2026-01-20T14:30:00.000Z",
        "has_order": true,
        "order": {
          "order_id": 123,
          "order_number": "ORD-001",
          "order_created_at": "2026-01-20T16:45:00.000Z",
          "order_created_date_time": "2026-01-20T16:45:00.000Z",
          "total_amount": 1000.00,
          "order_status": "DELIVERED"
        }
      },
      {
        "registry_id": 2,
        "customer_name": "Jane Smith",
        "customer_mobile": "9876543211",
        "registry_date": "2026-01-20T10:15:00.000Z",
        "registry_date_time": "2026-01-20T10:15:00.000Z",
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

---

## 💻 Component Code

### ContactsPage.jsx

```jsx
import { useState, useEffect } from 'react';
import { Phone, Calendar, RefreshCw, Plus, CheckCircle, XCircle } from 'lucide-react';

// Helper function to get today's date in IST (Indian Standard Time, UTC+5:30)
const getTodayIST = () => {
    const now = new Date();
    // Use Intl.DateTimeFormat to get date in IST timezone
    const istDateString = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);
    
    // Return in YYYY-MM-DD format (en-CA locale already returns this format)
    return istDateString;
};

export default function ContactsPage() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(getTodayIST());
    const [customerName, setCustomerName] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadContacts();
    }, [selectedDate]);

    const loadContacts = async () => {
        try {
            setLoading(true);
            // Replace with your API base URL
            const response = await fetch(
                `${API_BASE_URL}/customer-registry/with-orders?date=${selectedDate}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            const res = await response.json();
            const list = res.data?.customers || [];
            setContacts(list);
        } catch (error) {
            console.error('Error loading contacts:', error);
            alert(error.response?.data?.error?.message || error.response?.data?.message || 'Error loading contacts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get current date and time in IST as ISO string
    const getCurrentISTDateTime = () => {
        const now = new Date();
        // Format current date/time in IST timezone
        const istString = now.toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        // Parse the IST string (format: MM/DD/YYYY, HH:mm:ss)
        const [datePart, timePart] = istString.split(', ');
        const [month, day, year] = datePart.split('/');
        const [hour, minute, second] = timePart.split(':');
        
        // Format as ISO string: YYYY-MM-DDTHH:mm:ssZ
        return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    };

    const handleAddContact = async (e) => {
        e.preventDefault();
        
        if (!customerName.trim()) {
            alert('Please enter a customer name');
            return;
        }

        if (!mobileNumber.trim()) {
            alert('Please enter a mobile number');
            return;
        }

        // Validate mobile number (10 digits)
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobileNumber.trim())) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }

        try {
            setIsSubmitting(true);
            
            // Get current date and time in IST
            const registryDate = getCurrentISTDateTime();
            
            // Replace with your API base URL
            const response = await fetch(`${API_BASE_URL}/customer-registry`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mobile: mobileNumber.trim(),
                    name: customerName.trim(),
                    registry_date: registryDate
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add contact');
            }
            
            // Clear the inputs
            setCustomerName('');
            setMobileNumber('');
            
            // Reload contacts
            await loadContacts();
            
            alert('Contact added successfully');
        } catch (error) {
            console.error('Error adding contact:', error);
            alert(error.message || 'Error adding contact. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDateSubmit = () => {
        loadContacts();
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 px-4 pt-2 border-b-2 border-primary-200 shadow-sm flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">Contacts</h1>
                        <p className="text-xs text-gray-600 mt-0.5">Manage contact numbers</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Date:</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={getTodayIST()}
                                className="border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleDateSubmit}
                            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md flex items-center gap-1.5"
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            Submit
                        </button>
                        <button
                            type="button"
                            onClick={loadContacts}
                            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1.5 text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md flex items-center gap-1.5"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Contact Form */}
            <div className="px-4 mt-4 flex-shrink-0">
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <form onSubmit={handleAddContact} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Customer Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Enter customer name"
                                    disabled={isSubmitting}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Mobile Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={mobileNumber}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, ''); // Only numbers
                                        if (value.length <= 10) {
                                            setMobileNumber(value);
                                        }
                                    }}
                                    placeholder="Enter 10-digit mobile number"
                                    maxLength="10"
                                    disabled={isSubmitting}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting || !customerName.trim() || !mobileNumber.trim()}
                                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 text-xs font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md flex items-center gap-1.5 disabled:from-primary-300 disabled:to-primary-400 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Submit
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Contacts List */}
            <div className="px-4 pb-4 mt-4 flex flex-col flex-1 min-h-0">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col flex-1 min-h-0">
                    <div className="px-4 py-2 border-b bg-gradient-to-r from-gray-50 to-primary-50 flex-shrink-0">
                        <h3 className="text-xs font-medium text-gray-800">Contacts List</h3>
                    </div>
                    
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500"></div>
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-gray-600 text-xs">No contacts found for the selected date.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-primary-500 to-primary-600">
                                    <tr>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider w-[80px]">
                                            Sl.No
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Customer Mobile Number
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Customer Name
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Order Created
                                        </th>
                                        <th className="px-4 py-2.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                                            Order Created Date Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contacts.map((customer, index) => {
                                        const hasOrder = customer.has_order || false;
                                        const order = customer.order || null;
                                        const orderCreatedDate = order?.order_created_at || order?.order_created_date_time || null;
                                        const orderDateObj = orderCreatedDate ? new Date(orderCreatedDate) : null;
                                        
                                        return (
                                            <tr key={customer.registry_id || index} className="hover:bg-primary-50 transition-colors border-b border-gray-100">
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900 text-center">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-primary-600" />
                                                        {customer.customer_mobile || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    {customer.customer_name || '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        {hasOrder ? (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                                <span className="text-green-600 font-semibold">Yes</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4 text-red-600" />
                                                                <span className="text-red-600 font-semibold">No</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                                                    {hasOrder && orderDateObj ? (
                                                        orderDateObj.toLocaleString('en-GB', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                            hour12: false
                                                        })
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
```

---

## 📦 Dependencies

### Required Packages
```json
{
  "lucide-react": "^0.x.x"  // For icons (Phone, Calendar, RefreshCw, Plus, CheckCircle, XCircle)
}
```

### Required CSS Framework
- **Tailwind CSS** with custom primary color configuration

### Tailwind Config (Primary Colors)
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e0f7f6',
          100: '#b3ebe8',
          200: '#80ded9',
          300: '#4dd1ca',
          400: '#26c7bf',
          500: '#20b1aa', // Main primary color
          600: '#1d9f99',
          700: '#198c87',
          800: '#157975',
          900: '#0e5955',
        },
      },
    },
  },
}
```

---

## 🎨 UI Specifications

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Header (Fixed)                                          │
│ - Title: "Contacts"                                     │
│ - Subtitle: "Manage contact numbers"                    │
│ - Date Picker + Submit + Refresh buttons                │
├─────────────────────────────────────────────────────────┤
│ Add Contact Form (Fixed)                               │
│ - Customer Name input                                    │
│ - Mobile Number input                                    │
│ - Submit button                                          │
├─────────────────────────────────────────────────────────┤
│ Contacts List (Scrollable)                              │
│ - Table with 5 columns                                   │
│ - Only this section scrolls vertically                   │
└─────────────────────────────────────────────────────────┘
```

### Color Scheme
- **Primary Color:** `#20b1aa` (Teal/Turquoise)
- **Header Background:** `bg-gradient-to-r from-primary-50 to-primary-100`
- **Table Header:** `bg-gradient-to-r from-primary-500 to-primary-600`
- **Buttons:** `bg-gradient-to-r from-primary-500 to-primary-600`
- **Hover Effects:** `hover:bg-primary-50`

### Typography
- **Page Title:** `text-lg font-bold text-gray-800`
- **Subtitle:** `text-xs text-gray-600`
- **Table Headers:** `text-xs font-bold text-white uppercase`
- **Table Content:** `text-xs font-medium text-gray-900`
- **Labels:** `text-xs font-medium text-gray-600`

### Spacing & Sizing
- **Page Padding:** `p-4` or `px-4 pb-4`
- **Table Cell Padding:** `px-4 py-3`
- **Button Padding:** `px-3 py-1.5` or `px-4 py-2`
- **Icon Sizes:** `w-3.5 h-3.5` (buttons), `w-4 h-4` (table)

### Components

#### Header Section
- Background: `bg-gradient-to-r from-primary-50 to-primary-100`
- Border: `border-b-2 border-primary-200`
- Padding: `pb-2 px-4 pt-2`
- Shadow: `shadow-sm`
- Flex: `flex-shrink-0` (prevents shrinking)

#### Add Contact Form
- Background: `bg-white`
- Border: `border border-gray-200`
- Shadow: `shadow`
- Padding: `p-4`
- Grid: `grid grid-cols-1 md:grid-cols-2 gap-3`

#### Table
- Header: `bg-gradient-to-r from-primary-500 to-primary-600`
- Header Text: `text-xs font-bold text-white uppercase`
- Row Hover: `hover:bg-primary-50`
- Border: `border-b border-gray-100`

#### Buttons
- Primary: `bg-gradient-to-r from-primary-500 to-primary-600`
- Hover: `hover:from-primary-600 hover:to-primary-700`
- Disabled: `disabled:from-primary-300 disabled:to-primary-400`
- Shadow: `shadow-md`
- Text: `text-xs font-medium`

---

## 🔧 Integration Steps

### Step 1: Install Dependencies
```bash
npm install lucide-react
```

### Step 2: Configure Tailwind CSS
Ensure your `tailwind.config.js` includes the primary color palette (see above).

### Step 3: Create API Service Functions

Create or update your API service file:

```javascript
// api.js or services/api.js

const API_BASE_URL = 'https://your-api-base-url.com/api';

// Helper function to get auth token (adjust based on your auth implementation)
const getAuthToken = () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

export const customerRegistryAPI = {
    // POST /customer-registry
    create: async (data) => {
        const response = await fetch(`${API_BASE_URL}/customer-registry`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create customer registry');
        }
        
        return response.json();
    },
    
    // GET /customer-registry/with-orders?date=YYYY-MM-DD
    getWithOrders: async (date) => {
        const response = await fetch(
            `${API_BASE_URL}/customer-registry/with-orders?date=${date}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch contacts');
        }
        
        return response.json();
    }
};
```

### Step 4: Add Route (if using React Router)

```javascript
// App.jsx or routes file
import ContactsPage from './pages/ContactsPage';

<Route path="/contacts" element={<ContactsPage />} />
```

### Step 5: Add Navigation Menu Item

```javascript
// Navigation/Layout component
import { Phone } from 'lucide-react';

const navigation = [
    // ... other items
    { name: 'Contacts', href: '/contacts', icon: Phone },
];
```

### Step 6: Update Component to Use API Service

Replace the fetch calls in the component with your API service:

```javascript
import { customerRegistryAPI } from '../services/api';

// In loadContacts function:
const res = await customerRegistryAPI.getWithOrders(selectedDate);

// In handleAddContact function:
await customerRegistryAPI.create({
    mobile: mobileNumber.trim(),
    name: customerName.trim(),
    registry_date: registryDate
});
```

---

## 📝 Key Features

### 1. Date Selection
- Defaults to today's date in IST
- Future dates disabled (`max={getTodayIST()}`)
- Automatically loads contacts when date changes

### 2. Add Contact Form
- Two-column grid layout (responsive)
- Customer Name field (required)
- Mobile Number field (required, 10 digits only, numeric validation)
- Submit button (disabled when form is invalid or submitting)

### 3. Contacts List Table
- **Sl.No:** Sequential numbering starting from 1
- **Customer Mobile Number:** With phone icon
- **Customer Name:** Customer's full name
- **Order Created:** Visual indicator (Yes/No) with icons
  - Green checkmark + "Yes" for customers with orders
  - Red X + "No" for customers without orders
- **Order Created Date Time:** Formatted date/time (DD/MM/YYYY, HH:mm:ss) or "-"

### 4. Loading States
- Spinner while loading contacts
- Disabled form inputs during submission
- Loading indicator in submit button

### 5. Error Handling
- User-friendly error alerts
- API error message extraction
- Fallback error messages

---

## 🔍 Data Flow

1. **Page Load:**
   - Component mounts
   - `useEffect` triggers `loadContacts()`
   - Fetches contacts for today's date (IST)

2. **Date Change:**
   - User selects a date
   - `useEffect` detects `selectedDate` change
   - Automatically calls `loadContacts()` with new date

3. **Add Contact:**
   - User fills form (name + mobile)
   - Validates inputs (name required, mobile 10 digits)
   - Gets current IST date/time
   - Calls API to create registry
   - Clears form and reloads contacts list

4. **Refresh:**
   - User clicks Refresh button
   - Calls `loadContacts()` with current `selectedDate`

---

## 🎯 API Request Examples

### Create Customer Registry
```javascript
POST /api/customer-registry
Headers:
  Authorization: Bearer <your-token>
  Content-Type: application/json

Body:
{
  "mobile": "9876543210",
  "name": "John Doe",
  "registry_date": "2026-01-21T15:45:00Z"
}
```

### Get Contacts with Orders
```javascript
GET /api/customer-registry/with-orders?date=2026-01-20
Headers:
  Authorization: Bearer <your-token>
```

---

## 🐛 Troubleshooting

### Issue: Date not updating correctly
**Solution:** Ensure `getTodayIST()` function uses `Intl.DateTimeFormat` with `timeZone: 'Asia/Kolkata'`

### Issue: API calls failing
**Solution:** 
- Check API base URL configuration
- Verify authentication token is being sent
- Check CORS settings on backend

### Issue: Mobile number validation not working
**Solution:** Ensure input handler uses `replace(/\D/g, '')` to remove non-digits and `maxLength="10"`

### Issue: Table not scrolling
**Solution:** Ensure parent container has `flex flex-col flex-1 min-h-0` and table wrapper has `overflow-y-auto flex-1 min-h-0`

---

## 📱 Responsive Design

- **Desktop:** Two-column form layout, full table visible
- **Mobile:** Single-column form layout, horizontal scroll for table
- **Tablet:** Two-column form layout, horizontal scroll for table if needed

---

## ✅ Checklist for Integration

- [ ] Install `lucide-react` package
- [ ] Configure Tailwind CSS with primary colors
- [ ] Create API service functions
- [ ] Add ContactsPage component
- [ ] Add route to router
- [ ] Add navigation menu item
- [ ] Test API endpoints
- [ ] Test date selection
- [ ] Test add contact functionality
- [ ] Test loading states
- [ ] Test error handling
- [ ] Verify responsive design

---

## 📞 Support

For API-related issues, ensure:
- Backend API is running
- Authentication token is valid
- CORS is properly configured
- API endpoints match the specifications above

---

**Last Updated:** January 2026  
**Version:** 1.0
