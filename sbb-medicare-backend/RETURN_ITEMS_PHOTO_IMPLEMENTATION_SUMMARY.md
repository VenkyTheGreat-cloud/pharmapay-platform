# Return Items Photo Upload - Implementation Summary

## ✅ Changes Completed

### 1. Database Schema
- ✅ Added `return_items_photo_url TEXT` column to `orders` table
- ✅ Created migration script: `scripts/add-return-items-photo-url.sql`
- ✅ Updated `database/schema.sql`

### 2. Backend API Updates
- ✅ Updated `PUT /api/orders/:id/status` endpoint:
  - Accepts `returnItemsPhoto` file upload (multipart/form-data)
  - Accepts `returnItemsPhotoUrl` (base64 or URL string)
  - Validates photo is required when `status = DELIVERED` AND `return_items = true`
  
- ✅ Updated `PUT /api/orders/:id` endpoint:
  - Accepts `returnItemsPhoto` file upload
  - Accepts `returnItemsPhotoUrl` (base64 or URL string)
  - Stores photo URL in order record

### 3. File Upload Support
- ✅ Added `upload.single('returnItemsPhoto')` middleware to routes
- ✅ Supports multipart/form-data file uploads
- ✅ Supports base64/URL string uploads
- ✅ Files stored in `/uploads/` directory

### 4. Validation
- ✅ Photo is **required** when:
  - Order status is being changed to `DELIVERED`
  - AND `order.return_items = true`
- ✅ Photo is **optional** when:
  - Order status is NOT `DELIVERED`
  - OR `order.return_items = false`

---

## API Endpoints

### 1. Mark Order as Delivered (With Return Items Photo)

**Endpoint**: `PUT /api/orders/:id/status`

**Request** (File Upload):
```http
PUT /api/orders/:id/status
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "status": "DELIVERED",
  "notes": "Order delivered",
  "returnItemsPhoto": <file>
}
```

**Request** (Base64/URL):
```http
PUT /api/orders/:id/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "DELIVERED",
  "notes": "Order delivered",
  "returnItemsPhotoUrl": "data:image/jpeg;base64,..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "order_number": "ORD-001",
    "status": "DELIVERED",
    "return_items": true,
    "return_items_photo_url": "/uploads/returnItemsPhoto-1234567890.jpg",
    "items": [...]
  }
}
```

**Error** (Missing Photo):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Return items photo is required when marking order as delivered with return items"
  }
}
```

---

## Mobile App Changes Required

### 1. Check Return Items Flag
Before marking order as delivered, check if `order.return_items === true`

### 2. Require Photo Upload
If return items exist, require photo upload before allowing "Mark as Delivered"

### 3. Upload Photo
- Use multipart/form-data with field name `returnItemsPhoto`
- OR send base64/URL in `returnItemsPhotoUrl` field

### 4. UI Flow
```
1. Delivery boy collects payment
2. Check if return_items = true
3. If true:
   - Show "Upload Return Items Photo" section
   - Require photo before enabling "Mark as Delivered" button
4. Upload photo
5. Mark order as DELIVERED
```

---

## Files Modified

1. ✅ `database/schema.sql` - Added `return_items_photo_url` column
2. ✅ `scripts/add-return-items-photo-url.sql` - Migration script (new)
3. ✅ `src/controllers/orderController.js` - Added photo handling logic
4. ✅ `src/routes/orderRoutes.js` - Added file upload middleware

---

## Files Created

1. ✅ `RETURN_ITEMS_PHOTO_UPLOAD_GUIDE.md` - Complete implementation guide
2. ✅ `RETURN_ITEMS_PHOTO_IMPLEMENTATION_SUMMARY.md` - This summary

---

## Next Steps

### 1. Run Database Migration
```sql
-- Run: scripts/add-return-items-photo-url.sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_items_photo_url TEXT;
```

### 2. Update Mobile App
- Follow `RETURN_ITEMS_PHOTO_UPLOAD_GUIDE.md`
- Add photo upload UI when `return_items = true`
- Validate photo before marking as delivered

### 3. Test
- Test marking order as delivered WITHOUT return items (photo not required)
- Test marking order as delivered WITH return items (photo required)
- Test file upload
- Test validation errors

---

## Example Mobile App Flow

```javascript
// 1. Check if return items exist
if (order.return_items === true) {
  // 2. Show photo upload UI
  // 3. Require photo before enabling "Mark as Delivered"
  if (!returnItemsPhoto) {
    alert('Please upload return items photo');
    return;
  }
}

// 4. Mark as delivered with photo
const formData = new FormData();
formData.append('status', 'DELIVERED');
if (returnItemsPhoto) {
  formData.append('returnItemsPhoto', returnItemsPhoto);
}

await fetch(`${API_URL}/orders/${orderId}/status`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

---

## Validation Summary

| Condition | Photo Required? |
|-----------|----------------|
| `status = DELIVERED` AND `return_items = true` | ✅ **YES** |
| `status = DELIVERED` AND `return_items = false` | ❌ No |
| `status != DELIVERED` | ❌ No |

---

## Support

For detailed implementation examples, see:
- `RETURN_ITEMS_PHOTO_UPLOAD_GUIDE.md` - Complete guide with React Native and Flutter examples
