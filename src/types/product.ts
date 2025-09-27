export interface Review {
  id: number;
  productId: number;
  rating: number;
  author: string;
  comment: string;
  createdAt: string;
}

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
  size?: string; // Add size property
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
  material?: string; // Add material property
  variants?: ProductVariant[];
  averageRating: number;
  reviewCount: number;
  images?: string[]; // Thêm trường hình ảnh
}
