import { Medicine } from '../medicine.model';

export interface MedicineExchangeItem {
  medicineId: string;
  quantity: number;
  medicine?: Medicine; // For UI display
}

export type ExchangeStatus = 'draft' | 'pending' | 'accepted' | 'rejected' | 'completed' | 'requested' | 'in_transit';
export type PriorityLevel = 'low' | 'medium' | 'high';

export interface MedicineExchange {
  id: string;
  proposedBy: string; // Pharmacy ID
  proposedTo: string; // Pharmacy ID
  status: ExchangeStatus;
  proposedMedicines: MedicineExchangeItem[];
  offeredMedicines: MedicineExchangeItem[];
  priority: PriorityLevel;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface ExchangeProposal {
  id: string;
  exchangeId: string;
  proposedBy: string;
  medicines: MedicineExchangeItem[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  responseDate?: Date;
  responseNotes?: string;
}