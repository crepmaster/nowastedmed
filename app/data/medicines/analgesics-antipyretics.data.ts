/**
 * Analgesics and Antipyretics Database
 * Pain relievers and fever reducers commonly used in sub-Saharan Africa
 * Multi-language support: French, English, Portuguese
 */

import { MedicineDatabaseEntry } from '../medicine-database.model';

export const ANALGESICS_ANTIPYRETICS_DATA: MedicineDatabaseEntry[] = [
    // ============================================
    // PARACETAMOL (ACETAMINOPHEN)
    // ============================================
    {
        id: 'AA001',
        inn: 'Paracetamol',
        name: {
            fr: 'Paracétamol',
            en: 'Paracetamol (Acetaminophen)',
            pt: 'Paracetamol'
        },
        brandNames: {
            global: ['Doliprane', 'Panadol', 'Tylenol', 'Efferalgan'],
            regional: {
                west_africa_francophone: ['Doliprane', 'Efferalgan', 'Dafalgan'],
                west_africa_anglophone: ['Panadol', 'Tylenol'],
                east_africa: ['Panadol', 'Hedex']
            }
        },
        form: 'tablet',
        dosage: '500mg',
        category: 'analgesics',
        description: {
            fr: 'Antalgique et antipyrétique de première intention',
            en: 'First-line pain reliever and fever reducer',
            pt: 'Analgésico e antipirético de primeira linha'
        },
        prescriptionRequired: false,
        storageConditions: ['room_temperature'],
        packageSizes: ['8 tabs', '16 tabs', '100 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['paracétamol', 'doliprane', 'douleur', 'fièvre', 'antalgique'],
            en: ['paracetamol', 'acetaminophen', 'pain', 'fever', 'analgesic'],
            pt: ['paracetamol', 'dor', 'febre', 'analgésico']
        },
        atcCode: 'N02BE01'
    },
    {
        id: 'AA002',
        inn: 'Paracetamol',
        name: {
            fr: 'Paracétamol',
            en: 'Paracetamol',
            pt: 'Paracetamol'
        },
        brandNames: {
            global: ['Doliprane', 'Panadol', 'Tylenol']
        },
        form: 'tablet',
        dosage: '1000mg',
        category: 'analgesics',
        description: {
            fr: 'Antalgique et antipyrétique dose forte',
            en: 'High-dose pain reliever and fever reducer',
            pt: 'Analgésico e antipirético dose alta'
        },
        prescriptionRequired: false,
        storageConditions: ['room_temperature'],
        packageSizes: ['8 tabs', '16 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['paracétamol', '1g', 'douleur forte', 'fièvre'],
            en: ['paracetamol', '1g', 'strong pain', 'fever'],
            pt: ['paracetamol', '1g', 'dor forte', 'febre']
        },
        atcCode: 'N02BE01'
    },
    {
        id: 'AA003',
        inn: 'Paracetamol',
        name: {
            fr: 'Paracétamol sirop',
            en: 'Paracetamol syrup',
            pt: 'Paracetamol xarope'
        },
        brandNames: {
            global: ['Doliprane', 'Calpol', 'Panadol']
        },
        form: 'syrup',
        dosage: '120mg/5ml',
        category: 'analgesics',
        description: {
            fr: 'Sirop pédiatrique antipyrétique et antalgique',
            en: 'Pediatric fever and pain relief syrup',
            pt: 'Xarope pediátrico antipirético e analgésico'
        },
        prescriptionRequired: false,
        storageConditions: ['room_temperature'],
        packageSizes: ['60ml', '100ml', '150ml'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['paracétamol', 'sirop', 'enfant', 'bébé', 'fièvre'],
            en: ['paracetamol', 'syrup', 'child', 'baby', 'fever'],
            pt: ['paracetamol', 'xarope', 'criança', 'bebê', 'febre']
        },
        atcCode: 'N02BE01'
    },
    {
        id: 'AA004',
        inn: 'Paracetamol',
        name: {
            fr: 'Paracétamol sirop',
            en: 'Paracetamol syrup',
            pt: 'Paracetamol xarope'
        },
        brandNames: {
            global: ['Doliprane', 'Calpol']
        },
        form: 'syrup',
        dosage: '250mg/5ml',
        category: 'analgesics',
        description: {
            fr: 'Sirop pédiatrique dose forte',
            en: 'Higher strength pediatric syrup',
            pt: 'Xarope pediátrico dose forte'
        },
        prescriptionRequired: false,
        storageConditions: ['room_temperature'],
        packageSizes: ['60ml', '100ml'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['paracétamol', 'sirop', 'enfant', 'fièvre'],
            en: ['paracetamol', 'syrup', 'child', 'fever'],
            pt: ['paracetamol', 'xarope', 'criança', 'febre']
        },
        atcCode: 'N02BE01'
    },
    {
        id: 'AA005',
        inn: 'Paracetamol',
        name: {
            fr: 'Paracétamol suppositoire',
            en: 'Paracetamol suppository',
            pt: 'Paracetamol supositório'
        },
        brandNames: {
            global: ['Doliprane', 'Efferalgan']
        },
        form: 'suppository',
        dosage: '150mg',
        category: 'analgesics',
        description: {
            fr: 'Suppositoire pédiatrique pour fièvre et douleur',
            en: 'Pediatric suppository for fever and pain',
            pt: 'Supositório pediátrico para febre e dor'
        },
        prescriptionRequired: false,
        storageConditions: ['cool_dry_place'],
        packageSizes: ['10 supps'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'central_africa'],
        keywords: {
            fr: ['paracétamol', 'suppositoire', 'bébé', 'nourrisson'],
            en: ['paracetamol', 'suppository', 'baby', 'infant'],
            pt: ['paracetamol', 'supositório', 'bebê', 'lactente']
        },
        atcCode: 'N02BE01'
    },
    {
        id: 'AA006',
        inn: 'Paracetamol',
        name: {
            fr: 'Paracétamol suppositoire',
            en: 'Paracetamol suppository',
            pt: 'Paracetamol supositório'
        },
        brandNames: {
            global: ['Doliprane', 'Efferalgan']
        },
        form: 'suppository',
        dosage: '300mg',
        category: 'analgesics',
        description: {
            fr: 'Suppositoire enfant pour fièvre et douleur',
            en: 'Child suppository for fever and pain',
            pt: 'Supositório infantil para febre e dor'
        },
        prescriptionRequired: false,
        storageConditions: ['cool_dry_place'],
        packageSizes: ['10 supps'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'central_africa'],
        keywords: {
            fr: ['paracétamol', 'suppositoire', 'enfant'],
            en: ['paracetamol', 'suppository', 'child'],
            pt: ['paracetamol', 'supositório', 'criança']
        },
        atcCode: 'N02BE01'
    },
    {
        id: 'AA007',
        inn: 'Paracetamol',
        name: {
            fr: 'Paracétamol effervescent',
            en: 'Paracetamol effervescent',
            pt: 'Paracetamol efervescente'
        },
        brandNames: {
            global: ['Efferalgan', 'Panadol Soluble']
        },
        form: 'tablet',
        dosage: '500mg',
        category: 'analgesics',
        description: {
            fr: 'Comprimé effervescent à action rapide',
            en: 'Effervescent tablet for fast action',
            pt: 'Comprimido efervescente de ação rápida'
        },
        prescriptionRequired: false,
        storageConditions: ['room_temperature', 'protect_from_moisture'],
        packageSizes: ['16 tabs'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa'],
        keywords: {
            fr: ['paracétamol', 'effervescent', 'rapide'],
            en: ['paracetamol', 'effervescent', 'fast'],
            pt: ['paracetamol', 'efervescente', 'rápido']
        },
        atcCode: 'N02BE01'
    },
    {
        id: 'AA008',
        inn: 'Paracetamol',
        name: {
            fr: 'Paracétamol injectable',
            en: 'Paracetamol IV',
            pt: 'Paracetamol injetável'
        },
        brandNames: {
            global: ['Perfalgan', 'Paracetamol IV']
        },
        form: 'injection',
        dosage: '1g/100ml',
        category: 'analgesics',
        description: {
            fr: 'Paracétamol intraveineux pour douleur postopératoire',
            en: 'Intravenous paracetamol for post-operative pain',
            pt: 'Paracetamol intravenoso para dor pós-operatória'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['1 bag', '10 bags'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['paracétamol', 'IV', 'injectable', 'hôpital'],
            en: ['paracetamol', 'IV', 'injectable', 'hospital'],
            pt: ['paracetamol', 'IV', 'injetável', 'hospital']
        },
        atcCode: 'N02BE01'
    },

    // ============================================
    // IBUPROFEN
    // ============================================
    {
        id: 'AA009',
        inn: 'Ibuprofen',
        name: {
            fr: 'Ibuprofène',
            en: 'Ibuprofen',
            pt: 'Ibuprofeno'
        },
        brandNames: {
            global: ['Advil', 'Nurofen', 'Brufen'],
            regional: {
                west_africa_francophone: ['Advil', 'Nurofen'],
                west_africa_anglophone: ['Brufen', 'Ibufen']
            }
        },
        form: 'tablet',
        dosage: '200mg',
        category: 'anti_inflammatory',
        description: {
            fr: 'Anti-inflammatoire non stéroïdien (AINS)',
            en: 'Non-steroidal anti-inflammatory drug (NSAID)',
            pt: 'Anti-inflamatório não esteroide (AINE)'
        },
        prescriptionRequired: false,
        storageConditions: ['room_temperature'],
        packageSizes: ['20 tabs', '30 tabs', '100 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['ibuprofène', 'AINS', 'anti-inflammatoire', 'douleur'],
            en: ['ibuprofen', 'NSAID', 'anti-inflammatory', 'pain'],
            pt: ['ibuprofeno', 'AINE', 'anti-inflamatório', 'dor']
        },
        atcCode: 'M01AE01'
    },
    {
        id: 'AA010',
        inn: 'Ibuprofen',
        name: {
            fr: 'Ibuprofène',
            en: 'Ibuprofen',
            pt: 'Ibuprofeno'
        },
        brandNames: {
            global: ['Advil', 'Nurofen', 'Brufen']
        },
        form: 'tablet',
        dosage: '400mg',
        category: 'anti_inflammatory',
        description: {
            fr: 'AINS dose standard',
            en: 'Standard dose NSAID',
            pt: 'AINE dose padrão'
        },
        prescriptionRequired: false,
        storageConditions: ['room_temperature'],
        packageSizes: ['20 tabs', '30 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['ibuprofène', 'AINS', 'douleur', 'inflammation'],
            en: ['ibuprofen', 'NSAID', 'pain', 'inflammation'],
            pt: ['ibuprofeno', 'AINE', 'dor', 'inflamação']
        },
        atcCode: 'M01AE01'
    },
    {
        id: 'AA011',
        inn: 'Ibuprofen',
        name: {
            fr: 'Ibuprofène sirop',
            en: 'Ibuprofen syrup',
            pt: 'Ibuprofeno xarope'
        },
        brandNames: {
            global: ['Advil', 'Nurofen', 'Brufen']
        },
        form: 'syrup',
        dosage: '100mg/5ml',
        category: 'anti_inflammatory',
        description: {
            fr: 'Sirop pédiatrique anti-inflammatoire',
            en: 'Pediatric anti-inflammatory syrup',
            pt: 'Xarope pediátrico anti-inflamatório'
        },
        prescriptionRequired: false,
        storageConditions: ['room_temperature'],
        packageSizes: ['100ml', '150ml'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['ibuprofène', 'sirop', 'enfant', 'fièvre', 'douleur'],
            en: ['ibuprofen', 'syrup', 'child', 'fever', 'pain'],
            pt: ['ibuprofeno', 'xarope', 'criança', 'febre', 'dor']
        },
        atcCode: 'M01AE01'
    },

    // ============================================
    // DICLOFENAC
    // ============================================
    {
        id: 'AA012',
        inn: 'Diclofenac',
        name: {
            fr: 'Diclofénac',
            en: 'Diclofenac',
            pt: 'Diclofenaco'
        },
        brandNames: {
            global: ['Voltaren', 'Cataflam'],
            regional: {
                west_africa_francophone: ['Voltarène', 'Flector'],
                west_africa_anglophone: ['Voltaren', 'Diclo']
            }
        },
        form: 'tablet',
        dosage: '50mg',
        category: 'anti_inflammatory',
        description: {
            fr: 'AINS puissant pour douleurs inflammatoires',
            en: 'Strong NSAID for inflammatory pain',
            pt: 'AINE potente para dores inflamatórias'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['20 tabs', '30 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['diclofénac', 'voltarène', 'AINS', 'arthrite', 'douleur'],
            en: ['diclofenac', 'voltaren', 'NSAID', 'arthritis', 'pain'],
            pt: ['diclofenaco', 'voltaren', 'AINE', 'artrite', 'dor']
        },
        atcCode: 'M01AB05'
    },
    {
        id: 'AA013',
        inn: 'Diclofenac',
        name: {
            fr: 'Diclofénac LP',
            en: 'Diclofenac SR',
            pt: 'Diclofenaco LP'
        },
        brandNames: {
            global: ['Voltaren SR', 'Diclofenac Retard']
        },
        form: 'tablet',
        dosage: '75mg',
        category: 'anti_inflammatory',
        description: {
            fr: 'AINS libération prolongée',
            en: 'Sustained-release NSAID',
            pt: 'AINE de libertação prolongada'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['20 tabs'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['diclofénac', 'LP', 'retard', 'douleur chronique'],
            en: ['diclofenac', 'SR', 'sustained', 'chronic pain'],
            pt: ['diclofenaco', 'LP', 'retard', 'dor crónica']
        },
        atcCode: 'M01AB05'
    },
    {
        id: 'AA014',
        inn: 'Diclofenac',
        name: {
            fr: 'Diclofénac injectable',
            en: 'Diclofenac injection',
            pt: 'Diclofenaco injetável'
        },
        brandNames: {
            global: ['Voltaren']
        },
        form: 'injection',
        dosage: '75mg/3ml',
        category: 'anti_inflammatory',
        description: {
            fr: 'AINS injectable pour douleur aiguë',
            en: 'Injectable NSAID for acute pain',
            pt: 'AINE injetável para dor aguda'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['5 amps', '10 amps'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['diclofénac', 'injectable', 'IM', 'douleur aiguë'],
            en: ['diclofenac', 'injectable', 'IM', 'acute pain'],
            pt: ['diclofenaco', 'injetável', 'IM', 'dor aguda']
        },
        atcCode: 'M01AB05'
    },
    {
        id: 'AA015',
        inn: 'Diclofenac',
        name: {
            fr: 'Diclofénac gel',
            en: 'Diclofenac gel',
            pt: 'Diclofenaco gel'
        },
        brandNames: {
            global: ['Voltaren Emulgel', 'Flector']
        },
        form: 'gel',
        dosage: '1%',
        category: 'anti_inflammatory',
        description: {
            fr: 'Gel anti-inflammatoire topique',
            en: 'Topical anti-inflammatory gel',
            pt: 'Gel anti-inflamatório tópico'
        },
        prescriptionRequired: false,
        storageConditions: ['room_temperature'],
        packageSizes: ['50g', '100g'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['diclofénac', 'gel', 'topique', 'muscles', 'articulations'],
            en: ['diclofenac', 'gel', 'topical', 'muscles', 'joints'],
            pt: ['diclofenaco', 'gel', 'tópico', 'músculos', 'articulações']
        },
        atcCode: 'M02AA15'
    },

    // ============================================
    // ASPIRIN
    // ============================================
    {
        id: 'AA016',
        inn: 'Acetylsalicylic Acid',
        name: {
            fr: 'Acide Acétylsalicylique (Aspirine)',
            en: 'Acetylsalicylic Acid (Aspirin)',
            pt: 'Ácido Acetilsalicílico (Aspirina)'
        },
        brandNames: {
            global: ['Aspirin', 'Aspégic'],
            regional: {
                west_africa_francophone: ['Aspégic', 'Aspirine'],
                west_africa_anglophone: ['Aspirin', 'Disprin']
            }
        },
        form: 'tablet',
        dosage: '500mg',
        category: 'analgesics',
        description: {
            fr: 'Antalgique, antipyrétique et anti-inflammatoire',
            en: 'Analgesic, antipyretic and anti-inflammatory',
            pt: 'Analgésico, antipirético e anti-inflamatório'
        },
        prescriptionRequired: false,
        storageConditions: ['room_temperature', 'protect_from_moisture'],
        packageSizes: ['20 tabs', '100 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['aspirine', 'acide acétylsalicylique', 'douleur', 'fièvre'],
            en: ['aspirin', 'acetylsalicylic acid', 'pain', 'fever'],
            pt: ['aspirina', 'ácido acetilsalicílico', 'dor', 'febre']
        },
        atcCode: 'N02BA01'
    },
    {
        id: 'AA017',
        inn: 'Acetylsalicylic Acid',
        name: {
            fr: 'Aspirine faible dose (cardio)',
            en: 'Low-dose Aspirin (cardiac)',
            pt: 'Aspirina dose baixa (cardíaca)'
        },
        brandNames: {
            global: ['Kardégic', 'Aspirin Cardio']
        },
        form: 'tablet',
        dosage: '75mg',
        category: 'cardiovascular',
        description: {
            fr: 'Aspirine faible dose pour prévention cardiovasculaire',
            en: 'Low-dose aspirin for cardiovascular prevention',
            pt: 'Aspirina dose baixa para prevenção cardiovascular'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['28 tabs', '30 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['aspirine', 'cardio', 'cœur', 'prévention', 'AVC'],
            en: ['aspirin', 'cardio', 'heart', 'prevention', 'stroke'],
            pt: ['aspirina', 'cardio', 'coração', 'prevenção', 'AVC']
        },
        atcCode: 'B01AC06'
    },
    {
        id: 'AA018',
        inn: 'Acetylsalicylic Acid',
        name: {
            fr: 'Aspirine faible dose (cardio)',
            en: 'Low-dose Aspirin (cardiac)',
            pt: 'Aspirina dose baixa (cardíaca)'
        },
        brandNames: {
            global: ['Kardégic', 'Aspirin Cardio']
        },
        form: 'tablet',
        dosage: '100mg',
        category: 'cardiovascular',
        description: {
            fr: 'Aspirine pour prévention cardiovasculaire',
            en: 'Aspirin for cardiovascular prevention',
            pt: 'Aspirina para prevenção cardiovascular'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['28 tabs', '30 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['aspirine', 'cardio', 'antiagrégant'],
            en: ['aspirin', 'cardio', 'antiplatelet'],
            pt: ['aspirina', 'cardio', 'antiagregante']
        },
        atcCode: 'B01AC06'
    },

    // ============================================
    // TRAMADOL
    // ============================================
    {
        id: 'AA019',
        inn: 'Tramadol',
        name: {
            fr: 'Tramadol',
            en: 'Tramadol',
            pt: 'Tramadol'
        },
        brandNames: {
            global: ['Tramal', 'Contramal', 'Ultram'],
            regional: {
                west_africa_francophone: ['Contramal', 'Topalgic'],
                west_africa_anglophone: ['Tramal', 'Tramacet']
            }
        },
        form: 'capsule',
        dosage: '50mg',
        category: 'analgesics',
        description: {
            fr: 'Antalgique opioïde pour douleurs modérées à sévères',
            en: 'Opioid analgesic for moderate to severe pain',
            pt: 'Analgésico opioide para dores moderadas a graves'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['20 caps', '30 caps'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['tramadol', 'opioïde', 'douleur sévère', 'antalgique palier 2'],
            en: ['tramadol', 'opioid', 'severe pain', 'step 2 analgesic'],
            pt: ['tramadol', 'opioide', 'dor grave', 'analgésico nível 2']
        },
        atcCode: 'N02AX02'
    },
    {
        id: 'AA020',
        inn: 'Tramadol',
        name: {
            fr: 'Tramadol LP',
            en: 'Tramadol SR',
            pt: 'Tramadol LP'
        },
        brandNames: {
            global: ['Tramal LP', 'Contramal LP']
        },
        form: 'tablet',
        dosage: '100mg',
        category: 'analgesics',
        description: {
            fr: 'Tramadol libération prolongée pour douleur chronique',
            en: 'Sustained-release tramadol for chronic pain',
            pt: 'Tramadol libertação prolongada para dor crónica'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['30 tabs'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['tramadol', 'LP', 'douleur chronique'],
            en: ['tramadol', 'SR', 'chronic pain'],
            pt: ['tramadol', 'LP', 'dor crónica']
        },
        atcCode: 'N02AX02'
    },
    {
        id: 'AA021',
        inn: 'Tramadol',
        name: {
            fr: 'Tramadol injectable',
            en: 'Tramadol injection',
            pt: 'Tramadol injetável'
        },
        brandNames: {
            global: ['Tramal']
        },
        form: 'injection',
        dosage: '100mg/2ml',
        category: 'analgesics',
        description: {
            fr: 'Tramadol injectable pour douleur aiguë',
            en: 'Injectable tramadol for acute pain',
            pt: 'Tramadol injetável para dor aguda'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['5 amps', '10 amps'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['tramadol', 'injectable', 'douleur postopératoire'],
            en: ['tramadol', 'injectable', 'post-operative pain'],
            pt: ['tramadol', 'injetável', 'dor pós-operatória']
        },
        atcCode: 'N02AX02'
    },

    // ============================================
    // CODEINE COMBINATIONS
    // ============================================
    {
        id: 'AA022',
        inn: 'Paracetamol + Codeine',
        name: {
            fr: 'Paracétamol + Codéine',
            en: 'Paracetamol + Codeine',
            pt: 'Paracetamol + Codeína'
        },
        brandNames: {
            global: ['Dafalgan Codeine', 'Codoliprane', 'Co-codamol'],
            regional: {
                west_africa_francophone: ['Codoliprane', 'Klipal'],
                west_africa_anglophone: ['Co-codamol', 'Solpadeine']
            }
        },
        form: 'tablet',
        dosage: '500mg/30mg',
        category: 'analgesics',
        description: {
            fr: 'Antalgique palier 2 pour douleurs modérées',
            en: 'Step 2 analgesic for moderate pain',
            pt: 'Analgésico nível 2 para dores moderadas'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['16 tabs', '20 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['codéine', 'paracétamol', 'palier 2', 'douleur modérée'],
            en: ['codeine', 'paracetamol', 'step 2', 'moderate pain'],
            pt: ['codeína', 'paracetamol', 'nível 2', 'dor moderada']
        },
        atcCode: 'N02AA59'
    },

    // ============================================
    // MORPHINE
    // ============================================
    {
        id: 'AA023',
        inn: 'Morphine',
        name: {
            fr: 'Morphine',
            en: 'Morphine',
            pt: 'Morfina'
        },
        brandNames: {
            global: ['Morphine', 'Skenan']
        },
        form: 'tablet',
        dosage: '10mg',
        category: 'analgesics',
        description: {
            fr: 'Opioïde fort pour douleur sévère (cancer, postopératoire)',
            en: 'Strong opioid for severe pain (cancer, post-operative)',
            pt: 'Opioide forte para dor grave (cancro, pós-operatório)'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['14 tabs', '28 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['morphine', 'opioïde', 'douleur cancéreuse', 'palier 3'],
            en: ['morphine', 'opioid', 'cancer pain', 'step 3'],
            pt: ['morfina', 'opioide', 'dor oncológica', 'nível 3']
        },
        atcCode: 'N02AA01'
    },
    {
        id: 'AA024',
        inn: 'Morphine',
        name: {
            fr: 'Morphine injectable',
            en: 'Morphine injection',
            pt: 'Morfina injetável'
        },
        brandNames: {
            global: ['Morphine']
        },
        form: 'injection',
        dosage: '10mg/ml',
        category: 'analgesics',
        description: {
            fr: 'Morphine injectable pour douleur sévère aiguë',
            en: 'Injectable morphine for severe acute pain',
            pt: 'Morfina injetável para dor grave aguda'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['10 amps'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['morphine', 'injectable', 'urgence', 'douleur sévère'],
            en: ['morphine', 'injectable', 'emergency', 'severe pain'],
            pt: ['morfina', 'injetável', 'emergência', 'dor grave']
        },
        atcCode: 'N02AA01'
    },

    // ============================================
    // OTHER NSAIDS
    // ============================================
    {
        id: 'AA025',
        inn: 'Ketoprofen',
        name: {
            fr: 'Kétoprofène',
            en: 'Ketoprofen',
            pt: 'Cetoprofeno'
        },
        brandNames: {
            global: ['Profenid', 'Bi-Profenid']
        },
        form: 'tablet',
        dosage: '100mg',
        category: 'anti_inflammatory',
        description: {
            fr: 'AINS pour douleurs inflammatoires',
            en: 'NSAID for inflammatory pain',
            pt: 'AINE para dores inflamatórias'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['20 tabs'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa'],
        keywords: {
            fr: ['kétoprofène', 'AINS', 'inflammation'],
            en: ['ketoprofen', 'NSAID', 'inflammation'],
            pt: ['cetoprofeno', 'AINE', 'inflamação']
        },
        atcCode: 'M01AE03'
    },
    {
        id: 'AA026',
        inn: 'Piroxicam',
        name: {
            fr: 'Piroxicam',
            en: 'Piroxicam',
            pt: 'Piroxicam'
        },
        brandNames: {
            global: ['Feldene', 'Pirox']
        },
        form: 'capsule',
        dosage: '20mg',
        category: 'anti_inflammatory',
        description: {
            fr: 'AINS à longue durée d\'action',
            en: 'Long-acting NSAID',
            pt: 'AINE de longa duração'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['20 caps'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['piroxicam', 'AINS', 'arthrite'],
            en: ['piroxicam', 'NSAID', 'arthritis'],
            pt: ['piroxicam', 'AINE', 'artrite']
        },
        atcCode: 'M01AC01'
    },
    {
        id: 'AA027',
        inn: 'Meloxicam',
        name: {
            fr: 'Méloxicam',
            en: 'Meloxicam',
            pt: 'Meloxicam'
        },
        brandNames: {
            global: ['Mobic']
        },
        form: 'tablet',
        dosage: '15mg',
        category: 'anti_inflammatory',
        description: {
            fr: 'AINS COX-2 préférentiel',
            en: 'Preferential COX-2 NSAID',
            pt: 'AINE COX-2 preferencial'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['20 tabs', '30 tabs'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['méloxicam', 'AINS', 'arthrose', 'COX-2'],
            en: ['meloxicam', 'NSAID', 'osteoarthritis', 'COX-2'],
            pt: ['meloxicam', 'AINE', 'osteoartrite', 'COX-2']
        },
        atcCode: 'M01AC06'
    },
    {
        id: 'AA028',
        inn: 'Celecoxib',
        name: {
            fr: 'Célécoxib',
            en: 'Celecoxib',
            pt: 'Celecoxib'
        },
        brandNames: {
            global: ['Celebrex']
        },
        form: 'capsule',
        dosage: '200mg',
        category: 'anti_inflammatory',
        description: {
            fr: 'AINS inhibiteur sélectif de la COX-2',
            en: 'Selective COX-2 inhibitor NSAID',
            pt: 'AINE inibidor seletivo da COX-2'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['30 caps'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['célécoxib', 'COX-2', 'arthrite', 'estomac'],
            en: ['celecoxib', 'COX-2', 'arthritis', 'stomach'],
            pt: ['celecoxib', 'COX-2', 'artrite', 'estômago']
        },
        atcCode: 'M01AH01'
    }
];
