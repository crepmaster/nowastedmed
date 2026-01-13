# NowasteMed — Task (P1 Refactor)

## 0) Task Metadata
- Task ID: P1-VM-CLEANUP-01
- Date: 2026-01-13
- Owner: AI-assisted (Claude Code) + Human review
- Branch: feature/refactor-vm-cleanup
- Mode: refactor-only / demo-stable
- Risk Level: P1

## 1) Objective (What / Why)
**What**
Complete the remaining ViewModel refactoring to fully align the codebase with the Reviewer Constitution.

**Why**
Ensure architectural consistency, remove legacy anti-patterns, and reduce future maintenance risk without changing runtime behavior.

**Non-goals**
- No business logic changes
- No feature additions
- No behavior changes
- No auth, bootstrap, or navigation redesign

## 2) Scope Control
**Allowed files**
- app/pages/**/**-view-model.ts (only ViewModels not already refactored in P0)

**Read-only (must not modify)**
- app/services/auth-session.service.ts
- app/services/navigation.service.ts
- app/app.ts
- Firestore rules and Firebase services

## 3) Constitution & Reviewer Constraints
Reference: /REVIEWER_CONSTITUTION.md

**Must Not**
- Introduce Frame.topmost() in any ViewModel
- Access Firebase Auth / Firestore directly from ViewModels
- Duplicate auth or navigation state
- Change role routing or business conditions
- Introduce new services without justification

## 4) Implementation Plan
1. Inventory all remaining ViewModels not covered by P0
2. Identify:
   - direct Firebase access
   - Frame.topmost() usage
   - duplicated state
3. Refactor each ViewModel to:
   - delegate to existing services
   - preserve current behavior
4. Keep diffs minimal and mechanical

## 5) Validation Gates
Mandatory:
- npm run reviewer:phase1
- npx tsc --noEmit
- npm run android:build (or Gradle assembleDebug)

Smoke tests:
- App boots without crash
- Navigation behavior unchanged
- All existing screens reachable

## 6) Evidence Checklist
- List of ViewModels refactored
- grep evidence:
  - rg "Frame\\.topmost\\(" app/pages → 0 occurrences
  - rg "AuthFirebaseService|getAuthService\\(" app/pages → 0 occurrences
- git status clean
- Gate outputs attached

## 7) Stop Conditions
Stop immediately if:
- A ViewModel cannot function without direct Firebase access
- A change would alter business logic
- Scope expands beyond ViewModels

## 8) Deliverables
- All remaining ViewModels Reviewer-compliant
- No functional regression
- One coherent commit or a small, logical commit series
