import { Voucher } from './voucher';

export interface CustomerVoucherDTO {
  id: number;
  voucher: Voucher;
  giftedAt: string;
  quarter: string;
  used: boolean;
}

