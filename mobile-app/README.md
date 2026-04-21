# PharmaPay - Mobile App for Delivery Boys

A React Native mobile application built with Expo for delivery personnel to manage orders, track deliveries, and collect payments.

## 📱 Features

### Authentication
- ✅ Delivery boy registration with photo upload
- ✅ Login with email and password
- ✅ JWT-based authentication
- ✅ Profile management

### Order Management
- ✅ View assigned orders
- ✅ Filter orders by status (All, Assigned, Picked Up, In Transit, Delivered)
- ✅ View detailed order information
- ✅ Update order status throughout delivery lifecycle
- ✅ Order status flow: Assigned → Picked Up → In Transit → Delivered

### Navigation & Location
- ✅ GPS navigation to customer location via Google Maps
- ✅ One-tap navigation from order details
- ✅ Location permissions handling
- ✅ Call customer directly from app

### Payment Collection
- ✅ Multiple payment modes (Cash, Bank Transfer, Split Payment)
- ✅ Receipt photo capture and upload
- ✅ Transaction reference for bank transfers
- ✅ Payment amount validation
- ✅ Split payment support (Cash + Bank)

### Profile Management
- ✅ View profile information
- ✅ Edit profile (name, phone, address)
- ✅ Change password
- ✅ Logout functionality

## 🛠️ Tech Stack

- **Framework:** React Native with Expo (~51.0.0)
- **Navigation:** React Navigation v6
- **State Management:** React Context API
- **HTTP Client:** Axios
- **Storage:** AsyncStorage
- **Maps:** React Native Maps + Expo Location
- **Image Handling:** Expo Image Picker
- **UI:** Custom components with React Native StyleSheet

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Studio (for Android development)
- Expo Go app on your mobile device (for testing)

## 🚀 Getting Started

### 1. Installation

```bash
cd mobile-app
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
API_URL=http://your-api-url/api
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

**Important:** Replace the values with your actual API URL and Google Maps API key.

#### Getting a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Directions API
4. Create credentials (API Key)
5. Restrict the key to your app (optional but recommended)

### 3. Update API URL for Development

For local development, use your machine's IP address instead of localhost:

**Find your IP address:**
- **Mac/Linux:** `ifconfig` or `ip addr`
- **Windows:** `ipconfig`

**Update .env:**
```env
API_URL=http://192.168.x.x:5000/api
```

### 4. Start the Development Server

```bash
npm start
# or
expo start
```

This will open the Expo Developer Tools in your browser.

### 5. Run on Device/Emulator

**Option 1: Physical Device (Recommended for testing location features)**
1. Install Expo Go app from App Store or Play Store
2. Scan QR code from terminal or browser
3. App will load on your device

**Option 2: iOS Simulator (Mac only)**
```bash
npm run ios
```

**Option 3: Android Emulator**
```bash
npm run android
```

## 📁 Project Structure

```
mobile-app/
├── App.js                      # Root component
├── app.json                    # Expo configuration
├── app.config.js              # Dynamic Expo configuration
├── package.json               # Dependencies
├── babel.config.js            # Babel configuration
├── .env                       # Environment variables
├── .env.example              # Environment variables template
├── assets/                    # App assets (icons, images)
└── src/
    ├── components/           # Reusable UI components
    │   ├── Alert.js
    │   ├── Button.js
    │   ├── EmptyState.js
    │   ├── Input.js
    │   ├── LoadingScreen.js
    │   └── OrderCard.js
    ├── config/              # App configuration
    │   └── api.js          # API endpoints & constants
    ├── context/            # React Context providers
    │   └── AuthContext.js  # Authentication state
    ├── navigation/         # Navigation structure
    │   ├── AppNavigator.js
    │   └── MainNavigator.js
    ├── screens/           # Screen components
    │   ├── auth/         # Authentication screens
    │   │   ├── LoginScreen.js
    │   │   └── RegisterScreen.js
    │   ├── orders/       # Order management screens
    │   │   ├── OrdersScreen.js
    │   │   └── OrderDetailsScreen.js
    │   ├── payment/      # Payment screens
    │   │   └── PaymentScreen.js
    │   └── profile/      # Profile screens
    │       ├── ProfileScreen.js
    │       ├── EditProfileScreen.js
    │       └── ChangePasswordScreen.js
    ├── services/         # API services
    │   └── api.js       # API client & methods
    └── utils/           # Utility functions
        ├── helpers.js   # Helper functions
        └── storage.js   # AsyncStorage wrapper
```

## 🔐 Authentication Flow

1. **Registration:**
   - Delivery boy registers with name, email, phone, address, password
   - Optional profile photo upload
   - Backend creates pending account (requires admin approval)
   - JWT token returned upon successful registration

2. **Login:**
   - Email and password authentication
   - JWT token stored in AsyncStorage
   - User data cached locally
   - Auto-login on app restart if token valid

3. **Protected Routes:**
   - All main screens require authentication
   - Token sent in Authorization header for API requests
   - Auto-logout on 401 responses

## 📦 Order Workflow

### Status Lifecycle

```
NEW → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED
                                              ↓
                                         PAYMENT
```

### Delivery Boy Actions

1. **View Orders** - See all assigned orders
2. **Filter Orders** - Filter by status
3. **Order Details** - View customer info, order amount, notes
4. **Navigate** - Get directions to customer
5. **Update Status** - Mark as picked up, in transit, delivered
6. **Collect Payment** - Record payment after delivery

## 💳 Payment Collection

### Payment Modes

1. **Cash**
   - Full amount in cash
   - Receipt photo required

2. **Bank Transfer**
   - Full amount via bank
   - Transaction reference required
   - Receipt photo required

3. **Split Payment**
   - Partial cash + partial bank
   - Both amounts must sum to order total
   - Transaction reference required for bank portion
   - Receipt photo required

### Payment Validation

- Total payment must equal order amount
- Receipt photo is mandatory
- Transaction reference required for bank/split payments

## 🗺️ Location & Navigation

### Permissions Required

- **Location (When In Use):** For navigation and delivery tracking
- **Location (Always):** For background tracking (optional)

### Navigation Features

- One-tap navigation to customer location
- Opens Google Maps with driving directions
- Fallback message if coordinates not available

## 📸 Image Upload

### Features

- Camera capture or photo library selection
- Image cropping for profile photos
- Automatic image compression (80% quality)
- Used for:
  - Profile pictures (registration/edit profile)
  - Payment receipts

### Permissions Required

- **Camera:** Take photos
- **Photo Library:** Select existing photos

## 🔧 Configuration

### API Endpoints

All endpoints are configured in `src/config/api.js`:

- Authentication: `/auth/login`, `/auth/register`, `/auth/profile`
- Orders: `/orders/my-orders`, `/orders/:id`, `/orders/:id/status`
- Payments: `/payments`, `/payments/my-payments`
- Customers: `/customers/:id`

### Order Status Constants

```javascript
ORDER_STATUS = {
  NEW: 'new',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
}
```

### Payment Mode Constants

```javascript
PAYMENT_MODES = {
  CASH: 'cash',
  BANK: 'bank',
  SPLIT: 'split',
}
```

## 🐛 Troubleshooting

### Common Issues

**1. Can't connect to API**
- Ensure backend is running
- Use IP address instead of localhost for physical devices
- Check firewall settings
- Verify API_URL in .env

**2. Google Maps not working**
- Verify GOOGLE_MAPS_API_KEY is set correctly
- Ensure Maps SDK is enabled in Google Cloud Console
- Check API key restrictions

**3. Image upload failing**
- Ensure camera/photo permissions granted
- Check file size (max 5MB by default)
- Verify backend upload endpoint is working

**4. Location not working**
- Grant location permissions
- Enable location services on device
- Test on physical device (emulators may have issues)

**5. App crashes on startup**
- Clear cache: `expo start -c`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for console errors

## 📱 Building for Production

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build APK
eas build --platform android --profile preview
```

### iOS IPA (Requires Apple Developer Account)

```bash
# Build for iOS
eas build --platform ios --profile production
```

### Environment Variables for Production

Update `.env` with production values:

```env
API_URL=https://your-production-api.com/api
GOOGLE_MAPS_API_KEY=your-production-google-maps-key
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Register new delivery boy account
- [ ] Login with credentials
- [ ] View assigned orders
- [ ] Filter orders by status
- [ ] View order details
- [ ] Navigate to customer location
- [ ] Update order status (Assigned → Picked Up → In Transit → Delivered)
- [ ] Record payment (Cash, Bank, Split)
- [ ] Upload receipt photo
- [ ] Edit profile
- [ ] Change password
- [ ] Logout and re-login

## 🔒 Security Considerations

- JWT tokens stored in AsyncStorage (secure on device)
- Tokens expire after 7 days (configurable on backend)
- No sensitive data stored in plain text
- HTTPS recommended for production API
- API key restrictions recommended for Google Maps

## 📚 Dependencies

### Core Dependencies

```json
{
  "expo": "~51.0.0",
  "react": "18.2.0",
  "react-native": "0.74.0",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/native-stack": "^6.9.17",
  "@react-navigation/bottom-tabs": "^6.5.11",
  "axios": "^1.6.2",
  "@react-native-async-storage/async-storage": "1.23.1",
  "expo-image-picker": "~15.0.4",
  "expo-location": "~17.0.1",
  "react-native-maps": "1.14.0"
}
```

## 🤝 Contributing

This app is part of the PharmaPay system. For contributions:

1. Ensure backend API is compatible
2. Follow React Native best practices
3. Test on both iOS and Android
4. Update documentation for new features

## 📄 License

Copyright © 2024 PharmaPay. All rights reserved.

## 📞 Support

For issues or questions:
- Check troubleshooting section above
- Review backend API documentation
- Contact development team

## 🎯 Future Enhancements

Potential features for future releases:

- [ ] Push notifications for new order assignments
- [ ] Real-time order tracking on map
- [ ] Offline mode support
- [ ] Signature capture for delivery confirmation
- [ ] In-app chat with store staff
- [ ] Delivery history and statistics
- [ ] Rating system for delivery performance
- [ ] Multi-language support
- [ ] Dark mode theme

---

**Version:** 1.0.0
**Last Updated:** November 2024
**Platform:** iOS & Android
