import type {AttachmentDTO} from "./types.ts";

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
  size?: string;
  urlImage?: string
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
  categoryId: string,
  material?: string; // Add material property
  variants?: ProductVariant[];
  averageRating: number;
  reviewCount: number;
  attachmentDTOS?: AttachmentDTO[];
}
