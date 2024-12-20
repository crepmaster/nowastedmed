import { Observable } from '@nativescript/core';
import { Pharmacist } from '../../models/user.model';
import { DatabaseService } from '../database/database.service';

export class PharmacyCrudService extends Observable {
    private static instance: PharmacyCrudService;
    private databaseService: DatabaseService;

    private constructor() {
        super();
        this.databaseService = DatabaseService.getInstance();
    }

    static getInstance(): PharmacyCrudService {
        if (!PharmacyCrudService.instance) {
            PharmacyCrudService.instance = new PharmacyCrudService();
        }
        return PharmacyCrudService.instance;
    }

    async getAll(): Promise<Pharmacist[]> {
        return this.databaseService.getPharmacies();
    }

    async getById(id: string): Promise<Pharmacist | null> {
        return this.databaseService.getPharmacyById(id);
    }

    async create(pharmacy: Partial<Pharmacist>): Promise<Pharmacist> {
        return this.databaseService.createPharmacy(pharmacy);
    }

    async update(id: string, data: Partial<Pharmacist>): Promise<Pharmacist> {
        return this.databaseService.updatePharmacy(id, data);
    }

    async delete(id: string): Promise<boolean> {
        return this.databaseService.deletePharmacy(id);
    }
}