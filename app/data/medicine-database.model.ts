/**
 * Medicine Database Model
 *
 * Defines the structure for the pre-populated medicine database
 * containing common medicines used in sub-Saharan Africa.
 *
 * This database helps pharmacies quickly list medicines for exchange
 * by selecting from a standardized list rather than manual entry.
 *
 * Supports multiple languages: French (fr), English (en), Portuguese (pt), Spanish (es)
 */

/**
 * Supported languages for the application
 */
export type SupportedLanguage = 'fr' | 'en' | 'pt' | 'es';

/**
 * Multi-language text support
 */
export interface LocalizedText {
    fr: string;  // French (primary for West Africa)
    en: string;  // English
    pt?: string; // Portuguese (for Lusophone Africa)
    es?: string; // Spanish
}

/**
 * Geographic regions for medicine availability
 * Grouped by language and regulatory similarities
 */
export type AfricanRegion =
    | 'west_africa_francophone'  // Benin, Senegal, Mali, Burkina Faso, Côte d'Ivoire, Niger, Togo, Guinea
    | 'west_africa_anglophone'   // Nigeria, Ghana, Liberia, Sierra Leone, Gambia
    | 'west_africa_lusophone'    // Guinea-Bissau, Cape Verde
    | 'central_africa'           // Cameroon, DRC, Congo, Gabon, Chad, CAR
    | 'east_africa'              // Kenya, Tanzania, Uganda, Rwanda, Burundi, Ethiopia
    | 'southern_africa'          // South Africa, Zimbabwe, Zambia, Malawi, Mozambique, Angola
    | 'north_africa';            // Morocco, Algeria, Tunisia, Egypt

/**
 * Country codes for African countries
 */
export type AfricanCountryCode =
    // West Africa Francophone
    | 'BJ' // Benin
    | 'SN' // Senegal
    | 'ML' // Mali
    | 'BF' // Burkina Faso
    | 'CI' // Côte d'Ivoire
    | 'NE' // Niger
    | 'TG' // Togo
    | 'GN' // Guinea
    // West Africa Anglophone
    | 'NG' // Nigeria
    | 'GH' // Ghana
    | 'LR' // Liberia
    | 'SL' // Sierra Leone
    | 'GM' // Gambia
    // West Africa Lusophone
    | 'GW' // Guinea-Bissau
    | 'CV' // Cape Verde
    // Central Africa
    | 'CM' // Cameroon
    | 'CD' // DRC
    | 'CG' // Congo
    | 'GA' // Gabon
    | 'TD' // Chad
    | 'CF' // CAR
    // East Africa
    | 'KE' // Kenya
    | 'TZ' // Tanzania
    | 'UG' // Uganda
    | 'RW' // Rwanda
    | 'BI' // Burundi
    | 'ET' // Ethiopia
    // Southern Africa
    | 'ZA' // South Africa
    | 'ZW' // Zimbabwe
    | 'ZM' // Zambia
    | 'MW' // Malawi
    | 'MZ' // Mozambique
    | 'AO'; // Angola

/**
 * Region metadata
 */
export interface RegionInfo {
    code: AfricanRegion;
    name: LocalizedText;
    primaryLanguage: SupportedLanguage;
    countries: AfricanCountryCode[];
}

/**
 * Predefined region information
 */
export const AFRICAN_REGIONS: Record<AfricanRegion, RegionInfo> = {
    west_africa_francophone: {
        code: 'west_africa_francophone',
        name: {
            fr: 'Afrique de l\'Ouest Francophone',
            en: 'Francophone West Africa'
        },
        primaryLanguage: 'fr',
        countries: ['BJ', 'SN', 'ML', 'BF', 'CI', 'NE', 'TG', 'GN']
    },
    west_africa_anglophone: {
        code: 'west_africa_anglophone',
        name: {
            fr: 'Afrique de l\'Ouest Anglophone',
            en: 'Anglophone West Africa'
        },
        primaryLanguage: 'en',
        countries: ['NG', 'GH', 'LR', 'SL', 'GM']
    },
    west_africa_lusophone: {
        code: 'west_africa_lusophone',
        name: {
            fr: 'Afrique de l\'Ouest Lusophone',
            en: 'Lusophone West Africa'
        },
        primaryLanguage: 'pt',
        countries: ['GW', 'CV']
    },
    central_africa: {
        code: 'central_africa',
        name: {
            fr: 'Afrique Centrale',
            en: 'Central Africa'
        },
        primaryLanguage: 'fr',
        countries: ['CM', 'CD', 'CG', 'GA', 'TD', 'CF']
    },
    east_africa: {
        code: 'east_africa',
        name: {
            fr: 'Afrique de l\'Est',
            en: 'East Africa'
        },
        primaryLanguage: 'en',
        countries: ['KE', 'TZ', 'UG', 'RW', 'BI', 'ET']
    },
    southern_africa: {
        code: 'southern_africa',
        name: {
            fr: 'Afrique Australe',
            en: 'Southern Africa'
        },
        primaryLanguage: 'en',
        countries: ['ZA', 'ZW', 'ZM', 'MW', 'MZ', 'AO']
    },
    north_africa: {
        code: 'north_africa',
        name: {
            fr: 'Afrique du Nord',
            en: 'North Africa'
        },
        primaryLanguage: 'fr',
        countries: []
    }
};

/**
 * Get region by country code
 */
export function getRegionByCountry(countryCode: AfricanCountryCode): AfricanRegion | null {
    for (const [region, info] of Object.entries(AFRICAN_REGIONS)) {
        if (info.countries.includes(countryCode)) {
            return region as AfricanRegion;
        }
    }
    return null;
}

/**
 * Pharmaceutical form of the medicine
 */
export type MedicineForm =
    | 'tablet'
    | 'capsule'
    | 'syrup'
    | 'suspension'
    | 'injection'
    | 'cream'
    | 'ointment'
    | 'gel'
    | 'drops'
    | 'powder'
    | 'suppository'
    | 'inhaler'
    | 'patch'
    | 'solution'
    | 'spray'
    | 'lotion'
    | 'granules';

/**
 * Medicine category/therapeutic class
 */
export type MedicineCategory =
    | 'antibiotics'
    | 'antimalarials'
    | 'analgesics'
    | 'antipyretics'
    | 'antiretrovirals'
    | 'antihypertensives'
    | 'antidiabetics'
    | 'antihistamines'
    | 'antifungals'
    | 'antiparasitics'
    | 'antacids'
    | 'antiemetics'
    | 'antidiarrheals'
    | 'laxatives'
    | 'vitamins'
    | 'minerals'
    | 'supplements'
    | 'contraceptives'
    | 'hormones'
    | 'cardiovascular'
    | 'respiratory'
    | 'dermatological'
    | 'ophthalmic'
    | 'otic'
    | 'vaccines'
    | 'anticonvulsants'
    | 'antidepressants'
    | 'antipsychotics'
    | 'sedatives'
    | 'muscle_relaxants'
    | 'anti_inflammatory'
    | 'corticosteroids'
    | 'diuretics'
    | 'bronchodilators'
    | 'anticoagulants'
    | 'antituberculosis'
    | 'antiseptics'
    | 'oral_rehydration'
    | 'other';

/**
 * Storage requirements
 */
export type StorageCondition =
    | 'room_temperature'      // 15-25°C
    | 'cool_dry_place'        // Below 25°C
    | 'refrigerated'          // 2-8°C
    | 'frozen'                // Below -15°C
    | 'protect_from_light'
    | 'protect_from_moisture';

/**
 * Medicine database entry
 * Represents a standardized medicine in the reference database
 * Supports multiple languages and regional availability
 */
export interface MedicineDatabaseEntry {
    /** Unique identifier */
    id: string;

    /** International Nonproprietary Name (INN) / DCI (Dénomination Commune Internationale) */
    inn: string;

    /** Localized medicine name (for display) */
    name: LocalizedText;

    /** Common brand names by region */
    brandNames: {
        global: string[];           // International brands
        regional?: Partial<Record<AfricanRegion, string[]>>; // Region-specific brands
    };

    /** Pharmaceutical form */
    form: MedicineForm;

    /** Dosage/Strength (e.g., "500mg", "250mg/5ml") */
    dosage: string;

    /** Therapeutic category */
    category: MedicineCategory;

    /** Brief description/indication (localized) */
    description: LocalizedText;

    /** Whether prescription is required */
    prescriptionRequired: boolean;

    /** Storage conditions */
    storageConditions: StorageCondition[];

    /** Common package sizes */
    packageSizes: string[];

    /** WHO Essential Medicine indicator */
    isEssentialMedicine: boolean;

    /** Regions where this medicine is commonly available */
    availableRegions: AfricanRegion[];

    /** Search keywords in multiple languages */
    keywords: {
        fr: string[];
        en: string[];
        pt?: string[];
    };

    /** ATC code (Anatomical Therapeutic Chemical) if available */
    atcCode?: string;
}

/**
 * Simplified medicine entry for display in lists/autocomplete
 */
export interface MedicineSearchResult {
    id: string;
    inn: string;
    name: string;           // Localized name based on current language
    brandNames: string[];   // Combined global + regional brands
    form: MedicineForm;
    formDisplay: string;    // Localized form name
    dosage: string;
    category: MedicineCategory;
    categoryDisplay: string; // Localized category name
    displayName: string;    // Formatted as "Name dosage form" in current language
}

/**
 * Medicine filter options for search
 */
export interface MedicineFilterOptions {
    category?: MedicineCategory;
    form?: MedicineForm;
    prescriptionRequired?: boolean;
    isEssentialMedicine?: boolean;
    searchText?: string;
    region?: AfricanRegion;     // Filter by region availability
    language?: SupportedLanguage; // Language for search and display
}

/**
 * Helper function to generate display name
 */
export function generateDisplayName(entry: MedicineDatabaseEntry): string {
    return `${entry.inn} ${entry.dosage} ${entry.form}`;
}

/**
 * Get localized form name
 * Falls back to French if language not available
 */
export function getFormDisplayName(form: MedicineForm, language: SupportedLanguage = 'fr'): string {
    const formNames: Record<MedicineForm, { en: string; fr: string; pt: string; es: string }> = {
        tablet: { en: 'Tablet', fr: 'Comprimé', pt: 'Comprimido', es: 'Comprimido' },
        capsule: { en: 'Capsule', fr: 'Gélule', pt: 'Cápsula', es: 'Cápsula' },
        syrup: { en: 'Syrup', fr: 'Sirop', pt: 'Xarope', es: 'Jarabe' },
        suspension: { en: 'Suspension', fr: 'Suspension', pt: 'Suspensão', es: 'Suspensión' },
        injection: { en: 'Injection', fr: 'Injectable', pt: 'Injetável', es: 'Inyectable' },
        cream: { en: 'Cream', fr: 'Crème', pt: 'Creme', es: 'Crema' },
        ointment: { en: 'Ointment', fr: 'Pommade', pt: 'Pomada', es: 'Pomada' },
        gel: { en: 'Gel', fr: 'Gel', pt: 'Gel', es: 'Gel' },
        drops: { en: 'Drops', fr: 'Gouttes', pt: 'Gotas', es: 'Gotas' },
        powder: { en: 'Powder', fr: 'Poudre', pt: 'Pó', es: 'Polvo' },
        suppository: { en: 'Suppository', fr: 'Suppositoire', pt: 'Supositório', es: 'Supositorio' },
        inhaler: { en: 'Inhaler', fr: 'Inhalateur', pt: 'Inalador', es: 'Inhalador' },
        patch: { en: 'Patch', fr: 'Patch', pt: 'Adesivo', es: 'Parche' },
        solution: { en: 'Solution', fr: 'Solution', pt: 'Solução', es: 'Solución' },
        spray: { en: 'Spray', fr: 'Spray', pt: 'Spray', es: 'Aerosol' },
        lotion: { en: 'Lotion', fr: 'Lotion', pt: 'Loção', es: 'Loción' },
        granules: { en: 'Granules', fr: 'Granulés', pt: 'Grânulos', es: 'Gránulos' },
    };
    return formNames[form][language] || formNames[form]['fr'];
}

/**
 * Get localized category name
 * Falls back to French if language not available
 */
export function getCategoryDisplayName(category: MedicineCategory, language: SupportedLanguage = 'fr'): string {
    const categoryNames: Record<MedicineCategory, { en: string; fr: string; pt: string; es: string }> = {
        antibiotics: { en: 'Antibiotics', fr: 'Antibiotiques', pt: 'Antibióticos', es: 'Antibióticos' },
        antimalarials: { en: 'Antimalarials', fr: 'Antipaludiques', pt: 'Antimaláricos', es: 'Antimaláricos' },
        analgesics: { en: 'Pain Relief', fr: 'Antalgiques', pt: 'Analgésicos', es: 'Analgésicos' },
        antipyretics: { en: 'Fever Reducers', fr: 'Antipyrétiques', pt: 'Antipiréticos', es: 'Antipiréticos' },
        antiretrovirals: { en: 'Antiretrovirals', fr: 'Antirétroviraux', pt: 'Antirretrovirais', es: 'Antirretrovirales' },
        antihypertensives: { en: 'Blood Pressure', fr: 'Antihypertenseurs', pt: 'Anti-hipertensivos', es: 'Antihipertensivos' },
        antidiabetics: { en: 'Diabetes', fr: 'Antidiabétiques', pt: 'Antidiabéticos', es: 'Antidiabéticos' },
        antihistamines: { en: 'Antihistamines', fr: 'Antihistaminiques', pt: 'Anti-histamínicos', es: 'Antihistamínicos' },
        antifungals: { en: 'Antifungals', fr: 'Antifongiques', pt: 'Antifúngicos', es: 'Antifúngicos' },
        antiparasitics: { en: 'Antiparasitics', fr: 'Antiparasitaires', pt: 'Antiparasitários', es: 'Antiparasitarios' },
        antacids: { en: 'Antacids', fr: 'Antiacides', pt: 'Antiácidos', es: 'Antiácidos' },
        antiemetics: { en: 'Anti-nausea', fr: 'Antiémétiques', pt: 'Antieméticos', es: 'Antieméticos' },
        antidiarrheals: { en: 'Antidiarrheals', fr: 'Antidiarrhéiques', pt: 'Antidiarreicos', es: 'Antidiarreicos' },
        laxatives: { en: 'Laxatives', fr: 'Laxatifs', pt: 'Laxantes', es: 'Laxantes' },
        vitamins: { en: 'Vitamins', fr: 'Vitamines', pt: 'Vitaminas', es: 'Vitaminas' },
        minerals: { en: 'Minerals', fr: 'Minéraux', pt: 'Minerais', es: 'Minerales' },
        supplements: { en: 'Supplements', fr: 'Compléments', pt: 'Suplementos', es: 'Suplementos' },
        contraceptives: { en: 'Contraceptives', fr: 'Contraceptifs', pt: 'Contraceptivos', es: 'Anticonceptivos' },
        hormones: { en: 'Hormones', fr: 'Hormones', pt: 'Hormônios', es: 'Hormonas' },
        cardiovascular: { en: 'Cardiovascular', fr: 'Cardiovasculaire', pt: 'Cardiovascular', es: 'Cardiovascular' },
        respiratory: { en: 'Respiratory', fr: 'Respiratoire', pt: 'Respiratório', es: 'Respiratorio' },
        dermatological: { en: 'Skin Care', fr: 'Dermatologique', pt: 'Dermatológico', es: 'Dermatológico' },
        ophthalmic: { en: 'Eye Care', fr: 'Ophtalmique', pt: 'Oftálmico', es: 'Oftálmico' },
        otic: { en: 'Ear Care', fr: 'Otique', pt: 'Otológico', es: 'Ótico' },
        vaccines: { en: 'Vaccines', fr: 'Vaccins', pt: 'Vacinas', es: 'Vacunas' },
        anticonvulsants: { en: 'Anticonvulsants', fr: 'Anticonvulsivants', pt: 'Anticonvulsivantes', es: 'Anticonvulsivos' },
        antidepressants: { en: 'Antidepressants', fr: 'Antidépresseurs', pt: 'Antidepressivos', es: 'Antidepresivos' },
        antipsychotics: { en: 'Antipsychotics', fr: 'Antipsychotiques', pt: 'Antipsicóticos', es: 'Antipsicóticos' },
        sedatives: { en: 'Sedatives', fr: 'Sédatifs', pt: 'Sedativos', es: 'Sedantes' },
        muscle_relaxants: { en: 'Muscle Relaxants', fr: 'Myorelaxants', pt: 'Relaxantes Musculares', es: 'Relajantes Musculares' },
        anti_inflammatory: { en: 'Anti-inflammatory', fr: 'Anti-inflammatoires', pt: 'Anti-inflamatórios', es: 'Antiinflamatorios' },
        corticosteroids: { en: 'Corticosteroids', fr: 'Corticoïdes', pt: 'Corticosteroides', es: 'Corticosteroides' },
        diuretics: { en: 'Diuretics', fr: 'Diurétiques', pt: 'Diuréticos', es: 'Diuréticos' },
        bronchodilators: { en: 'Bronchodilators', fr: 'Bronchodilatateurs', pt: 'Broncodilatadores', es: 'Broncodilatadores' },
        anticoagulants: { en: 'Anticoagulants', fr: 'Anticoagulants', pt: 'Anticoagulantes', es: 'Anticoagulantes' },
        antituberculosis: { en: 'Anti-TB', fr: 'Antituberculeux', pt: 'Antituberculosos', es: 'Antituberculosos' },
        antiseptics: { en: 'Antiseptics', fr: 'Antiseptiques', pt: 'Antissépticos', es: 'Antisépticos' },
        oral_rehydration: { en: 'Oral Rehydration', fr: 'Réhydratation orale', pt: 'Reidratação Oral', es: 'Rehidratación Oral' },
        other: { en: 'Other', fr: 'Autre', pt: 'Outro', es: 'Otro' },
    };
    return categoryNames[category][language] || categoryNames[category]['fr'];
}
