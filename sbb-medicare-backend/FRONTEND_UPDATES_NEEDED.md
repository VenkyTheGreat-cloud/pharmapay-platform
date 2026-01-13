# 🎨 Frontend Updates Needed

## Overview

Since we added the `status` field to store managers (similar to delivery_boys), your frontend needs to be updated to handle this new field.

---

## 📋 What Changed in Backend

### API Response Now Includes `status` Field

**Before:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Store Manager",
    "is_active": true,
    ...
  }
}
```

**After:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Store Manager",
    "is_active": true,
    "status": "active",  // ← NEW FIELD
    ...
  }
}
```

---

## 🔧 Frontend Changes Needed

### 1. Update Store Manager List/Table

Display the `status` field in your store managers list:

```jsx
// React Example
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Status</th>
      <th>Active</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {storeManagers.map(manager => (
      <tr key={manager.id}>
        <td>{manager.name}</td>
        <td>{manager.email}</td>
        <td>
          <span className={`badge ${manager.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
            {manager.status}
          </span>
        </td>
        <td>{manager.is_active ? 'Yes' : 'No'}</td>
        <td>
          <button onClick={() => toggleActive(manager.id)}>
            {manager.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### 2. Update Store Manager Detail View

Show status in the detail view:

```jsx
<div>
  <label>Status:</label>
  <span>{storeManager.status}</span>
</div>
<div>
  <label>Is Active:</label>
  <span>{storeManager.is_active ? 'Yes' : 'No'}</span>
</div>
```

### 3. Update TypeScript Interfaces/Types

If using TypeScript, update your interfaces:

```typescript
interface StoreManager {
  id: string;
  name: string;
  email: string;
  mobile: string;
  is_active: boolean;
  status: 'active' | 'inactive';  // ← ADD THIS
  role: 'admin' | 'store_manager';
  store_name?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}
```

### 4. Update Toggle Active Status Handler

When toggling active status, the response will now include updated `status`:

```javascript
// Example: Toggle active status
const toggleActiveStatus = async (managerId, newIsActive) => {
  try {
    const response = await fetch(`/api/access-control/${managerId}/toggle-active`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ is_active: newIsActive })
    });
    
    const result = await response.json();
    
    // result.data.status will now be 'active' or 'inactive'
    console.log('Updated status:', result.data.status);
    
    // Update your UI
    updateStoreManagerInList(result.data);
  } catch (error) {
    console.error('Error toggling status:', error);
  }
};
```

### 5. Status Badge Component

Create a status badge component (similar to delivery boys):

```jsx
const StatusBadge = ({ status, isActive }) => {
  const getStatusClass = () => {
    if (status === 'active' || isActive) {
      return 'badge-success'; // Green
    }
    return 'badge-secondary'; // Gray
  };
  
  return (
    <span className={`badge ${getStatusClass()}`}>
      {status || (isActive ? 'active' : 'inactive')}
    </span>
  );
};
```

### 6. Filter/Sort by Status

Add filtering and sorting options:

```jsx
// Filter by status
const filteredManagers = storeManagers.filter(manager => {
  if (statusFilter === 'all') return true;
  return manager.status === statusFilter;
});

// Sort by status
const sortedManagers = [...storeManagers].sort((a, b) => {
  if (sortBy === 'status') {
    return a.status.localeCompare(b.status);
  }
  return 0;
});
```

---

## 🎯 Key Points for Frontend

### Status Values
- `'active'` - Store manager is active (is_active = true)
- `'inactive'` - Store manager is inactive (is_active = false)

### Automatic Sync
- ✅ Backend automatically syncs `status` when `is_active` changes
- ✅ No need to manually update `status` - just toggle `is_active`
- ✅ Backend handles the synchronization

### API Endpoints Affected

1. **GET `/api/access-control`** - Returns `status` in list
2. **GET `/api/access-control/:id`** - Returns `status` in detail
3. **POST `/api/access-control`** - Creates with `status = 'active'`
4. **PATCH `/api/access-control/:id/toggle-active`** - Updates both `is_active` and `status`

---

## 📝 Migration Notes

### Backward Compatibility
- If your frontend doesn't use `status` yet, it will still work
- `is_active` field remains unchanged
- `status` is just an additional field for better UI logic

### Optional Updates
- You can continue using `is_active` for now
- Add `status` display when you're ready to update the UI
- No breaking changes - both fields work together

---

## ✅ Checklist for Frontend Updates

- [ ] Update TypeScript interfaces/types to include `status`
- [ ] Display `status` field in store manager list/table
- [ ] Show `status` in store manager detail view
- [ ] Update status badge component (if using one)
- [ ] Add filter/sort by status (optional)
- [ ] Test toggle active status - verify status updates
- [ ] Update any status-related logic to use `status` field

---

## 🔍 Example API Response

### Get All Store Managers
```json
{
  "success": true,
  "data": {
    "store_managers": [
      {
        "id": "...",
        "name": "Manager 1",
        "email": "manager1@example.com",
        "is_active": true,
        "status": "active",
        ...
      },
      {
        "id": "...",
        "name": "Manager 2",
        "email": "manager2@example.com",
        "is_active": false,
        "status": "inactive",
        ...
      }
    ],
    "count": 2
  }
}
```

### Toggle Active Status Response
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Manager 1",
    "is_active": false,
    "status": "inactive",
    ...
  },
  "message": "Store manager deactivated and status set to inactive successfully"
}
```

---

## 📚 Summary

**Minimal Changes Required:**
- Add `status` field to your TypeScript/JavaScript types
- Display `status` in the UI (optional, but recommended)
- No breaking changes - everything still works with just `is_active`

**Recommended Changes:**
- Use `status` field for better UI display (badges, colors, etc.)
- Sync status display when toggling active status
- Add status-based filtering/sorting

The backend handles all the logic - frontend just needs to display the new field!









