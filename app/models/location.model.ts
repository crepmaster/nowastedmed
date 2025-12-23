/**
 * Location Models
 *
 * Configuration for countries, cities, regions, and currencies
 * Used for pharmacy organization and exchange validation
 */

import { SupportedRegion } from './wallet.model';

/**
 * Country Configuration
 */
export interface Country {
    code: string;           // ISO 3166-1 alpha-2
    name: string;
    region: SupportedRegion;
    currency: string;
    phonePrefix: string;
    cities: City[];
    isActive: boolean;
}

/**
 * City Configuration
 */
export interface City {
    id: string;
    name: string;
    countryCode: string;
    isCapital?: boolean;
    isActive: boolean;
}

/**
 * Location data for users/pharmacies
 */
export interface UserLocation {
    countryCode: string;
    countryName: string;
    cityId: string;
    cityName: string;
    region: SupportedRegion;
    currency: string;
    address: string;        // Street address within the city
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}

/**
 * All Supported Countries with Cities
 */
export const SUPPORTED_COUNTRIES: Country[] = [
    // ============================================
    // WEST AFRICA - XOF Zone (Francophone)
    // ============================================
    {
        code: 'BJ',
        name: 'Benin',
        region: 'west_africa_xof',
        currency: 'XOF',
        phonePrefix: '+229',
        isActive: true,
        cities: [
            { id: 'bj_cotonou', name: 'Cotonou', countryCode: 'BJ', isCapital: false, isActive: true },
            { id: 'bj_porto_novo', name: 'Porto-Novo', countryCode: 'BJ', isCapital: true, isActive: true },
            { id: 'bj_parakou', name: 'Parakou', countryCode: 'BJ', isActive: true },
            { id: 'bj_abomey_calavi', name: 'Abomey-Calavi', countryCode: 'BJ', isActive: true },
            { id: 'bj_djougou', name: 'Djougou', countryCode: 'BJ', isActive: true },
            { id: 'bj_bohicon', name: 'Bohicon', countryCode: 'BJ', isActive: true },
        ],
    },
    {
        code: 'TG',
        name: 'Togo',
        region: 'west_africa_xof',
        currency: 'XOF',
        phonePrefix: '+228',
        isActive: true,
        cities: [
            { id: 'tg_lome', name: 'Lomé', countryCode: 'TG', isCapital: true, isActive: true },
            { id: 'tg_sokode', name: 'Sokodé', countryCode: 'TG', isActive: true },
            { id: 'tg_kara', name: 'Kara', countryCode: 'TG', isActive: true },
            { id: 'tg_kpalime', name: 'Kpalimé', countryCode: 'TG', isActive: true },
            { id: 'tg_atakpame', name: 'Atakpamé', countryCode: 'TG', isActive: true },
        ],
    },
    {
        code: 'SN',
        name: 'Senegal',
        region: 'west_africa_xof',
        currency: 'XOF',
        phonePrefix: '+221',
        isActive: true,
        cities: [
            { id: 'sn_dakar', name: 'Dakar', countryCode: 'SN', isCapital: true, isActive: true },
            { id: 'sn_thies', name: 'Thiès', countryCode: 'SN', isActive: true },
            { id: 'sn_saint_louis', name: 'Saint-Louis', countryCode: 'SN', isActive: true },
            { id: 'sn_rufisque', name: 'Rufisque', countryCode: 'SN', isActive: true },
            { id: 'sn_kaolack', name: 'Kaolack', countryCode: 'SN', isActive: true },
            { id: 'sn_ziguinchor', name: 'Ziguinchor', countryCode: 'SN', isActive: true },
        ],
    },
    {
        code: 'CI',
        name: 'Ivory Coast',
        region: 'west_africa_xof',
        currency: 'XOF',
        phonePrefix: '+225',
        isActive: true,
        cities: [
            { id: 'ci_abidjan', name: 'Abidjan', countryCode: 'CI', isActive: true },
            { id: 'ci_yamoussoukro', name: 'Yamoussoukro', countryCode: 'CI', isCapital: true, isActive: true },
            { id: 'ci_bouake', name: 'Bouaké', countryCode: 'CI', isActive: true },
            { id: 'ci_daloa', name: 'Daloa', countryCode: 'CI', isActive: true },
            { id: 'ci_san_pedro', name: 'San-Pédro', countryCode: 'CI', isActive: true },
            { id: 'ci_korhogo', name: 'Korhogo', countryCode: 'CI', isActive: true },
        ],
    },
    {
        code: 'BF',
        name: 'Burkina Faso',
        region: 'west_africa_xof',
        currency: 'XOF',
        phonePrefix: '+226',
        isActive: true,
        cities: [
            { id: 'bf_ouagadougou', name: 'Ouagadougou', countryCode: 'BF', isCapital: true, isActive: true },
            { id: 'bf_bobo_dioulasso', name: 'Bobo-Dioulasso', countryCode: 'BF', isActive: true },
            { id: 'bf_koudougou', name: 'Koudougou', countryCode: 'BF', isActive: true },
            { id: 'bf_banfora', name: 'Banfora', countryCode: 'BF', isActive: true },
        ],
    },
    {
        code: 'ML',
        name: 'Mali',
        region: 'west_africa_xof',
        currency: 'XOF',
        phonePrefix: '+223',
        isActive: true,
        cities: [
            { id: 'ml_bamako', name: 'Bamako', countryCode: 'ML', isCapital: true, isActive: true },
            { id: 'ml_sikasso', name: 'Sikasso', countryCode: 'ML', isActive: true },
            { id: 'ml_segou', name: 'Ségou', countryCode: 'ML', isActive: true },
            { id: 'ml_mopti', name: 'Mopti', countryCode: 'ML', isActive: true },
        ],
    },
    {
        code: 'NE',
        name: 'Niger',
        region: 'west_africa_xof',
        currency: 'XOF',
        phonePrefix: '+227',
        isActive: true,
        cities: [
            { id: 'ne_niamey', name: 'Niamey', countryCode: 'NE', isCapital: true, isActive: true },
            { id: 'ne_zinder', name: 'Zinder', countryCode: 'NE', isActive: true },
            { id: 'ne_maradi', name: 'Maradi', countryCode: 'NE', isActive: true },
            { id: 'ne_tahoua', name: 'Tahoua', countryCode: 'NE', isActive: true },
        ],
    },

    // ============================================
    // WEST AFRICA - Nigeria (NGN)
    // ============================================
    {
        code: 'NG',
        name: 'Nigeria',
        region: 'west_africa_ngn',
        currency: 'NGN',
        phonePrefix: '+234',
        isActive: true,
        cities: [
            { id: 'ng_lagos', name: 'Lagos', countryCode: 'NG', isActive: true },
            { id: 'ng_abuja', name: 'Abuja', countryCode: 'NG', isCapital: true, isActive: true },
            { id: 'ng_kano', name: 'Kano', countryCode: 'NG', isActive: true },
            { id: 'ng_ibadan', name: 'Ibadan', countryCode: 'NG', isActive: true },
            { id: 'ng_port_harcourt', name: 'Port Harcourt', countryCode: 'NG', isActive: true },
            { id: 'ng_benin_city', name: 'Benin City', countryCode: 'NG', isActive: true },
            { id: 'ng_kaduna', name: 'Kaduna', countryCode: 'NG', isActive: true },
            { id: 'ng_enugu', name: 'Enugu', countryCode: 'NG', isActive: true },
            { id: 'ng_onitsha', name: 'Onitsha', countryCode: 'NG', isActive: true },
            { id: 'ng_aba', name: 'Aba', countryCode: 'NG', isActive: true },
        ],
    },

    // ============================================
    // WEST AFRICA - Ghana (GHS)
    // ============================================
    {
        code: 'GH',
        name: 'Ghana',
        region: 'west_africa_ghs',
        currency: 'GHS',
        phonePrefix: '+233',
        isActive: true,
        cities: [
            { id: 'gh_accra', name: 'Accra', countryCode: 'GH', isCapital: true, isActive: true },
            { id: 'gh_kumasi', name: 'Kumasi', countryCode: 'GH', isActive: true },
            { id: 'gh_tamale', name: 'Tamale', countryCode: 'GH', isActive: true },
            { id: 'gh_sekondi_takoradi', name: 'Sekondi-Takoradi', countryCode: 'GH', isActive: true },
            { id: 'gh_cape_coast', name: 'Cape Coast', countryCode: 'GH', isActive: true },
            { id: 'gh_tema', name: 'Tema', countryCode: 'GH', isActive: true },
        ],
    },

    // ============================================
    // WEST AFRICA - Guinea (GNF)
    // ============================================
    {
        code: 'GN',
        name: 'Guinea',
        region: 'west_africa_gnf',
        currency: 'GNF',
        phonePrefix: '+224',
        isActive: true,
        cities: [
            { id: 'gn_conakry', name: 'Conakry', countryCode: 'GN', isCapital: true, isActive: true },
            { id: 'gn_nzerekore', name: 'Nzérékoré', countryCode: 'GN', isActive: true },
            { id: 'gn_kankan', name: 'Kankan', countryCode: 'GN', isActive: true },
            { id: 'gn_kindia', name: 'Kindia', countryCode: 'GN', isActive: true },
            { id: 'gn_labe', name: 'Labé', countryCode: 'GN', isActive: true },
        ],
    },

    // ============================================
    // EAST AFRICA - Kenya (KES)
    // ============================================
    {
        code: 'KE',
        name: 'Kenya',
        region: 'east_africa_kes',
        currency: 'KES',
        phonePrefix: '+254',
        isActive: true,
        cities: [
            { id: 'ke_nairobi', name: 'Nairobi', countryCode: 'KE', isCapital: true, isActive: true },
            { id: 'ke_mombasa', name: 'Mombasa', countryCode: 'KE', isActive: true },
            { id: 'ke_kisumu', name: 'Kisumu', countryCode: 'KE', isActive: true },
            { id: 'ke_nakuru', name: 'Nakuru', countryCode: 'KE', isActive: true },
            { id: 'ke_eldoret', name: 'Eldoret', countryCode: 'KE', isActive: true },
            { id: 'ke_thika', name: 'Thika', countryCode: 'KE', isActive: true },
            { id: 'ke_malindi', name: 'Malindi', countryCode: 'KE', isActive: true },
        ],
    },

    // ============================================
    // EAST AFRICA - Tanzania (TZS)
    // ============================================
    {
        code: 'TZ',
        name: 'Tanzania',
        region: 'east_africa_tzs',
        currency: 'TZS',
        phonePrefix: '+255',
        isActive: true,
        cities: [
            { id: 'tz_dar_es_salaam', name: 'Dar es Salaam', countryCode: 'TZ', isActive: true },
            { id: 'tz_dodoma', name: 'Dodoma', countryCode: 'TZ', isCapital: true, isActive: true },
            { id: 'tz_mwanza', name: 'Mwanza', countryCode: 'TZ', isActive: true },
            { id: 'tz_arusha', name: 'Arusha', countryCode: 'TZ', isActive: true },
            { id: 'tz_mbeya', name: 'Mbeya', countryCode: 'TZ', isActive: true },
            { id: 'tz_zanzibar', name: 'Zanzibar City', countryCode: 'TZ', isActive: true },
            { id: 'tz_tanga', name: 'Tanga', countryCode: 'TZ', isActive: true },
        ],
    },

    // ============================================
    // EAST AFRICA - Uganda (UGX)
    // ============================================
    {
        code: 'UG',
        name: 'Uganda',
        region: 'east_africa_ugx',
        currency: 'UGX',
        phonePrefix: '+256',
        isActive: true,
        cities: [
            { id: 'ug_kampala', name: 'Kampala', countryCode: 'UG', isCapital: true, isActive: true },
            { id: 'ug_gulu', name: 'Gulu', countryCode: 'UG', isActive: true },
            { id: 'ug_lira', name: 'Lira', countryCode: 'UG', isActive: true },
            { id: 'ug_mbarara', name: 'Mbarara', countryCode: 'UG', isActive: true },
            { id: 'ug_jinja', name: 'Jinja', countryCode: 'UG', isActive: true },
            { id: 'ug_mbale', name: 'Mbale', countryCode: 'UG', isActive: true },
        ],
    },

    // ============================================
    // SOUTHERN AFRICA - Botswana (BWP)
    // ============================================
    {
        code: 'BW',
        name: 'Botswana',
        region: 'southern_africa_bwp',
        currency: 'BWP',
        phonePrefix: '+267',
        isActive: true,
        cities: [
            { id: 'bw_gaborone', name: 'Gaborone', countryCode: 'BW', isCapital: true, isActive: true },
            { id: 'bw_francistown', name: 'Francistown', countryCode: 'BW', isActive: true },
            { id: 'bw_molepolole', name: 'Molepolole', countryCode: 'BW', isActive: true },
            { id: 'bw_maun', name: 'Maun', countryCode: 'BW', isActive: true },
            { id: 'bw_serowe', name: 'Serowe', countryCode: 'BW', isActive: true },
            { id: 'bw_selebi_phikwe', name: 'Selebi-Phikwe', countryCode: 'BW', isActive: true },
        ],
    },
];

/**
 * Helper Functions
 */

/**
 * Get all active countries
 */
export function getActiveCountries(): Country[] {
    return SUPPORTED_COUNTRIES.filter(c => c.isActive);
}

/**
 * Get country by code
 */
export function getCountryByCode(code: string): Country | undefined {
    return SUPPORTED_COUNTRIES.find(c => c.code === code);
}

/**
 * Get countries by region
 */
export function getCountriesByRegion(region: SupportedRegion): Country[] {
    return SUPPORTED_COUNTRIES.filter(c => c.region === region && c.isActive);
}

/**
 * Get countries by currency
 */
export function getCountriesByCurrency(currency: string): Country[] {
    return SUPPORTED_COUNTRIES.filter(c => c.currency === currency && c.isActive);
}

/**
 * Get cities by country
 */
export function getCitiesByCountry(countryCode: string): City[] {
    const country = getCountryByCode(countryCode);
    return country ? country.cities.filter(c => c.isActive) : [];
}

/**
 * Get city by ID
 */
export function getCityById(cityId: string): City | undefined {
    for (const country of SUPPORTED_COUNTRIES) {
        const city = country.cities.find(c => c.id === cityId);
        if (city) return city;
    }
    return undefined;
}

/**
 * Get country for city
 */
export function getCountryForCity(cityId: string): Country | undefined {
    for (const country of SUPPORTED_COUNTRIES) {
        if (country.cities.some(c => c.id === cityId)) {
            return country;
        }
    }
    return undefined;
}

/**
 * Validate if two locations are in the same city (for exchange validation)
 */
export function isSameCity(cityId1: string, cityId2: string): boolean {
    return cityId1 === cityId2;
}

/**
 * Validate if two locations are in the same country
 */
export function isSameCountry(countryCode1: string, countryCode2: string): boolean {
    return countryCode1 === countryCode2;
}

/**
 * Get currency for a country
 */
export function getCurrencyForCountry(countryCode: string): string | undefined {
    const country = getCountryByCode(countryCode);
    return country?.currency;
}

/**
 * Get region for a country
 */
export function getRegionForCountry(countryCode: string): SupportedRegion | undefined {
    const country = getCountryByCode(countryCode);
    return country?.region;
}

/**
 * Get all cities (flattened)
 */
export function getAllCities(): City[] {
    return SUPPORTED_COUNTRIES.flatMap(c => c.cities.filter(city => city.isActive));
}

/**
 * Search cities by name
 */
export function searchCities(query: string): City[] {
    const lowerQuery = query.toLowerCase();
    return getAllCities().filter(c =>
        c.name.toLowerCase().includes(lowerQuery)
    );
}
