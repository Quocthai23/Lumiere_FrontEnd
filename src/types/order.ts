import type { Product, ProductVariant } from './product';

export interface OrderStatusHistory {
  id: number;
  orderId: number;
  status: string;
  timestamp: string;
  description: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  variantId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productVariant?: ProductVariant;
}

export interface Order {
  id: number;
  customer?: { id: number };
  code: string;
  status: 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'CANCELLED' | 'DELIVERED' | 'SHIPPING' | 'CONFIRMED'; 
  paymentStatus: 'PAID' | 'UNPAID' | 'REFUNDED';
  fulfillmentStatus: 'FULFILLED' | 'UNFULFILLED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'FAILED';
  totalAmount: number;
  currency: string;
  note?: string;
  placedAt: string;
  orderItems?: OrderItem[]; 
  paymentMethod?: string;
  orderStatusHistory?: OrderStatusHistory[];
}
