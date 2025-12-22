# 📥 Download Firebase Config Files - Step-by-Step Guide

**Package Name**: `com.pharmapp.pharmacy`
**Firebase Project**: mediexchange

---

## ✅ Code Updates Complete

All package names have been updated to **`com.pharmapp.pharmacy`**:
- ✅ [nativescript.config.ts](nativescript.config.ts)
- ✅ [AndroidManifest.xml](app/App_Resources/Android/src/main/AndroidManifest.xml)
- ✅ [google-services.json](app/App_Resources/Android/google-services.json) (placeholder)
- ✅ [GoogleService-Info.plist](app/App_Resources/iOS/GoogleService-Info.plist) (placeholder)

---

## 🔴 CRITICAL NEXT STEP: Download Actual Config Files

The placeholder files still contain **fake App IDs** (`PLACEHOLDER`). You need to download the actual files from Firebase Console.

---

## 📱 Step 1: Download Android Config

### Navigate to Firebase Console

1. Open: https://console.firebase.google.com/project/mediexchange/settings/general
2. You should see the **"Your apps"** section

### Find the Pharmacy App

3. Look for the Android app with package name: **`com.pharmapp.pharmacy`**
4. You should see it listed under "Android apps"

### Download google-services.json

5. Find the **gear icon (⚙️)** next to `com.pharmapp.pharmacy`
6. Click the gear icon
7. Click **"Download google-services.json"**
8. Save the file to your Downloads folder

### Replace the Placeholder File

9. Open File Explorer
10. Navigate to: `c:\Users\dell user\projects\nowastedmed\app\App_Resources\Android`
11. **Delete** the existing `google-services.json` file
12. **Copy** the downloaded `google-services.json` from your Downloads folder
13. **Paste** it into `c:\Users\dell user\projects\nowastedmed\app\App_Resources\Android`

### Verify the File

14. Open the new `google-services.json` in a text editor
15. Check that `mobilesdk_app_id` does NOT contain "PLACEHOLDER"
16. It should look like: `"mobilesdk_app_id": "1:850077575356:android:abc123def456"`

---

## 🍎 Step 2: Download/Register iOS Config

### Check if iOS App Exists

1. Still in Firebase Console: https://console.firebase.google.com/project/mediexchange/settings/general
2. Scroll down to **"Your apps"** section
3. Look for an **iOS app** with Bundle ID: **`com.pharmapp.pharmacy`**

### Option A: iOS App Already Exists

If you see the iOS app:

4. Find the **gear icon (⚙️)** next to the iOS app
5. Click the gear icon
6. Click **"Download GoogleService-Info.plist"**
7. Save the file to your Downloads folder
8. Navigate to: `c:\Users\dell user\projects\nowastedmed\app\App_Resources\iOS`
9. **Delete** the existing `GoogleService-Info.plist`
10. **Copy** the downloaded file and paste it there

### Option B: iOS App Does NOT Exist

If you don't see the iOS app:

4. Click **"Add app"** button
5. Select the **Apple icon** (iOS)
6. Enter Bundle ID: `com.pharmapp.pharmacy`
7. Enter App nickname: `NoWasteMed Pharmacy` (optional)
8. Click **"Register app"**
9. Click **"Download GoogleService-Info.plist"**
10. Save to Downloads, then copy to: `c:\Users\dell user\projects\nowastedmed\app\App_Resources\iOS`

### Verify the File

11. Open the new `GoogleService-Info.plist` in a text editor
12. Check that `GOOGLE_APP_ID` does NOT contain "PLACEHOLDER"
13. It should look like: `<string>1:850077575356:ios:abc123def456</string>`

---

## ✅ Verification Checklist

Before building, verify:

- [ ] `google-services.json` downloaded from Firebase Console
- [ ] File placed in `app/App_Resources/Android/google-services.json`
- [ ] `mobilesdk_app_id` does NOT say "PLACEHOLDER"
- [ ] `package_name` is `com.pharmapp.pharmacy`
- [ ] `GoogleService-Info.plist` downloaded (if iOS app exists)
- [ ] File placed in `app/App_Resources/iOS/GoogleService-Info.plist`
- [ ] `GOOGLE_APP_ID` does NOT say "PLACEHOLDER"
- [ ] `BUNDLE_ID` is `com.pharmapp.pharmacy`

---

## 🚀 Step 3: Clean Build

After downloading both config files:

```bash
# Navigate to project directory
cd "c:\Users\dell user\projects\nowastedmed"

# Clean previous builds
ns clean

# Build for Android
ns build android

# Or run directly on device/emulator
ns run android
```

---

## 🔍 Step 4: Verify Firebase Connection

### Check Build Logs

When the app starts, look for these messages in the console:

```
🔥 Initializing Firebase...
✅ Firebase initialized successfully
📱 Project: mediexchange
```

### If You See Errors

**Error: "Default Firebase app has not been initialized"**
- Check that config files were replaced correctly
- Make sure you're using `app-firebase.ts` as entry point

**Error: "No matching client found for package name"**
- The package name in `google-services.json` doesn't match `AndroidManifest.xml`
- Re-download the file for `com.pharmapp.pharmacy`

**Error: "GOOGLE_APP_ID is missing"**
- iOS config file is still the placeholder
- Download the actual `GoogleService-Info.plist` from Firebase Console

---

## 📋 Quick Reference

### File Locations

| File | Location | Status |
|------|----------|--------|
| **Android Config** | `app/App_Resources/Android/google-services.json` | ⚠️ Replace with downloaded file |
| **iOS Config** | `app/App_Resources/iOS/GoogleService-Info.plist` | ⚠️ Replace with downloaded file |
| **Package Config** | `nativescript.config.ts` | ✅ Updated to `com.pharmapp.pharmacy` |
| **Android Manifest** | `app/App_Resources/Android/src/main/AndroidManifest.xml` | ✅ Updated to `com.pharmapp.pharmacy` |

### Firebase Console URLs

- **Settings Page**: https://console.firebase.google.com/project/mediexchange/settings/general
- **Authentication**: https://console.firebase.google.com/project/mediexchange/authentication
- **Firestore**: https://console.firebase.google.com/project/mediexchange/firestore

---

## 🆘 Troubleshooting

### Can't Find `com.pharmapp.pharmacy` in Firebase Console

**Possible causes**:
1. You're looking at the wrong Firebase project (check it's `mediexchange`)
2. The app was registered under a different name
3. Someone deleted the app

**Solution**: Check the HTML file in `documents/` folder to confirm the app ID

### Download Button is Grayed Out

**Cause**: The app might be in an error state

**Solution**: Click the gear icon first, then "Download config file"

### File Download Fails

**Cause**: Browser security settings

**Solution**: Try a different browser or check popup blockers

---

## 🎉 Next Steps After Download

Once config files are in place:

1. ✅ **Enable Firebase Entry Point**:
   ```bash
   mv app/app.ts app/app-local.ts
   mv app/app-firebase.ts app/app.ts
   ```

2. ✅ **Build and Test**:
   ```bash
   ns clean
   ns run android
   ```

3. ✅ **Test Authentication**:
   - Try creating a new user account
   - Check if user appears in Firestore

4. ✅ **Test Database**:
   - Try reading pharmacies collection
   - Test creating an exchange

5. ✅ **Update UI Pages**:
   - Switch login page to use `AuthFirebaseService`
   - Update dashboard to use Firestore

---

**Ready? Go to Firebase Console and download those config files!** 🚀

Firebase Console: https://console.firebase.google.com/project/mediexchange/settings/general
