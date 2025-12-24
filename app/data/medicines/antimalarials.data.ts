/**
 * Antimalarials Database
 * Critical medicines for sub-Saharan Africa where malaria is endemic
 * Multi-language support: French, English, Portuguese
 */

import { MedicineDatabaseEntry } from '../medicine-database.model';

export const ANTIMALARIALS_DATA: MedicineDatabaseEntry[] = [
    // ============================================
    // ARTEMISININ-BASED COMBINATIONS (ACTs) - First-line treatment
    // ============================================
    {
        id: 'AM001',
        inn: 'Artemether + Lumefantrine',
        name: {
            fr: 'Artéméther + Luméfantrine',
            en: 'Artemether + Lumefantrine',
            pt: 'Arteméter + Lumefantrina'
        },
        brandNames: {
            global: ['Coartem', 'Riamet'],
            regional: {
                west_africa_francophone: ['Coartem', 'Artefan'],
                west_africa_anglophone: ['Coartem', 'Lonart'],
                east_africa: ['Coartem', 'Lumartem']
            }
        },
        form: 'tablet',
        dosage: '20mg/120mg',
        category: 'antimalarials',
        description: {
            fr: 'CTA de première ligne pour le paludisme non compliqué',
            en: 'First-line ACT for uncomplicated malaria',
            pt: 'TCA de primeira linha para malária não complicada'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_moisture'],
        packageSizes: ['6 tabs', '12 tabs', '18 tabs', '24 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['coartem', 'artéméther', 'luméfantrine', 'paludisme', 'malaria', 'CTA'],
            en: ['coartem', 'artemether', 'lumefantrine', 'malaria', 'ACT'],
            pt: ['coartem', 'arteméter', 'lumefantrina', 'malária', 'TCA']
        },
        atcCode: 'P01BF01'
    },
    {
        id: 'AM002',
        inn: 'Artemether + Lumefantrine',
        name: {
            fr: 'Artéméther + Luméfantrine dispersible',
            en: 'Artemether + Lumefantrine dispersible',
            pt: 'Arteméter + Lumefantrina dispersível'
        },
        brandNames: {
            global: ['Coartem Dispersible']
        },
        form: 'tablet',
        dosage: '20mg/120mg',
        category: 'antimalarials',
        description: {
            fr: 'CTA pédiatrique dispersible pour le paludisme',
            en: 'Pediatric dispersible ACT for malaria',
            pt: 'TCA pediátrico dispersível para malária'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_moisture'],
        packageSizes: ['6 tabs', '12 tabs', '18 tabs', '24 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['coartem', 'dispersible', 'enfant', 'pédiatrique', 'paludisme'],
            en: ['coartem', 'dispersible', 'child', 'pediatric', 'malaria'],
            pt: ['coartem', 'dispersível', 'criança', 'pediátrico', 'malária']
        },
        atcCode: 'P01BF01'
    },
    {
        id: 'AM003',
        inn: 'Artesunate + Amodiaquine',
        name: {
            fr: 'Artésunate + Amodiaquine',
            en: 'Artesunate + Amodiaquine',
            pt: 'Artesunato + Amodiaquina'
        },
        brandNames: {
            global: ['ASAQ', 'Coarsucam', 'Winthrop'],
            regional: {
                west_africa_francophone: ['ASAQ', 'Coarsucam'],
                west_africa_anglophone: ['ASAQ Winthrop']
            }
        },
        form: 'tablet',
        dosage: '100mg/270mg',
        category: 'antimalarials',
        description: {
            fr: 'CTA alternative pour le paludisme non compliqué',
            en: 'Alternative ACT for uncomplicated malaria',
            pt: 'TCA alternativa para malária não complicada'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['3 tabs', '6 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa'],
        keywords: {
            fr: ['ASAQ', 'artésunate', 'amodiaquine', 'paludisme', 'CTA'],
            en: ['ASAQ', 'artesunate', 'amodiaquine', 'malaria', 'ACT'],
            pt: ['ASAQ', 'artesunato', 'amodiaquina', 'malária', 'TCA']
        },
        atcCode: 'P01BF02'
    },
    {
        id: 'AM004',
        inn: 'Artesunate + Amodiaquine',
        name: {
            fr: 'Artésunate + Amodiaquine pédiatrique',
            en: 'Artesunate + Amodiaquine pediatric',
            pt: 'Artesunato + Amodiaquina pediátrico'
        },
        brandNames: {
            global: ['ASAQ', 'Coarsucam Nourrisson']
        },
        form: 'tablet',
        dosage: '25mg/67.5mg',
        category: 'antimalarials',
        description: {
            fr: 'CTA pédiatrique pour nourrissons',
            en: 'Pediatric ACT for infants',
            pt: 'TCA pediátrico para lactentes'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['3 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa'],
        keywords: {
            fr: ['ASAQ', 'nourrisson', 'bébé', 'pédiatrique', 'paludisme'],
            en: ['ASAQ', 'infant', 'baby', 'pediatric', 'malaria'],
            pt: ['ASAQ', 'lactente', 'bebê', 'pediátrico', 'malária']
        },
        atcCode: 'P01BF02'
    },
    {
        id: 'AM005',
        inn: 'Artesunate + Mefloquine',
        name: {
            fr: 'Artésunate + Méfloquine',
            en: 'Artesunate + Mefloquine',
            pt: 'Artesunato + Mefloquina'
        },
        brandNames: {
            global: ['ASMQ', 'Artequin']
        },
        form: 'tablet',
        dosage: '100mg/200mg',
        category: 'antimalarials',
        description: {
            fr: 'CTA pour zones de résistance à l\'amodiaquine',
            en: 'ACT for areas with amodiaquine resistance',
            pt: 'TCA para áreas com resistência à amodiaquina'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['3 tabs', '6 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['east_africa', 'southern_africa'],
        keywords: {
            fr: ['ASMQ', 'artésunate', 'méfloquine', 'paludisme'],
            en: ['ASMQ', 'artesunate', 'mefloquine', 'malaria'],
            pt: ['ASMQ', 'artesunato', 'mefloquina', 'malária']
        },
        atcCode: 'P01BF03'
    },
    {
        id: 'AM006',
        inn: 'Dihydroartemisinin + Piperaquine',
        name: {
            fr: 'Dihydroartémisinine + Pipéraquine',
            en: 'Dihydroartemisinin + Piperaquine',
            pt: 'Di-hidroartemisinina + Piperaquina'
        },
        brandNames: {
            global: ['Eurartesim', 'Duo-Cotecxin'],
            regional: {
                west_africa_francophone: ['Duo-Cotecxin'],
                east_africa: ['Eurartesim', 'D-Artepp']
            }
        },
        form: 'tablet',
        dosage: '40mg/320mg',
        category: 'antimalarials',
        description: {
            fr: 'CTA à prise unique quotidienne pendant 3 jours',
            en: 'ACT with once-daily dosing for 3 days',
            pt: 'TCA com dose única diária por 3 dias'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['3 tabs', '6 tabs', '9 tabs', '12 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['DHA-PPQ', 'dihydroartémisinine', 'pipéraquine', 'paludisme'],
            en: ['DHA-PPQ', 'dihydroartemisinin', 'piperaquine', 'malaria'],
            pt: ['DHA-PPQ', 'di-hidroartemisinina', 'piperaquina', 'malária']
        },
        atcCode: 'P01BF05'
    },
    {
        id: 'AM007',
        inn: 'Artesunate + Sulfadoxine-Pyrimethamine',
        name: {
            fr: 'Artésunate + Sulfadoxine-Pyriméthamine',
            en: 'Artesunate + Sulfadoxine-Pyrimethamine',
            pt: 'Artesunato + Sulfadoxina-Pirimetamina'
        },
        brandNames: {
            global: ['AS+SP']
        },
        form: 'tablet',
        dosage: '100mg + 500mg/25mg',
        category: 'antimalarials',
        description: {
            fr: 'CTA utilisée dans certaines régions',
            en: 'ACT used in certain regions',
            pt: 'TCA usada em certas regiões'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['3 tabs'],
        isEssentialMedicine: false,
        availableRegions: ['east_africa', 'southern_africa'],
        keywords: {
            fr: ['AS-SP', 'artésunate', 'sulfadoxine', 'paludisme'],
            en: ['AS-SP', 'artesunate', 'sulfadoxine', 'malaria'],
            pt: ['AS-SP', 'artesunato', 'sulfadoxina', 'malária']
        },
        atcCode: 'P01BF04'
    },

    // ============================================
    // INJECTABLE ARTEMISININS - Severe malaria
    // ============================================
    {
        id: 'AM008',
        inn: 'Artesunate',
        name: {
            fr: 'Artésunate injectable',
            en: 'Artesunate injection',
            pt: 'Artesunato injetável'
        },
        brandNames: {
            global: ['Artesunate', 'Malacef'],
            regional: {
                west_africa_francophone: ['Malacef', 'Artesunat'],
                east_africa: ['Artesun', 'Falcinat']
            }
        },
        form: 'injection',
        dosage: '60mg',
        category: 'antimalarials',
        description: {
            fr: 'Traitement de première ligne du paludisme grave',
            en: 'First-line treatment for severe malaria',
            pt: 'Tratamento de primeira linha para malária grave'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['1 vial', '10 vials'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['artésunate', 'injectable', 'paludisme grave', 'IV', 'IM'],
            en: ['artesunate', 'injectable', 'severe malaria', 'IV', 'IM'],
            pt: ['artesunato', 'injetável', 'malária grave', 'IV', 'IM']
        },
        atcCode: 'P01BE03'
    },
    {
        id: 'AM009',
        inn: 'Artesunate',
        name: {
            fr: 'Artésunate injectable',
            en: 'Artesunate injection',
            pt: 'Artesunato injetável'
        },
        brandNames: {
            global: ['Artesunate']
        },
        form: 'injection',
        dosage: '120mg',
        category: 'antimalarials',
        description: {
            fr: 'Traitement du paludisme grave chez l\'adulte',
            en: 'Severe malaria treatment in adults',
            pt: 'Tratamento de malária grave em adultos'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['1 vial', '10 vials'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['artésunate', 'injectable', 'adulte', 'paludisme grave'],
            en: ['artesunate', 'injectable', 'adult', 'severe malaria'],
            pt: ['artesunato', 'injetável', 'adulto', 'malária grave']
        },
        atcCode: 'P01BE03'
    },
    {
        id: 'AM010',
        inn: 'Artemether',
        name: {
            fr: 'Artéméther injectable',
            en: 'Artemether injection',
            pt: 'Arteméter injetável'
        },
        brandNames: {
            global: ['Paluther', 'Artenam']
        },
        form: 'injection',
        dosage: '80mg/ml',
        category: 'antimalarials',
        description: {
            fr: 'Alternative injectable pour paludisme grave',
            en: 'Alternative injectable for severe malaria',
            pt: 'Alternativa injetável para malária grave'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['1 amp', '6 amps'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa'],
        keywords: {
            fr: ['artéméther', 'injectable', 'paludisme grave', 'IM'],
            en: ['artemether', 'injectable', 'severe malaria', 'IM'],
            pt: ['arteméter', 'injetável', 'malária grave', 'IM']
        },
        atcCode: 'P01BE02'
    },
    {
        id: 'AM011',
        inn: 'Artesunate',
        name: {
            fr: 'Artésunate rectal',
            en: 'Artesunate rectal',
            pt: 'Artesunato retal'
        },
        brandNames: {
            global: ['Rectocaps', 'Artesunate Supp']
        },
        form: 'suppository',
        dosage: '100mg',
        category: 'antimalarials',
        description: {
            fr: 'Traitement pré-transfert pour paludisme grave pédiatrique',
            en: 'Pre-referral treatment for severe pediatric malaria',
            pt: 'Tratamento pré-referência para malária pediátrica grave'
        },
        prescriptionRequired: true,
        storageConditions: ['cool_dry_place'],
        packageSizes: ['1 supp', '6 supps'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa'],
        keywords: {
            fr: ['artésunate', 'suppositoire', 'rectal', 'enfant', 'urgence'],
            en: ['artesunate', 'suppository', 'rectal', 'child', 'emergency'],
            pt: ['artesunato', 'supositório', 'retal', 'criança', 'emergência']
        },
        atcCode: 'P01BE03'
    },

    // ============================================
    // QUININE - Reserve treatment
    // ============================================
    {
        id: 'AM012',
        inn: 'Quinine',
        name: {
            fr: 'Quinine comprimé',
            en: 'Quinine tablet',
            pt: 'Quinina comprimido'
        },
        brandNames: {
            global: ['Quinine', 'Qualaquin'],
            regional: {
                west_africa_francophone: ['Quinimax', 'Surquina'],
                west_africa_anglophone: ['Qualaquin']
            }
        },
        form: 'tablet',
        dosage: '300mg',
        category: 'antimalarials',
        description: {
            fr: 'Antipaludique de réserve',
            en: 'Reserve antimalarial',
            pt: 'Antimalárico de reserva'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['20 tabs', '100 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['quinine', 'paludisme', 'crampes'],
            en: ['quinine', 'malaria', 'cramps'],
            pt: ['quinina', 'malária', 'cãibras']
        },
        atcCode: 'P01BC01'
    },
    {
        id: 'AM013',
        inn: 'Quinine',
        name: {
            fr: 'Quinine injectable',
            en: 'Quinine injection',
            pt: 'Quinina injetável'
        },
        brandNames: {
            global: ['Quinine', 'Quinimax']
        },
        form: 'injection',
        dosage: '300mg/ml',
        category: 'antimalarials',
        description: {
            fr: 'Alternative injectable pour paludisme grave',
            en: 'Alternative injectable for severe malaria',
            pt: 'Alternativa injetável para malária grave'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['1 amp', '10 amps'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['quinine', 'injectable', 'perfusion', 'paludisme grave'],
            en: ['quinine', 'injectable', 'infusion', 'severe malaria'],
            pt: ['quinina', 'injetável', 'infusão', 'malária grave']
        },
        atcCode: 'P01BC01'
    },

    // ============================================
    // PROPHYLAXIS
    // ============================================
    {
        id: 'AM014',
        inn: 'Sulfadoxine + Pyrimethamine',
        name: {
            fr: 'Sulfadoxine + Pyriméthamine',
            en: 'Sulfadoxine + Pyrimethamine',
            pt: 'Sulfadoxina + Pirimetamina'
        },
        brandNames: {
            global: ['Fansidar', 'SP'],
            regional: {
                west_africa_francophone: ['Fansidar', 'Maloxine'],
                west_africa_anglophone: ['Fansidar']
            }
        },
        form: 'tablet',
        dosage: '500mg/25mg',
        category: 'antimalarials',
        description: {
            fr: 'Traitement préventif intermittent pendant la grossesse (TPIg)',
            en: 'Intermittent preventive treatment in pregnancy (IPTp)',
            pt: 'Tratamento preventivo intermitente na gravidez (TPIg)'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['3 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['fansidar', 'SP', 'prophylaxie', 'grossesse', 'TPIg'],
            en: ['fansidar', 'SP', 'prophylaxis', 'pregnancy', 'IPTp'],
            pt: ['fansidar', 'SP', 'profilaxia', 'gravidez', 'TPIg']
        },
        atcCode: 'P01BD51'
    },
    {
        id: 'AM015',
        inn: 'Mefloquine',
        name: {
            fr: 'Méfloquine',
            en: 'Mefloquine',
            pt: 'Mefloquina'
        },
        brandNames: {
            global: ['Lariam', 'Mephaquin']
        },
        form: 'tablet',
        dosage: '250mg',
        category: 'antimalarials',
        description: {
            fr: 'Prophylaxie pour voyageurs et traitement de réserve',
            en: 'Prophylaxis for travelers and reserve treatment',
            pt: 'Profilaxia para viajantes e tratamento de reserva'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['8 tabs'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['méfloquine', 'lariam', 'prophylaxie', 'voyage'],
            en: ['mefloquine', 'lariam', 'prophylaxis', 'travel'],
            pt: ['mefloquina', 'lariam', 'profilaxia', 'viagem']
        },
        atcCode: 'P01BC02'
    },
    {
        id: 'AM016',
        inn: 'Atovaquone + Proguanil',
        name: {
            fr: 'Atovaquone + Proguanil',
            en: 'Atovaquone + Proguanil',
            pt: 'Atovaquona + Proguanil'
        },
        brandNames: {
            global: ['Malarone']
        },
        form: 'tablet',
        dosage: '250mg/100mg',
        category: 'antimalarials',
        description: {
            fr: 'Prophylaxie et traitement alternatif du paludisme',
            en: 'Prophylaxis and alternative malaria treatment',
            pt: 'Profilaxia e tratamento alternativo da malária'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['12 tabs'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['malarone', 'atovaquone', 'proguanil', 'prophylaxie'],
            en: ['malarone', 'atovaquone', 'proguanil', 'prophylaxis'],
            pt: ['malarone', 'atovaquona', 'proguanil', 'profilaxia']
        },
        atcCode: 'P01BB51'
    },
    {
        id: 'AM017',
        inn: 'Atovaquone + Proguanil',
        name: {
            fr: 'Atovaquone + Proguanil pédiatrique',
            en: 'Atovaquone + Proguanil pediatric',
            pt: 'Atovaquona + Proguanil pediátrico'
        },
        brandNames: {
            global: ['Malarone Pediatric']
        },
        form: 'tablet',
        dosage: '62.5mg/25mg',
        category: 'antimalarials',
        description: {
            fr: 'Prophylaxie pédiatrique du paludisme',
            en: 'Pediatric malaria prophylaxis',
            pt: 'Profilaxia pediátrica da malária'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['12 tabs'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['malarone', 'pédiatrique', 'enfant', 'prophylaxie'],
            en: ['malarone', 'pediatric', 'child', 'prophylaxis'],
            pt: ['malarone', 'pediátrico', 'criança', 'profilaxia']
        },
        atcCode: 'P01BB51'
    },

    // ============================================
    // SEASONAL MALARIA CHEMOPREVENTION
    // ============================================
    {
        id: 'AM018',
        inn: 'Sulfadoxine-Pyrimethamine + Amodiaquine',
        name: {
            fr: 'SP + Amodiaquine (CPS)',
            en: 'SP + Amodiaquine (SMC)',
            pt: 'SP + Amodiaquina (QPS)'
        },
        brandNames: {
            global: ['SPAQ', 'SMC Pack']
        },
        form: 'tablet',
        dosage: '500mg/25mg + 153mg',
        category: 'antimalarials',
        description: {
            fr: 'Chimioprévention du paludisme saisonnier (CPS) pour enfants',
            en: 'Seasonal malaria chemoprevention (SMC) for children',
            pt: 'Quimioprofilaxia sazonal do paludismo (QPS) para crianças'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['3 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa'],
        keywords: {
            fr: ['CPS', 'chimioprévention', 'saisonnier', 'enfant', 'SPAQ'],
            en: ['SMC', 'chemoprevention', 'seasonal', 'child', 'SPAQ'],
            pt: ['QPS', 'quimioprofilaxia', 'sazonal', 'criança', 'SPAQ']
        },
        atcCode: 'P01BD51'
    },

    // ============================================
    // CHLOROQUINE (Limited use due to resistance)
    // ============================================
    {
        id: 'AM019',
        inn: 'Chloroquine',
        name: {
            fr: 'Chloroquine',
            en: 'Chloroquine',
            pt: 'Cloroquina'
        },
        brandNames: {
            global: ['Nivaquine', 'Aralen'],
            regional: {
                west_africa_francophone: ['Nivaquine'],
                west_africa_anglophone: ['Aralen']
            }
        },
        form: 'tablet',
        dosage: '100mg',
        category: 'antimalarials',
        description: {
            fr: 'Utilisation limitée en raison de la résistance (P. vivax, P. ovale)',
            en: 'Limited use due to resistance (P. vivax, P. ovale)',
            pt: 'Uso limitado devido à resistência (P. vivax, P. ovale)'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['20 tabs', '100 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['chloroquine', 'nivaquine', 'P. vivax'],
            en: ['chloroquine', 'aralen', 'P. vivax'],
            pt: ['cloroquina', 'aralen', 'P. vivax']
        },
        atcCode: 'P01BA01'
    },
    {
        id: 'AM020',
        inn: 'Chloroquine',
        name: {
            fr: 'Chloroquine sirop',
            en: 'Chloroquine syrup',
            pt: 'Cloroquina xarope'
        },
        brandNames: {
            global: ['Nivaquine']
        },
        form: 'syrup',
        dosage: '25mg/5ml',
        category: 'antimalarials',
        description: {
            fr: 'Forme pédiatrique de chloroquine',
            en: 'Pediatric form of chloroquine',
            pt: 'Forma pediátrica de cloroquina'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['150ml'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa'],
        keywords: {
            fr: ['chloroquine', 'sirop', 'enfant'],
            en: ['chloroquine', 'syrup', 'child'],
            pt: ['cloroquina', 'xarope', 'criança']
        },
        atcCode: 'P01BA01'
    },

    // ============================================
    // PRIMAQUINE - Radical cure
    // ============================================
    {
        id: 'AM021',
        inn: 'Primaquine',
        name: {
            fr: 'Primaquine',
            en: 'Primaquine',
            pt: 'Primaquina'
        },
        brandNames: {
            global: ['Primaquine']
        },
        form: 'tablet',
        dosage: '15mg',
        category: 'antimalarials',
        description: {
            fr: 'Cure radicale de P. vivax et P. ovale, gamétocytocide',
            en: 'Radical cure for P. vivax and P. ovale, gametocytocidal',
            pt: 'Cura radical de P. vivax e P. ovale, gametocitocida'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['14 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['east_africa', 'southern_africa'],
        keywords: {
            fr: ['primaquine', 'P. vivax', 'cure radicale', 'gamétocyte'],
            en: ['primaquine', 'P. vivax', 'radical cure', 'gametocyte'],
            pt: ['primaquina', 'P. vivax', 'cura radical', 'gametócito']
        },
        atcCode: 'P01BA03'
    },
    {
        id: 'AM022',
        inn: 'Primaquine',
        name: {
            fr: 'Primaquine faible dose',
            en: 'Primaquine low dose',
            pt: 'Primaquina dose baixa'
        },
        brandNames: {
            global: ['Primaquine']
        },
        form: 'tablet',
        dosage: '7.5mg',
        category: 'antimalarials',
        description: {
            fr: 'Dose unique pour réduction de la transmission',
            en: 'Single dose for transmission reduction',
            pt: 'Dose única para redução da transmissão'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['1 tab', '10 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['primaquine', 'transmission', 'dose unique'],
            en: ['primaquine', 'transmission', 'single dose'],
            pt: ['primaquina', 'transmissão', 'dose única']
        },
        atcCode: 'P01BA03'
    }
];
