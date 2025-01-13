export class PharmacyDashboardViewModel extends Observable {
    // ... existing properties ...
    public availableMedicines: Medicine[] = [];

    constructor() {
        super();
        this.navigationService = NavigationService.getInstance();
        this.authService = AuthService.getInstance();
        this.medicineService = MedicineService.getInstance();
        this.loadData();
    }

    async loadData() {
        try {
            const user = this.authService.getCurrentUser();
            if (!user) {
                console.error('No user found');
                return;
            }

            // Load my medicines
            const medicines = await this.medicineService.getMedicinesByPharmacy(user.id);
            this.set('medicines', medicines);
            this.updateStats(medicines);

            // Load available medicines from other pharmacies
            const availableMedicines = await this.medicineService.getAvailableMedicinesForExchange(user.id);
            this.set('availableMedicines', availableMedicines);
        } catch (error) {
            console.error('Error loading pharmacy data:', error);
        }
    }

    // ... existing methods ...

    async onRequestExchange(args: any) {
        const medicine = args.object.bindingContext;
        this.navigationService.navigate({
            moduleName: 'pages/pharmacy/exchange/create-exchange-page',
            context: { medicine, isRequest: true }
        });
    }
}