import type { Product, ProductVariant } from './product';

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
  id: number;
}

// DTO cho backend API
export interface CartItemDTO {
  id?: number;
  variantId: number;
  quantity: number;
  userId?: number;
  productVariant?: ProductVariant;
  product?: Product;
}

