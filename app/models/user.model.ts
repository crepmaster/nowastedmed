export interface User {
  id: string;
  email: string;
  role: 'pharmacist' | 'courier' | 'admin';
  name: string;
  phoneNumber: string;
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