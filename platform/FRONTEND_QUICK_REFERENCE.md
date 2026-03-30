# Frontend Changes - Quick Reference

## 🚨 CRITICAL CHANGES (Must Implement)

### Mobile App - Registration
1. **Add Admin Dropdown** - Required field
2. **API Call:** `GET /api/auth/admins-stores` (fetch on page load)
3. **Add `store_id`** to registration payload (from dropdown selection)

### Store Manager Dashboard
- **Remove/Hide** store manager management menu (if exists)
- Store managers cannot see other store managers

---

## ✅ NO CHANGES NEEDED

### Admin Dashboard
- All existing functionality works
- Can see all delivery boys, orders, customers

### Store Manager Dashboard
- Delivery Boys: See all (shared view) ✅
- Orders: See all (shared view) ✅
- Customers: See own only (unchanged) ✅

### Mobile App (After Registration)
- Login, profile, order tracking - No changes

---

## 📋 Implementation Checklist

### Mobile App
- [ ] Add admin dropdown to registration
- [ ] Fetch admins on page load
- [ ] Include `store_id` in registration API
- [ ] Add validation for admin selection

### Store Manager Dashboard
- [ ] Hide/remove store manager management access

---

## 🔗 API Endpoints

**New:**
```
GET /api/auth/admins-stores
```

**Updated:**
```
POST /api/auth/register
Body: { ..., "store_id": "required" }
```

---

See `FRONTEND_CHANGES_REQUIRED.md` for detailed implementation guide.
