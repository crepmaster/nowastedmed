export class CreateExchangeViewModel extends Observable {
    // ... existing properties ...

    async onSubmit() {
        try {
            if (!this.validateForm()) return;

            const user = this.authService.getCurrentUser();
            if (!user) {
                this.set('errorMessage', 'User not logged in');
                return;
            }

            // First make the medicine available for exchange
            const success = await this.medicineService.makeAvailableForExchange(
                this.medicine.id,
                this.exchangeQuantity
            );

            if (!success) {
                this.set('errorMessage', 'Failed to make medicine available for exchange');
                return;
            }

            // Create the exchange record
            await this.exchangeService.createExchange({
                proposedBy: user.id,
                status: 'pending',
                priority: this.priorityLevels[this.selectedPriorityIndex].toLowerCase(),
                proposedMedicines: [{
                    medicineId: this.medicine.id,
                    quantity: this.exchangeQuantity,
                    medicine: this.medicine
                }],
                offeredMedicines: [],
                notes: this.notes
            });

            this.navigationService.navigate({
                moduleName: 'pages/pharmacy/dashboard/pharmacy-dashboard-page',
                clearHistory: true
            });
        } catch (error) {
            console.error('Error making medicine available:', error);
            this.set('errorMessage', 'Failed to make medicine available');
        }
    }
}