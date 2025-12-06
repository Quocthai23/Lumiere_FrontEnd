export interface Voucher {
  id: number;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usageCount?: number;
}

export interface VoucherCalculateRequestDTO {
  voucherCode: string;
  orderAmount: number;
}

export interface VoucherCalculateResponseDTO {
  discountAmount: number;
  finalAmount: number;
  voucher: Voucher;
}