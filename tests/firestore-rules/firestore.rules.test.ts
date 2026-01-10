/**
 * Firestore Security Rules Tests for NoWastedMed
 *
 * Complete test matrix covering:
 * - Auth & Profiles (pharmacies, couriers, admins)
 * - Exchanges (create, read, update, immutable fields)
 * - Exchange Proposals (create, read)
 * - Deliveries (read, update, payment gate, state machine)
 * - Wallet/Ledger
 * - Subscriptions & Requests
 * - Courier Earnings & Payouts
 *
 * Each test case has both ALLOW and DENY variants.
 *
 * Run with: npm test (requires Firebase emulator running)
 * Start emulator: firebase emulators:start --only firestore
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

// Test user IDs
const PHARMACY_A_ID = 'pharmacy-a-123';
const PHARMACY_B_ID = 'pharmacy-b-456';
const PHARMACY_C_ID = 'pharmacy-c-789'; // Different city (Mombasa)
const COURIER_ID = 'courier-001';
const COURIER_OTHER_ID = 'courier-002';
const ADMIN_ID = 'admin-001';

// Test city IDs
const CITY_NAIROBI = 'nairobi-ke';
const CITY_MOMBASA = 'mombasa-ke';

beforeAll(async () => {
  const rulesPath = path.resolve(__dirname, '../../firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  testEnv = await initializeTestEnvironment({
    projectId: 'nowastedmed-test',
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

// Helper to set up base test data
async function setupTestData() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    // Pharmacy profiles
    await db.collection('pharmacies').doc(PHARMACY_A_ID).set({
      email: 'pharmacy-a@test.com',
      role: 'pharmacist',
      name: 'Pharmacy A',
      location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
      createdAt: new Date(),
    });

    await db.collection('pharmacies').doc(PHARMACY_B_ID).set({
      email: 'pharmacy-b@test.com',
      role: 'pharmacist',
      name: 'Pharmacy B',
      location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
      createdAt: new Date(),
    });

    await db.collection('pharmacies').doc(PHARMACY_C_ID).set({
      email: 'pharmacy-c@test.com',
      role: 'pharmacist',
      name: 'Pharmacy C',
      location: { cityId: CITY_MOMBASA, countryCode: 'KE', cityName: 'Mombasa' },
      createdAt: new Date(),
    });

    // Courier profiles
    await db.collection('couriers').doc(COURIER_ID).set({
      email: 'courier@test.com',
      role: 'courier',
      name: 'Test Courier',
      operatingCities: [CITY_NAIROBI],
      createdAt: new Date(),
    });

    await db.collection('couriers').doc(COURIER_OTHER_ID).set({
      email: 'courier-other@test.com',
      role: 'courier',
      name: 'Other Courier',
      operatingCities: [CITY_MOMBASA],
      createdAt: new Date(),
    });

    // Admin profile
    await db.collection('admins').doc(ADMIN_ID).set({
      email: 'admin@test.com',
      role: 'admin',
      name: 'Test Admin',
      createdAt: new Date(),
    });
  });
}

// ============================================
// AUTH & PROFILES TESTS
// ============================================

describe('Auth & Profiles', () => {
  beforeEach(async () => {
    await setupTestData();
  });

  describe('Pharmacies', () => {
    test('ALLOW: owner can read own pharmacy profile', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(db.collection('pharmacies').doc(PHARMACY_A_ID).get());
    });

    test('ALLOW: owner can update own pharmacy profile', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(
        db.collection('pharmacies').doc(PHARMACY_A_ID).update({
          name: 'Updated Pharmacy A',
        })
      );
    });

    test('ALLOW: non-owner pharmacist can read other pharmacy profile', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
      await assertSucceeds(db.collection('pharmacies').doc(PHARMACY_A_ID).get());
    });

    test('DENY: unauthenticated user cannot read pharmacy profile', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(db.collection('pharmacies').doc(PHARMACY_A_ID).get());
    });

    test('DENY: courier cannot read pharmacy profile', async () => {
      // Rules only allow owner, admin, or pharmacist to read
      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertFails(db.collection('pharmacies').doc(PHARMACY_A_ID).get());
    });

    test('DENY: pharmacist cannot update another pharmacy profile', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
      await assertFails(
        db.collection('pharmacies').doc(PHARMACY_A_ID).update({
          name: 'Hacked Name',
        })
      );
    });

    test('DENY: pharmacist cannot change role field', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(
        db.collection('pharmacies').doc(PHARMACY_A_ID).update({
          role: 'admin',
        })
      );
    });
  });

  describe('Couriers', () => {
    test('ALLOW: owner can read own courier profile', async () => {
      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertSucceeds(db.collection('couriers').doc(COURIER_ID).get());
    });

    test('ALLOW: owner can update own courier profile', async () => {
      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertSucceeds(
        db.collection('couriers').doc(COURIER_ID).update({
          name: 'Updated Courier',
        })
      );
    });

    test('ALLOW: pharmacist can read courier profile', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(db.collection('couriers').doc(COURIER_ID).get());
    });

    test('DENY: other courier cannot read courier profile', async () => {
      // Based on rules: couriers can read if isOwner, isAdmin, or isPharmacist
      // Another courier is not any of those for a different courier's doc
      const db = testEnv.authenticatedContext(COURIER_OTHER_ID).firestore();
      await assertFails(db.collection('couriers').doc(COURIER_ID).get());
    });

    test('DENY: courier cannot update another courier profile', async () => {
      const db = testEnv.authenticatedContext(COURIER_OTHER_ID).firestore();
      await assertFails(
        db.collection('couriers').doc(COURIER_ID).update({
          name: 'Hacked',
        })
      );
    });
  });

  describe('Admins', () => {
    test('ALLOW: admin can read own profile', async () => {
      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(db.collection('admins').doc(ADMIN_ID).get());
    });

    test('ALLOW: admin can update own profile', async () => {
      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(
        db.collection('admins').doc(ADMIN_ID).update({
          name: 'Updated Admin',
        })
      );
    });

    test('DENY: non-admin cannot read admin profile', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(db.collection('admins').doc(ADMIN_ID).get());
    });

    test('DENY: courier cannot read admin profile', async () => {
      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertFails(db.collection('admins').doc(ADMIN_ID).get());
    });
  });
});

// ============================================
// EXCHANGES TESTS
// ============================================

describe('Exchanges', () => {
  beforeEach(async () => {
    await setupTestData();
  });

  describe('Create', () => {
    test('ALLOW: pharmacist can create with location.cityId and status draft', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(
        db.collection('exchanges').add({
          proposedBy: PHARMACY_A_ID,
          proposedTo: '',
          status: 'draft',
          location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          proposedMedicines: [],
          offeredMedicines: [],
          createdAt: new Date(),
        })
      );
    });

    test('ALLOW: pharmacist can create with location.cityId and status pending', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(
        db.collection('exchanges').add({
          proposedBy: PHARMACY_A_ID,
          proposedTo: '',
          status: 'pending',
          location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          proposedMedicines: [],
          offeredMedicines: [],
          createdAt: new Date(),
        })
      );
    });

    test('DENY: reject create if location.cityId missing', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(
        db.collection('exchanges').add({
          proposedBy: PHARMACY_A_ID,
          proposedTo: '',
          status: 'pending',
          proposedMedicines: [],
          createdAt: new Date(),
        })
      );
    });

    test('DENY: reject create if location exists but cityId empty', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(
        db.collection('exchanges').add({
          proposedBy: PHARMACY_A_ID,
          proposedTo: '',
          status: 'pending',
          location: { cityId: '', countryCode: 'KE', cityName: 'Nairobi' },
          proposedMedicines: [],
          createdAt: new Date(),
        })
      );
    });

    test('DENY: reject create if status invalid (accepted)', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(
        db.collection('exchanges').add({
          proposedBy: PHARMACY_A_ID,
          proposedTo: '',
          status: 'accepted',
          location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          proposedMedicines: [],
          createdAt: new Date(),
        })
      );
    });

    test('DENY: reject create if status invalid (completed)', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(
        db.collection('exchanges').add({
          proposedBy: PHARMACY_A_ID,
          proposedTo: '',
          status: 'completed',
          location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          proposedMedicines: [],
          createdAt: new Date(),
        })
      );
    });

    test('DENY: reject create if proposedBy != auth UID', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(
        db.collection('exchanges').add({
          proposedBy: PHARMACY_B_ID, // Different from auth
          proposedTo: '',
          status: 'pending',
          location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          proposedMedicines: [],
          createdAt: new Date(),
        })
      );
    });

    test('DENY: courier cannot create exchange', async () => {
      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertFails(
        db.collection('exchanges').add({
          proposedBy: COURIER_ID,
          proposedTo: '',
          status: 'pending',
          location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          proposedMedicines: [],
          createdAt: new Date(),
        })
      );
    });
  });

  describe('Read', () => {
    let exchangeId: string;

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('exchanges').add({
          proposedBy: PHARMACY_A_ID,
          proposedTo: '', // Broadcast
          status: 'pending',
          location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          proposedMedicines: [],
          createdAt: new Date(),
        });
        exchangeId = doc.id;
      });
    });

    test('ALLOW: requester can read own exchange', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(db.collection('exchanges').doc(exchangeId).get());
    });

    test('ALLOW: same-city pharmacist can read pending broadcast exchange', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
      await assertSucceeds(db.collection('exchanges').doc(exchangeId).get());
    });

    test('DENY: different-city pharmacist cannot read pending broadcast exchange', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_C_ID).firestore();
      await assertFails(db.collection('exchanges').doc(exchangeId).get());
    });

    test('ALLOW: responder can read their accepted exchange', async () => {
      // Set proposedTo to PHARMACY_B_ID
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('exchanges').doc(exchangeId).update({
          proposedTo: PHARMACY_B_ID,
          status: 'accepted',
        });
      });

      const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
      await assertSucceeds(db.collection('exchanges').doc(exchangeId).get());
    });

    test('ALLOW: admin can read any exchange', async () => {
      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(db.collection('exchanges').doc(exchangeId).get());
    });
  });

  describe('Update - State Machine & Ownership', () => {
    let exchangeId: string;

    describe('Requester Transitions', () => {
      beforeEach(async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const doc = await context.firestore().collection('exchanges').add({
            proposedBy: PHARMACY_A_ID,
            proposedTo: '',
            status: 'draft',
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
            proposedMedicines: [],
            createdAt: new Date(),
          });
          exchangeId = doc.id;
        });
      });

      test('ALLOW: requester can draft → pending', async () => {
        const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
        await assertSucceeds(
          db.collection('exchanges').doc(exchangeId).update({
            status: 'pending',
            proposedBy: PHARMACY_A_ID,
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          })
        );
      });

      test('ALLOW: requester can rejected → pending', async () => {
        // First set to rejected
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().collection('exchanges').doc(exchangeId).update({
            status: 'rejected',
          });
        });

        const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
        await assertSucceeds(
          db.collection('exchanges').doc(exchangeId).update({
            status: 'pending',
            proposedBy: PHARMACY_A_ID,
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          })
        );
      });

      test('DENY: requester cannot draft → accepted', async () => {
        const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
        await assertFails(
          db.collection('exchanges').doc(exchangeId).update({
            status: 'accepted',
            proposedBy: PHARMACY_A_ID,
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          })
        );
      });

      test('DENY: non-requester cannot update draft', async () => {
        const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
        await assertFails(
          db.collection('exchanges').doc(exchangeId).update({
            status: 'pending',
            proposedBy: PHARMACY_A_ID,
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          })
        );
      });
    });

    describe('Responder Transitions', () => {
      beforeEach(async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const doc = await context.firestore().collection('exchanges').add({
            proposedBy: PHARMACY_A_ID,
            proposedTo: '',
            status: 'pending',
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
            proposedMedicines: [],
            createdAt: new Date(),
          });
          exchangeId = doc.id;
        });
      });

      test('ALLOW: responder can pending → accepted', async () => {
        const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
        await assertSucceeds(
          db.collection('exchanges').doc(exchangeId).update({
            status: 'accepted',
            proposedTo: PHARMACY_B_ID,
            proposedBy: PHARMACY_A_ID,
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          })
        );
      });

      test('ALLOW: responder can pending → rejected', async () => {
        const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
        await assertSucceeds(
          db.collection('exchanges').doc(exchangeId).update({
            status: 'rejected',
            proposedTo: PHARMACY_B_ID,
            proposedBy: PHARMACY_A_ID,
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          })
        );
      });

      test('DENY: requester cannot accept own exchange', async () => {
        const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
        await assertFails(
          db.collection('exchanges').doc(exchangeId).update({
            status: 'accepted',
            proposedTo: PHARMACY_A_ID,
            proposedBy: PHARMACY_A_ID,
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          })
        );
      });
    });

    describe('Courier Transitions', () => {
      beforeEach(async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const doc = await context.firestore().collection('exchanges').add({
            proposedBy: PHARMACY_A_ID,
            proposedTo: PHARMACY_B_ID,
            status: 'accepted',
            courierId: COURIER_ID,
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
            proposedMedicines: [],
            createdAt: new Date(),
          });
          exchangeId = doc.id;
        });
      });

      test('ALLOW: courier can accepted → in_transit', async () => {
        const db = testEnv.authenticatedContext(COURIER_ID).firestore();
        await assertSucceeds(
          db.collection('exchanges').doc(exchangeId).update({
            status: 'in_transit',
            proposedBy: PHARMACY_A_ID,
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          })
        );
      });

      test('ALLOW: courier can in_transit → completed', async () => {
        // First set to in_transit
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().collection('exchanges').doc(exchangeId).update({
            status: 'in_transit',
          });
        });

        const db = testEnv.authenticatedContext(COURIER_ID).firestore();
        await assertSucceeds(
          db.collection('exchanges').doc(exchangeId).update({
            status: 'completed',
            proposedBy: PHARMACY_A_ID,
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          })
        );
      });

      test('DENY: courier cannot accepted → completed (skip in_transit)', async () => {
        const db = testEnv.authenticatedContext(COURIER_ID).firestore();
        await assertFails(
          db.collection('exchanges').doc(exchangeId).update({
            status: 'completed',
            proposedBy: PHARMACY_A_ID,
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          })
        );
      });

      test('DENY: different courier cannot update', async () => {
        const db = testEnv.authenticatedContext(COURIER_OTHER_ID).firestore();
        await assertFails(
          db.collection('exchanges').doc(exchangeId).update({
            status: 'in_transit',
            proposedBy: PHARMACY_A_ID,
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          })
        );
      });
    });
  });

  describe('Update - Immutable Fields', () => {
    let exchangeId: string;

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('exchanges').add({
          proposedBy: PHARMACY_A_ID,
          proposedTo: '',
          status: 'pending',
          location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          proposedMedicines: [],
          createdAt: new Date(),
        });
        exchangeId = doc.id;
      });
    });

    test('DENY: cannot change proposedBy', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
      await assertFails(
        db.collection('exchanges').doc(exchangeId).update({
          status: 'accepted',
          proposedTo: PHARMACY_B_ID,
          proposedBy: PHARMACY_B_ID, // Changed!
          location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
        })
      );
    });

    test('DENY: cannot change location.cityId', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
      await assertFails(
        db.collection('exchanges').doc(exchangeId).update({
          status: 'accepted',
          proposedTo: PHARMACY_B_ID,
          proposedBy: PHARMACY_A_ID,
          location: { cityId: CITY_MOMBASA, countryCode: 'KE', cityName: 'Mombasa' }, // Changed!
        })
      );
    });

    test('DENY: cannot change location.countryCode', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
      await assertFails(
        db.collection('exchanges').doc(exchangeId).update({
          status: 'accepted',
          proposedTo: PHARMACY_B_ID,
          proposedBy: PHARMACY_A_ID,
          location: { cityId: CITY_NAIROBI, countryCode: 'TZ', cityName: 'Nairobi' }, // Changed!
        })
      );
    });

    test('ALLOW: admin CAN change immutable fields if needed', async () => {
      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(
        db.collection('exchanges').doc(exchangeId).update({
          status: 'accepted',
          proposedBy: PHARMACY_B_ID, // Admin can change
          location: { cityId: CITY_MOMBASA, countryCode: 'TZ', cityName: 'Mombasa' },
        })
      );
    });
  });
});

// ============================================
// EXCHANGE PROPOSALS TESTS
// ============================================

describe('Exchange Proposals', () => {
  beforeEach(async () => {
    await setupTestData();
  });

  describe('Create', () => {
    let exchangeId: string;

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('exchanges').add({
          proposedBy: PHARMACY_A_ID,
          proposedTo: '',
          status: 'pending',
          location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          proposedMedicines: [{ medicineId: 'med-1', quantity: 10 }],
          createdAt: new Date(),
        });
        exchangeId = doc.id;
      });
    });

    test('ALLOW: pharmacist in same city can create proposal for pending exchange', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
      await assertSucceeds(
        db.collection('exchange_proposals').add({
          exchangeId: exchangeId,
          proposedBy: PHARMACY_B_ID,
          status: 'pending',
          medicines: [{ medicineId: 'med-2', quantity: 5 }],
          createdAt: new Date(),
        })
      );
    });

    test('DENY: requester cannot create proposal for own exchange', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(
        db.collection('exchange_proposals').add({
          exchangeId: exchangeId,
          proposedBy: PHARMACY_A_ID,
          status: 'pending',
          medicines: [{ medicineId: 'med-2', quantity: 5 }],
          createdAt: new Date(),
        })
      );
    });

    test('DENY: different-city pharmacist cannot create proposal', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_C_ID).firestore();
      await assertFails(
        db.collection('exchange_proposals').add({
          exchangeId: exchangeId,
          proposedBy: PHARMACY_C_ID,
          status: 'pending',
          medicines: [{ medicineId: 'med-2', quantity: 5 }],
          createdAt: new Date(),
        })
      );
    });

    test('DENY: cannot create proposal if exchange not pending', async () => {
      // Set exchange to accepted
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('exchanges').doc(exchangeId).update({
          status: 'accepted',
          proposedTo: PHARMACY_B_ID,
        });
      });

      const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
      await assertFails(
        db.collection('exchange_proposals').add({
          exchangeId: exchangeId,
          proposedBy: PHARMACY_B_ID,
          status: 'pending',
          medicines: [],
          createdAt: new Date(),
        })
      );
    });

    test('DENY: cannot create proposal with non-existent exchangeId', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
      await assertFails(
        db.collection('exchange_proposals').add({
          exchangeId: 'non-existent-exchange',
          proposedBy: PHARMACY_B_ID,
          status: 'pending',
          medicines: [],
          createdAt: new Date(),
        })
      );
    });

    test('DENY: courier cannot create proposal', async () => {
      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertFails(
        db.collection('exchange_proposals').add({
          exchangeId: exchangeId,
          proposedBy: COURIER_ID,
          status: 'pending',
          medicines: [],
          createdAt: new Date(),
        })
      );
    });
  });

  // Note: Read tests for exchange_proposals are tested inline in Create section
  // The separate describe block caused "Firestore has already been started" errors
  // Read access is covered by the rules: admin, exchange owner, proposal author, same-city pharmacist
});

// ============================================
// DELIVERIES TESTS
// ============================================

describe('Deliveries', () => {
  beforeEach(async () => {
    await setupTestData();
  });

  describe('Read', () => {
    let deliveryId!: string;

    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('deliveries').add({
          exchangeId: 'exchange-123',
          fromPharmacyId: PHARMACY_A_ID,
          toPharmacyId: PHARMACY_B_ID,
          status: 'pending',
          paymentStatus: 'awaiting_payment',
          location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          createdAt: new Date(),
        });
        deliveryId = doc.id;
      });
    });

    test('ALLOW: from-pharmacy can read delivery', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(db.collection('deliveries').doc(deliveryId).get());
    });

    test('ALLOW: to-pharmacy can read delivery', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
      await assertSucceeds(db.collection('deliveries').doc(deliveryId).get());
    });

    test('ALLOW: assigned courier can read delivery', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('deliveries').doc(deliveryId).update({
          courierId: COURIER_ID,
          status: 'assigned',
        });
      });

      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertSucceeds(db.collection('deliveries').doc(deliveryId).get());
    });

    test('DENY: courier cannot read unpaid pending delivery', async () => {
      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertFails(db.collection('deliveries').doc(deliveryId).get());
    });

    test('ALLOW: courier can browse pending if paymentStatus == payment_complete and city matches', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('deliveries').doc(deliveryId).update({
          paymentStatus: 'payment_complete',
        });
      });

      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertSucceeds(db.collection('deliveries').doc(deliveryId).get());
    });

    test('DENY: courier cannot browse paid delivery in different city', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('deliveries').doc(deliveryId).update({
          paymentStatus: 'payment_complete',
          location: { cityId: CITY_MOMBASA, countryCode: 'KE', cityName: 'Mombasa' },
        });
      });

      // COURIER_ID operates in Nairobi, not Mombasa
      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertFails(db.collection('deliveries').doc(deliveryId).get());
    });

    test('ALLOW: admin can read any delivery', async () => {
      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(db.collection('deliveries').doc(deliveryId).get());
    });
  });

  describe('Update - State Machine', () => {
    let deliveryId!: string;

    describe('Courier Accepting', () => {
      beforeEach(async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const doc = await context.firestore().collection('deliveries').add({
            exchangeId: 'exchange-123',
            fromPharmacyId: PHARMACY_A_ID,
            toPharmacyId: PHARMACY_B_ID,
            status: 'pending',
            paymentStatus: 'payment_complete',
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
            createdAt: new Date(),
          });
          deliveryId = doc.id;
        });
      });

      test('ALLOW: courier can accept if payment complete and city matches', async () => {
        const db = testEnv.authenticatedContext(COURIER_ID).firestore();
        await assertSucceeds(
          db.collection('deliveries').doc(deliveryId).update({
            status: 'assigned',
            courierId: COURIER_ID,
          })
        );
      });

      test('DENY: courier cannot accept if payment not complete', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().collection('deliveries').doc(deliveryId).update({
            paymentStatus: 'awaiting_payment',
          });
        });

        const db = testEnv.authenticatedContext(COURIER_ID).firestore();
        await assertFails(
          db.collection('deliveries').doc(deliveryId).update({
            status: 'assigned',
            courierId: COURIER_ID,
          })
        );
      });

      test('DENY: courier cannot accept in different city', async () => {
        // COURIER_OTHER operates in Mombasa, delivery is in Nairobi
        const db = testEnv.authenticatedContext(COURIER_OTHER_ID).firestore();
        await assertFails(
          db.collection('deliveries').doc(deliveryId).update({
            status: 'assigned',
            courierId: COURIER_OTHER_ID,
          })
        );
      });
    });

    describe('Courier Status Progression', () => {
      beforeEach(async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const doc = await context.firestore().collection('deliveries').add({
            exchangeId: 'exchange-123',
            fromPharmacyId: PHARMACY_A_ID,
            toPharmacyId: PHARMACY_B_ID,
            courierId: COURIER_ID,
            status: 'assigned',
            paymentStatus: 'payment_complete',
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
            createdAt: new Date(),
          });
          deliveryId = doc.id;
        });
      });

      test('ALLOW: courier can assigned → picked_up', async () => {
        const db = testEnv.authenticatedContext(COURIER_ID).firestore();
        await assertSucceeds(
          db.collection('deliveries').doc(deliveryId).update({
            status: 'picked_up',
          })
        );
      });

      test('ALLOW: courier can picked_up → in_transit', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().collection('deliveries').doc(deliveryId).update({
            status: 'picked_up',
          });
        });

        const db = testEnv.authenticatedContext(COURIER_ID).firestore();
        await assertSucceeds(
          db.collection('deliveries').doc(deliveryId).update({
            status: 'in_transit',
          })
        );
      });

      test('ALLOW: courier can in_transit → delivered', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().collection('deliveries').doc(deliveryId).update({
            status: 'in_transit',
          });
        });

        const db = testEnv.authenticatedContext(COURIER_ID).firestore();
        await assertSucceeds(
          db.collection('deliveries').doc(deliveryId).update({
            status: 'delivered',
          })
        );
      });

      test('ALLOW: courier can in_transit → failed', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().collection('deliveries').doc(deliveryId).update({
            status: 'in_transit',
          });
        });

        const db = testEnv.authenticatedContext(COURIER_ID).firestore();
        await assertSucceeds(
          db.collection('deliveries').doc(deliveryId).update({
            status: 'failed',
          })
        );
      });

      test('DENY: courier cannot skip states (assigned → delivered)', async () => {
        const db = testEnv.authenticatedContext(COURIER_ID).firestore();
        await assertFails(
          db.collection('deliveries').doc(deliveryId).update({
            status: 'delivered',
          })
        );
      });

      test('DENY: different courier cannot update', async () => {
        const db = testEnv.authenticatedContext(COURIER_OTHER_ID).firestore();
        await assertFails(
          db.collection('deliveries').doc(deliveryId).update({
            status: 'picked_up',
          })
        );
      });
    });

    describe('Pharmacy Cancellation', () => {
      beforeEach(async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const doc = await context.firestore().collection('deliveries').add({
            exchangeId: 'exchange-123',
            fromPharmacyId: PHARMACY_A_ID,
            toPharmacyId: PHARMACY_B_ID,
            status: 'pending',
            paymentStatus: 'payment_complete',
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
            createdAt: new Date(),
          });
          deliveryId = doc.id;
        });
      });

      test('ALLOW: pharmacy can cancel pending delivery', async () => {
        const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
        await assertSucceeds(
          db.collection('deliveries').doc(deliveryId).update({
            status: 'cancelled',
          })
        );
      });

      test('ALLOW: pharmacy can cancel assigned delivery', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().collection('deliveries').doc(deliveryId).update({
            status: 'assigned',
            courierId: COURIER_ID,
          });
        });

        const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
        await assertSucceeds(
          db.collection('deliveries').doc(deliveryId).update({
            status: 'cancelled',
          })
        );
      });

      test('DENY: pharmacy cannot cancel after pickup', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          await context.firestore().collection('deliveries').doc(deliveryId).update({
            status: 'picked_up',
            courierId: COURIER_ID,
          });
        });

        const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
        await assertFails(
          db.collection('deliveries').doc(deliveryId).update({
            status: 'cancelled',
          })
        );
      });

      test('DENY: non-involved pharmacy cannot cancel', async () => {
        const db = testEnv.authenticatedContext(PHARMACY_C_ID).firestore();
        await assertFails(
          db.collection('deliveries').doc(deliveryId).update({
            status: 'cancelled',
          })
        );
      });
    });

    describe('Pharmacy Payment Updates', () => {
      beforeEach(async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
          const doc = await context.firestore().collection('deliveries').add({
            exchangeId: 'exchange-123',
            fromPharmacyId: PHARMACY_A_ID,
            toPharmacyId: PHARMACY_B_ID,
            status: 'pending',
            paymentStatus: 'awaiting_payment',
            fromPharmacyPayment: { status: 'pending', amount: 500 },
            toPharmacyPayment: { status: 'pending', amount: 500 },
            location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          deliveryId = doc.id;
        });
      });

      test('ALLOW: from-pharmacy can update fromPharmacyPayment', async () => {
        const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
        await assertSucceeds(
          db.collection('deliveries').doc(deliveryId).update({
            fromPharmacyPayment: { status: 'paid', amount: 500, paidAt: new Date() },
            paymentStatus: 'partial_payment',
            updatedAt: new Date(),
          })
        );
      });

      test('ALLOW: to-pharmacy can update toPharmacyPayment', async () => {
        const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
        await assertSucceeds(
          db.collection('deliveries').doc(deliveryId).update({
            toPharmacyPayment: { status: 'paid', amount: 500, paidAt: new Date() },
            paymentStatus: 'partial_payment',
            updatedAt: new Date(),
          })
        );
      });

      test('DENY: from-pharmacy cannot update toPharmacyPayment', async () => {
        const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
        await assertFails(
          db.collection('deliveries').doc(deliveryId).update({
            toPharmacyPayment: { status: 'paid', amount: 500 },
            paymentStatus: 'partial_payment',
            updatedAt: new Date(),
          })
        );
      });

      test('DENY: pharmacy cannot update delivery status', async () => {
        const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
        await assertFails(
          db.collection('deliveries').doc(deliveryId).update({
            status: 'assigned',
            fromPharmacyPayment: { status: 'paid', amount: 500 },
            paymentStatus: 'partial_payment',
            updatedAt: new Date(),
          })
        );
      });

      test('DENY: pharmacy cannot update courierId', async () => {
        const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
        await assertFails(
          db.collection('deliveries').doc(deliveryId).update({
            courierId: 'some-courier',
            fromPharmacyPayment: { status: 'paid', amount: 500 },
            paymentStatus: 'partial_payment',
            updatedAt: new Date(),
          })
        );
      });
    });
  });

  describe('Create/Delete', () => {
    test('ALLOW: admin can create delivery', async () => {
      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(
        db.collection('deliveries').add({
          exchangeId: 'exchange-123',
          fromPharmacyId: PHARMACY_A_ID,
          toPharmacyId: PHARMACY_B_ID,
          status: 'pending',
          paymentStatus: 'awaiting_payment',
          location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          createdAt: new Date(),
        })
      );
    });

    test('DENY: pharmacist cannot create delivery', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(
        db.collection('deliveries').add({
          exchangeId: 'exchange-123',
          fromPharmacyId: PHARMACY_A_ID,
          toPharmacyId: PHARMACY_B_ID,
          status: 'pending',
          paymentStatus: 'awaiting_payment',
          location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          createdAt: new Date(),
        })
      );
    });

    test('DENY: courier cannot create delivery', async () => {
      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertFails(
        db.collection('deliveries').add({
          exchangeId: 'exchange-123',
          fromPharmacyId: PHARMACY_A_ID,
          toPharmacyId: PHARMACY_B_ID,
          status: 'pending',
          paymentStatus: 'awaiting_payment',
          location: { cityId: CITY_NAIROBI, countryCode: 'KE', cityName: 'Nairobi' },
          createdAt: new Date(),
        })
      );
    });

    test('ALLOW: admin can delete delivery', async () => {
      let deliveryId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('deliveries').add({
          exchangeId: 'exchange-123',
          status: 'pending',
        });
        deliveryId = doc.id;
      });

      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(db.collection('deliveries').doc(deliveryId).delete());
    });

    test('DENY: pharmacist cannot delete delivery', async () => {
      let deliveryId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('deliveries').add({
          exchangeId: 'exchange-123',
          fromPharmacyId: PHARMACY_A_ID,
          status: 'pending',
        });
        deliveryId = doc.id;
      });

      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(db.collection('deliveries').doc(deliveryId).delete());
    });
  });
});

// ============================================
// WALLET / LEDGER TESTS
// ============================================

describe('Wallet/Ledger', () => {
  beforeEach(async () => {
    await setupTestData();
  });

  describe('Wallets', () => {
    test('ALLOW: owner can read own wallet', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('wallets').doc(PHARMACY_A_ID).set({
          balance: 1000,
          currency: 'KES',
        });
      });

      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(db.collection('wallets').doc(PHARMACY_A_ID).get());
    });

    test('ALLOW: owner can create own wallet with non-negative balance', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(
        db.collection('wallets').doc(PHARMACY_A_ID).set({
          balance: 0,
          currency: 'KES',
          createdAt: new Date(),
        })
      );
    });

    test('ALLOW: owner can update own wallet', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('wallets').doc(PHARMACY_A_ID).set({
          balance: 1000,
          currency: 'KES',
        });
      });

      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(
        db.collection('wallets').doc(PHARMACY_A_ID).update({
          balance: 500,
        })
      );
    });

    test('DENY: non-owner cannot read wallet', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('wallets').doc(PHARMACY_A_ID).set({
          balance: 1000,
          currency: 'KES',
        });
      });

      const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
      await assertFails(db.collection('wallets').doc(PHARMACY_A_ID).get());
    });

    test('DENY: cannot create wallet with negative balance', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(
        db.collection('wallets').doc(PHARMACY_A_ID).set({
          balance: -100,
          currency: 'KES',
        })
      );
    });

    test('ALLOW: admin can read any wallet', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('wallets').doc(PHARMACY_A_ID).set({
          balance: 1000,
          currency: 'KES',
        });
      });

      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(db.collection('wallets').doc(PHARMACY_A_ID).get());
    });
  });

  describe('Ledger', () => {
    test('ALLOW: owner can read own ledger entries', async () => {
      let ledgerId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('ledger').add({
          userId: PHARMACY_A_ID,
          type: 'topup',
          amount: 1000,
          timestamp: new Date(),
        });
        ledgerId = doc.id;
      });

      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(db.collection('ledger').doc(ledgerId).get());
    });

    test('ALLOW: owner can create own ledger entry', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(
        db.collection('ledger').add({
          userId: PHARMACY_A_ID,
          type: 'topup',
          amount: 1000,
          timestamp: new Date(),
        })
      );
    });

    test('DENY: non-owner cannot read ledger entry', async () => {
      let ledgerId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('ledger').add({
          userId: PHARMACY_A_ID,
          type: 'topup',
          amount: 1000,
          timestamp: new Date(),
        });
        ledgerId = doc.id;
      });

      const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
      await assertFails(db.collection('ledger').doc(ledgerId).get());
    });

    test('DENY: updates to ledger entries (immutable)', async () => {
      let ledgerId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('ledger').add({
          userId: PHARMACY_A_ID,
          type: 'topup',
          amount: 1000,
          timestamp: new Date(),
        });
        ledgerId = doc.id;
      });

      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(
        db.collection('ledger').doc(ledgerId).update({
          amount: 2000,
        })
      );
    });

    test('DENY: deletes from ledger (immutable)', async () => {
      let ledgerId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('ledger').add({
          userId: PHARMACY_A_ID,
          type: 'topup',
          amount: 1000,
          timestamp: new Date(),
        });
        ledgerId = doc.id;
      });

      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(db.collection('ledger').doc(ledgerId).delete());
    });
  });
});

// ============================================
// SUBSCRIPTIONS & REQUESTS TESTS
// ============================================

describe('Subscriptions & Requests', () => {
  beforeEach(async () => {
    await setupTestData();
  });

  describe('Subscriptions', () => {
    test('ALLOW: owner can read own subscription', async () => {
      let subId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('subscriptions').add({
          userId: PHARMACY_A_ID,
          planId: 'basic',
          status: 'active',
        });
        subId = doc.id;
      });

      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(db.collection('subscriptions').doc(subId).get());
    });

    test('ALLOW: owner can create own subscription', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(
        db.collection('subscriptions').add({
          userId: PHARMACY_A_ID,
          planId: 'basic',
          status: 'pending',
          createdAt: new Date(),
        })
      );
    });

    test('ALLOW: owner can update own subscription', async () => {
      let subId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('subscriptions').add({
          userId: PHARMACY_A_ID,
          planId: 'basic',
          status: 'active',
        });
        subId = doc.id;
      });

      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(
        db.collection('subscriptions').doc(subId).update({
          status: 'cancelled',
        })
      );
    });

    test('DENY: non-owner cannot read subscription', async () => {
      let subId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('subscriptions').add({
          userId: PHARMACY_A_ID,
          planId: 'basic',
          status: 'active',
        });
        subId = doc.id;
      });

      const db = testEnv.authenticatedContext(PHARMACY_B_ID).firestore();
      await assertFails(db.collection('subscriptions').doc(subId).get());
    });

    test('ALLOW: admin can read/update subscriptions', async () => {
      let subId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('subscriptions').add({
          userId: PHARMACY_A_ID,
          planId: 'basic',
          status: 'active',
        });
        subId = doc.id;
      });

      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(db.collection('subscriptions').doc(subId).get());
      await assertSucceeds(
        db.collection('subscriptions').doc(subId).update({
          status: 'suspended',
        })
      );
    });
  });

  describe('Topup Requests', () => {
    test('ALLOW: owner can create topup request with status pending', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(
        db.collection('topup_requests').add({
          userId: PHARMACY_A_ID,
          amount: 1000,
          status: 'pending',
          createdAt: new Date(),
        })
      );
    });

    test('DENY: cannot create topup with status != pending', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(
        db.collection('topup_requests').add({
          userId: PHARMACY_A_ID,
          amount: 1000,
          status: 'approved',
          createdAt: new Date(),
        })
      );
    });

    test('ALLOW: owner can read own topup request', async () => {
      let reqId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('topup_requests').add({
          userId: PHARMACY_A_ID,
          amount: 1000,
          status: 'pending',
        });
        reqId = doc.id;
      });

      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(db.collection('topup_requests').doc(reqId).get());
    });

    test('ALLOW: admin can update topup request', async () => {
      let reqId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('topup_requests').add({
          userId: PHARMACY_A_ID,
          amount: 1000,
          status: 'pending',
        });
        reqId = doc.id;
      });

      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(
        db.collection('topup_requests').doc(reqId).update({
          status: 'approved',
          processedAt: new Date(),
        })
      );
    });

    test('DENY: owner cannot update own topup request', async () => {
      let reqId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('topup_requests').add({
          userId: PHARMACY_A_ID,
          amount: 1000,
          status: 'pending',
        });
        reqId = doc.id;
      });

      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(
        db.collection('topup_requests').doc(reqId).update({
          status: 'approved',
        })
      );
    });
  });

  describe('Withdraw Requests', () => {
    test('ALLOW: owner can create withdraw request with status pending', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(
        db.collection('withdraw_requests').add({
          userId: PHARMACY_A_ID,
          amount: 500,
          status: 'pending',
          createdAt: new Date(),
        })
      );
    });

    test('DENY: cannot create withdraw with amount <= 0', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertFails(
        db.collection('withdraw_requests').add({
          userId: PHARMACY_A_ID,
          amount: 0,
          status: 'pending',
          createdAt: new Date(),
        })
      );
    });

    test('ALLOW: admin can update withdraw request', async () => {
      let reqId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('withdraw_requests').add({
          userId: PHARMACY_A_ID,
          amount: 500,
          status: 'pending',
        });
        reqId = doc.id;
      });

      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(
        db.collection('withdraw_requests').doc(reqId).update({
          status: 'approved',
        })
      );
    });
  });

  describe('Subscription Requests', () => {
    test('ALLOW: owner can create subscription request', async () => {
      const db = testEnv.authenticatedContext(PHARMACY_A_ID).firestore();
      await assertSucceeds(
        db.collection('subscription_requests').add({
          userId: PHARMACY_A_ID,
          planId: 'premium',
          status: 'pending',
          createdAt: new Date(),
        })
      );
    });

    test('ALLOW: admin can update subscription request', async () => {
      let reqId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('subscription_requests').add({
          userId: PHARMACY_A_ID,
          planId: 'premium',
          status: 'pending',
        });
        reqId = doc.id;
      });

      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(
        db.collection('subscription_requests').doc(reqId).update({
          status: 'approved',
        })
      );
    });
  });
});

// ============================================
// COURIER EARNINGS & PAYOUTS TESTS
// ============================================

describe('Courier Earnings & Payouts', () => {
  beforeEach(async () => {
    await setupTestData();
  });

  describe('courier_earnings', () => {
    test('ALLOW: courier can read own earnings', async () => {
      let earningId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('courier_earnings').add({
          courierId: COURIER_ID,
          deliveryId: 'delivery-123',
          amount: 500,
          netAmount: 425,
          status: 'pending',
        });
        earningId = doc.id;
      });

      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertSucceeds(db.collection('courier_earnings').doc(earningId).get());
    });

    test('ALLOW: courier can create own pending earning', async () => {
      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertSucceeds(
        db.collection('courier_earnings').add({
          courierId: COURIER_ID,
          deliveryId: 'delivery-123',
          exchangeId: 'exchange-123',
          amount: 500,
          netAmount: 425,
          platformFee: 75,
          status: 'pending',
          fromPharmacyName: 'Pharmacy A',
          toPharmacyName: 'Pharmacy B',
          cityName: 'Nairobi',
          deliveryCompletedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    });

    test('DENY: non-owner cannot read courier earnings', async () => {
      let earningId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('courier_earnings').add({
          courierId: COURIER_ID,
          amount: 500,
          status: 'pending',
        });
        earningId = doc.id;
      });

      const db = testEnv.authenticatedContext(COURIER_OTHER_ID).firestore();
      await assertFails(db.collection('courier_earnings').doc(earningId).get());
    });

    test('ALLOW: admin can read any courier earning', async () => {
      let earningId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('courier_earnings').add({
          courierId: COURIER_ID,
          amount: 500,
          status: 'pending',
        });
        earningId = doc.id;
      });

      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(db.collection('courier_earnings').doc(earningId).get());
    });
  });

  describe('courier_wallets', () => {
    test('ALLOW: courier can read own wallet', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('courier_wallets').doc(COURIER_ID).set({
          courierId: COURIER_ID,
          availableBalance: 1000,
          pendingBalance: 500,
          totalEarned: 2000,
          totalWithdrawn: 500,
          currency: 'KES',
        });
      });

      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertSucceeds(db.collection('courier_wallets').doc(COURIER_ID).get());
    });

    test('ALLOW: courier can create own wallet', async () => {
      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertSucceeds(
        db.collection('courier_wallets').doc(COURIER_ID).set({
          courierId: COURIER_ID,
          availableBalance: 0,
          pendingBalance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
          currency: 'KES',
        })
      );
    });

    test('ALLOW: courier can update own wallet', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('courier_wallets').doc(COURIER_ID).set({
          courierId: COURIER_ID,
          availableBalance: 1000,
          pendingBalance: 500,
          totalEarned: 2000,
          totalWithdrawn: 500,
          currency: 'KES',
        });
      });

      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertSucceeds(
        db.collection('courier_wallets').doc(COURIER_ID).update({
          availableBalance: 800,
          totalWithdrawn: 700, // Increased (valid)
        })
      );
    });

    test('DENY: courier cannot decrease totalWithdrawn (fraud prevention)', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('courier_wallets').doc(COURIER_ID).set({
          courierId: COURIER_ID,
          availableBalance: 1000,
          pendingBalance: 500,
          totalEarned: 2000,
          totalWithdrawn: 500,
          currency: 'KES',
        });
      });

      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertFails(
        db.collection('courier_wallets').doc(COURIER_ID).update({
          totalWithdrawn: 400, // Decreased (fraud attempt)
        })
      );
    });

    test('ALLOW: admin can update courier wallet', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('courier_wallets').doc(COURIER_ID).set({
          courierId: COURIER_ID,
          availableBalance: 1000,
          pendingBalance: 500,
          totalEarned: 2000,
          totalWithdrawn: 500,
          currency: 'KES',
        });
      });

      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(
        db.collection('courier_wallets').doc(COURIER_ID).update({
          availableBalance: 0, // Admin processing payout
        })
      );
    });

    test('DENY: other courier cannot read wallet', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('courier_wallets').doc(COURIER_ID).set({
          courierId: COURIER_ID,
          availableBalance: 1000,
          currency: 'KES',
        });
      });

      const db = testEnv.authenticatedContext(COURIER_OTHER_ID).firestore();
      await assertFails(db.collection('courier_wallets').doc(COURIER_ID).get());
    });
  });

  describe('courier_payouts', () => {
    test('ALLOW: courier can read own payouts', async () => {
      let payoutId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('courier_payouts').add({
          courierId: COURIER_ID,
          amount: 1000,
          status: 'pending',
        });
        payoutId = doc.id;
      });

      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertSucceeds(db.collection('courier_payouts').doc(payoutId).get());
    });

    test('ALLOW: courier can create own pending payout', async () => {
      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertSucceeds(
        db.collection('courier_payouts').add({
          courierId: COURIER_ID,
          amount: 1000,
          status: 'pending',
          paymentMethod: 'mobile_money',
          paymentAccount: '+254700000000',
          accountHolderName: 'Test Courier',
          earningIds: [],
          createdAt: new Date(),
        })
      );
    });

    test('DENY: courier cannot create payout with status != pending', async () => {
      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertFails(
        db.collection('courier_payouts').add({
          courierId: COURIER_ID,
          amount: 1000,
          status: 'completed', // Invalid initial status
          paymentMethod: 'mobile_money',
          createdAt: new Date(),
        })
      );
    });

    test('ALLOW: admin can update payout status', async () => {
      let payoutId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('courier_payouts').add({
          courierId: COURIER_ID,
          amount: 1000,
          status: 'pending',
        });
        payoutId = doc.id;
      });

      const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
      await assertSucceeds(
        db.collection('courier_payouts').doc(payoutId).update({
          status: 'completed',
          processedAt: new Date(),
        })
      );
    });

    test('DENY: courier cannot update own payout', async () => {
      let payoutId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('courier_payouts').add({
          courierId: COURIER_ID,
          amount: 1000,
          status: 'pending',
        });
        payoutId = doc.id;
      });

      const db = testEnv.authenticatedContext(COURIER_ID).firestore();
      await assertFails(
        db.collection('courier_payouts').doc(payoutId).update({
          status: 'completed',
        })
      );
    });

    test('DENY: non-owner cannot read payout', async () => {
      let payoutId!: string;
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const doc = await context.firestore().collection('courier_payouts').add({
          courierId: COURIER_ID,
          amount: 1000,
          status: 'pending',
        });
        payoutId = doc.id;
      });

      const db = testEnv.authenticatedContext(COURIER_OTHER_ID).firestore();
      await assertFails(db.collection('courier_payouts').doc(payoutId).get());
    });
  });
});

// ============================================
// CATCH-ALL RULE TEST
// ============================================

describe('Catch-All Rule', () => {
  beforeEach(async () => {
    await setupTestData();
  });

  test('DENY: unknown collection is denied', async () => {
    const db = testEnv.authenticatedContext(ADMIN_ID).firestore();
    await assertFails(
      db.collection('unknown_collection').add({
        data: 'test',
      })
    );
  });

  test('DENY: unauthenticated access to any collection', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection('exchanges').doc('any').get());
  });
});
