export interface Medicine {
  id: string;
  name: string;
  expiryDate: Date;
  quantity: number;
  pharmacyId: string;
  pharmacyName?: string; // Added for display purposes
  status?: 'available' | 'for_exchange' | 'pending' | 'exchanged';
  batchNumber: string;
  exchangeQuantity?: number; // Quantity available for exchange
  availableForExchange?: boolean; // Whether medicine is available for exchange
  category?: string; // Medicine category (e.g., 'antibiotics', 'painkillers', 'general')
  price?: number; // Price per unit
}

export interface Exchange {
  id: string;
  medicineId: string;
  fromPharmacyId: string;
  toPharmacyId?: string;
  courierId?: string;
  status: 'pending' | 'accepted' | 'in_transit' | 'completed' | 'requested';
  createdAt: Date;
  qrCode: string;
  medicineName: string;
  fromPharmacyName: string;
  quantity: number;
}