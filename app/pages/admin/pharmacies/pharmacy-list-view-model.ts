import { Observable } from '@nativescript/core';
import { AdminService } from '../../../services/admin.service';
import { Pharmacist } from '../../../models/user.model';

export class PharmacyListViewModel extends Observable {
    private adminService: AdminService;
    public pharmacies: Pharmacist[] = [];
    public isLoading: boolean = false;
    public errorMessage: string = '';

    constructor() {
        super();
        this.adminService = AdminService.getInstance();
        this.loadPharmacies();
    }

    async loadPharmacies() {
        try {
            this.set('isLoading', true);
            this.pharmacies = await this.adminService.getPharmacies();
            this.notifyPropertyChange('pharmacies', this.pharmacies);
        } catch (error) {
            console.error('Error loading pharmacies:', error);
            this.set('errorMessage', 'Failed to load pharmacies');
        } finally {
            this.set('isLoading', false);
        }
    }

    async onRefresh() {
        await this.loadPharmacies();
    }
}