
import type { Order } from './order';

export interface DashboardStats {
  totalRevenue: number;
  newOrdersCount: number;
  newCustomersCount: number;
  totalProducts: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentOrders: Order[];
}

// DTOs từ backend
export interface DashboardStatsDTO {
  totalRevenue: number;
  subscriptions?: number; // Khách hàng mới
  sales?: number; // Doanh số
  activeNow?: number; // Hoạt động
}

export interface MonthlyRevenueDTO {
  month: string;
  total: number;
}

export interface MonthlyCustomerDTO {
  month: string;
  count: number;
}

export interface TopProductDTO {
  name: string;
  total: number;
}

export interface RecentSaleDTO {
  name: string;
  email: string;
  amount: number;
}