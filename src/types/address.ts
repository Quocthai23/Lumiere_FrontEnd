export interface Address {
  id?: number;
  customerId?: number;
  fullName: string;
  phone: string;
  email?: string;
  provinceName: string;
  districtName: string;
  wardName?: string;
  addressLine: string;
  companyName?: string;
  taxCode?: string;
  note?: string;
  isDefault?: boolean;
}

// Backend DTO format
export interface CustomerInfoDTO {
  id?: number;
  customerId?: number;
  fullName: string;
  phone: string;
  email?: string;
  provinceName: string;
  districtName: string;
  wardName?: string;
  addressLine: string;
  companyName?: string;
  taxCode?: string;
  note?: string;
  isDefault?: boolean;
}
