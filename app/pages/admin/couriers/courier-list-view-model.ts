import { Observable } from '@nativescript/core';
import { CourierCrudService } from '../../../services/crud/courier.crud.service';
import { NavigationService } from '../../../services/navigation.service';
import { Courier } from '../../../models/user.model';
import { confirm } from '@nativescript/core/ui/dialogs';

export class CourierListViewModel extends Observable {
    private courierCrudService: CourierCrudService;
    private navigationService: NavigationService;
    
    public couriers: Courier[] = [];
    public isLoading: boolean = false;
    public errorMessage: string = '';
    public searchQuery: string = '';

    constructor() {
        super();
        this.courierCrudService = CourierCrudService.getInstance();
        this.navigationService = NavigationService.getInstance();
        
        // Bind methods to maintain correct 'this' context
        this.onEditCourier = this.onEditCourier.bind(this);
        this.onDeleteCourier = this.onDeleteCourier.bind(this);
        this.onSearchQueryChanged = this.onSearchQueryChanged.bind(this);
        
        this.loadCouriers();
    }

    async loadCouriers() {
        try {
            this.set('isLoading', true);
            this.set('errorMessage', '');
            const couriers = await this.courierCrudService.getAll();
            this.set('couriers', this.filterCouriers(couriers));
        } catch (error) {
            console.error('Error loading couriers:', error);
            this.set('errorMessage', 'Failed to load couriers');
        } finally {
            this.set('isLoading', false);
        }
    }

    onAddCourier() {
        this.navigationService.navigate({
            moduleName: 'pages/admin/couriers/courier-form-page',
            context: { mode: 'create' }
        });
    }

    async onEditCourier(args: any) {
        try {
            const courier = args.object.bindingContext;
            console.log('Editing courier:', courier);
            this.navigationService.navigate({
                moduleName: 'pages/admin/couriers/courier-form-page',
                context: { mode: 'edit', courierId: courier.id }
            });
        } catch (error) {
            console.error('Error navigating to edit:', error);
            this.set('errorMessage', 'Failed to open edit form');
        }
    }

    async onDeleteCourier(args: any) {
        try {
            const courier = args.object.bindingContext;
            console.log('Deleting courier:', courier);
            
            const result = await confirm({
                title: "Delete Courier",
                message: `Are you sure you want to delete ${courier.name}?`,
                okButtonText: "Delete",
                cancelButtonText: "Cancel"
            });

            if (result) {
                const success = await this.courierCrudService.delete(courier.id);
                if (success) {
                    await this.loadCouriers();
                } else {
                    this.set('errorMessage', 'Failed to delete courier');
                }
            }
        } catch (error) {
            console.error('Error deleting courier:', error);
            this.set('errorMessage', 'Failed to delete courier');
        }
    }

    onSearchQueryChanged() {
        this.set('couriers', this.filterCouriers(this.couriers));
    }

    private filterCouriers(couriers: Courier[]): Courier[] {
        if (!this.searchQuery) return couriers;
        
        const query = this.searchQuery.toLowerCase();
        return couriers.filter(courier => 
            courier.name?.toLowerCase().includes(query) ||
            courier.email.toLowerCase().includes(query)
        );
    }
}