import { Observable } from '@nativescript/core';
import { PharmacyCrudService } from '../../../services/crud/pharmacy.crud.service';
import { NavigationService } from '../../../services/navigation.service';
import { Pharmacist } from '../../../models/user.model';
import { confirm } from '@nativescript/core/ui/dialogs';

export class PharmacyListViewModel extends Observable {
    private pharmacyCrudService: PharmacyCrudService;
    private navigationService: NavigationService;
    
    public pharmacies: Pharmacist[] = [];
    public isLoading: boolean = false;
    public errorMessage: string = '';
    public searchQuery: string = '';

    constructor() {
        super();
        this.pharmacyCrudService = PharmacyCrudService.getInstance();
        this.navigationService = NavigationService.getInstance();
        this.loadPharmacies();

        // Bind methods to maintain correct 'this' context
        this.onEditPharmacy = this.onEditPharmacy.bind(this);
        this.onDeletePharmacy = this.onDeletePharmacy.bind(this);
        this.onSearchQueryChanged = this.onSearchQueryChanged.bind(this);
    }

    async loadPharmacies() {
        try {
            this.set('isLoading', true);
            this.set('errorMessage', '');
            const pharmacies = await this.pharmacyCrudService.getAll();
            this.set('pharmacies', this.filterPharmacies(pharmacies));
        } catch (error) {
            console.error('Error loading pharmacies:', error);
            this.set('errorMessage', 'Failed to load pharmacies');
        } finally {
            this.set('isLoading', false);
        }
    }

    onAddPharmacy() {
        this.navigationService.navigate({
            moduleName: 'pages/admin/pharmacies/pharmacy-form-page',
            context: { mode: 'create' }
        });
    }

    onEditPharmacy(args: any) {
        try {
            const pharmacy = args.object.bindingContext;
            console.log('Editing pharmacy:', pharmacy);
            this.navigationService.navigate({
                moduleName: 'pages/admin/pharmacies/pharmacy-form-page',
                context: { mode: 'edit', pharmacyId: pharmacy.id }
            });
        } catch (error) {
            console.error('Error navigating to edit:', error);
            this.set('errorMessage', 'Failed to open edit form');
        }
    }

    async onDeletePharmacy(args: any) {
        try {
            const pharmacy = args.object.bindingContext;
            console.log('Deleting pharmacy:', pharmacy);
            
            const result = await confirm({
                title: "Delete Pharmacy",
                message: `Are you sure you want to delete ${pharmacy.pharmacyName}?`,
                okButtonText: "Delete",
                cancelButtonText: "Cancel"
            });

            if (result) {
                const success = await this.pharmacyCrudService.delete(pharmacy.id);
                if (success) {
                    await this.loadPharmacies();
                } else {
                    this.set('errorMessage', 'Failed to delete pharmacy');
                }
            }
        } catch (error) {
            console.error('Error deleting pharmacy:', error);
            this.set('errorMessage', 'Failed to delete pharmacy');
        }
    }

    onSearchQueryChanged() {
        this.set('pharmacies', this.filterPharmacies(this.pharmacies));
    }

    private filterPharmacies(pharmacies: Pharmacist[]): Pharmacist[] {
        if (!this.searchQuery) return pharmacies;
        
        const query = this.searchQuery.toLowerCase();
        return pharmacies.filter(pharmacy => 
            pharmacy.pharmacyName?.toLowerCase().includes(query) ||
            pharmacy.email.toLowerCase().includes(query)
        );
    }
}