# NoWastedMed - TODO List

## Completed (2024-12-24) - Session 6

### Courier Payment & Earnings System
- [x] **Courier Earnings Model** - Complete earnings tracking
  - `CourierEarning` - Tracks earnings per delivery with platform fee deduction
  - `CourierPayout` - Payout request with mobile money/bank transfer
  - `CourierWallet` - Available/pending balance tracking
  - `DeliveryFeeConfig` - Per-city fee configuration with commission rates
  - Status flow: pending → available (24h hold) → processing → paid

- [x] **Courier Earnings Service** - `app/services/firebase/courier-earnings-firebase.service.ts`
  - `calculateDeliveryFee()` - City-based fee calculation with country defaults
  - `createEarning()` - Creates earning record when delivery completed
  - `processPendingEarnings()` - Moves pending to available after 24h hold
  - `getCourierWallet()` - Gets/creates courier wallet
  - `requestPayout()` - Courier requests withdrawal
  - `completePayout()` / `failPayout()` - Admin payout processing

### Pharmacy 50/50 Split Payment for Deliveries
- [x] **Delivery Payment Model** - Split payment tracking
  - `DeliveryPaymentStatus` - awaiting_payment → partial_payment → payment_complete → released_to_courier
  - `DeliveryPayment` - Individual pharmacy payment record
  - Payment flow: Both pharmacies must pay their 50% share before courier sees delivery

- [x] **Delivery Payment Service** - `app/services/firebase/delivery-payment-firebase.service.ts`
  - `initializeDeliveryPayment()` - Sets up 50/50 split when delivery created
  - `payFromWallet()` - Pharmacy pays from wallet balance
  - `initiateMobileMoneyPayment()` - Start mobile money payment flow
  - `confirmMobileMoneyPayment()` - Webhook callback to confirm payment
  - `refundDeliveryPayments()` - Refund if delivery cancelled
  - `releasePaymentToCourier()` - Release funds after successful delivery

- [x] **Delivery Service Updates** - Payment integration
  - Couriers only see deliveries with `paymentStatus: 'payment_complete'`
  - `getPendingDeliveries()` filters by both status and payment status
  - Delivery completion triggers earnings creation and payment release

### Courier UI Pages
- [x] **Delivery Details Page** - `app/pages/courier/delivery-details/`
  - QR code scanning for pickup/delivery verification
  - Status updates with notes
  - Medicine details display
  - Pharmacy contact information

- [x] **Earnings Page** - `app/pages/courier/earnings/`
  - Earnings summary dashboard
  - Available/pending balance display
  - Earnings history list
  - Payout request functionality

### Firestore Updates
- [x] **Security Rules** - Added rules for payment collections
  - `courier_earnings` - Courier can read own earnings
  - `courier_wallets` - Courier can read own wallet
  - `courier_payouts` - Courier can create/read own payouts
  - `delivery_fee_configs` - Read-only for authenticated users

- [x] **Indexes** - Added payment query indexes
  - `courier_earnings`: courierId + createdAt, courierId + status + createdAt, status + availableAt
  - `courier_payouts`: courierId + createdAt, courierId + status + createdAt, status + createdAt
  - `delivery_fee_configs`: cityId + isActive, countryCode + cityName
  - `deliveries`: status + paymentStatus + createdAt (for paid deliveries query)

## Critical Security Fixes Needed (Next Session)

### From Code Review - Priority 1 (Critical)
- [ ] **Payout Race Condition** - Concurrent payout requests could overdraft wallet
  - Solution: Use Firestore transactions with balance check inside transaction
  - File: `courier-earnings-firebase.service.ts:requestPayout()`

- [ ] **Missing Auth Checks in Delivery Methods**
  - `acceptDelivery()` - Anyone can accept any delivery
  - `confirmPickup()` - Anyone can confirm pickup
  - `confirmDelivery()` - Anyone can confirm delivery
  - Solution: Add `courierId === currentUser.uid` validation
  - File: `delivery-firebase.service.ts`

- [ ] **Firestore Rules Block Wallet Creation**
  - Current rule: `allow create: if false;` for courier_wallets
  - Wallets are created by service, not directly by users
  - Solution: Create wallets via Cloud Functions or allow service creation
  - File: `firestore.rules`

- [ ] **Race Condition in processPendingEarnings()**
  - Multiple calls could process same earnings twice
  - Solution: Use batch with transaction or add processing lock
  - File: `courier-earnings-firebase.service.ts`

- [ ] **Missing Auth Verification in Earnings Creation**
  - `createEarning()` trusts courierId parameter
  - Solution: Verify courierId matches delivery.courierId
  - File: `courier-earnings-firebase.service.ts`

### From Code Review - Priority 2 (High)
- [ ] Add input validation for payout amounts (min/max limits)
- [ ] Add rate limiting for payout requests
- [ ] Implement proper error recovery for failed payouts
- [ ] Add audit logging for financial transactions

## Completed (2024-12-23) - Session 5

### Location-Based Organization & Same-City Exchange Enforcement
- [x] **Location Model** - Comprehensive country/city configuration
  - `app/models/location.model.ts` - 14 countries, 80+ cities across Africa
  - Regions: West Africa (XOF, NGN, GHS, GNF), East Africa (KES, TZS, UGX), Southern Africa (BWP)
  - Helper functions: getCountryByCode, getCitiesByCountry, isSameCity, etc.

- [x] **User Model Updates** - Added structured location fields
  - `UserLocation` interface with countryCode, cityId, cityName, region, currency
  - `operatingCities` field for couriers to work in multiple cities
  - Backwards compatible with legacy `address` field

- [x] **Exchange Service** - Same-city validation MANDATORY
  - `getPendingExchanges()` now filters by cityId
  - `createExchange()` requires location data
  - `validateSameCityExchange()` helper for validation
  - Added `ExchangeLocation` to exchange model

- [x] **Delivery Service** - City-based filtering for couriers
  - `getPendingDeliveriesByCity()` for single-city couriers
  - `getPendingDeliveriesByCities()` for multi-city couriers
  - Couriers only see deliveries in their operating cities
  - Added `DeliveryLocation` to delivery model

- [x] **Registration Updates** - Country/city selection required
  - Country dropdown with all supported countries
  - City dropdown updates based on country selection
  - Address field for street-level location
  - Couriers get initial `operatingCities` set

- [x] **Exchange Hub** - Same-city filtering
  - Available exchanges filtered by user's city
  - Uses Firebase service with city-based queries

- [x] **Firestore Indexes** - Added city-based query indexes
  - `exchanges` collection: status + location.cityId + createdAt
  - `deliveries` collection: status + location.cityId + createdAt

## Completed (2024-12-23) - Session 4

### Missing Features Implementation
- [x] **Wallet Feature** - Complete wallet system with Firebase integration
  - `app/models/wallet.model.ts` - Wallet and transaction models
  - `app/services/firebase/wallet-firebase.service.ts` - Firebase wallet service
  - `app/pages/shared/wallet/wallet-page.xml` - Wallet UI page
  - `app/pages/shared/wallet/wallet-view-model.ts` - Wallet view model
  - Real-time balance updates via Firestore subscriptions
  - Top-up request flow (Mobile Money, Bank Transfer)
  - Transaction history display

- [x] **Subscription Feature** - Complete subscription and plan system
  - `app/models/subscription.model.ts` - Subscription and plan models
  - `app/services/firebase/subscription-firebase.service.ts` - Firebase subscription service
  - `app/pages/shared/subscription/subscription-page.xml` - Subscription UI
  - `app/pages/shared/subscription/subscription-view-model.ts` - Subscription view model
  - 4 default plans: Free, Basic (5000 XOF), Premium (15000 XOF), Enterprise (50000 XOF)
  - Plan feature comparison display
  - Subscription request and cancellation flow

- [x] **Courier/Delivery Feature** - Complete delivery tracking with Firebase
  - `app/models/delivery.model.ts` - Delivery and courier models
  - `app/services/firebase/delivery-firebase.service.ts` - Firebase delivery service
  - Updated `courier-dashboard-view-model.ts` with real Firebase integration
  - Delivery acceptance, pickup confirmation, and delivery confirmation
  - QR code verification for pickup/delivery
  - Real-time delivery status tracking
  - Courier statistics (deliveries, earnings, rating)

- [x] **Updated Firestore Security Rules** - Added rules for new collections
  - `subscription_plans` - Read-only for authenticated users
  - `topup_requests` - Users can create their own requests
  - `subscription_requests` - Users can create their own requests
  - `deliveries` - Couriers can accept pending and update their deliveries

- [x] **Updated Firestore Indexes** - Added indexes for new queries
  - Delivery queries (by courier, status, pharmacy)
  - Ledger/transaction queries (by user, type, status)
  - Subscription queries (by user, status)
  - Subscription plan queries

## Completed (2024-12-23) - Session 3

### Input Sanitization & Environment Configuration
- [x] **InputSanitizerService** - Created comprehensive input sanitization utility
  - Sanitizes email, phone, names, addresses, license numbers
  - Prevents XSS, injection attacks
  - Applied to registration, login, pharmacy form, medicine form
- [x] **EnvironmentConfig** - Implemented environment configuration system
  - Supports development, staging, production environments
  - Controls feature flags (demo mode, analytics, debug logs)
  - Configures API timeouts, security settings
- [x] Updated view models to use sanitization:
  - `registration-view-model.ts`
  - `login-view-model.ts`
  - `pharmacy-form-view-model.ts`
  - `add-medicine-view-model.ts`

### Firebase App Check
- [x] **AppCheckService** - Created App Check service for production security
  - Integrates with Firebase App Check
  - Supports debug provider for development
  - Auto-initializes based on environment config
  - Gracefully handles missing `@nativescript/firebase-app-check` package

### Firebase Security Rules
- [x] **firestore.rules** - Comprehensive security rules
  - Role-based access control (pharmacist, courier, admin)
  - User profile protection (users can only access own data)
  - Exchange access control (both parties can access)
  - Inventory protection (pharmacies own their inventory)
  - Read-only collections for backend-managed data
- [x] **firestore.indexes.json** - Query optimization indexes
- [x] **firebase.json** - Firebase deployment configuration

## Completed (2024-12-23) - Session 2

### Security Fixes Applied
- [x] **auth.validator.ts** - Removed hardcoded admin credentials, now uses Firebase Auth
- [x] **auth.service.ts** - Removed hardcoded admin bypass, uses proper validation
- [x] **security.service.ts** - Fixed hardcoded SECRET_KEY, now uses per-device generated key
- [x] **demo-data.service.ts** - Removed hardcoded demo credentials, uses environment config
- [x] **auth-firebase.service.ts** - Removed sensitive UID logging
- [x] **auth.storage.ts** - Removed sensitive user data logging
- [x] **AndroidManifest.xml** - Reviewed: `android:exported="true"` required for launcher activity

### Security Summary
- Removed all hardcoded credentials from codebase
- Implemented device-specific encryption key generation
- Demo mode now controlled by environment configuration
- Sensitive data no longer logged to console
- Firebase API keys reviewed (client-side keys are OK per Firebase security model)

## Completed (2024-12-23) - Session 1
- [x] Fix TypeScript compilation errors
- [x] Add Firebase services (exchange, medicine)
- [x] Add QR code verification system
- [x] Add exchange accept/reject functionality
- [x] Run initial code review
- [x] Push changes to GitHub

## Next Steps (Priority)
- [ ] Deploy Firestore security rules to Firebase
- [ ] Set up Cloud Functions for wallet/subscription management
- [ ] Add rate limiting for API calls
- [ ] Implement proper error handling UI
- [ ] Add navigation to wallet/subscription pages from dashboards
- [ ] Test all features end-to-end
- [ ] Test security rules with Firebase Emulator

## Firebase Security Rules Deployment
```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

## App Check Setup (When Ready for Production)
```bash
# Install App Check package
npm install @nativescript/firebase-app-check

# Then in Firebase Console:
# 1. Go to App Check section
# 2. Register Android app with SafetyNet/Play Integrity
# 3. Register iOS app with DeviceCheck/App Attest
# 4. Set environment.security.enableAppCheck = true for staging/production
```

## New Files Created (Session 6)
- `app/services/firebase/courier-earnings-firebase.service.ts` - Courier earnings, wallet, payout service
- `app/services/firebase/delivery-payment-firebase.service.ts` - Pharmacy 50/50 split payment service
- `app/pages/courier/delivery-details/delivery-details-page.ts` - Delivery details page
- `app/pages/courier/delivery-details/delivery-details-page.xml` - Delivery details UI
- `app/pages/courier/delivery-details/delivery-details-view-model.ts` - Delivery details view model
- `app/pages/courier/earnings/earnings-page.ts` - Earnings page
- `app/pages/courier/earnings/earnings-page.xml` - Earnings UI
- `app/pages/courier/earnings/earnings-view-model.ts` - Earnings view model

## Modified Files (Session 6)
- `app/models/delivery.model.ts` - Added CourierEarning, CourierPayout, CourierWallet, DeliveryFeeConfig, DeliveryPayment, DeliveryPaymentStatus
- `app/services/firebase/delivery-firebase.service.ts` - Added payment status filtering, earnings integration
- `firestore.rules` - Added courier payment collection rules
- `firestore.indexes.json` - Added courier earnings/payout indexes

## New Files Created (Session 5)
- `app/models/location.model.ts` - Country/city configuration (14 countries, 80+ cities)

## Modified Files (Session 5)
- `app/models/user.model.ts` - Added UserLocation interface and operatingCities
- `app/models/exchange/medicine-exchange.model.ts` - Added ExchangeLocation
- `app/models/delivery.model.ts` - Added DeliveryLocation
- `app/services/firebase/exchange-firebase.service.ts` - Added same-city validation
- `app/services/firebase/delivery-firebase.service.ts` - Added city-based filtering
- `app/pages/registration/registration-view-model.ts` - Added country/city selection
- `app/pages/registration/registration-page.xml` - Added country/city pickers
- `app/pages/pharmacy/exchange/exchange-list-view-model.ts` - Added same-city filtering
- `app/pages/courier/dashboard/courier-dashboard-view-model.ts` - Added city-based delivery filtering
- `firestore.indexes.json` - Added city-based query indexes

## New Files Created (Session 4)
- `app/models/wallet.model.ts` - Wallet and transaction models
- `app/models/subscription.model.ts` - Subscription and plan models
- `app/models/delivery.model.ts` - Delivery and courier models
- `app/services/firebase/wallet-firebase.service.ts` - Wallet Firebase service
- `app/services/firebase/subscription-firebase.service.ts` - Subscription Firebase service
- `app/services/firebase/delivery-firebase.service.ts` - Delivery Firebase service
- `app/pages/shared/wallet/wallet-page.ts` - Wallet page
- `app/pages/shared/wallet/wallet-page.xml` - Wallet UI
- `app/pages/shared/wallet/wallet-view-model.ts` - Wallet view model
- `app/pages/shared/subscription/subscription-page.ts` - Subscription page
- `app/pages/shared/subscription/subscription-page.xml` - Subscription UI
- `app/pages/shared/subscription/subscription-view-model.ts` - Subscription view model

## New Files Created (Session 3)
- `app/services/utils/input-sanitizer.service.ts` - Input sanitization utility
- `app/config/environment.config.ts` - Environment configuration system
- `app/services/firebase/app-check.service.ts` - Firebase App Check service
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore query indexes
- `firebase.json` - Firebase deployment configuration

## Code Review Notes
- **firebase.config.ts** - API keys are client-side identifiers, security is through Firebase Security Rules
- HTTP URLs in XML files are namespace declarations (expected)
- TypeScript compilation: Clean (0 errors)

## Commands
```bash
# Run code reviewer
node "c:\Users\dell user\projects\tools\nativescript-reviewer\index.js" .

# TypeScript check
npx tsc --noEmit

# Build Android
ns build android

# Build iOS
ns build ios
```
