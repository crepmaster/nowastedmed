export type UserRole = 'pharmacist' | 'courier' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phoneNumber: string;
  password?: string;
  pharmacyName?: string;
  address?: string;
  license?: string;
  licenseNumber?: string;
  vehicleType?: string;
  isActive?: boolean;
  createdAt?: Date | any;
}

export interface Pharmacist extends User {
  pharmacyName: string;
  address: string;
  license: string;
}

export interface Courier extends User {
  vehicleType: string;
  licenseNumber: string;
}