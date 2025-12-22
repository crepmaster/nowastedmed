# 🚀 Quick Start Guide - Firebase Integration

## ✅ What's Done

All Firebase integration code is ready! Here's what we've set up:

### 1. Packages Installed ✅
```bash
✅ @nativescript/firebase-core
✅ @nativescript/firebase-auth
✅ @nativescript/firebase-firestore
```

### 2. Files Created ✅
```
app/
├── config/
│   └── firebase.config.ts                    # Firebase configuration
├── services/
│   └── firebase/
│       ├── firebase.service.ts               # Core initialization
│       ├── firestore.service.ts              # Database wrapper
│       └── auth-firebase.service.ts          # Authentication
├── App_Resources/
│   ├── Android/
│   │   └── google-services.json              # Android config ⚠️ PLACEHOLDER
│   └── iOS/
│       └── GoogleService-Info.plist          # iOS config ⚠️ PLACEHOLDER
└── app-firebase.ts                           # Firebase-enabled entry point
```

### 3. Configuration ✅
- **Project**: mediexchange
- **API Key**: Configured
- **Region**: europe-west1
- **Backend**: https://europe-west1-mediexchange.cloudfunctions.net

---

## ⚠️ ONE CRITICAL STEP REMAINING

The config files contain **PLACEHOLDER** App IDs. You MUST register the apps in Firebase Console:

### 🔴 Download Android App Config

1. Go to: https://console.firebase.google.com/project/mediexchange/settings/general
2. Find the existing Android app: `com.pharmapp.pharmacy`
3. Click the gear icon → Download `google-services.json`
4. Replace: `app/App_Resources/Android/google-services.json`

### 🔴 Download/Register iOS App Config

1. Same Firebase Console page
2. Check if iOS app exists with Bundle ID: `com.pharmapp.pharmacy`
3. If yes: Download `GoogleService-Info.plist`
4. If no: Click "Add app" → iOS → Bundle ID: `com.pharmapp.pharmacy`
5. Replace: `app/App_Resources/iOS/GoogleService-Info.plist`

---

## 🎯 How to Use

### Enable Firebase (After Registering Apps)

```bash
# 1. Backup current app.ts
cd nowastedmed
mv app/app.ts app/app-local.ts

# 2. Use Firebase version
mv app/app-firebase.ts app/app.ts

# 3. Clean and rebuild
ns clean
ns build android  # or ns build ios

# 4. Run the app
ns run android  # or ns run ios
```

### Check If It Works

Look for this in the logs:
```
🔥 Initializing Firebase...
✅ Firebase initialized successfully
📱 Project: mediexchange
```

---

## 📝 Example Usage

### Login with Firebase

```typescript
import { AuthFirebaseService } from './services/firebase/auth-firebase.service';

const authService = AuthFirebaseService.getInstance();

// Login
const success = await authService.login(
  'user@example.com',
  'password123'
);

if (success) {
  const user = authService.getCurrentUser();
  console.log('Logged in as:', user.name);
}
```

### Read from Firestore

```typescript
import { FirestoreService } from './services/firebase/firestore.service';

const db = FirestoreService.getInstance();

// Get all pharmacies
const pharmacies = await db.getCollection('pharmacies');
console.log('Pharmacies:', pharmacies);

// Get wallet balance
const wallet = await db.getDocument('wallets', userId);
console.log('Balance:', wallet.available);
```

### Real-time Updates

```typescript
import { FirestoreService } from './services/firebase/firestore.service';

const db = FirestoreService.getInstance();

// Listen to exchanges
const unsubscribe = db.subscribeToCollection(
  'exchanges',
  (exchanges) => {
    console.log('Exchanges updated:', exchanges);
    this.set('exchanges', exchanges);
  },
  {
    field: 'aId',
    operator: '==',
    value: currentUserId
  }
);

// Later, stop listening
unsubscribe();
```

---

## 🔄 Migration Path

### Current (Local Storage)
```typescript
// Old way - local only
import { AuthService } from './services/auth.service';

const authService = AuthService.getInstance();
await authService.login(email, password);
```

### New (Firebase)
```typescript
// New way - Firebase backend
import { AuthFirebaseService } from './services/firebase/auth-firebase.service';

const authService = AuthFirebaseService.getInstance();
await authService.login(email, password);
```

### Update Pages

Just change the import in these files:
- `app/pages/login/login-page.ts`
- `app/pages/registration/registration-page.ts`
- `app/pages/pharmacy/dashboard/pharmacy-dashboard-view-model.ts`
- Any file using `AuthService`

Replace:
```typescript
import { AuthService } from '../../../services/auth.service';
const authService = AuthService.getInstance();
```

With:
```typescript
import { AuthFirebaseService } from '../../../services/firebase/auth-firebase.service';
const authService = AuthFirebaseService.getInstance();
```

---

## 🧪 Testing Checklist

After registering apps and rebuilding:

- [ ] App starts without errors
- [ ] Firebase initialization message appears
- [ ] Can create new user account
- [ ] Can login with created account
- [ ] User data saves to Firestore
- [ ] Can read pharmacies list
- [ ] Can create exchange
- [ ] Real-time updates work

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Firebase not initialized" | Make sure `FirebaseService.initialize()` is called in `app.ts` |
| "Default Firebase app not found" | Config files missing or incorrect. Re-download from Firebase Console |
| "User profile not found" | User might not have Firestore profile. Call backend Cloud Function |
| "Permission denied" | Check Firestore security rules in `pharmapp/firestore.rules` |
| Build fails | Run `ns clean` first, then rebuild |

---

## 📁 File Structure After Integration

```
nowastedmed/
├── app/
│   ├── app.ts                          # Main entry (use app-firebase.ts)
│   ├── app-local.ts                    # Backup (local-only version)
│   ├── config/
│   │   └── firebase.config.ts          # ✅ Ready
│   ├── services/
│   │   ├── firebase/                   # ✅ Ready
│   │   │   ├── firebase.service.ts
│   │   │   ├── firestore.service.ts
│   │   │   └── auth-firebase.service.ts
│   │   ├── auth.service.ts             # Old local version
│   │   └── ... (other services)
│   └── App_Resources/
│       ├── Android/
│       │   └── google-services.json    # ⚠️ REPLACE after registration
│       └── iOS/
│           └── GoogleService-Info.plist # ⚠️ REPLACE after registration
├── FIREBASE_SETUP.md                   # Detailed guide
├── QUICK_START.md                      # This file
└── package.json
```

---

## 🎉 What's Next

1. **Register apps** in Firebase Console (5 minutes)
2. **Replace config files** with downloaded ones
3. **Rebuild app**: `ns clean && ns build android`
4. **Test login** and see data in Firestore
5. **Celebrate** - your app is connected to Firebase! 🎊

---

## 📞 Need Help?

- Check `FIREBASE_SETUP.md` for detailed troubleshooting
- Review Firebase Console for errors
- Check backend logs in Firebase Functions
- Verify Firestore rules in `../pharmapp/firestore.rules`

**Backend Repository**: `../pharmapp`
**Firebase Console**: https://console.firebase.google.com/project/mediexchange
