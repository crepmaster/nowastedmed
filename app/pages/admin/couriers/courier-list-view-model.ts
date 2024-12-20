import { Observable } from '@nativescript/core';
import { CarrierCrudService } from '../../../services/crud/carrier.crud.service';
import { NavigationService } from '../../../services/navigation.service';
import { Courier } from '../../../models/user.model';

export class CourierListViewModel extends Observable {
    private carrierCrudService: CarrierCrudService;
    private navigationService: NavigationService;
    
    public couriers: Courier[] = [];
    public isLoading: boolean = false;
    public errorMessage: string = '';
    public searchQuery: string = '';

    constructor() {
        super();
        this.carrierCrudService = CarrierCrudService.getInstance();
        this.navigationService = NavigationService.getInstance();
        this.loadCouriers();
    }

    async loadCouriers() {
        try {
            this.set('isLoading', true);
            this.set('errorMessage', '');
            const couriers = await this.carrierCrudService.getAll();
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

    onEditCourier(args: any) {
        const courier = args.object.bindingContext;
        this.navigationService.navigate({
            moduleName: 'pages/admin/couriers/courier-form-page',
            context: { mode: 'edit', courierId: courier.id }
        });
    }

    async onDeleteCourier(args: any) {
        try {
            const courier = args.object.bindingContext;
            await this.carrierCrudService.delete(courier.id);
            await this.loadCouriers();
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
            courier.name.toLowerCase().includes(query) ||
            courier.email.toLowerCase().includes(query)
        );
    }
}