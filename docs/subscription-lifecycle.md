# Subscription Lifecycle

This document describes the subscription system architecture, data flow, and source of truth hierarchy.

## Source of Truth Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    PRIMARY SOURCE                           │
│         Firestore `subscriptions` collection                │
│                                                             │
│  - Contains subscription record with status, dates, planId  │
│  - subscriptionId is required for cancellation              │
│  - Only source that can return status: 'active'             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   FALLBACK SOURCE                           │
│              User Profile Fields                            │
│                                                             │
│  - hasActiveSubscription, subscriptionPlanId, etc.          │
│  - Used when no subscription record exists                  │
│  - Can return status: 'pending' or 'inactive' for paid plans│
│  - Exception (R8): Free plan can return status: 'active'    │
│  - hasSubscription is always false in fallback mode         │
└─────────────────────────────────────────────────────────────┘
```

## Plan ID Scheme

Global plans use the `plan_<type>` ID scheme:

| Plan Type | Plan ID |
|-----------|---------|
| free | `plan_free` |
| basic | `plan_basic` |
| premium | `plan_premium` |
| enterprise | `plan_enterprise` |

Country-specific plans created by admins use auto-generated Firestore IDs.

## SubscriptionSnapshot Interface

The `SubscriptionSnapshot` interface is the normalized data structure used by ViewModels:

```typescript
interface SubscriptionSnapshot {
    hasSubscription: boolean;        // True only with valid subscription record
    subscriptionId: string | null;   // Firestore doc ID (null = profile fallback)
    planId: string;                  // e.g., 'plan_basic'
    planName: string;                // Display name
    planType: PlanType;              // 'free' | 'basic' | 'premium' | 'enterprise'
    status: SubscriptionStatus;      // 'active' | 'pending' | 'inactive' | etc.
    daysRemaining: number;
    startDate: Date | null;
    endDate: Date | null;
    autoRenew: boolean;
    usageStats: {
        exchangesThisMonth: number;
        medicinesInInventory: number;
        activeExchanges: number;
    };
}
```

## Mode-Aware Services

The subscription system uses a factory pattern to support both Firebase and Local modes:

```typescript
// Usage in ViewModels
const subscriptionService = getSubscriptionService();
const snapshot = await subscriptionService.getSubscriptionSnapshot(userId);
```

### Firebase Mode (`useFirebaseAuth: true`)

- Reads from Firestore `subscriptions` collection
- Falls back to user profile fields if no record exists
- Supports realtime updates via `subscribeToSubscriptionUpdates()`
- Write operations create actual Firestore documents

### Local Mode (`useFirebaseAuth: false`)

- Reads from user profile fields only
- No Firestore access (offline demo mode)
- `subscribeToSubscriptionUpdates()` returns immediately with current snapshot
- Write operations are no-ops (profile updates handled by ViewModel)

## Subscription Activation Flow

### Free Plan (R8: Profile-Only)

```
1. User selects free plan
2. ViewModel updates user profile fields ONLY (no Firestore record)
3. Navigate to dashboard
```

**Note:** Free plans do not create Firestore subscription records. This:
- Reduces unnecessary Firestore writes
- Simplifies free tier management
- Profile fields are sufficient for free tier state

### Paid Plan (Wallet/Mobile Money)

```
1. User selects paid plan and payment method
2. ViewModel calls requestSubscription() - creates request record
3. ViewModel calls activateSubscription() - creates subscription record (demo auto-approve)
4. ViewModel updates user profile fields
5. Navigate to dashboard
```

### Paid Plan (Invoice)

```
1. User selects paid plan and "Pay Later"
2. ViewModel calls requestSubscription() - creates request record
3. ViewModel updates profile with status: 'pending'
4. Admin processes invoice and approves subscription
5. Realtime listener updates UI automatically
```

## Idempotence Guards

All subscription operations are protected by `_isProcessingSubscription` flag:

```typescript
async onSelectPlan(args: any): Promise<void> {
    if (this._isProcessingSubscription) return;  // Guard

    this.isProcessingSubscription = true;
    try {
        // ... subscription logic
    } finally {
        this.isProcessingSubscription = false;
    }
}
```

This prevents:
- Double-tap on subscription buttons
- Duplicate subscription records
- Race conditions in async operations

## Realtime Updates

In Firebase mode, ViewModels can subscribe to live updates:

```typescript
private setupRealtimeListener(userId: string): void {
    if (this.subscriptionService.subscribeToSubscriptionUpdates) {
        this.unsubscribe = this.subscriptionService.subscribeToSubscriptionUpdates(
            userId,
            (snapshot) => {
                this.currentSnapshot = snapshot;
                this.updateUIFromSnapshot(snapshot);
            }
        );
    }
}
```

This enables:
- Live status updates when admin approves/denies subscriptions
- Automatic UI refresh on subscription changes
- Sync across devices

## Cancellation Requirements

Cancellation requires a valid `subscriptionId`:

```typescript
if (!this.currentSnapshot.subscriptionId) {
    // Cannot cancel - no Firestore record exists
    return;
}

await this.subscriptionService.requestCancellation(
    userId,
    this.currentSnapshot.subscriptionId,
    reason
);
```

Profile-only subscriptions (Local mode, free tier, or legacy data) cannot be cancelled through the normal flow.

## Profile Status Normalization

Profile status values from user records are normalized to valid `SubscriptionStatus` values:

| Profile Value | Normalized Status |
|---------------|-------------------|
| `'active'` | `'active'` |
| `'pending'`, `'pendingPayment'` | `'pending'` |
| `'cancelled'`, `'canceled'` | `'cancelled'` |
| `'expired'` | `'expired'` |
| `'none'`, `'inactive'`, undefined | `'inactive'` |

This normalization is applied in both Firebase and Local services via `normalizeProfileStatus()` helper.

## Collections Reference

| Collection | Purpose |
|------------|---------|
| `subscriptions` | Active subscription records (primary source of truth) |
| `subscription_plans` | Admin-managed plan definitions |
| `subscription_requests` | Pending requests and cancellation requests |
