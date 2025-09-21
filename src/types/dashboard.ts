
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
