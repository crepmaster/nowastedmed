import { Observable } from '@nativescript/core';
import { 
  ExchangeValidationRule,
  ExchangeValidationResult,
  ExpiryDateRule 
} from '../../models/exchange/exchange-validation.model';
import { MedicineExchange } from '../../models/exchange/medicine-exchange.model';

export class ValidationService extends Observable {
  private static instance: ValidationService;
  private expiryRule: ExpiryDateRule = {
    minimumDaysBeforeExpiry: 30
  };

  private constructor() {
    super();
  }

  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  async validateExchange(exchange: Partial<MedicineExchange>): Promise<ExchangeValidationResult> {
    const errors: string[] = [];

    // Basic validation
    if (!exchange.proposedBy || !exchange.proposedTo) {
      errors.push('Both proposing and receiving pharmacies must be specified');
    }

    if (!exchange.proposedMedicines?.length) {
      errors.push('At least one medicine must be proposed for exchange');
    }

    // Validate medicines
    if (exchange.proposedMedicines) {
      for (const item of exchange.proposedMedicines) {
        if (!item.medicineId || item.quantity <= 0) {
          errors.push('Invalid medicine or quantity in proposed medicines');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateExpiryDate(expiryDate: Date): boolean {
    const today = new Date();
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry >= this.expiryRule.minimumDaysBeforeExpiry;
  }
}