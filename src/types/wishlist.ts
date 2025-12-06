import type { Product, ProductVariant } from './product';

export interface WishlistItem {
  id: number;
  product: Product;
  productId: number;
  variantId: number;
  variant?: ProductVariant;
}

// DTO cho backend API
export interface WishlistItemDTO {
  id?: number;
  variantId: number;
  productId?: number;
  userId?: number;
  product?: Product;
  variant?: ProductVariant;
}

