export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  stockQuantity: number;
  isDefault: boolean;
  color?: string; 
}

export interface Product {
  id: number;
  code: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  category: string; 
  variants?: ProductVariant[];
}
