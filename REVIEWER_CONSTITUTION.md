# NativeScript Reviewer – Constitution (NowasteMed)

## 1. Purpose

This document is the **canonical source of truth** for all development, refactoring, and AI-assisted code generation on the NowasteMed project.

Any code (human or AI-generated) **must comply** with these rules. The NativeScript Reviewer (CI) is the executable enforcement of this constitution.

Primary objective: **demo-stable software** — no regressions, no boot failures, no hidden logic changes.

---

## 2. Guiding Principles

1. **Boot always wins**
   If the app does not boot reliably, nothing else matters.

2. **No logic change by default**
   Refactoring means *moving, centralizing, or abstracting* — never altering business decisions unless explicitly stated.

3. **Single source of truth**
   Auth state, navigation, and initialization must never be duplicated.

4. **Reviewer > AI > Human preference**
   If a rule is enforced by the NativeScript Reviewer, it overrides any AI or human opinion.

---

## 3. Rule Levels

* **P0 – Blockers**: Violation = immediate FAIL (CI + manual)
* **P1 – Structural safety**: Violation = FAIL in CI
* **P2 – Best practices**: Expected, may warn, but not blocking unless escalated

---

## 4. P0 Rules – Absolute Blockers

### P0-1. Single Bootstrap Rule

* Exactly **one** `Application.run()` / app bootstrap path is allowed.
* Forbidden:

  * Parallel entry files (e.g. `app-firebase.ts` with implicit run)
  * Indirect secondary bootstraps via imports

### P0-2. Firebase Initialization Guard

* Firebase **must not** initialize before `Application.launchEvent`.
* Forbidden:

  * Top-level Firebase imports triggering side effects
  * `firebase().initializeApp()` outside a bootstrap gate
* Allowed:

  * Lazy initialization
  * Explicit guards (e.g. `ensureFirebaseReady()` called after launch)

### P0-3. ViewModel Isolation (MVVM Hard Rule)

ViewModels **must not**:

* Access Firebase Auth or Firestore directly
* Access native navigation (`Frame.topmost()`)
* Initialize plugins or platform APIs

ViewModels **may only**:

* Call services
* React to observable/session state

### P0-4. Single Navigation Owner

* All navigation must go through **one** service (e.g. `NavigationService`).
* Forbidden:

  * `Frame.topmost()` in ViewModels
  * Multiple navigation coordinators

### P0-5. Single Auth Session Source

* Auth state must be centralized (e.g. `AuthSessionService`).
* Forbidden:

  * Duplicated `currentUser` state
  * Local auth caches inside ViewModels

### P0-6. Runtime Compatibility

* Forbidden in runtime:

  * Node-only modules (`crypto`, `fs`, `path`, etc.)
  * Libraries assuming Node.js APIs without NativeScript compatibility

---

## 5. P1 Rules – Boot & Structural Safety

### P1-1. Entrypoint Integrity

* Assets must contain `package.json` with:

  * `"main": "./bundle.mjs"`
  * `"type": "module"`
* No ambiguous or duplicated entrypoints

### P1-2. Safe Top-Level Imports

* Top-level imports **must not**:

  * Perform IO
  * Initialize native plugins
  * Access Firebase or platform services

### P1-3. Bundling & Webpack Safety

* No resolution attempts to `~/package.json`
* No circular imports that block bundling

---

## 6. P2 Rules – Architecture & Data Discipline

### P2-1. MVVM Discipline

* ViewModels = orchestration only
* Services = IO, Firebase, navigation, platform logic

### P2-2. Firestore Hygiene

* Prefer `undefined` over `null`
* Security rules must be symmetric (`create` / `read`)
* Avoid multiple Firestore initializations

### P2-3. Explicit Contracts

* TypeScript strict typing
* No uncontrolled `any`
* Interfaces preferred over implicit shapes

---

## 7. Validation Gates (Mandatory)

At minimum, any change must pass:

1. `npm run reviewer:phase1`
2. NativeScript build (Android at least)
3. Manual smoke tests:

   * Cold start (no crash)
   * Login / logout
   * Role-based navigation

If a gate cannot be executed, the exact command and expected outcome **must** be documented.

---

## 8. Stop Conditions (Non-Negotiable)

Work must **stop immediately** if:

* A ViewModel touches Firebase or navigation directly
* Firebase is initialized before `Application.launchEvent`
* More than one bootstrap path exists
* Business logic is altered unintentionally
* A P0 rule conflict is detected

Resolution requires explicit explanation and approval.

---

## 9. AI Usage Policy (Claude / Codex)

* AI agents are **executors**, not architects
* All AI-generated code must self-review against this constitution
* If ambiguity exists, apply the **strictest rule** or stop

---

## 10. Change Policy

Any modification to this constitution:

* Must be explicit
* Must be versioned
* Must justify why an existing rule is relaxed or tightened

This file is intentionally strict.

---

**Status**: Active – enforced by NativeScript Reviewer
