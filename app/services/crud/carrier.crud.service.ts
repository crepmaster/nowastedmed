import { Observable } from '@nativescript/core';
import { Courier } from '../../models/user.model';
import { DatabaseService } from '../database/database.service';

export class CarrierCrudService extends Observable {
    private static instance: CarrierCrudService;
    private databaseService: DatabaseService;

    private constructor() {
        super();
        this.databaseService = DatabaseService.getInstance();
    }

    static getInstance(): CarrierCrudService {
        if (!CarrierCrudService.instance) {
            CarrierCrudService.instance = new CarrierCrudService();
        }
        return CarrierCrudService.instance;
    }

    async getAll(): Promise<Courier[]> {
        return this.databaseService.getCouriers();
    }

    async getById(id: string): Promise<Courier | null> {
        return this.databaseService.getCourierById(id);
    }

    async create(courier: Partial<Courier>): Promise<Courier> {
        return this.databaseService.createCourier(courier);
    }

    async update(id: string, data: Partial<Courier>): Promise<Courier> {
        return this.databaseService.updateCourier(id, data);
    }

    async delete(id: string): Promise<boolean> {
        return this.databaseService.deleteCourier(id);
    }
}