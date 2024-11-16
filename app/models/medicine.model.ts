export interface Medicine {
  id: string;
  name: string;
  expiryDate: Date;
  quantity: number;
  pharmacyId: string;
  status: 'available' | 'pending' | 'exchanged';
  batchNumber: string;
}

export interface Exchange {
  id: string;
  medicineId: string;
  fromPharmacyId: string;
  toPharmacyId: string;
  courierId?: string;
  status: 'pending' | 'accepted' | 'in_transit' | 'completed';
  createdAt: Date;
  qrCode: string;
}