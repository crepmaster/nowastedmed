# Firestore Security Rules Tests

Unit tests for NoWastedMed Firestore security rules.

## Prerequisites

- **Node.js 18+**
- **Java 21+** (required for Firebase emulator)
  - Download from [Adoptium](https://adoptium.net/)

## Quick Start (Single Command)

### Windows (PowerShell)
```powershell
cd tests/firestore-rules
.\run-tests.ps1
```

### Windows (CMD)
```cmd
cd tests\firestore-rules
run-tests.bat
```

The script will:
1. Auto-detect Java 21 installation
2. Install npm dependencies if needed
3. Start Firebase emulator
4. Run all tests
5. Stop emulator and report results

## Manual Setup

### 1. Install dependencies
```bash
cd tests/firestore-rules
npm install
```

### 2. Run tests with emulator (recommended)
```bash
npm run test:emulator
```

This uses `firebase emulators:exec` to start/stop the emulator automatically.

### 3. Alternative: Manual emulator
```bash
# Terminal 1: Start emulator
npm run emulator:start

# Terminal 2: Run tests
npm test
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run tests (requires running emulator) |
| `npm run test:emulator` | Start emulator, run tests, stop emulator |
| `npm run emulator:start` | Start emulator only |
| `npm run test:watch` | Watch mode for development |
| `npm run test:coverage` | Run with coverage report |

## CI/CD

Tests run automatically on GitHub Actions when:
- `firestore.rules` is modified
- Files in `tests/firestore-rules/` change
- PR is opened against `main`

See `.github/workflows/firestore-rules.yml`

## Test Coverage

### Auth & Profiles
- Pharmacy profile CRUD with role checks
- Courier profile CRUD with role checks
- Admin profile access restrictions

### Exchanges
- Create validation (location, status, ownership)
- State machine: `draft → pending → accepted → in_transit → completed`
- Immutable field protection (`proposedBy`, `location.cityId`)
- City-based filtering for broadcasts

### Deliveries
- Payment gate: couriers only see paid deliveries
- State machine: `pending → assigned → picked_up → in_transit → delivered`
- Pharmacy cancellation (before pickup only)
- Field-level payment update restrictions

### Wallet/Ledger
- Owner-only access
- Balance validation
- Ledger immutability (audit trail)

### Courier Earnings & Payouts
- Courier self-service restrictions
- Fraud prevention (totalWithdrawn can't decrease)
- Admin-only payout processing

## Troubleshooting

### Java not found
```
ERROR: Java 21 not found.
```
Install Java 21+ from https://adoptium.net/

### Port 8080 in use
```
Error: Could not start Firestore Emulator, port taken.
```
Kill the process using port 8080 or change port in `firebase.json`

### Tests timeout
Increase timeout in `jest.config.js`:
```js
testTimeout: 60000, // 60 seconds
```
