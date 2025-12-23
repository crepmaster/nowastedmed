import { Observable } from '@nativescript/core';
import { NavigationService } from '../../../services/navigation.service';
import { AuthService } from '../../../services/auth.service';
import { MedicineService } from '../../../services/medicine.service';
import { MedicineFirebaseService } from '../../../services/firebase/medicine-firebase.service';
import { Medicine } from '../../../models/medicine.model';
import { prompt } from "@nativescript/core/ui/dialogs";

export class PharmacyDashboardViewModel extends Observable {
    private navigationService: NavigationService;
    private authService: AuthService;
    private medicineService: MedicineService;
    private medicineFirebaseService: MedicineFirebaseService;
    private useFirebase: boolean = true; // Set to false for offline mode
    private unsubscribe: (() => void) | null = null;

    public medicines: Medicine[] = [];
    public selectedTabIndex: number = 0;
    public isLoading: boolean = false;
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
        this.medicineFirebaseService = MedicineFirebaseService.getInstance();

        // Bind methods
        this.onMakeAvailable = this.onMakeAvailable.bind(this);

        this.loadData();
        this.setupRealtimeUpdates();
    }

    /**
     * Setup real-time updates from Firestore
     */
    private setupRealtimeUpdates() {
        if (!this.useFirebase) return;

        const user = this.authService.getCurrentUser();
        if (!user) return;

        this.unsubscribe = this.medicineFirebaseService.subscribeToPharmacyInventory(
            user.id,
            (medicines) => {
                this.medicines = medicines;
                this.updateStats();
                this.notifyPropertyChange('medicines', this.medicines);
            }
        );
    }

    /**
     * Cleanup subscriptions when view is destroyed
     */
    onUnloaded() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
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

                let success: boolean;
                if (this.useFirebase) {
                    success = await this.medicineFirebaseService.makeAvailableForExchange(
                        medicine.id,
                        quantity
                    );
                } else {
                    success = await this.medicineService.makeAvailableForExchange(
                        medicine.id,
                        quantity
                    );
                }

                if (success) {
                    // Real-time updates will refresh automatically if using Firebase
                    if (!this.useFirebase) {
                        await this.loadData();
                    }
                } else {
                    alert("Failed to make medicine available");
                }
            }
        } catch (error) {
            console.error('Error making medicine available:', error);
            alert("An error occurred");
        }
    }

    async loadData() {
        try {
            this.set('isLoading', true);
            const user = this.authService.getCurrentUser();
            if (user) {
                if (this.useFirebase) {
                    this.medicines = await this.medicineFirebaseService.getMedicinesByPharmacy(user.id);
                } else {
                    this.medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
                }
                this.updateStats();
                this.notifyPropertyChange('medicines', this.medicines);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            this.set('isLoading', false);
        }
    }

    private updateStats() {
        this.stats = {
            available: this.medicines.filter(m => m.status === 'available').length,
            pending: this.medicines.filter(m => m.status === 'pending' || m.status === 'for_exchange').length,
            exchanged: this.medicines.filter(m => m.status === 'exchanged').length
        };
        this.notifyPropertyChange('stats', this.stats);
    }

    onAddMedicine() {
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/medicine/add-medicine-page'
        });
    }

    onViewExchanges() {
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/exchange/exchange-list-page'
        });
    }

    onLogout() {
        this.authService.logout();
        this.navigationService.navigate({
            moduleName: 'pages/login/login-page',
            clearHistory: true
        });
    }
}