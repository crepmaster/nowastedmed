# Firestore Security Rules Tests

Unit tests for NoWastedMed Firestore security rules.

## Prerequisites

1. **Firebase CLI** - Install globally:
   ```bash
   npm install -g firebase-tools
   ```

2. **Java Runtime** - Required for Firebase emulators (JRE 11+)

## Setup

1. Install test dependencies:
   ```bash
   cd tests/firestore-rules
   npm install
   ```

2. Start the Firebase Firestore emulator (from project root):
   ```bash
   firebase emulators:start --only firestore
   ```

   The emulator UI will be available at http://127.0.0.1:4000

## Running Tests

With the emulator running, in a separate terminal:

```bash
cd tests/firestore-rules
npm test
```

Or from project root:
```bash
npm run test:rules
```

## Test Coverage

The tests cover:

### Exchange State Machine
- Creation (draft/pending status)
- Status transitions (draft → pending → accepted → in_transit → completed)
- Accept/reject by responder
- Immutable field protection (proposedBy, location.cityId)

### Delivery State Machine
- Payment gate enforcement (couriers only see paid deliveries)
- Status transitions (pending → assigned → picked_up → in_transit → delivered)
- Pharmacy cancellation rules
- Pharmacy payment updates (field-level restrictions)

### City-Based Filtering
- Same-city exchange visibility
- Courier operating city restrictions

### Role-Based Access Control
- Profile read/write permissions
- Admin-only operations (countries, deliveries creation)
- Inventory access rules

### Wallet & Financial
- Wallet creation and updates
- Courier wallet fraud protection
- Ledger immutability (audit trail)

### Exchange Proposals
- Same-city requirement for proposals
- Self-proposal prevention
- Read access for broadcast exchanges

## File Structure

```
tests/firestore-rules/
├── package.json           # Test dependencies
├── jest.config.js         # Jest configuration
├── tsconfig.json          # TypeScript config
├── firestore.rules.test.ts # Main test file
└── README.md              # This file
```
