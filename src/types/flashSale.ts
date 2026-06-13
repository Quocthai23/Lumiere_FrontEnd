import type { ProductVariant } from './product';

export interface FlashSaleProduct {
  id?: number;
  salePrice: number;
  quantity: number; // Tổng số lượng bán trong đợt sale
  sold: number;     // Số lượng đã bán
  flashSale?: FlashSale;
  productVariant?: ProductVariant;
}

export interface FlashSale {
  id?: number;
  name: string;
  startTime: string; // ISO 8601 format
  endTime: string;   // ISO 8601 format
  products?: FlashSaleProduct[];
}

// Legacy interface for backward compatibility
export interface FlashSaleProductInfo {
  productId: number;
  salePrice: number;
  quantity: number;
  sold: number;
}
