/**
 * Medicine Database Service
 *
 * Provides search, filtering, and lookup functionality for the medicine database.
 * Supports multi-language search and regional filtering.
 */

import { Observable } from '@nativescript/core';
import {
    MedicineDatabaseEntry,
    MedicineSearchResult,
    MedicineFilterOptions,
    MedicineCategory,
    MedicineForm,
    AfricanRegion,
    SupportedLanguage,
    getFormDisplayName,
    getCategoryDisplayName
} from '../data/medicine-database.model';
import { ALL_MEDICINES, getMedicineDbStats } from '../data/medicines';

export class MedicineDatabaseService extends Observable {
    private static instance: MedicineDatabaseService;
    private medicines: MedicineDatabaseEntry[] = ALL_MEDICINES;
    private currentLanguage: SupportedLanguage = 'fr'; // Default to French
    private currentRegion: AfricanRegion = 'west_africa_francophone'; // Default region

    private constructor() {
        super();
    }

    static getInstance(): MedicineDatabaseService {
        if (!MedicineDatabaseService.instance) {
            MedicineDatabaseService.instance = new MedicineDatabaseService();
        }
        return MedicineDatabaseService.instance;
    }

    /**
     * Set the current language for search and display
     */
    setLanguage(language: SupportedLanguage): void {
        this.currentLanguage = language;
    }

    /**
     * Get the current language
     */
    getLanguage(): SupportedLanguage {
        return this.currentLanguage;
    }

    /**
     * Set the current region for filtering
     */
    setRegion(region: AfricanRegion): void {
        this.currentRegion = region;
    }

    /**
     * Get the current region
     */
    getRegion(): AfricanRegion {
        return this.currentRegion;
    }

    /**
     * Get database statistics
     */
    getStats() {
        return getMedicineDbStats();
    }

    /**
     * Search medicines by text (name, INN, brand, keywords)
     * Searches in the current language
     */
    search(query: string, options?: MedicineFilterOptions): MedicineSearchResult[] {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const searchTerm = query.toLowerCase().trim();
        const language = options?.language || this.currentLanguage;
        const region = options?.region || this.currentRegion;

        let results = this.medicines.filter(med => {
            // Filter by region if specified
            if (region && !med.availableRegions.includes(region)) {
                return false;
            }

            // Filter by category if specified
            if (options?.category && med.category !== options.category) {
                return false;
            }

            // Filter by form if specified
            if (options?.form && med.form !== options.form) {
                return false;
            }

            // Filter by prescription required if specified
            if (options?.prescriptionRequired !== undefined && med.prescriptionRequired !== options.prescriptionRequired) {
                return false;
            }

            // Filter by essential medicine if specified
            if (options?.isEssentialMedicine !== undefined && med.isEssentialMedicine !== options.isEssentialMedicine) {
                return false;
            }

            // Search in multiple fields
            return this.matchesSearch(med, searchTerm, language);
        });

        // Sort by relevance (exact matches first, then partial)
        results = this.sortByRelevance(results, searchTerm, language);

        // Convert to search results format
        return results.map(med => this.toSearchResult(med, language, region));
    }

    /**
     * Get medicine by ID
     */
    getMedicineById(id: string): MedicineDatabaseEntry | null {
        return this.medicines.find(med => med.id === id) || null;
    }

    /**
     * Get medicines by category
     */
    getMedicinesByCategory(category: MedicineCategory, region?: AfricanRegion): MedicineSearchResult[] {
        const targetRegion = region || this.currentRegion;

        return this.medicines
            .filter(med => med.category === category && med.availableRegions.includes(targetRegion))
            .map(med => this.toSearchResult(med, this.currentLanguage, targetRegion));
    }

    /**
     * Get all categories with medicine counts
     */
    getCategories(): { category: MedicineCategory; count: number; displayName: string }[] {
        const categoryCounts: Record<string, number> = {};

        this.medicines.forEach(med => {
            if (med.availableRegions.includes(this.currentRegion)) {
                categoryCounts[med.category] = (categoryCounts[med.category] || 0) + 1;
            }
        });

        return Object.entries(categoryCounts).map(([category, count]) => ({
            category: category as MedicineCategory,
            count,
            displayName: getCategoryDisplayName(category as MedicineCategory, this.currentLanguage)
        }));
    }

    /**
     * Get all forms with counts
     */
    getForms(): { form: MedicineForm; count: number; displayName: string }[] {
        const formCounts: Record<string, number> = {};

        this.medicines.forEach(med => {
            if (med.availableRegions.includes(this.currentRegion)) {
                formCounts[med.form] = (formCounts[med.form] || 0) + 1;
            }
        });

        return Object.entries(formCounts).map(([form, count]) => ({
            form: form as MedicineForm,
            count,
            displayName: getFormDisplayName(form as MedicineForm, this.currentLanguage)
        }));
    }

    /**
     * Get autocomplete suggestions (for quick search)
     */
    getAutocompleteSuggestions(query: string, limit: number = 10): MedicineSearchResult[] {
        return this.search(query).slice(0, limit);
    }

    /**
     * Check if a medicine matches the search term
     */
    private matchesSearch(med: MedicineDatabaseEntry, searchTerm: string, language: SupportedLanguage): boolean {
        // Check INN (always in English/Latin)
        if (med.inn.toLowerCase().includes(searchTerm)) {
            return true;
        }

        // Check localized name
        const name = med.name[language] || med.name.en || med.name.fr;
        if (name.toLowerCase().includes(searchTerm)) {
            return true;
        }

        // Check brand names (global)
        if (med.brandNames.global.some(brand => brand.toLowerCase().includes(searchTerm))) {
            return true;
        }

        // Check regional brand names
        if (med.brandNames.regional) {
            for (const brands of Object.values(med.brandNames.regional)) {
                if (brands && brands.some(brand => brand.toLowerCase().includes(searchTerm))) {
                    return true;
                }
            }
        }

        // Check dosage
        if (med.dosage.toLowerCase().includes(searchTerm)) {
            return true;
        }

        // Check keywords in current language
        const keywords = med.keywords[language] || med.keywords.en || med.keywords.fr;
        if (keywords && keywords.some(kw => kw.toLowerCase().includes(searchTerm))) {
            return true;
        }

        // Check ATC code
        if (med.atcCode && med.atcCode.toLowerCase().includes(searchTerm)) {
            return true;
        }

        return false;
    }

    /**
     * Sort results by relevance
     */
    private sortByRelevance(
        results: MedicineDatabaseEntry[],
        searchTerm: string,
        language: SupportedLanguage
    ): MedicineDatabaseEntry[] {
        return results.sort((a, b) => {
            const scoreA = this.getRelevanceScore(a, searchTerm, language);
            const scoreB = this.getRelevanceScore(b, searchTerm, language);
            return scoreB - scoreA;
        });
    }

    /**
     * Calculate relevance score for sorting
     */
    private getRelevanceScore(med: MedicineDatabaseEntry, searchTerm: string, language: SupportedLanguage): number {
        let score = 0;

        // Exact INN match = highest score
        if (med.inn.toLowerCase() === searchTerm) {
            score += 100;
        } else if (med.inn.toLowerCase().startsWith(searchTerm)) {
            score += 80;
        } else if (med.inn.toLowerCase().includes(searchTerm)) {
            score += 40;
        }

        // Localized name match
        const name = med.name[language] || med.name.en || med.name.fr;
        if (name.toLowerCase() === searchTerm) {
            score += 90;
        } else if (name.toLowerCase().startsWith(searchTerm)) {
            score += 70;
        } else if (name.toLowerCase().includes(searchTerm)) {
            score += 30;
        }

        // Brand name match
        if (med.brandNames.global.some(brand => brand.toLowerCase() === searchTerm)) {
            score += 85;
        } else if (med.brandNames.global.some(brand => brand.toLowerCase().startsWith(searchTerm))) {
            score += 65;
        }

        // Essential medicine bonus
        if (med.isEssentialMedicine) {
            score += 10;
        }

        return score;
    }

    /**
     * Convert database entry to search result format
     */
    private toSearchResult(
        med: MedicineDatabaseEntry,
        language: SupportedLanguage,
        region: AfricanRegion
    ): MedicineSearchResult {
        const name = med.name[language] || med.name.en || med.name.fr;
        const formDisplay = getFormDisplayName(med.form, language);
        const categoryDisplay = getCategoryDisplayName(med.category, language);

        // Combine global and regional brand names
        let brandNames = [...med.brandNames.global];
        if (med.brandNames.regional && med.brandNames.regional[region]) {
            brandNames = [...new Set([...brandNames, ...med.brandNames.regional[region]!])];
        }

        return {
            id: med.id,
            inn: med.inn,
            name,
            brandNames,
            form: med.form,
            formDisplay,
            dosage: med.dosage,
            category: med.category,
            categoryDisplay,
            displayName: `${name} ${med.dosage} ${formDisplay}`
        };
    }
}

// Export singleton getter for convenience
export const getMedicineDatabaseService = (): MedicineDatabaseService =>
    MedicineDatabaseService.getInstance();
