import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { AuthService } from '../../../services/auth.service';
import { MedicineService } from '../../../services/medicine.service';
import { Medicine } from '../../../models/medicine.model';
import { prompt } from "@nativescript/core/ui/dialogs";

export class PharmacyDashboardViewModel extends Observable {
    private navigationService: NavigationService;
    private authService: AuthService;
    private medicineService: MedicineService;

    public medicines: Medicine[] = [];
    public selectedTabIndex: number = 0;
    public stats = {
        available: 0,
        pending: 0,
        exchanged: 0
    };

    constructor() {
        super();
        this.navigationService = NavigationService.getInstance();
        this.authService = AuthService.getInstance();
        this.medicineService = MedicineService.getInstance();
        
        // Bind methods
        this.onMakeAvailable = this.onMakeAvailable.bind(this);
        
        this.loadData();
    }

    async onMakeAvailable(args: any) {
        const medicine = args.object.bindingContext;
        
        try {
            const result = await prompt({
                title: "Make Available for Exchange",
                message: "Enter quantity to make available:",
                inputType: "number",
                defaultText: "0",
                okButtonText: "Confirm",
                cancelButtonText: "Cancel"
            });

            if (result.result) {
                const quantity = parseInt(result.text, 10);
                
                if (isNaN(quantity) || quantity <= 0) {
                    alert("Please enter a valid quantity");
                    return;
                }

                if (quantity > medicine.quantity) {
                    alert("Cannot exceed available quantity");
                    return;
                }

                const success = await this.medicineService.makeAvailableForExchange(
                    medicine.id,
                    quantity
                );

                if (success) {
                    await this.loadData(); // Refresh the data
                } else {
                    alert("Failed to make medicine available");
                }
            }
        } catch (error) {
            console.error('Error making medicine available:', error);
            alert("An error occurred");
        }
    }

    // ... rest of the existing methods ...
}