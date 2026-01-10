# Exchange Flow Refactor Plan

## Current State Assessment

### Components Status

| Component | Status | Details |
|-----------|--------|---------|
| **Exchange Models** | Complete | `medicine-exchange.model.ts` has all needed types |
| **Firebase Service** | Complete | `exchange-firebase.service.ts` has full CRUD |
| **Create Exchange** | Partial | Doesn't consistently write `exchanges` record tied to inventory |
| **Proposal Flow** | Partial | `ExchangeProposalViewModel` uses **local** `ExchangeService`, not Firebase - proposals don't persist |
| **Exchange Details** | Partial | Accept/reject updates status only, no proposal reconciliation or inventory |
| **QR Scanner Page** | Exists, Not Integrated | `qr-scanner-page.xml` exists but not wired to exchange flow |
| **QR Verification Service** | Complete | Generates pickup/delivery codes |
| **Validation Service** | Not Integrated | Exists but unused |
| **Notification Service** | Not Integrated | Exists but unused |
| **Inventory Transfer** | Missing | No stock adjustment on accept/complete |
| **City Filtering** | Code Only | Not enforced in Firestore rules (security gap) |
| **Sell Flow** | Not Implemented | No price fields, buyer/seller flow |

### Key Issues Identified

1. **Service Mismatch**: `ExchangeProposalViewModel` uses local storage while rest uses Firebase
2. **Ambiguous Status Flow**: `pending` used inconsistently, `proposedTo` semantics flip mid-flow
3. **Field Naming Confusion**: `proposedBy/proposedTo` confusing when `proposedTo` starts empty then becomes responder
4. **No Inventory Impact**: No stock reservation on accept, no transfer on complete
5. **Security Gap**: City-based filtering only in code, not in Firestore rules
6. **QR Scanner Disconnected**: Page exists but not wired to exchange flow
7. **Unused Services**: Validation and Notification services created but never integrated

## Proposed State Machine

```
draft → open → proposal_received → accepted → in_transit → completed
                     ↓
                  rejected
```

### State Definitions
- **draft**: Exchange being created, not yet visible to others
- **open**: Broadcast to same-city pharmacies, awaiting proposals
- **proposal_received**: Another pharmacy has responded with their medicines
- **accepted**: Requester accepted the proposal, ready for pickup
- **in_transit**: Medicines picked up, being delivered
- **completed**: Exchange finalized, inventory transferred
- **rejected**: Proposal was rejected (can return to open for new proposals)

## Proposed Field Renaming

| Current | Proposed | Reason |
|---------|----------|--------|
| `proposedBy` | `requesterId` | Clearer - person requesting the exchange |
| `proposedTo` | `responderId` | Clearer - person responding (null until proposal) |
| `proposedMedicines` | `requestItems` | What the requester wants |
| `offeredMedicines` | `offerItems` | What the responder offers |

## Refactor Phases

### Phase 1: Fix Core Exchange Flow
1. Update `ExchangeProposalViewModel` to use `ExchangeFirebaseService` instead of local `ExchangeService`
2. Implement clear state machine with new status values
3. Fix Create Exchange to properly persist `exchanges` record with location data
4. Consider field renaming (requires data migration strategy)

### Phase 2: Complete the Loop
1. Add inventory reservation when exchange is accepted
2. Add inventory transfer/finalization when exchange completes
3. Wire `qr-scanner-page` to exchange pickup/delivery flow
4. Harden Firestore rules:
   - Add city-based read restrictions for open exchanges
   - Restrict updates to requester/responder and valid transitions only

### Phase 3: Integration
1. Integrate `ValidationService` into exchange creation flow
2. Integrate `NotificationService` for exchange events

### Phase 4: Optional - Sell Flow
1. Add `type` field to distinguish exchange vs sale
2. Add price/total fields for sales
3. Implement: listing → order → payment → delivery → completion
4. Payment integration with wallet

## Files to Modify

### Models
- `app/models/exchange/medicine-exchange.model.ts` - Add new status enum, consider field renames

### Services
- `app/services/firebase/exchange-firebase.service.ts` - Update for new state machine
- `app/services/exchange/exchange.service.ts` - Keep as fallback or deprecate

### View Models
- `app/pages/pharmacy/exchange/create-exchange-view-model.ts` - Fix exchange creation
- `app/pages/pharmacy/exchange/exchange-list-view-model.ts` - Update for new states
- `app/pages/pharmacy/exchange/exchange-details-view-model.ts` - Fix accept/reject flow
- `app/pages/pharmacy/exchange/exchange-proposal-view-model.ts` - Switch to Firebase service

### Pages
- `app/pages/shared/qr-scanner/qr-scanner-page.*` - Wire to exchange flow

### Rules
- `firestore.rules` - Add city-based filtering and transition restrictions

## Migration Considerations

If renaming fields:
1. Add new fields alongside old ones initially
2. Update code to write both, read new preferentially
3. Run migration script on existing data
4. Remove old field references

Or for demo: start fresh with new collection structure.
