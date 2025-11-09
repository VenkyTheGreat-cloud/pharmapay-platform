# Mobile App Deployment - Quick Reference

## 🎯 TL;DR - Mobile Apps Can't Go on Render

**Mobile apps are NOT deployed to Render.** They connect to your Render backend API.

## 3 Simple Options:

### 1️⃣ Expo Go (Easiest - Start Here)

**For testing/development**

```bash
# Update API URL to point to Render
cd sbb-medicare-mobile
nano .env  # Change to: API_URL=https://your-api.onrender.com/api

# Start
npm start

# Scan QR code with Expo Go app
```

✅ **Best for:** Testing right now
💰 **Cost:** Free

---

### 2️⃣ Build APK/IPA

**For distributing to testers**

```bash
# Install EAS
npm install -g eas-cli
eas login

# Build Android
cd sbb-medicare-mobile
eas build --platform android --profile preview

# Download APK and share
```

✅ **Best for:** Beta testing
💰 **Cost:** Free (Android), $99/year (iOS)

---

### 3️⃣ App Stores

**For public release**

```bash
# Build first
eas build --platform android

# Then submit to:
# - Google Play Store ($25 one-time)
# - Apple App Store ($99/year)
```

✅ **Best for:** Production release
💰 **Cost:** $25-$99/year

---

## What You Have Now:

```
Render Deployment:
├── ✅ Backend API        → https://your-api.onrender.com
├── ✅ Admin Dashboard    → https://admin.onrender.com
├── ✅ Store Dashboard    → https://store.onrender.com
└── ❌ Mobile App        → NOT on Render (needs to be built)
```

## What Mobile App Needs:

1. **Point to Render backend:** Update `API_URL` in `.env`
2. **Choose how to distribute:**
   - Expo Go (testing)
   - APK file (beta)
   - App Store (production)

---

## Recommended Path:

**Week 1:** Use Expo Go for testing
```bash
npm start → Scan QR → Test
```

**Week 2-3:** Build APK for beta testers
```bash
eas build --platform android
```

**Week 4+:** Submit to Google Play Store

---

## Need Help?

See full guide: `MOBILE_APP_DEPLOYMENT.md`

Quick start: `QUICKSTART.md` in `sbb-medicare-mobile/`
