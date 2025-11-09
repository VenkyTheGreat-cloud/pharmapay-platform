# Mobile App Build Guide - Quick Reference

## 🚀 Build Commands (Run on Your Mac)

```bash
# 1. Clone repository (if you haven't already)
git clone https://github.com/VenkyTheGreat-cloud/sbb-medicare.git
cd sbb-medicare/sbb-medicare-mobile

# 2. Install dependencies
npm install

# 3. Install EAS CLI
npm install -g eas-cli

# 4. Login to Expo
eas login

# 5. Build APK
eas build --platform android --profile preview
```

---

## ⏱️ Expected Timeline

| Step | Time | What Happens |
|------|------|--------------|
| Clone repo | 1 min | Downloads code |
| npm install | 2-3 min | Installs 1,167 packages |
| Install EAS CLI | 30 sec | Global install |
| eas login | 1 min | Browser login |
| Build upload | 2 min | Code uploads to Expo |
| Build process | 15-20 min | Expo builds APK |

**Total:** ~20-25 minutes

---

## ✅ Build Prompts & Answers

During `eas build`, you'll see these prompts:

### 1. Keystore Generation
```
? Generate a new Android Keystore? › (Y/n)
```
**Answer:** Press **Y** (or Enter)
- EAS will create and securely store your keystore

### 2. EAS Project Creation
```
? Would you like to automatically create an EAS project? › (Y/n)
```
**Answer:** Press **Y** (or Enter)
- Links your app to Expo

### 3. Bundler Choice (if asked)
```
? What would you like your Android application id to be?
```
**Answer:** Just press **Enter** (already set to `com.sbbmedicare.delivery`)

---

## 📊 Build Progress

You'll see output like this:

```
✔ Logged in
✔ Linked to project
✔ Credentials configured
⠋ Uploading to EAS Build

Build started!
View build details: https://expo.dev/accounts/YOUR-ACCOUNT/projects/sbb-medicare-mobile/builds/...

Build in progress...
```

**Keep that URL!** You can check progress there.

---

## 🎯 When Build Completes

You'll see:

```
✔ Build finished
🎉 Android APK: https://expo.dev/artifacts/eas/...apk

Download: https://expo.dev/artifacts/eas/[unique-id].apk
```

**Click the download link** to get your APK (~50-80 MB)

---

## 📱 Installing the APK

### On Android Phone:

1. **Download APK** to your phone
2. **Open the APK file**
3. **Allow "Install from Unknown Sources"** if prompted
4. **Install** and **Open**
5. **App launches!**

### Share with Delivery Boys:

- Send them the download link
- Or use file sharing (AirDrop, WhatsApp, etc.)
- They install the same way

---

## 🔧 Already Configured For You

The app is pre-configured with:

- ✅ **Backend API:** `https://sbb-medicare-api.onrender.com/api`
- ✅ **Package name:** `com.sbbmedicare.delivery`
- ✅ **Permissions:** Location, Camera, Photos
- ✅ **Version:** 1.0.0
- ✅ **Build type:** APK (preview profile)

---

## 💡 Troubleshooting

### "permission denied" when installing EAS CLI
```bash
sudo npm install -g eas-cli
```

### "xcrun: error" on Mac
```bash
sudo xcode-select --install
```

### "Network request failed"
- Check internet connection
- Try again (Expo servers might be busy)

### "Build failed"
- Check the build logs at the Expo URL
- Common issue: Missing dependencies (run `npm install` again)

---

## 📞 After You Have the APK

### Test It:
1. Install on your Android phone
2. Open the app
3. Register/Login
4. Test all features
5. Check it connects to Render backend

### Distribute:
- Share APK link with delivery boys
- Or send APK file directly
- They can install immediately (no app store needed)

---

## 🎉 Success Indicators

You know it's working when:
- ✅ Build completes without errors
- ✅ You get a download link
- ✅ APK installs on Android
- ✅ App opens to login screen
- ✅ Can register/login successfully
- ✅ Can see orders (connects to Render API)

---

## 🔄 Rebuilding (If Needed)

To create a new version:

```bash
# Make code changes
# Update version in app.config.js
# Then rebuild:
eas build --platform android --profile preview
```

Each build creates a new APK with the latest code.

---

## 📚 Useful Links

- **Expo Dashboard:** https://expo.dev/
- **Build Docs:** https://docs.expo.dev/build/introduction/
- **Your Backend:** https://sbb-medicare-api.onrender.com/api

---

## ⚡ Quick Commands Reference

```bash
# Check build status
eas build:list

# View project info
eas project:info

# Login again (if session expires)
eas login

# Build production (app bundle for Play Store)
eas build --platform android --profile production
```

---

**Ready to build!** Just run the commands in order and you'll have your APK in ~20 minutes! 🚀
