/**
 * Antibiotics Database
 * Common antibiotics used in sub-Saharan Africa
 * Multi-language support: French, English, Portuguese
 */

import { MedicineDatabaseEntry } from '../medicine-database.model';

export const ANTIBIOTICS_DATA: MedicineDatabaseEntry[] = [
    // ============================================
    // PENICILLINS
    // ============================================
    {
        id: 'AB001',
        inn: 'Amoxicillin',
        name: {
            fr: 'Amoxicilline',
            en: 'Amoxicillin',
            pt: 'Amoxicilina'
        },
        brandNames: {
            global: ['Amoxil', 'Clamoxyl', 'Flemoxin'],
            regional: {
                west_africa_francophone: ['Agram', 'Amodex', 'Bristamox'],
                west_africa_anglophone: ['Amoxil', 'Moxatag'],
                east_africa: ['Amoxil', 'Biomox']
            }
        },
        form: 'capsule',
        dosage: '500mg',
        category: 'antibiotics',
        description: {
            fr: 'Antibiotique pénicilline à large spectre pour infections bactériennes',
            en: 'Broad-spectrum penicillin antibiotic for bacterial infections',
            pt: 'Antibiótico penicilina de amplo espectro para infecções bacterianas'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_moisture'],
        packageSizes: ['12 caps', '20 caps', '100 caps'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['amoxicilline', 'pénicilline', 'infection', 'antibiotique'],
            en: ['amoxicillin', 'penicillin', 'infection', 'antibiotic'],
            pt: ['amoxicilina', 'penicilina', 'infecção', 'antibiótico']
        },
        atcCode: 'J01CA04'
    },
    {
        id: 'AB002',
        inn: 'Amoxicillin',
        name: {
            fr: 'Amoxicilline',
            en: 'Amoxicillin',
            pt: 'Amoxicilina'
        },
        brandNames: {
            global: ['Amoxil', 'Clamoxyl']
        },
        form: 'capsule',
        dosage: '250mg',
        category: 'antibiotics',
        description: {
            fr: 'Antibiotique pénicilline à large spectre',
            en: 'Broad-spectrum penicillin antibiotic',
            pt: 'Antibiótico penicilina de amplo espectro'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_moisture'],
        packageSizes: ['12 caps', '20 caps', '100 caps'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['amoxicilline', 'pénicilline', 'infection'],
            en: ['amoxicillin', 'penicillin', 'infection'],
            pt: ['amoxicilina', 'penicilina', 'infecção']
        },
        atcCode: 'J01CA04'
    },
    {
        id: 'AB003',
        inn: 'Amoxicillin',
        name: {
            fr: 'Amoxicilline sirop',
            en: 'Amoxicillin suspension',
            pt: 'Amoxicilina suspensão'
        },
        brandNames: {
            global: ['Amoxil', 'Clamoxyl']
        },
        form: 'suspension',
        dosage: '125mg/5ml',
        category: 'antibiotics',
        description: {
            fr: 'Suspension pédiatrique antibiotique',
            en: 'Pediatric antibiotic suspension',
            pt: 'Suspensão antibiótica pediátrica'
        },
        prescriptionRequired: true,
        storageConditions: ['refrigerated'],
        packageSizes: ['60ml', '100ml'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['amoxicilline', 'sirop', 'enfant', 'pédiatrique'],
            en: ['amoxicillin', 'syrup', 'child', 'pediatric'],
            pt: ['amoxicilina', 'xarope', 'criança', 'pediátrico']
        },
        atcCode: 'J01CA04'
    },
    {
        id: 'AB004',
        inn: 'Amoxicillin',
        name: {
            fr: 'Amoxicilline sirop',
            en: 'Amoxicillin suspension',
            pt: 'Amoxicilina suspensão'
        },
        brandNames: {
            global: ['Amoxil', 'Clamoxyl']
        },
        form: 'suspension',
        dosage: '250mg/5ml',
        category: 'antibiotics',
        description: {
            fr: 'Suspension pédiatrique antibiotique dose forte',
            en: 'Pediatric antibiotic suspension higher strength',
            pt: 'Suspensão antibiótica pediátrica dose alta'
        },
        prescriptionRequired: true,
        storageConditions: ['refrigerated'],
        packageSizes: ['60ml', '100ml'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['amoxicilline', 'sirop', 'enfant', 'pédiatrique'],
            en: ['amoxicillin', 'syrup', 'child', 'pediatric'],
            pt: ['amoxicilina', 'xarope', 'criança', 'pediátrico']
        },
        atcCode: 'J01CA04'
    },
    {
        id: 'AB005',
        inn: 'Amoxicillin + Clavulanic Acid',
        name: {
            fr: 'Amoxicilline + Acide Clavulanique',
            en: 'Amoxicillin + Clavulanic Acid',
            pt: 'Amoxicilina + Ácido Clavulânico'
        },
        brandNames: {
            global: ['Augmentin', 'Clavamox', 'Co-Amoxiclav'],
            regional: {
                west_africa_francophone: ['Augmentin', 'Ciblor'],
                west_africa_anglophone: ['Augmentin', 'Clavulin']
            }
        },
        form: 'tablet',
        dosage: '625mg',
        category: 'antibiotics',
        description: {
            fr: 'Antibiotique combiné avec inhibiteur de bêta-lactamase',
            en: 'Combination antibiotic with beta-lactamase inhibitor',
            pt: 'Antibiótico combinado com inibidor de beta-lactamase'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_moisture'],
        packageSizes: ['14 tabs', '21 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['augmentin', 'clavulanate', 'infection résistante', 'co-amoxiclav'],
            en: ['augmentin', 'clavulanate', 'resistant infection', 'co-amoxiclav'],
            pt: ['augmentin', 'clavulanato', 'infecção resistente', 'co-amoxiclav']
        },
        atcCode: 'J01CR02'
    },
    {
        id: 'AB006',
        inn: 'Amoxicillin + Clavulanic Acid',
        name: {
            fr: 'Amoxicilline + Acide Clavulanique Fort',
            en: 'Amoxicillin + Clavulanic Acid Strong',
            pt: 'Amoxicilina + Ácido Clavulânico Forte'
        },
        brandNames: {
            global: ['Augmentin', 'Clavamox']
        },
        form: 'tablet',
        dosage: '1g',
        category: 'antibiotics',
        description: {
            fr: 'Antibiotique combiné haute dose',
            en: 'High dose combination antibiotic',
            pt: 'Antibiótico combinado dose alta'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_moisture'],
        packageSizes: ['14 tabs', '21 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['augmentin', 'clavulanate', 'infection résistante'],
            en: ['augmentin', 'clavulanate', 'resistant infection'],
            pt: ['augmentin', 'clavulanato', 'infecção resistente']
        },
        atcCode: 'J01CR02'
    },
    {
        id: 'AB007',
        inn: 'Amoxicillin + Clavulanic Acid',
        name: {
            fr: 'Amoxicilline + Acide Clavulanique sirop',
            en: 'Amoxicillin + Clavulanic Acid suspension',
            pt: 'Amoxicilina + Ácido Clavulânico suspensão'
        },
        brandNames: {
            global: ['Augmentin']
        },
        form: 'suspension',
        dosage: '457mg/5ml',
        category: 'antibiotics',
        description: {
            fr: 'Antibiotique combiné pédiatrique',
            en: 'Pediatric combination antibiotic',
            pt: 'Antibiótico combinado pediátrico'
        },
        prescriptionRequired: true,
        storageConditions: ['refrigerated'],
        packageSizes: ['70ml', '100ml'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['augmentin', 'sirop', 'enfant', 'pédiatrique'],
            en: ['augmentin', 'syrup', 'child', 'pediatric'],
            pt: ['augmentin', 'xarope', 'criança', 'pediátrico']
        },
        atcCode: 'J01CR02'
    },
    {
        id: 'AB008',
        inn: 'Ampicillin',
        name: {
            fr: 'Ampicilline',
            en: 'Ampicillin',
            pt: 'Ampicilina'
        },
        brandNames: {
            global: ['Pentrexyl', 'Totapen']
        },
        form: 'capsule',
        dosage: '500mg',
        category: 'antibiotics',
        description: {
            fr: 'Antibiotique pénicilline à large spectre',
            en: 'Broad-spectrum penicillin antibiotic',
            pt: 'Antibiótico penicilina de amplo espectro'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['20 caps', '100 caps'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['ampicilline', 'pénicilline'],
            en: ['ampicillin', 'penicillin'],
            pt: ['ampicilina', 'penicilina']
        },
        atcCode: 'J01CA01'
    },
    {
        id: 'AB009',
        inn: 'Ampicillin',
        name: {
            fr: 'Ampicilline injectable',
            en: 'Ampicillin injection',
            pt: 'Ampicilina injetável'
        },
        brandNames: {
            global: ['Pentrexyl']
        },
        form: 'injection',
        dosage: '1g',
        category: 'antibiotics',
        description: {
            fr: 'Antibiotique pénicilline injectable',
            en: 'Injectable penicillin antibiotic',
            pt: 'Antibiótico penicilina injetável'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['1 vial', '10 vials'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['ampicilline', 'injectable', 'IV', 'intraveineuse'],
            en: ['ampicillin', 'injectable', 'IV', 'intravenous'],
            pt: ['ampicilina', 'injetável', 'IV', 'intravenosa']
        },
        atcCode: 'J01CA01'
    },
    {
        id: 'AB010',
        inn: 'Benzylpenicillin',
        name: {
            fr: 'Benzylpénicilline (Pénicilline G)',
            en: 'Benzylpenicillin (Penicillin G)',
            pt: 'Benzilpenicilina (Penicilina G)'
        },
        brandNames: {
            global: ['Penicillin G', 'Crystapen']
        },
        form: 'injection',
        dosage: '1 million IU',
        category: 'antibiotics',
        description: {
            fr: 'Pénicilline injectable pour infections sévères',
            en: 'Injectable penicillin for severe infections',
            pt: 'Penicilina injetável para infecções graves'
        },
        prescriptionRequired: true,
        storageConditions: ['refrigerated'],
        packageSizes: ['1 vial', '10 vials'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['pénicilline G', 'injectable', 'infection sévère'],
            en: ['penicillin G', 'injectable', 'severe infection'],
            pt: ['penicilina G', 'injetável', 'infecção grave']
        },
        atcCode: 'J01CE01'
    },

    // ============================================
    // CEPHALOSPORINS
    // ============================================
    {
        id: 'AB011',
        inn: 'Cefixime',
        name: {
            fr: 'Céfixime',
            en: 'Cefixime',
            pt: 'Cefixima'
        },
        brandNames: {
            global: ['Oroken', 'Suprax'],
            regional: {
                west_africa_francophone: ['Oroken'],
                west_africa_anglophone: ['Suprax']
            }
        },
        form: 'tablet',
        dosage: '200mg',
        category: 'antibiotics',
        description: {
            fr: 'Céphalosporine de 3ème génération orale',
            en: 'Third-generation oral cephalosporin',
            pt: 'Cefalosporina de terceira geração oral'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['8 tabs', '10 tabs'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['céfixime', 'céphalosporine', 'oroken'],
            en: ['cefixime', 'cephalosporin', 'suprax'],
            pt: ['cefixima', 'cefalosporina']
        },
        atcCode: 'J01DD08'
    },
    {
        id: 'AB012',
        inn: 'Cefixime',
        name: {
            fr: 'Céfixime sirop',
            en: 'Cefixime suspension',
            pt: 'Cefixima suspensão'
        },
        brandNames: {
            global: ['Oroken']
        },
        form: 'suspension',
        dosage: '100mg/5ml',
        category: 'antibiotics',
        description: {
            fr: 'Céphalosporine orale pédiatrique',
            en: 'Pediatric oral cephalosporin',
            pt: 'Cefalosporina oral pediátrica'
        },
        prescriptionRequired: true,
        storageConditions: ['refrigerated'],
        packageSizes: ['60ml', '100ml'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa'],
        keywords: {
            fr: ['céfixime', 'sirop', 'enfant'],
            en: ['cefixime', 'syrup', 'child'],
            pt: ['cefixima', 'xarope', 'criança']
        },
        atcCode: 'J01DD08'
    },
    {
        id: 'AB013',
        inn: 'Ceftriaxone',
        name: {
            fr: 'Ceftriaxone',
            en: 'Ceftriaxone',
            pt: 'Ceftriaxona'
        },
        brandNames: {
            global: ['Rocephin', 'Ceftriaxone']
        },
        form: 'injection',
        dosage: '1g',
        category: 'antibiotics',
        description: {
            fr: 'Céphalosporine de 3ème génération injectable',
            en: 'Third-generation injectable cephalosporin',
            pt: 'Cefalosporina de terceira geração injetável'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['1 vial', '10 vials'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['ceftriaxone', 'rocéphine', 'injectable', 'infection sévère'],
            en: ['ceftriaxone', 'rocephin', 'injectable', 'severe infection'],
            pt: ['ceftriaxona', 'rocefin', 'injetável', 'infecção grave']
        },
        atcCode: 'J01DD04'
    },
    {
        id: 'AB014',
        inn: 'Ceftriaxone',
        name: {
            fr: 'Ceftriaxone',
            en: 'Ceftriaxone',
            pt: 'Ceftriaxona'
        },
        brandNames: {
            global: ['Rocephin']
        },
        form: 'injection',
        dosage: '500mg',
        category: 'antibiotics',
        description: {
            fr: 'Céphalosporine de 3ème génération injectable',
            en: 'Third-generation injectable cephalosporin',
            pt: 'Cefalosporina de terceira geração injetável'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['1 vial', '10 vials'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['ceftriaxone', 'rocéphine', 'injectable'],
            en: ['ceftriaxone', 'rocephin', 'injectable'],
            pt: ['ceftriaxona', 'rocefin', 'injetável']
        },
        atcCode: 'J01DD04'
    },
    {
        id: 'AB015',
        inn: 'Cefuroxime',
        name: {
            fr: 'Céfuroxime',
            en: 'Cefuroxime',
            pt: 'Cefuroxima'
        },
        brandNames: {
            global: ['Zinnat', 'Ceftin']
        },
        form: 'tablet',
        dosage: '500mg',
        category: 'antibiotics',
        description: {
            fr: 'Céphalosporine de 2ème génération orale',
            en: 'Second-generation oral cephalosporin',
            pt: 'Cefalosporina de segunda geração oral'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['10 tabs', '14 tabs'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['céfuroxime', 'zinnat', 'céphalosporine'],
            en: ['cefuroxime', 'zinnat', 'cephalosporin'],
            pt: ['cefuroxima', 'zinnat', 'cefalosporina']
        },
        atcCode: 'J01DC02'
    },

    // ============================================
    // MACROLIDES
    // ============================================
    {
        id: 'AB016',
        inn: 'Azithromycin',
        name: {
            fr: 'Azithromycine',
            en: 'Azithromycin',
            pt: 'Azitromicina'
        },
        brandNames: {
            global: ['Zithromax', 'Azithro'],
            regional: {
                west_africa_francophone: ['Zithromax', 'Azadose'],
                west_africa_anglophone: ['Zithromax', 'Z-Pak']
            }
        },
        form: 'tablet',
        dosage: '500mg',
        category: 'antibiotics',
        description: {
            fr: 'Macrolide, traitement de 3 jours',
            en: 'Macrolide antibiotic, 3-day course',
            pt: 'Antibiótico macrolídeo, tratamento de 3 dias'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['3 tabs', '6 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['azithromycine', 'macrolide', 'zithromax', 'z-pack'],
            en: ['azithromycin', 'macrolide', 'zithromax', 'z-pak'],
            pt: ['azitromicina', 'macrolídeo', 'zithromax']
        },
        atcCode: 'J01FA10'
    },
    {
        id: 'AB017',
        inn: 'Azithromycin',
        name: {
            fr: 'Azithromycine',
            en: 'Azithromycin',
            pt: 'Azitromicina'
        },
        brandNames: {
            global: ['Zithromax']
        },
        form: 'tablet',
        dosage: '250mg',
        category: 'antibiotics',
        description: {
            fr: 'Macrolide antibiotique',
            en: 'Macrolide antibiotic',
            pt: 'Antibiótico macrolídeo'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['6 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['azithromycine', 'macrolide'],
            en: ['azithromycin', 'macrolide'],
            pt: ['azitromicina', 'macrolídeo']
        },
        atcCode: 'J01FA10'
    },
    {
        id: 'AB018',
        inn: 'Azithromycin',
        name: {
            fr: 'Azithromycine sirop',
            en: 'Azithromycin suspension',
            pt: 'Azitromicina suspensão'
        },
        brandNames: {
            global: ['Zithromax']
        },
        form: 'suspension',
        dosage: '200mg/5ml',
        category: 'antibiotics',
        description: {
            fr: 'Suspension macrolide pédiatrique',
            en: 'Pediatric macrolide suspension',
            pt: 'Suspensão macrolídeo pediátrica'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['15ml', '22.5ml', '30ml'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['azithromycine', 'sirop', 'enfant', 'pédiatrique'],
            en: ['azithromycin', 'syrup', 'child', 'pediatric'],
            pt: ['azitromicina', 'xarope', 'criança', 'pediátrico']
        },
        atcCode: 'J01FA10'
    },
    {
        id: 'AB019',
        inn: 'Erythromycin',
        name: {
            fr: 'Érythromycine',
            en: 'Erythromycin',
            pt: 'Eritromicina'
        },
        brandNames: {
            global: ['Erythrocine', 'Ery']
        },
        form: 'tablet',
        dosage: '500mg',
        category: 'antibiotics',
        description: {
            fr: 'Macrolide classique antibiotique',
            en: 'Classic macrolide antibiotic',
            pt: 'Antibiótico macrolídeo clássico'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['20 tabs', '100 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['érythromycine', 'macrolide'],
            en: ['erythromycin', 'macrolide'],
            pt: ['eritromicina', 'macrolídeo']
        },
        atcCode: 'J01FA01'
    },

    // ============================================
    // FLUOROQUINOLONES
    // ============================================
    {
        id: 'AB020',
        inn: 'Ciprofloxacin',
        name: {
            fr: 'Ciprofloxacine',
            en: 'Ciprofloxacin',
            pt: 'Ciprofloxacino'
        },
        brandNames: {
            global: ['Ciflox', 'Cipro'],
            regional: {
                west_africa_francophone: ['Ciflox', 'Cifloxi'],
                west_africa_anglophone: ['Cipro', 'Ciproxin']
            }
        },
        form: 'tablet',
        dosage: '500mg',
        category: 'antibiotics',
        description: {
            fr: 'Fluoroquinolone pour infections urinaires et respiratoires',
            en: 'Fluoroquinolone for urinary and respiratory infections',
            pt: 'Fluoroquinolona para infecções urinárias e respiratórias'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['10 tabs', '20 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['ciprofloxacine', 'fluoroquinolone', 'infection urinaire', 'UTI'],
            en: ['ciprofloxacin', 'fluoroquinolone', 'urinary infection', 'UTI'],
            pt: ['ciprofloxacino', 'fluoroquinolona', 'infecção urinária']
        },
        atcCode: 'J01MA02'
    },
    {
        id: 'AB021',
        inn: 'Ciprofloxacin',
        name: {
            fr: 'Ciprofloxacine',
            en: 'Ciprofloxacin',
            pt: 'Ciprofloxacino'
        },
        brandNames: {
            global: ['Ciflox']
        },
        form: 'tablet',
        dosage: '250mg',
        category: 'antibiotics',
        description: {
            fr: 'Fluoroquinolone antibiotique',
            en: 'Fluoroquinolone antibiotic',
            pt: 'Antibiótico fluoroquinolona'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['10 tabs', '20 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['ciprofloxacine', 'fluoroquinolone'],
            en: ['ciprofloxacin', 'fluoroquinolone'],
            pt: ['ciprofloxacino', 'fluoroquinolona']
        },
        atcCode: 'J01MA02'
    },
    {
        id: 'AB022',
        inn: 'Levofloxacin',
        name: {
            fr: 'Lévofloxacine',
            en: 'Levofloxacin',
            pt: 'Levofloxacino'
        },
        brandNames: {
            global: ['Tavanic', 'Levaquin']
        },
        form: 'tablet',
        dosage: '500mg',
        category: 'antibiotics',
        description: {
            fr: 'Fluoroquinolone respiratoire',
            en: 'Respiratory fluoroquinolone',
            pt: 'Fluoroquinolona respiratória'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['5 tabs', '7 tabs', '10 tabs'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['lévofloxacine', 'fluoroquinolone', 'pneumonie'],
            en: ['levofloxacin', 'fluoroquinolone', 'pneumonia'],
            pt: ['levofloxacino', 'fluoroquinolona', 'pneumonia']
        },
        atcCode: 'J01MA12'
    },

    // ============================================
    // TETRACYCLINES
    // ============================================
    {
        id: 'AB023',
        inn: 'Doxycycline',
        name: {
            fr: 'Doxycycline',
            en: 'Doxycycline',
            pt: 'Doxiciclina'
        },
        brandNames: {
            global: ['Vibramycin', 'Doxy'],
            regional: {
                west_africa_francophone: ['Doxypalu', 'Doxylis'],
                west_africa_anglophone: ['Vibramycin']
            }
        },
        form: 'capsule',
        dosage: '100mg',
        category: 'antibiotics',
        description: {
            fr: 'Tétracycline, aussi utilisée en prophylaxie antipaludique',
            en: 'Tetracycline, also used for malaria prophylaxis',
            pt: 'Tetraciclina, também usada para profilaxia da malária'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['8 caps', '10 caps', '100 caps'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['doxycycline', 'tétracycline', 'paludisme', 'prophylaxie', 'acné'],
            en: ['doxycycline', 'tetracycline', 'malaria', 'prophylaxis', 'acne'],
            pt: ['doxiciclina', 'tetraciclina', 'malária', 'profilaxia', 'acne']
        },
        atcCode: 'J01AA02'
    },
    {
        id: 'AB024',
        inn: 'Doxycycline',
        name: {
            fr: 'Doxycycline',
            en: 'Doxycycline',
            pt: 'Doxiciclina'
        },
        brandNames: {
            global: ['Vibramycin']
        },
        form: 'tablet',
        dosage: '100mg',
        category: 'antibiotics',
        description: {
            fr: 'Tétracycline antibiotique comprimé',
            en: 'Tetracycline antibiotic tablet',
            pt: 'Comprimido antibiótico tetraciclina'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['10 tabs', '28 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['doxycycline', 'tétracycline'],
            en: ['doxycycline', 'tetracycline'],
            pt: ['doxiciclina', 'tetraciclina']
        },
        atcCode: 'J01AA02'
    },

    // ============================================
    // SULFONAMIDES
    // ============================================
    {
        id: 'AB025',
        inn: 'Sulfamethoxazole + Trimethoprim',
        name: {
            fr: 'Cotrimoxazole',
            en: 'Co-trimoxazole',
            pt: 'Cotrimoxazol'
        },
        brandNames: {
            global: ['Bactrim', 'Septrin', 'Cotrimoxazole']
        },
        form: 'tablet',
        dosage: '480mg',
        category: 'antibiotics',
        description: {
            fr: 'Antibiotique combiné pour diverses infections',
            en: 'Combination antibiotic for various infections',
            pt: 'Antibiótico combinado para várias infecções'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['20 tabs', '100 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['bactrim', 'cotrimoxazole', 'sulfamide', 'prophylaxie VIH'],
            en: ['bactrim', 'cotrimoxazole', 'sulfa', 'HIV prophylaxis'],
            pt: ['bactrim', 'cotrimoxazol', 'sulfa', 'profilaxia HIV']
        },
        atcCode: 'J01EE01'
    },
    {
        id: 'AB026',
        inn: 'Sulfamethoxazole + Trimethoprim',
        name: {
            fr: 'Cotrimoxazole Forte',
            en: 'Co-trimoxazole DS',
            pt: 'Cotrimoxazol Forte'
        },
        brandNames: {
            global: ['Bactrim Forte', 'Septrin DS']
        },
        form: 'tablet',
        dosage: '960mg',
        category: 'antibiotics',
        description: {
            fr: 'Antibiotique combiné dose double',
            en: 'Double-strength combination antibiotic',
            pt: 'Antibiótico combinado dose dupla'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['10 tabs', '20 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['bactrim forte', 'cotrimoxazole', 'double dose'],
            en: ['bactrim forte', 'cotrimoxazole', 'double strength'],
            pt: ['bactrim forte', 'cotrimoxazol', 'dose dupla']
        },
        atcCode: 'J01EE01'
    },
    {
        id: 'AB027',
        inn: 'Sulfamethoxazole + Trimethoprim',
        name: {
            fr: 'Cotrimoxazole sirop',
            en: 'Co-trimoxazole suspension',
            pt: 'Cotrimoxazol suspensão'
        },
        brandNames: {
            global: ['Bactrim']
        },
        form: 'suspension',
        dosage: '240mg/5ml',
        category: 'antibiotics',
        description: {
            fr: 'Antibiotique combiné pédiatrique',
            en: 'Pediatric combination antibiotic',
            pt: 'Antibiótico combinado pediátrico'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['100ml'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['bactrim', 'sirop', 'enfant', 'pédiatrique'],
            en: ['bactrim', 'syrup', 'child', 'pediatric'],
            pt: ['bactrim', 'xarope', 'criança', 'pediátrico']
        },
        atcCode: 'J01EE01'
    },

    // ============================================
    // AMINOGLYCOSIDES
    // ============================================
    {
        id: 'AB028',
        inn: 'Gentamicin',
        name: {
            fr: 'Gentamicine',
            en: 'Gentamicin',
            pt: 'Gentamicina'
        },
        brandNames: {
            global: ['Gentalline', 'Garamycin']
        },
        form: 'injection',
        dosage: '80mg/2ml',
        category: 'antibiotics',
        description: {
            fr: 'Aminoside injectable pour infections sévères',
            en: 'Injectable aminoglycoside for severe infections',
            pt: 'Aminoglicosídeo injetável para infecções graves'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['1 amp', '10 amps'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['gentamicine', 'aminoside', 'injectable', 'septicémie'],
            en: ['gentamicin', 'aminoglycoside', 'injectable', 'sepsis'],
            pt: ['gentamicina', 'aminoglicosídeo', 'injetável', 'septicemia']
        },
        atcCode: 'J01GB03'
    },
    {
        id: 'AB029',
        inn: 'Gentamicin',
        name: {
            fr: 'Gentamicine gouttes ophtalmiques',
            en: 'Gentamicin eye drops',
            pt: 'Gentamicina colírio'
        },
        brandNames: {
            global: ['Gentalline']
        },
        form: 'drops',
        dosage: '0.3%',
        category: 'antibiotics',
        description: {
            fr: 'Gouttes ophtalmiques aminoside',
            en: 'Aminoglycoside ophthalmic drops',
            pt: 'Colírio aminoglicosídeo'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['5ml', '10ml'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['gentamicine', 'gouttes', 'yeux', 'ophtalmique'],
            en: ['gentamicin', 'drops', 'eye', 'ophthalmic'],
            pt: ['gentamicina', 'colírio', 'olho', 'oftálmico']
        },
        atcCode: 'S01AA11'
    },

    // ============================================
    // NITROIMIDAZOLES
    // ============================================
    {
        id: 'AB030',
        inn: 'Metronidazole',
        name: {
            fr: 'Métronidazole',
            en: 'Metronidazole',
            pt: 'Metronidazol'
        },
        brandNames: {
            global: ['Flagyl', 'Metro'],
            regional: {
                west_africa_francophone: ['Flagyl', 'Métrozol'],
                west_africa_anglophone: ['Flagyl', 'MetroGel']
            }
        },
        form: 'tablet',
        dosage: '500mg',
        category: 'antibiotics',
        description: {
            fr: 'Antibiotique pour infections anaérobies et parasitaires',
            en: 'Antibiotic for anaerobic and parasitic infections',
            pt: 'Antibiótico para infecções anaeróbicas e parasitárias'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['14 tabs', '20 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'west_africa_lusophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['métronidazole', 'flagyl', 'anaérobie', 'amibiase', 'giardia'],
            en: ['metronidazole', 'flagyl', 'anaerobic', 'amoeba', 'giardia'],
            pt: ['metronidazol', 'flagyl', 'anaeróbico', 'ameba', 'giárdia']
        },
        atcCode: 'J01XD01'
    },
    {
        id: 'AB031',
        inn: 'Metronidazole',
        name: {
            fr: 'Métronidazole',
            en: 'Metronidazole',
            pt: 'Metronidazol'
        },
        brandNames: {
            global: ['Flagyl']
        },
        form: 'tablet',
        dosage: '250mg',
        category: 'antibiotics',
        description: {
            fr: 'Antibiotique pour infections anaérobies',
            en: 'Antibiotic for anaerobic infections',
            pt: 'Antibiótico para infecções anaeróbicas'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['20 tabs'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['métronidazole', 'flagyl'],
            en: ['metronidazole', 'flagyl'],
            pt: ['metronidazol', 'flagyl']
        },
        atcCode: 'J01XD01'
    },
    {
        id: 'AB032',
        inn: 'Metronidazole',
        name: {
            fr: 'Métronidazole sirop',
            en: 'Metronidazole suspension',
            pt: 'Metronidazol suspensão'
        },
        brandNames: {
            global: ['Flagyl']
        },
        form: 'suspension',
        dosage: '125mg/5ml',
        category: 'antibiotics',
        description: {
            fr: 'Suspension métronidazole pédiatrique',
            en: 'Pediatric metronidazole suspension',
            pt: 'Suspensão pediátrica de metronidazol'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['120ml'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['métronidazole', 'sirop', 'enfant'],
            en: ['metronidazole', 'syrup', 'child'],
            pt: ['metronidazol', 'xarope', 'criança']
        },
        atcCode: 'J01XD01'
    },
    {
        id: 'AB033',
        inn: 'Metronidazole',
        name: {
            fr: 'Métronidazole injectable',
            en: 'Metronidazole IV',
            pt: 'Metronidazol injetável'
        },
        brandNames: {
            global: ['Flagyl']
        },
        form: 'injection',
        dosage: '500mg/100ml',
        category: 'antibiotics',
        description: {
            fr: 'Perfusion métronidazole injectable',
            en: 'Metronidazole IV infusion',
            pt: 'Infusão injetável de metronidazol'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature', 'protect_from_light'],
        packageSizes: ['1 bag'],
        isEssentialMedicine: true,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['métronidazole', 'IV', 'perfusion', 'injectable'],
            en: ['metronidazole', 'IV', 'infusion', 'injectable'],
            pt: ['metronidazol', 'IV', 'infusão', 'injetável']
        },
        atcCode: 'J01XD01'
    },
    {
        id: 'AB034',
        inn: 'Tinidazole',
        name: {
            fr: 'Tinidazole',
            en: 'Tinidazole',
            pt: 'Tinidazol'
        },
        brandNames: {
            global: ['Fasigyn']
        },
        form: 'tablet',
        dosage: '500mg',
        category: 'antibiotics',
        description: {
            fr: 'Nitroimidazole pour infections parasitaires',
            en: 'Nitroimidazole for parasitic infections',
            pt: 'Nitroimidazol para infecções parasitárias'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['4 tabs'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa', 'southern_africa'],
        keywords: {
            fr: ['tinidazole', 'giardia', 'amibiase'],
            en: ['tinidazole', 'giardia', 'amoeba'],
            pt: ['tinidazol', 'giárdia', 'ameba']
        },
        atcCode: 'J01XD02'
    },
    {
        id: 'AB035',
        inn: 'Secnidazole',
        name: {
            fr: 'Secnidazole',
            en: 'Secnidazole',
            pt: 'Secnidazol'
        },
        brandNames: {
            global: ['Secnol', 'Flagentyl']
        },
        form: 'tablet',
        dosage: '1g',
        category: 'antibiotics',
        description: {
            fr: 'Traitement dose unique pour infections parasitaires',
            en: 'Single-dose treatment for parasitic infections',
            pt: 'Tratamento dose única para infecções parasitárias'
        },
        prescriptionRequired: true,
        storageConditions: ['room_temperature'],
        packageSizes: ['2 tabs'],
        isEssentialMedicine: false,
        availableRegions: ['west_africa_francophone', 'west_africa_anglophone', 'central_africa', 'east_africa'],
        keywords: {
            fr: ['secnidazole', 'dose unique', 'giardia'],
            en: ['secnidazole', 'single dose', 'giardia'],
            pt: ['secnidazol', 'dose única', 'giárdia']
        },
        atcCode: 'P01AB07'
    }
];
