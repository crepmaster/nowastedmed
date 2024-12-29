export interface ExchangeValidationRule {
  type: 'expiry' | 'quantity' | 'priority';
  validate: (value: any) => boolean;
  message: string;
}

export interface ExchangeValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ExpiryDateRule {
  minimumDaysBeforeExpiry: number;
  maximumDaysBeforeExpiry?: number;
}