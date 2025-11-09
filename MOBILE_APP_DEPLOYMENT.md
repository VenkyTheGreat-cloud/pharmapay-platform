# SBB Medicare Mobile App - Deployment Guide

## 📱 Mobile App Deployment Options

Unlike web applications, React Native/Expo mobile apps cannot be deployed to Render. They need to be built and distributed differently.

## Current Render Setup

Your Render deployment includes:
- ✅ Backend API (Node.js)
- ✅ Admin Dashboard (Static Site)
- ✅ Store Dashboard (Static Site)

**The mobile app connects to these services but is NOT hosted on Render.**

---

## 🚀 Deployment Options

### Option 1: Expo Go (Development/Testing)

**Best for:** Development, testing, team sharing

**Pros:**
- No build process required
- Instant updates
- Easy sharing via QR code
- Free

**Cons:**
- Requires Expo Go app installed
- Limited to Expo SDK features
- Not suitable for public release

**How it works:**
1. Backend runs on Render (production)
2. Run `npm start` in mobile directory
3. Share QR code with testers
4. They scan with Expo Go app
5. App loads and connects to Render API

**Setup:**
```bash
cd sbb-medicare-mobile

# Update .env to point to Render
# Change: API_URL=http://21.0.0.26:5000/api
# To: API_URL=https://your-render-api-url.onrender.com/api

npm start
```

**Cost:** Free

---

### Option 2: EAS Build (Standalone Apps)

**Best for:** Production, distributing APK/IPA files

**Pros:**
- True native apps
- No Expo Go required
- Can distribute directly
- Better performance

**Cons:**
- Build time (15-30 minutes)
- Requires Expo account
- iOS requires Apple Developer account ($99/year)

**Steps:**

1. **Install EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Login to Expo:**
```bash
eas login
```

3. **Configure Project:**
```bash
cd sbb-medicare-mobile
eas build:configure
```

4. **Update Production Environment:**

Create `sbb-medicare-mobile/.env.production`:
```env
API_URL=https://your-api.onrender.com/api
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

5. **Build Android APK:**
```bash
eas build --platform android --profile preview
```

6. **Build iOS IPA (requires Apple Developer account):**
```bash
eas build --platform ios --profile production
```

7. **Download builds** from Expo dashboard and distribute

**Cost:**
- Android: Free (30 builds/month on free tier)
- iOS: Requires Apple Developer ($99/year)

---

### Option 3: App Store Distribution

**Best for:** Public release, maximum reach

**Pros:**
- Professional distribution
- Automatic updates
- User trust
- App store visibility

**Cons:**
- Review process (1-7 days)
- Ongoing fees
- Strict guidelines

**Steps:**

1. **Build with EAS** (Option 2)

2. **Google Play Store (Android):**
   - Create Google Play Developer account ($25 one-time)
   - Upload APK via Google Play Console
   - Fill in store listing
   - Submit for review
   - Review time: 1-3 days

3. **Apple App Store (iOS):**
   - Apple Developer account required ($99/year)
   - Upload IPA via App Store Connect
   - Fill in store listing
   - Submit for review
   - Review time: 1-7 days

**Cost:**
- Google Play: $25 one-time
- Apple App Store: $99/year

---

## 📝 Recommended Approach

For your project, I recommend this phased approach:

### Phase 1: Development & Testing (Now)
- Use **Expo Go** (Option 1)
- Connect to Render backend
- Test with team and delivery boys
- Iterate quickly

### Phase 2: Beta Testing (1-2 weeks)
- Build **standalone APK** with EAS (Option 2)
- Distribute APK directly to beta testers
- Collect feedback
- Fix bugs

### Phase 3: Production (When ready)
- Submit to **Google Play Store** (Option 3)
- If budget allows, submit to **Apple App Store**
- Public release

---

## 🔧 Connecting Mobile App to Render Backend

### Step 1: Get Your Render API URL

From your Render dashboard:
- Go to your `sbb-medicare-api` service
- Copy the URL (e.g., `https://sbb-medicare-api.onrender.com`)

### Step 2: Update Mobile App Configuration

#### For Development (Expo Go):

```bash
# Edit sbb-medicare-mobile/.env
API_URL=https://your-api.onrender.com/api
GOOGLE_MAPS_API_KEY=your-key-here
```

#### For Production Builds:

Create `sbb-medicare-mobile/.env.production`:
```env
API_URL=https://your-api.onrender.com/api
GOOGLE_MAPS_API_KEY=your-production-key
```

Update `app.config.js` to use production env:
```javascript
export default {
  expo: {
    extra: {
      apiUrl: process.env.API_URL || 'https://your-api.onrender.com/api',
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    },
  },
};
```

### Step 3: Update Backend CORS

Make sure your Render backend allows mobile app requests:

In `sbb-medicare-backend/.env` on Render:
```env
ALLOWED_ORIGINS=*
# Or specify your domains:
# ALLOWED_ORIGINS=https://admin.onrender.com,https://store.onrender.com
```

For mobile apps, `*` is usually fine as they're not web browsers.

---

## 🎯 Quick Start Guide

### To Test Now (Option 1):

1. **Update mobile .env:**
```bash
cd sbb-medicare-mobile
echo "API_URL=https://your-api.onrender.com/api" > .env
echo "GOOGLE_MAPS_API_KEY=" >> .env
```

2. **Start dev server:**
```bash
npm start
```

3. **Test with Expo Go:**
- Install Expo Go on phone
- Scan QR code
- App connects to Render backend!

### To Build APK (Option 2):

1. **Install EAS CLI:**
```bash
npm install -g eas-cli
eas login
```

2. **Configure build:**
```bash
cd sbb-medicare-mobile
eas build:configure
```

3. **Build APK:**
```bash
eas build --platform android --profile preview
```

4. **Download and distribute APK**

---

## 📊 Comparison Table

| Feature | Expo Go | Standalone App | App Stores |
|---------|---------|----------------|------------|
| Build Time | None | 15-30 min | 15-30 min + review |
| Distribution | QR Code | Direct APK/IPA | Store |
| Updates | Instant | Rebuild required | Store update |
| Cost | Free | Free-$99/year | $25-$99/year |
| Best For | Testing | Beta/Internal | Production |
| User Access | Need Expo Go | Direct install | Store download |

---

## 🔒 Security Considerations

- ✅ Use HTTPS for Render backend
- ✅ Store API keys in environment variables
- ✅ Don't commit .env files to git
- ✅ Use different keys for dev/production
- ✅ Enable backend authentication
- ✅ Validate all API requests

---

## 📱 Testing Checklist

Before distributing:

- [ ] Backend on Render is accessible via HTTPS
- [ ] Mobile app connects to Render API
- [ ] All API endpoints work
- [ ] Authentication works
- [ ] File uploads work (receipts, photos)
- [ ] Google Maps integration works
- [ ] All screens load correctly
- [ ] No console errors
- [ ] Test on both Android and iOS
- [ ] Test on different network conditions

---

## 💡 Pro Tips

1. **Start with Expo Go** for quick iterations
2. **Build APK** when ready for broader testing
3. **Submit to stores** only when stable
4. **Use EAS Update** for quick fixes without rebuilding
5. **Monitor Render logs** for API issues
6. **Set up error tracking** (Sentry, Bugsnag)
7. **Use staging environment** for testing builds

---

## 🆘 Common Issues

### Issue: "Cannot connect to server"

**Solution:**
- Verify Render backend is running
- Check ALLOWED_ORIGINS includes mobile requests
- Ensure using HTTPS URL
- Test API with curl: `curl https://your-api.onrender.com/api/health`

### Issue: "Build failed"

**Solution:**
- Check app.json configuration
- Verify all dependencies are listed
- Review build logs in Expo dashboard
- Ensure environment variables are set

### Issue: "App crashes on startup"

**Solution:**
- Check API_URL is correct
- Verify backend is accessible
- Review mobile app logs
- Clear cache and rebuild

---

## 📚 Additional Resources

- [Expo Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Build Guide](https://docs.expo.dev/build/setup/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Render Documentation](https://render.com/docs)

---

## 🎯 Next Steps

1. **Choose deployment option** (Expo Go, Standalone, or App Store)
2. **Update mobile app** to use Render backend URL
3. **Test thoroughly** with Expo Go
4. **Build APK** when ready for distribution
5. **Submit to stores** when stable

---

**Remember:** Mobile apps are built once and distributed, not continuously deployed like web apps. The backend on Render handles all the server logic, and the mobile app is just the client that connects to it.
