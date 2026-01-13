# NowasteMed — Task (P1-1 Subscription/Profile Reconciliation)

## 0) Task Metadata
- Task ID: P1-SUBSCRIPTION-RECONCILE-01
- Date: 2026-01-13
- Owner: AI-assisted (Claude Code) + Human review
- Branch: feature/subscription-reconcile
- Mode: refactor-only / demo-stable (read-only first)
- Risk Level: P1
- Runtime modes: Firebase + Local (both must remain working)

## 1) Objective (What / Why)
**What**
Make subscription state consistent and non-duplicated from the UI perspective by reading from the canonical subscription record (Firebase mode) and reconciling what is displayed on profile-driven screens, with a safe Local-mode path.

**Why**
Codex analysis identified drift/duplication between:
- profile fields (user model / auth profile)
- subscription records (subscription collection/service)

This task reduces inconsistency without schema changes or migrations.

**Non-goals**
- No Firestore schema changes
- No collection renames
- No rules/index changes (unless a security regression is proven)
- No new payment/ledger logic
- No write-back/migration of profile subscription fields (read-only reconciliation for demo)
- No changes to auth/navigation ownership
- No hard-coded `useFirebase` decisions in UI

## 2) Scope Control
**Allowed files**
- app/services/firebase/subscription-firebase.service.ts
- app/pages/shared/subscription/subscription-view-model.ts
- app/pages/shared/subscription/choose-plan-view-model.ts
- app/pages/registration/registration-view-model.ts (read-only / minimal adjustments only if needed)
- app/models/subscription.model.ts
- app/models/user.model.ts
- app/services/auth-factory.service.ts (or the existing project mode-switch file/service used to choose Firebase vs Local)

**Read-only (must not modify)**
- app/app.ts
- AuthSessionService and navigation services
- Firestore rules/indexes (unless explicitly required by a demonstrated bug)

## 3) Constitution & Constraints
Reference: /REVIEWER_CONSTITUTION.md

Must keep:
- ViewModels do not access Firebase directly
- No Frame.topmost() in ViewModels
- No logic changes outside subscription display consistency
- Minimal diff, no opportunistic refactors
- Respect existing Firebase vs Local mode selection (no UI hard-coding)

## 4) Required Behavior (Acceptance)
- Subscription screen displays values sourced from the subscription record when available (Firebase mode).
- If subscription record is missing, UI falls back to existing profile fields (no crash).
- In Local/offline mode, subscription screens still render correctly **without any Firebase calls/imports**.
- Existing mode selection is respected (no hard-coded `useFirebase` in UI).
- No change to existing writes/flows unless explicitly required to prevent inconsistent UI states.
- Demo stability preserved.

## 5) Implementation Plan
1. Identify “source of truth” fields in subscription record vs profile fields currently used by the UI.
2. Add a **mode-aware** reconciliation method that returns a normalized “SubscriptionSnapshot” for UI:
   - Firebase mode: read subscription record, normalize fields
   - Local mode: derive snapshot from local/profile data (no Firebase access)
   - includes fallback logic to profile fields
3. Update subscription-related ViewModels to use that snapshot only (via existing services), preserving behavior.
4. Add defensive logging (non-intrusive) for missing/invalid records.

## 6) Validation Gates
Mandatory:
- npm run reviewer:phase1
- npx tsc --noEmit
- npm run android:build (or gradlew assembleDebug)

Smoke tests:
- Firebase mode: Login → open Subscription screen → values render correctly
- Firebase mode: Change plan flow (if exists) still navigates correctly
- Local mode: open Subscription screen → renders without Firebase usage
- Missing subscription record does not break UI (fallback works)

## 7) Evidence Checklist
- Files changed list
- grep proofs:
  - rg "Frame\.topmost\(" app/pages --glob "*-view-model.ts" → 0 matches
  - rg "firebase\(" app/pages --glob "*-view-model.ts" → 0 matches (or explain any false-positive pattern)
- Gate outputs attached

## 8) Stop Conditions
Stop if:
- A schema change is required to proceed
- A rule/index change is required to proceed
- Behavior changes beyond display reconciliation are needed
- Implementing Local mode would require adding new local storage schemas or migrations
Escalate with a proposal for a separate task (P1-2/P2).

## 9) Deliverables
- A single normalized subscription snapshot path for UI display (mode-aware)
- Fallback handling for missing subscription record
- Both Firebase and Local demo modes remain functional
- All gates PASS
