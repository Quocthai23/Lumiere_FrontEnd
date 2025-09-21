import type { Product, ProductVariant } from './product';

export interface OrderItem {
  id: number;
  orderId: number;
  variantId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  nameSnapshot: string; 
  skuSnapshot: string;
  product?: Product; 
  variant?: ProductVariant;
}

export interface Order {
  id: number;
  customerId: number;
  code: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED'; 
  paymentStatus: 'PAID' | 'UNPAID';
  fulfillmentStatus: 'FULFILLED' | 'UNFULFILLED';
  totalAmount: number;
  currency: string;
  note?: string;
  placedAt: string;
  items: OrderItem[]; 
