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
