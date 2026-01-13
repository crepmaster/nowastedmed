import { Medicine } from '../medicine.model';

export interface MedicineExchangeItem {
  medicineId: string;
  quantity: number;
  medicine?: Medicine; // For UI display
}

export type ExchangeStatus = 'draft' | 'pending' | 'accepted' | 'rejected' | 'completed' | 'requested' | 'in_transit';
export type PriorityLevel = 'low' | 'medium' | 'high';

/**
 * Location info stored with exchange for filtering and validation
 */
export interface ExchangeLocation {
  countryCode: string;
  cityId: string;
  cityName: string;
}

export interface MedicineExchange {
  id: string;
  proposedBy: string; // Pharmacy ID
  proposedByName?: string; // Pharmacy name for display
  proposedTo: string; // Pharmacy ID (responder who submitted proposal)
  proposedToName?: string; // Pharmacy name for display
  status: ExchangeStatus;
  proposedMedicines: MedicineExchangeItem[];
  offeredMedicines: MedicineExchangeItem[];
  priority: PriorityLevel;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  // Location fields - REQUIRED for new exchanges
  location?: ExchangeLocation; // City where exchange takes place (must be same for both parties)
  // Proposal tracking - set when responder submits proposal
  lastProposalId?: string; // ID of the current/last proposal for easy accept/reject
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