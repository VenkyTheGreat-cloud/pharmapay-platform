# Return Items Photo Upload Guide

## Overview

When a delivery boy collects payment and marks an order as delivered, if the order has return items (`return_items = true`), they must upload a photo of the returned items before marking the order as delivered.

---

## Database Changes

### New Field Added
- **Field Name**: `return_items_photo_url`
- **Type**: `TEXT`
- **Table**: `orders`
- **Nullable**: `YES` (optional when no return items)

### Migration Script
Run the migration script to add the field:
```sql
-- Run: scripts/add-return-items-photo-url.sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_items_photo_url TEXT;
```

---

## API Endpoints

### 1. Update Order Status (Mark as Delivered)

**Endpoint**: `PUT /api/orders/:id/status`

**When to Use**: Delivery boy marks order as delivered after collecting payment

**Request Format**:

#### Option A: File Upload (Multipart Form Data)
```http
PUT /api/orders/:id/status
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "status": "DELIVERED",
  "notes": "Order delivered successfully",
  "returnItemsPhoto": <file>  // File field name must be "returnItemsPhoto"
}
```

#### Option B: Base64 or URL (JSON)
```http
PUT /api/orders/:id/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "DELIVERED",
  "notes": "Order delivered successfully",
  "returnItemsPhotoUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." 
  // OR
  "returnItemsPhotoUrl": "https://example.com/photos/return-items-123.jpg"
}
```

**Validation Rules**:
- ✅ If `status = "DELIVERED"` AND `order.return_items = true`
- ✅ `returnItemsPhoto` (file) OR `returnItemsPhotoUrl` (string) is **REQUIRED**
- ❌ If return items photo is missing, returns `400 VALIDATION_ERROR`

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
  },
  "message": "Order status updated successfully"
}
```

**Error Response** (Missing Photo):
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

### 2. Update Order (Alternative)

**Endpoint**: `PUT /api/orders/:id`

**When to Use**: Store manager updates order details including return items photo

**Request Format**:

#### Option A: File Upload
```http
PUT /api/orders/:id
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "returnItems": true,
  "returnItemsList": [
    {"name": "Item 1", "quantity": 2}
  ],
  "returnAdjustAmount": 100.00,
  "returnItemsPhoto": <file>
}
```

#### Option B: Base64 or URL
```http
PUT /api/orders/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "returnItems": true,
  "returnItemsList": [
    {"name": "Item 1", "quantity": 2}
  ],
  "returnAdjustAmount": 100.00,
  "returnItemsPhotoUrl": "data:image/jpeg;base64,..."
}
```

---

## Mobile App Implementation

### React Native Example

```javascript
import React, { useState } from 'react';
import { View, Button, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../config';

const MarkOrderDelivered = ({ orderId, hasReturnItems }) => {
  const [returnItemsPhoto, setReturnItemsPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setReturnItemsPhoto(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setReturnItemsPhoto(result.assets[0]);
    }
  };

  const markAsDelivered = async () => {
    // Validate return items photo if required
    if (hasReturnItems && !returnItemsPhoto) {
      Alert.alert('Photo Required', 'Please upload a photo of the returned items');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('status', 'DELIVERED');
      formData.append('notes', 'Order delivered successfully');

      // Add return items photo if exists
      if (returnItemsPhoto) {
        formData.append('returnItemsPhoto', {
          uri: returnItemsPhoto.uri,
          type: 'image/jpeg',
          name: 'return-items-photo.jpg',
        });
      }

      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success', 'Order marked as delivered');
        // Navigate back or refresh
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to mark order as delivered');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View>
      {hasReturnItems && (
        <View>
          <Text>Return Items Photo (Required)</Text>
          
          {returnItemsPhoto && (
            <Image 
              source={{ uri: returnItemsPhoto.uri }} 
              style={{ width: 200, height: 200 }} 
            />
          )}

          <Button title="Take Photo" onPress={takePhoto} />
          <Button title="Pick from Gallery" onPress={pickImage} />
        </View>
      )}

      <Button 
        title={uploading ? "Uploading..." : "Mark as Delivered"} 
        onPress={markAsDelivered}
        disabled={uploading || (hasReturnItems && !returnItemsPhoto)}
      />
    </View>
  );
};

export default MarkOrderDelivered;
```

---

### Flutter Example

```dart
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:io';

class MarkOrderDeliveredScreen extends StatefulWidget {
  final int orderId;
  final bool hasReturnItems;

  const MarkOrderDeliveredScreen({
    Key? key,
    required this.orderId,
    required this.hasReturnItems,
  }) : super(key: key);

  @override
  _MarkOrderDeliveredScreenState createState() => _MarkOrderDeliveredScreenState();
}

class _MarkOrderDeliveredScreenState extends State<MarkOrderDeliveredScreen> {
  File? _returnItemsPhoto;
  bool _uploading = false;
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImage(ImageSource source) async {
    final XFile? image = await _picker.pickImage(
      source: source,
      imageQuality: 80,
    );

    if (image != null) {
      setState(() {
        _returnItemsPhoto = File(image.path);
      });
    }
  }

  Future<void> _markAsDelivered() async {
    // Validate return items photo if required
    if (widget.hasReturnItems && _returnItemsPhoto == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please upload a photo of the returned items')),
      );
      return;
    }

    setState(() {
      _uploading = true;
    });

    try {
      var request = http.MultipartRequest(
        'PUT',
        Uri.parse('$API_URL/orders/${widget.orderId}/status'),
      );

      request.headers['Authorization'] = 'Bearer $accessToken';
      request.fields['status'] = 'DELIVERED';
      request.fields['notes'] = 'Order delivered successfully';

      // Add return items photo if exists
      if (_returnItemsPhoto != null) {
        request.files.add(
          await http.MultipartFile.fromPath(
            'returnItemsPhoto',
            _returnItemsPhoto!.path,
          ),
        );
      }

      var response = await request.send();
      var responseBody = await response.stream.bytesToString();
      var result = jsonDecode(responseBody);

      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Order marked as delivered')),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['error']?['message'] ?? 'Failed to mark order as delivered')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() {
        _uploading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Mark as Delivered')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (widget.hasReturnItems) ...[
              Text(
                'Return Items Photo (Required)',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              
              if (_returnItemsPhoto != null)
                Image.file(
                  _returnItemsPhoto!,
                  height: 200,
                  fit: BoxFit.cover,
                ),
              
              SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _pickImage(ImageSource.camera),
                      icon: Icon(Icons.camera_alt),
                      label: Text('Take Photo'),
                    ),
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _pickImage(ImageSource.gallery),
                      icon: Icon(Icons.photo_library),
                      label: Text('Pick from Gallery'),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 24),
            ],

            ElevatedButton(
              onPressed: _uploading || (widget.hasReturnItems && _returnItemsPhoto == null)
                  ? null
                  : _markAsDelivered,
              child: Text(_uploading ? 'Uploading...' : 'Mark as Delivered'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## Validation Rules

### When Photo is Required
- ✅ Order status is being changed to `DELIVERED`
- ✅ AND `order.return_items = true`
- ✅ Photo must be provided (file upload or URL)

### When Photo is Optional
- ✅ Order status is NOT `DELIVERED`
- ✅ OR `order.return_items = false`
- ✅ Photo can be omitted

---

## File Upload Details

### Supported Formats
- **Image Types**: JPEG, JPG, PNG
- **Max File Size**: 5MB (default, configurable via `MAX_FILE_SIZE` env variable)
- **Field Name**: `returnItemsPhoto` (for multipart/form-data)

### Storage
- Files are stored in the `uploads/` directory
- Filename format: `returnItemsPhoto-{timestamp}-{random}.{ext}`
- URL format: `/uploads/returnItemsPhoto-1234567890-987654321.jpg`

---

## API Response Fields

The order response now includes:
```json
{
  "id": 123,
  "order_number": "ORD-001",
  "return_items": true,
  "return_items_photo_url": "/uploads/returnItemsPhoto-1234567890.jpg",
  ...
}
```

---

## Error Handling

### Missing Photo Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Return items photo is required when marking order as delivered with return items"
  }
}
```

### Invalid File Type
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Only JPEG, PNG, and PDF files are allowed"
  }
}
```

---

## Testing Checklist

- [ ] Run database migration
- [ ] Test marking order as delivered WITHOUT return items (photo not required)
- [ ] Test marking order as delivered WITH return items (photo required)
- [ ] Test file upload via multipart/form-data
- [ ] Test base64 URL upload
- [ ] Test validation error when photo is missing
- [ ] Test invalid file type rejection
- [ ] Verify photo is stored correctly
- [ ] Verify photo URL is returned in order response

---

## Summary

1. **Database**: Added `return_items_photo_url` field to `orders` table
2. **API**: Updated `PUT /api/orders/:id/status` to require photo when `return_items = true` and `status = DELIVERED`
3. **Validation**: Photo is mandatory when marking order as delivered with return items
4. **File Upload**: Supports both multipart/form-data and base64/URL formats
5. **Mobile App**: Must check `return_items` flag and require photo upload before marking as delivered
