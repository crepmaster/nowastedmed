# NoWastedMed - Testing Guide

## Data Storage Architecture

| Mode | Auth | User Profiles | Medicines | Exchanges | Deliveries | Payments |
|------|------|---------------|-----------|-----------|------------|----------|
| **Demo (Local)** | Local Storage | Local Storage | In-Memory | Local Storage | In-Memory | Not Persisted |
| **Production** | Firebase Auth | Firestore | Firestore | Firestore | Firestore | Firestore |

**Current Default:** Demo mode uses local storage (data is lost when app is reinstalled)

**To use Firebase:** The app has full Firebase integration ready. See "Enabling Firebase Mode" below.

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Pharmacy (Main)** | demo-pharmacy@nowastedmed.com | demo123 |
| **Courier** | demo-courier@nowastedmed.com | demo123 |
| **Admin** | demo-admin@nowastedmed.com | demo123 |
| **Pharmacy 2** | pharmacie-akpakpa@demo.local | demo123 |
| **Pharmacy 3** | pharmacie-ganhi@demo.local | demo123 |
| **Pharmacy 4** | pharmacie-cadjehoun@demo.local | demo123 |
| **Pharmacy 5** | pharmacie-fidjrosse@demo.local | demo123 |

All demo pharmacies are located in **Cotonou, Benin** with GPS coordinates.

---

## Testing Scenarios

### Scenario 1: Pharmacy Registration & Login

**Objective:** Test new pharmacy registration flow

**Steps:**
1. Open app (Login page appears in French by default)
2. Toggle language to English (tap FR/EN buttons)
3. Tap "Create Account"
4. Fill registration form:
   - Email: `test-pharmacy@example.com`
   - Password: `Test1234!`
   - Pharmacy Name: `Pharmacie Test`
   - Owner Name: `Jean Dupont`
   - Phone: `+22997001234`
   - License: `BJ-PHR-001`
   - Select Country: Benin
   - Select City: Cotonou
   - Tap "Capture GPS Location"
5. Submit registration
6. Verify redirect to Pharmacy Dashboard

**Expected Results:**
- Registration succeeds
- User is logged in automatically
- Dashboard shows pharmacy name
- GPS location is captured

---

### Scenario 2: Pharmacy - Add Medicine to Inventory

**Objective:** Test medicine listing with database search

**Steps:**
1. Login as pharmacy (demo-pharmacy@nowastedmed.com)
2. Navigate to Inventory
3. Tap "Add Medicine"
4. Search for "Amoxicillin" in search field
5. Select "Amoxicillin 500mg Capsule" from results
6. Fill details:
   - Quantity: 100
   - Batch Number: LOT-2024-001
   - Expiry Date: (6 months from now)
   - Check "Available for Exchange"
7. Save medicine

**Expected Results:**
- Autocomplete shows matching medicines (Amoxicilline in French, Amoxicillin in English)
- Medicine form auto-fills from database (INN, dosage, category)
- Medicine appears in inventory list
- Status shows "Available for Exchange"

---

### Scenario 3: Pharmacy - Create Exchange Request

**Objective:** Test exchange creation between pharmacies

**Preconditions:**
- Pharmacy 1 has medicine in inventory (available for exchange)
- Pharmacy 2 wants to request that medicine

**Steps (Pharmacy 2):**
1. Login as pharmacie-akpakpa@demo.local
2. Navigate to "Exchanges" or "Available Medicines"
3. Browse available medicines from other pharmacies
4. Find medicine from Pharmacie Centrale Demo
5. Tap "Request Exchange"
6. Enter quantity needed
7. Submit request

**Steps (Pharmacy 1 - Receiving Request):**
1. Login as demo-pharmacy@nowastedmed.com
2. Check "Exchange Requests" section
3. View incoming request details
4. Accept or Reject request

**Expected Results:**
- Request is created with status "Pending"
- Pharmacy 1 sees notification of new request
- After acceptance, status changes to "Accepted"
- Delivery is created automatically

---

### Scenario 4: Courier - Accept and Complete Delivery

**Objective:** Test full delivery flow with QR verification

**Preconditions:**
- Exchange is accepted between two pharmacies
- Delivery is created with status "Pending"
- Both pharmacies have paid their 50% share

**Steps:**
1. Login as demo-courier@nowastedmed.com
2. View "Available Deliveries"
3. Select a delivery (shows pickup/delivery locations)
4. Tap "Accept Delivery"
5. Navigate to pickup location (tap navigation button)
6. At pickup pharmacy:
   - Tap "Confirm Pickup"
   - Scan QR code shown by pharmacy
7. Navigate to delivery location
8. At delivery pharmacy:
   - Tap "Confirm Delivery"
   - Scan QR code shown by receiving pharmacy
9. Delivery marked complete

**Expected Results:**
- Delivery status updates: Pending → Accepted → Picked Up → Delivered
- QR codes are verified at each step
- Courier earnings are calculated
- Both pharmacies see delivery completed

---

### Scenario 5: Courier - View Earnings & Request Payout

**Objective:** Test earnings tracking and payout request

**Steps:**
1. Login as demo-courier@nowastedmed.com
2. Navigate to "Earnings"
3. View earnings summary:
   - Today's earnings
   - Weekly/Monthly earnings
   - Available balance
   - Pending balance (24h hold)
4. Tap "Request Payout"
5. Enter amount
6. Select payout method (Mobile Money)
7. Enter phone number
8. Submit request

**Expected Results:**
- Earnings show correct totals
- Platform fee (15%) is deducted
- Payout request is created
- Status shows "Processing"

---

### Scenario 6: Admin - Manage Users & Subscriptions

**Objective:** Test admin dashboard functionality

**Steps:**
1. Login as demo-admin@nowastedmed.com
2. View Admin Dashboard:
   - Total pharmacies
   - Total couriers
   - Active exchanges
   - Revenue stats
3. Navigate to "Pharmacies" list
4. View pharmacy details
5. Navigate to "Subscriptions"
6. View/manage subscription plans

**Expected Results:**
- Dashboard shows aggregated statistics
- Can view all registered pharmacies
- Can view subscription status of each pharmacy

---

### Scenario 7: Language Switching

**Objective:** Test bilingual UI (French/English)

**Steps:**
1. Open app (default is French)
2. On login page, tap "EN" button
3. Verify all labels change to English
4. Login to any account
5. Navigate to Settings
6. Change language back to French
7. Verify all screens update

**Expected Results:**
- All UI labels translate correctly
- Medicine names/categories show in selected language
- Language preference is saved

---

### Scenario 8: Wallet Top-up (Mobile Money)

**Objective:** Test wallet funding via Mobile Money

**Steps:**
1. Login as pharmacy
2. Navigate to "Wallet"
3. View current balance
4. Tap "Top Up"
5. Enter amount: 10000 XOF
6. Select provider: MTN Mobile Money
7. Enter phone number
8. Confirm payment
9. (In production: receive USSD prompt on phone)

**Expected Results:**
- Top-up request is created
- Status shows "Pending"
- After confirmation, balance updates

---

## Firebase Mode (Enabled by Default)

The app is configured to use **Firebase Authentication** by default for shared testing.

**Current Setting:** `useFirebaseAuth: true` in `app/config/environment.config.ts`

This means:
- All testers share the same database
- Data persists between app reinstalls
- Users can be created in Firebase Console
- Login credentials work across all devices

### Setting Up Demo Users in Firebase

You need to create demo users in **Firebase Console** before testing:

#### Step 1: Create Users in Firebase Authentication

Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Authentication → Users

Add these users:

| Email | Password |
|-------|----------|
| demo-pharmacy@nowastedmed.com | demo123 |
| demo-courier@nowastedmed.com | demo123 |
| demo-admin@nowastedmed.com | demo123 |

#### Step 2: Create User Profiles in Firestore

Go to Firebase Console → Firestore Database → Create these documents:

**Collection: `pharmacies`**
Document ID: (copy the UID from Authentication)
```json
{
  "email": "demo-pharmacy@nowastedmed.com",
  "name": "Pharmacie Centrale Demo",
  "pharmacyName": "Pharmacie Centrale Demo",
  "phoneNumber": "+22997001234",
  "role": "pharmacist",
  "isActive": true,
  "location": {
    "countryCode": "BJ",
    "cityId": "cotonou",
    "cityName": "Cotonou",
    "region": "west_africa_francophone",
    "currency": "XOF",
    "coordinates": {
      "latitude": 6.3654,
      "longitude": 2.4183
    }
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Collection: `couriers`**
Document ID: (copy the UID from Authentication)
```json
{
  "email": "demo-courier@nowastedmed.com",
  "name": "Kofi Demo Courier",
  "phoneNumber": "+22996005678",
  "role": "courier",
  "isActive": true,
  "vehicleType": "motorcycle",
  "operatingCities": ["cotonou"],
  "location": {
    "countryCode": "BJ",
    "cityId": "cotonou",
    "cityName": "Cotonou"
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Collection: `admins`**
Document ID: (copy the UID from Authentication)
```json
{
  "email": "demo-admin@nowastedmed.com",
  "name": "Admin Demo",
  "phoneNumber": "+22990009999",
  "role": "admin",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Switching to Local Mode (Offline Testing)

If you want to test without Firebase (offline mode), edit `app/config/environment.config.ts`:

```typescript
features: {
    enableDemoMode: true,
    useFirebaseAuth: false, // Change to false for local storage
    // ...
}
```

Then rebuild the app. Local mode will auto-create demo accounts on startup.

---

## Firestore Collections

| Collection | Purpose |
|------------|---------|
| `pharmacies` | Pharmacy user profiles |
| `couriers` | Courier user profiles |
| `admins` | Admin user profiles |
| `medicines` | Medicine inventory listings |
| `exchanges` | Exchange requests between pharmacies |
| `deliveries` | Delivery assignments for couriers |
| `wallets` | User wallet balances |
| `transactions` | Wallet transaction history |
| `courier_earnings` | Courier earnings per delivery |
| `courier_wallets` | Courier available/pending balance |
| `courier_payouts` | Payout requests from couriers |
| `subscription_plans` | Available subscription plans |
| `subscriptions` | User subscriptions |
| `audit_logs` | Security/financial audit trail |

---

## Known Limitations (Demo Mode)

1. **Data not persisted** - Reinstalling app clears all data
2. **No push notifications** - Not configured in demo
3. **No real payments** - Mobile Money is simulated
4. **Single device** - Data doesn't sync between devices

---

## Troubleshooting

### "Invalid credentials" on demo login
- Demo accounts are created on app startup
- Restart app to reinitialize demo data
- Check console for "Demo pharmacies created successfully"

### App crashes on startup
- Check Firebase configuration in `firebase.config.ts`
- Verify `google-services.json` is in `App_Resources/Android/`

### QR scanner not working
- Grant camera permission when prompted
- Check `nativescript-barcodescanner` plugin is installed

---

## Build Commands

```bash
# Development build
ns build android

# Run on connected device
ns run android

# Run on emulator
ns run android --emulator

# Production build
ns build android --release
```

---

## Contact

For issues or questions about testing, contact the development team.
