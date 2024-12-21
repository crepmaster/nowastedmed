export interface AdminStats {
    totalPharmacies: number;
    totalCouriers: number;
    totalExchanges: number;
    activeExchanges: number;
    totalMedicines: number;
    savingsAmount: number;
}

export interface UserApproval {
    id: string;
    type: 'pharmacy' | 'courier';
    status: 'pending' | 'approved' | 'rejected';
    submissionDate: Date;
    userData: any;
}