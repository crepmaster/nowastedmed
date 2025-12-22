# Firebase Integration Setup Guide

This document explains how to complete the Firebase integration for the NoWasteMed mobile app.

## ✅ Completed Steps

### 1. Firebase Configuration
- ✅ Firebase config extracted from `pharmapp` backend
- ✅ Configuration file created: `app/config/firebase.config.ts`
- ✅ Project: **mediexchange** (Production)
- ✅ Region: **europe-west1**

### 2. Firebase SDK Installation
- ✅ Installed: `@nativescript/firebase-core`
- ✅ Installed: `@nativescript/firebase-auth`
- ✅ Installed: `@nativescript/firebase-firestore`

### 3. Service Files Created
- ✅ `app/config/firebase.config.ts` - Firebase configuration
- ✅ `app/services/firebase/firebase.service.ts` - Core initialization
- ✅ `app/services/firebase/firestore.service.ts` - Database wrapper
- ✅ `app/services/firebase/auth-firebase.service.ts` - Authentication

### 4. Platform Configuration
- ✅ `app/App_Resources/Android/google-services.json` - Android config
- ✅ `app/App_Resources/iOS/GoogleService-Info.plist` - iOS config
- ⚠️  **IMPORTANT**: The App IDs in these files are PLACEHOLDERS

### 5. App Initialization
- ✅ `app/app-firebase.ts` - Firebase-enabled app entry point

---

## ⚠️ IMPORTANT: Missing Android/iOS App Registration

The `google-services.json` and `GoogleService-Info.plist` files currently contain **PLACEHOLDER** app IDs. You need to register the Android and iOS apps in Firebase Console.

### To Register Apps:

1. **Go to Firebase Console**: https://console.firebase.google.com/project/mediexchange/settings/general

2. **For Android App** (`com.pharmapp.pharmacy`):
   - Find the existing Android app: `com.pharmapp.pharmacy`
   - Click the gear icon → Download `google-services.json`
   - Replace `app/App_Resources/Android/google-services.json` with the downloaded file

3. **For iOS App**:
   - Check if iOS app is registered with Bundle ID: `com.pharmapp.pharmacy`
   - If yes: Download `GoogleService-Info.plist`
   - If no: Click "Add app" → Select iOS → Bundle ID: `com.pharmapp.pharmacy`
   - Replace `app/App_Resources/iOS/GoogleService-Info.plist` with the downloaded file

---

## 🚀 How to Enable Firebase Integration

### Option 1: Switch to Firebase (Recommended for Production)

```bash
# Backup the current local-only app.ts
mv app/app.ts app/app-local.ts

# Use the Firebase-enabled version
mv app/app-firebase.ts app/app.ts

# Rebuild the app
ns clean
ns build android  # or ns build ios
```

### Option 2: Keep Both Versions

Keep `app.ts` for local development and use `app-firebase.ts` for production builds.

Update `package.json` to add build scripts:
```json
{
  "scripts": {
    "build:local": "cp app/app-local.ts app/app.ts && ns build",
    "build:firebase": "cp app/app-firebase.ts app/app.ts && ns build"
  }
}
```

---

## 📋 Integration Checklist

### Phase 1: Firebase Setup (CURRENT)
- [x] Install Firebase SDK
- [x] Create Firebase service files
- [x] Add Firebase configuration
- [ ] Register Android app in Firebase Console
- [ ] Register iOS app in Firebase Console
- [ ] Download and replace config files
- [ ] Test Firebase initialization

### Phase 2: Authentication
- [ ] Update login page to use `AuthFirebaseService`
- [ ] Update registration page to use `AuthFirebaseService`
- [ ] Test user registration
- [ ] Test user login
- [ ] Test password reset

### Phase 3: Database Integration
- [ ] Update `PharmacyDatabaseService` to use Firestore
- [ ] Update `CourierDatabaseService` to use Firestore
- [ ] Update `ExchangeDatabaseService` to use Firestore
- [ ] Add real-time listeners for exchanges
- [ ] Test data synchronization

### Phase 4: Backend API Integration
- [ ] Create `WalletService` for wallet operations
- [ ] Create `PaymentService` for MTN MoMo/Orange Money
- [ ] Create `ExchangeBackendService` for exchange operations
- [ ] Test wallet balance retrieval
- [ ] Test exchange hold/capture/cancel

### Phase 5: Testing
- [ ] Test complete user registration flow
- [ ] Test exchange creation and completion
- [ ] Test wallet top-up
- [ ] Test offline functionality
- [ ] Test real-time updates

---

## 🔧 Testing Firebase Connection

### Test 1: Firebase Initialization

After registering the apps and updating config files:

```typescript
// In app.ts
import { FirebaseService } from './services/firebase/firebase.service';

FirebaseService.initialize()
  .then(() => {
    console.log('✅ Firebase connected!');
  })
  .catch((error) => {
    console.error('❌ Firebase error:', error);
  });
```

### Test 2: Authentication

```typescript
import { AuthFirebaseService } from './services/firebase/auth-firebase.service';

const authService = AuthFirebaseService.getInstance();

// Test login
const success = await authService.login('test@example.com', 'password123');
console.log('Login result:', success);
```

### Test 3: Firestore Read

```typescript
import { FirestoreService } from './services/firebase/firestore.service';

const db = FirestoreService.getInstance();

// Get pharmacies
const pharmacies = await db.getCollection('pharmacies');
console.log('Pharmacies:', pharmacies);
```

---

## 🔐 Security Considerations

### Current Implementation:
- ✅ API keys are in config (safe for mobile apps)
- ✅ Security enforced by Firestore Rules
- ✅ Authentication required for all operations

### TODO:
- [ ] Enable Firebase App Check for production
- [ ] Add SSL certificate pinning
- [ ] Implement biometric authentication
- [ ] Add refresh token logic
- [ ] Implement session timeout

---

## 📱 Package Names

Make sure your package names match across:

1. **NativeScript Config** (`nativescript.config.ts`):
   ```typescript
   {
     id: "com.pharmapp.pharmacy"
   }
   ```

2. **Android** (`app/App_Resources/Android/src/main/AndroidManifest.xml`):
   ```xml
   package="com.pharmapp.pharmacy"
   ```

3. **iOS** (`app/App_Resources/iOS/Info.plist`):
   ```xml
   <key>CFBundleIdentifier</key>
   <string>com.pharmapp.pharmacy</string>
   ```

4. **Firebase Console**: Using existing registered app `com.pharmapp.pharmacy`

---

## 🐛 Troubleshooting

### Error: "Firebase not initialized"
- Make sure `FirebaseService.initialize()` is called before using any Firebase service
- Check console logs for initialization errors

### Error: "Default Firebase app not found"
- Android: Verify `google-services.json` is in `app/App_Resources/Android/`
- iOS: Verify `GoogleService-Info.plist` is in `app/App_Resources/iOS/`
- Rebuild the app after adding config files

### Error: "User profile not found"
- The user might not have a Firestore profile
- Call the backend Cloud Function to create the profile:
  - `createPharmacyUser`
  - `createCourierUser`
  - `createAdminUser`

### Firebase Console shows no data
- Check Firestore security rules
- Verify authentication is working
- Check network connectivity
- Look for errors in device logs

---

## 📚 Next Steps

1. **Register Apps in Firebase Console** (CRITICAL)
   - This is required before the app can connect to Firebase

2. **Test Firebase Connection**
   - Run the app and check logs for "✅ Firebase initialized successfully"

3. **Update Login/Registration Pages**
   - Switch from `AuthService` to `AuthFirebaseService`

4. **Create Backend API Services**
   - WalletService
   - PaymentService
   - ExchangeBackendService

5. **Test End-to-End Flow**
   - Register → Login → Create Exchange → Complete Exchange

---

## 🔗 Useful Links

- Firebase Console: https://console.firebase.google.com/project/mediexchange
- NativeScript Firebase Docs: https://docs.nativescript.org/plugins/firebase
- Backend Repository: `../pharmapp`
- Backend Functions: https://europe-west1-mediexchange.cloudfunctions.net

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Firebase Console for errors
3. Check backend Cloud Functions logs
4. Review Firestore security rules in `pharmapp/firestore.rules`
