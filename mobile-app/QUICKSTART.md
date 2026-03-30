# Quick Start Guide - PharmaPay Mobile App

This guide will help you get the mobile app running on your device in minutes.

## ✅ Prerequisites Check

Before starting, make sure you have:

- [x] Node.js installed (v16+)
- [x] npm or yarn installed
- [x] **Expo Go** app installed on your smartphone
  - 📱 [Download for iOS](https://apps.apple.com/app/expo-go/id982107779)
  - 📱 [Download for Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies ✅

Dependencies are already installed! If you need to reinstall:

```bash
cd mobile-app
npm install
```

### Step 2: Configure Environment ✅

The environment file is already configured with:

- **API URL:** `http://21.0.0.26:5000/api`
- **Google Maps API Key:** (Optional for basic testing)

**Note:** The API URL uses your machine's IP address so it works on physical devices.

### Step 3: Start Backend API (Required)

The mobile app needs the backend API to be running. In a **new terminal window**:

```bash
# Navigate to backend directory
cd ../platform

# Make sure dependencies are installed
npm install

# Start the backend server
npm start
```

You should see:
```
Server running on port 5000
Database connected successfully
```

### Step 4: Start Mobile App

In the mobile app directory:

```bash
# If you're not already there
cd mobile-app

# Start Expo development server
npm start
```

This will:
- Start the Metro bundler
- Open Expo DevTools in your browser
- Display a QR code

### Step 5: Run on Your Phone

1. **Open Expo Go app** on your smartphone
2. **Scan the QR code** from your terminal or browser
   - **iOS:** Use Camera app, then tap the notification
   - **Android:** Use Expo Go's built-in QR scanner
3. **Wait for app to load** (may take 1-2 minutes on first launch)
4. **App launches!** 🎉

## 📱 Testing the App

### Register a Delivery Boy Account

1. Tap **"Register here"** on login screen
2. Fill in the form:
   - **Name:** Test Delivery Boy
   - **Email:** delivery@test.com
   - **Phone:** 9876543210
   - **Address:** Test Address, City
   - **Password:** test123
   - **Confirm Password:** test123
3. (Optional) Add a profile photo
4. Tap **"Register"**

**Note:** The account will be created with "pending" status and needs admin approval before you can use it.

### Quick Approval via Backend

Since you're testing, you can approve the account directly:

**Option 1: Use Admin Dashboard**
1. Go to `http://localhost:3000` (Admin Dashboard)
2. Login as admin
3. Go to "Delivery Boys" section
4. Approve the new delivery boy

**Option 2: Direct Database Update**
```bash
# Connect to database and run:
UPDATE users SET status = 'active' WHERE email = 'delivery@test.com';
```

### Login and Test Features

1. **Login** with your credentials
2. **View Orders** - Should show any assigned orders
3. **Filter Orders** - Try different status filters
4. **View Order Details** - Tap on an order
5. **Navigate** - Tap "Navigate to Customer" (requires Google Maps)
6. **Update Status** - Mark order as picked up, in transit, delivered
7. **Record Payment** - After marking as delivered
8. **View Profile** - Check the Profile tab
9. **Edit Profile** - Update your information

## 🔧 Troubleshooting

### Issue: Can't Connect to API

**Symptoms:** "Network error" or "Cannot connect to server"

**Solutions:**
1. **Check backend is running:**
   ```bash
   # Should show server running on port 5000
   curl http://localhost:5000/api/auth/profile
   ```

2. **Verify IP address:**
   ```bash
   # Get your machine's IP
   hostname -I

   # Update .env if different
   # Edit: API_URL=http://YOUR_IP:5000/api
   ```

3. **Check firewall:**
   - Make sure port 5000 is not blocked
   - Allow connections from your phone's network

4. **Same network:**
   - Ensure phone and computer are on the same WiFi network

### Issue: QR Code Not Scanning

**Solutions:**
1. Use manual connection:
   - In Expo Go, tap "Enter URL manually"
   - Type the URL shown in terminal (e.g., `exp://21.0.0.26:8081`)

2. Try tunnel mode:
   ```bash
   npm start -- --tunnel
   ```

### Issue: App Crashes on Startup

**Solutions:**
1. Clear Expo cache:
   ```bash
   npm start -- --clear
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Check console for errors:
   - Shake device to open developer menu
   - Tap "Debug Remote JS"
   - Check browser console for errors

### Issue: Location/Camera Not Working

**Solutions:**
1. **Grant permissions:**
   - iOS: Settings > Expo Go > Allow Location/Camera
   - Android: Settings > Apps > Expo Go > Permissions

2. **Test on physical device:**
   - Emulators have limited location/camera support

### Issue: Images Not Uploading

**Solutions:**
1. Check photo library permissions
2. Try taking a photo with camera instead
3. Check file size (max 5MB)
4. Verify backend upload endpoint is working

## 🗺️ Getting Google Maps API Key (Optional)

For navigation features, you'll need a Google Maps API key:

1. **Go to** [Google Cloud Console](https://console.cloud.google.com/)
2. **Create a new project** (or select existing)
3. **Enable these APIs:**
   - Maps SDK for Android
   - Maps SDK for iOS
   - Directions API
4. **Create credentials:**
   - Go to "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the key
5. **Add to .env:**
   ```
   GOOGLE_MAPS_API_KEY=your-api-key-here
   ```
6. **Restart the app**

**Without API key:** Navigation will still work by opening Google Maps app on device.

## 📊 Test Data

To test the app properly, you'll need some data in the system:

### Create Test Customer (via Store Dashboard)
```
Name: Test Customer
Phone: 9999999999
Address: 123 Test Street, Test City
Landmark: Near Test Mall
```

### Create Test Order (via Store Dashboard)
```
Customer: Test Customer
Amount: 500.00
Notes: Test delivery
Assigned to: Your delivery boy account
```

### Test Payment Recording
1. Mark order as "Delivered"
2. Tap "Record Payment"
3. Select payment mode (Cash/Bank/Split)
4. Take/upload receipt photo
5. Submit payment

## 🎯 Feature Checklist

Test these features to ensure everything works:

- [ ] Register new account
- [ ] Login with credentials
- [ ] View orders list
- [ ] Filter orders by status
- [ ] View order details
- [ ] Call customer (tap phone number)
- [ ] Navigate to customer
- [ ] Update order status (Assigned → Picked Up → In Transit → Delivered)
- [ ] Record cash payment
- [ ] Record bank payment with reference
- [ ] Record split payment
- [ ] Upload receipt photo
- [ ] View profile
- [ ] Edit profile information
- [ ] Change password
- [ ] Logout

## 🔄 Development Workflow

### Make Code Changes

1. **Edit files** in `src/` directory
2. **Save** - App reloads automatically
3. **Test** on device

### Reload App Manually

- Shake device > Tap "Reload"
- Or: Press `r` in terminal

### Clear Cache

```bash
npm start -- --clear
```

### Check Logs

- Terminal shows console logs
- Shake device > "Debug Remote JS" for browser console

## 📱 Running on Emulator

### iOS Simulator (Mac only)

```bash
npm run ios
```

### Android Emulator

```bash
npm run android
```

**Note:** Location and camera features work best on physical devices.

## 🚀 Next Steps

Once you've tested the app:

1. **Add Real Assets:**
   - Create app icon (1024x1024)
   - Create splash screen
   - Update `app.json` with asset paths

2. **Configure Production API:**
   - Deploy backend to production
   - Update `API_URL` in `.env`
   - Use HTTPS URL

3. **Get Google Maps API Key:**
   - Follow steps above
   - Add to `.env`

4. **Build Standalone App:**
   ```bash
   npm install -g eas-cli
   eas build --platform android
   ```

## 📞 Need Help?

- **Check README.md** for detailed documentation
- **Check console logs** for error messages
- **Verify backend is running** and accessible
- **Ensure phone and computer on same network**

## 🎉 Success!

If you can see the login screen and register/login successfully, you're all set! The app is working correctly.

---

**Quick Commands Reference:**

```bash
# Start backend
cd platform && npm start

# Start mobile app
cd mobile-app && npm start

# Clear cache
npm start -- --clear

# Get IP address
hostname -I
```

Happy testing! 🚀
