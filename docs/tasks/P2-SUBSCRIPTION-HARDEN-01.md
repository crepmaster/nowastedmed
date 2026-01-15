# P2-SUBSCRIPTION-HARDEN-01: Subscription Lifecycle Hardening

## Status: COMPLETED

## Summary

Micro-hardening patch set to eliminate "ghost states", standardize plan IDs, enforce single source of truth for subscription status, add idempotence guards, and wire realtime subscription updates.

## Rules Implemented

| Rule | Description | Implementation |
|------|-------------|----------------|
| R1 | `subscriptions` collection is authoritative source of truth | `getSubscriptionSnapshot()` checks Firestore first, profile is fallback only |
| R2 | Plan IDs use `plan_<type>` scheme | Fixed `getDefaultPlans()`, `getPlanByType()`, added `initializeGlobalDefaultPlans()` |
| R3 | `hasSubscription: true` requires valid subscriptionId | `getSnapshotFromProfile()` returns `hasSubscription: false` when no record |
| R4 | Profile fallback never returns `status: 'active'` (except free plan per R8) | Downgrades 'active' to 'pending' in profile fallback path, unless `planId === 'plan_free'` |
| R5 | Realtime listener for subscription updates | Added `subscribeToSubscriptionUpdates()` to interface and implementations |
| R6 | Idempotence guards on all subscription operations | Added `_isProcessingSubscription` flag to both ViewModels |
| R7 | Current plan detection uses planId (not planType) | Updated `formatPlanForDisplay()` to match by planId |
| R8 | Free plan activation is profile-only | Comment added, no subscription record required for free tier |

## Files Modified

### Services

- **subscription-factory.service.ts**
  - Added `subscribeToSubscriptionUpdates?()` optional method to interface (R5)

- **subscription-firebase.service.ts**
  - Fixed `getDefaultPlans()` to use `plan_${type}` ID scheme (R2)
  - Fixed `getPlanByType()` to use `plan_${type}` ID scheme (R2)
  - Hardened `getSnapshotFromProfile()` to never return 'active' status (R4)
  - Set `hasSubscription: false` in profile fallback (R3)
  - Added `subscribeToSubscriptionUpdates()` for realtime updates (R5)

- **subscription-local.service.ts**
  - Added `subscribeToSubscriptionUpdates()` no-op implementation (R5)

- **admin-subscription-firebase.service.ts**
  - Added `initializeGlobalDefaultPlans()` with `plan_<type>` ID scheme (R2)
  - Added documentation comments about ID schemes

### ViewModels

- **subscription-view-model.ts**
  - Added `_isProcessingSubscription` idempotence guard (R6)
  - Added `isProcessingSubscription` getter/setter for UI binding
  - Wired `processSubscription()` with try/finally guard pattern
  - Updated `formatPlanForDisplay()` to use planId matching (R7)
  - Added `setupRealtimeListener()` for live updates (R5)
  - Added `updateUIFromSnapshot()` helper for consistency

- **choose-plan-view-model.ts**
  - Added `_isProcessingSubscription` idempotence guard (R6)
  - Added `isProcessingSubscription` getter/setter for UI binding
  - Protected `onSelectPlan()`, `activateFreePlan()`, `handlePaidPlanSelection()`, `onContinueWithFree()`

## Testing Checklist

- [ ] Free plan activation in Local mode
- [ ] Free plan activation in Firebase mode
- [ ] Paid plan activation (wallet payment)
- [ ] Paid plan activation (mobile money)
- [ ] Invoice request flow
- [ ] Double-tap prevention on subscription buttons
- [ ] Realtime update when subscription changes externally
- [ ] Cancellation flow (requires subscriptionId)
- [ ] Current plan highlighting in plan list

## Related Tasks

- P1-SUBSCRIPTION-RECONCILE-01: Created the subscription factory service pattern
- P1-VM-CLEANUP-01: Initial ViewModel cleanup

## Post-Review Fixes

### P2-Fix-1: Free Plan Profile-Only Policy
- Removed `activateSubscription()` call from `choose-plan-view-model.ts` for free plans
- Added early return in `subscription-view-model.ts::processSubscription()` for free plans
- Updated `getSnapshotFromProfile()` to allow 'active' status for free tier (R8 exception to R4)

### P2-Fix-2: Profile Status Normalization
- Added `normalizeProfileStatus()` helper in `subscription-factory.service.ts`
- Maps legacy values ('none', 'pendingPayment') to valid `SubscriptionStatus`
- Used in both `SubscriptionFirebaseService` and `SubscriptionLocalService`

## Notes

- This is a hardening patch, not a refactor - minimal changes to existing logic
- Type mismatch for 'pending' status preserved (pre-existing issue, not in scope)
- Realtime listener is optional interface method for backwards compatibility
- Free plan is profile-only per R8 - no Firestore subscription record created
