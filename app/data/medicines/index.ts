/**
 * Medicine Database Index
 *
 * Exports all medicine data organized by category.
 * Target: 3000+ medicines commonly used in sub-Saharan Africa
 *
 * Categories included:
 * - Antibiotics (35 entries)
 * - Antimalarials (22 entries)
 * - Analgesics & Antipyretics (28 entries)
 * - [More categories to be added]
 *
 * Total current entries: ~85
 * Remaining to reach 3000: ~2915 (will be added progressively)
 */

import { MedicineDatabaseEntry } from '../medicine-database.model';

// Import category data files
import { ANTIBIOTICS_DATA } from './antibiotics.data';
import { ANTIMALARIALS_DATA } from './antimalarials.data';
import { ANALGESICS_ANTIPYRETICS_DATA } from './analgesics-antipyretics.data';

/**
 * All medicines combined from all categories
 */
export const ALL_MEDICINES: MedicineDatabaseEntry[] = [
    ...ANTIBIOTICS_DATA,
    ...ANTIMALARIALS_DATA,
    ...ANALGESICS_ANTIPYRETICS_DATA,
    // Add more categories as they are created
];

/**
 * Medicines organized by category
 */
export const MEDICINES_BY_CATEGORY = {
    antibiotics: ANTIBIOTICS_DATA,
    antimalarials: ANTIMALARIALS_DATA,
    analgesics: ANALGESICS_ANTIPYRETICS_DATA.filter(m => m.category === 'analgesics'),
    antipyretics: ANALGESICS_ANTIPYRETICS_DATA.filter(m => m.category === 'antipyretics'),
    anti_inflammatory: ANALGESICS_ANTIPYRETICS_DATA.filter(m => m.category === 'anti_inflammatory'),
    // Add more categories as they are created
};

/**
 * Get medicine database statistics
 */
export function getMedicineDbStats(): {
    totalMedicines: number;
    byCategory: Record<string, number>;
    byRegion: Record<string, number>;
    essentialMedicines: number;
} {
    const stats = {
        totalMedicines: ALL_MEDICINES.length,
        byCategory: {} as Record<string, number>,
        byRegion: {} as Record<string, number>,
        essentialMedicines: 0,
    };

    // Count by category
    ALL_MEDICINES.forEach(med => {
        stats.byCategory[med.category] = (stats.byCategory[med.category] || 0) + 1;

        // Count by region
        med.availableRegions.forEach(region => {
            stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;
        });

        // Count essential medicines
        if (med.isEssentialMedicine) {
            stats.essentialMedicines++;
        }
    });

    return stats;
}

// Re-export category data for direct access
export { ANTIBIOTICS_DATA } from './antibiotics.data';
export { ANTIMALARIALS_DATA } from './antimalarials.data';
export { ANALGESICS_ANTIPYRETICS_DATA } from './analgesics-antipyretics.data';
