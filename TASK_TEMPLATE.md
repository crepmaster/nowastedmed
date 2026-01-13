# NowasteMed — Task Template (Reviewer-Driven)

## 0) Task Metadata
- Task ID:
- Date:
- Owner:
- Branch:
- Mode: [demo-stable / refactor-only / feature / hotfix]
- Risk Level: [P0 / P1 / P2]

## 1) Objective (What / Why)
**What (1–3 lines):**
- 

**Why (1–3 lines):**
- 

**Non-goals (explicitly out of scope):**
- 
- 

## 2) Scope Control
**Allowed files to modify (exact paths):**
- 
- 

**Forbidden areas (must not touch):**
- Business rules / role routing logic (unless explicitly requested)
- Entry/bootstrap chain (unless task is bootstrap-related)
- Firestore rules (unless explicitly requested)

## 3) Constitution & Reviewer Constraints (Must / Must Not)
**Reference (mandatory):**
- /REVIEWER_CONSTITUTION.md

**P0 Must Not (check all that apply):**
- [ ] No second bootstrap / Application.run()
- [ ] No Firebase init before Application.launchEvent
- [ ] No top-level Firebase imports with side effects
- [ ] No Firebase/Auth/Firestore access in ViewModels
- [ ] No Frame.topmost() in ViewModels
- [ ] Single Navigation owner only
- [ ] Single Auth Session source only
- [ ] No Node-only modules in runtime

## 4) Implementation Plan (Minimal Patch)
**Step-by-step plan (max 10 bullets):**
1.
2.
3.

**New artifacts to be created (if any):**
- 

## 5) Validation Gates (Proof Required)
**Mandatory gates (attach logs or CI link):**
- [ ] npm run reviewer:phase1
- [ ] npx tsc --noEmit
- [ ] npm run android:build OR Gradle assembleDebug
- [ ] Smoke tests (below)

**Smoke tests (PASS criteria):**
- [ ] Cold start: app boots without crash
- [ ] Login/logout: routes correctly
- [ ] Role routing: pharmacy → dashboard, courier → dashboard
- [ ] Wallet/subscription/account navigation works (no back-stack glitch)

## 6) Evidence Checklist (What to paste in the PR)
- Diff summary (files changed + reason)
- `git status` clean
- Gate outputs (phase1 / tsc / android build)
- Grep evidence (if applicable):
  - `rg "Frame\.topmost\(" app/pages` → expected 0 in targeted VMs
  - `rg "AuthFirebaseService|getAuthService\(" app/pages` → expected 0 in targeted VMs

## 7) Stop Conditions (Hard Stop)
Stop and escalate if any occurs:
- A ViewModel needs Firebase or Frame.topmost() to accomplish the goal
- Firebase would run before Application.launchEvent
- Task requires unintended behavior change
- Scope needs to expand beyond allowed files

## 8) Deliverables
- [ ] Code changes merged
- [ ] Documentation updated (if needed)
- [ ] No logic changes confirmed (unless requested)
