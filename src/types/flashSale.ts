export interface FlashSaleProductInfo {
  productId: number;
  salePrice: number;
  quantity: number; // Tổng số lượng bán trong đợt sale
  sold: number;     // Số lượng đã bán
}

export interface FlashSale {
  id: number;
  name: string;
  startTime: string; // ISO 8601 format
  endTime: string;   // ISO 8601 format
  products: FlashSaleProductInfo[];
}
