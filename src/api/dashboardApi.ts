import axiosClient from './axiosClient';
import type {
  DashboardStatsDTO,
  MonthlyRevenueDTO,
  MonthlyCustomerDTO,
  TopProductDTO,
  RecentSaleDTO,
} from '../types/dashboard';

/**
 * Lấy thống kê tổng quan cho dashboard
 */
export const getDashboardStats = async (): Promise<DashboardStatsDTO> => {
  const response = await axiosClient.get<DashboardStatsDTO>('/dashboard/stats');
  return response.data;
};

/**
 * Lấy doanh thu theo tháng trong năm hiện tại
 */
export const getRevenueByMonth = async (): Promise<MonthlyRevenueDTO[]> => {
  const response = await axiosClient.get<MonthlyRevenueDTO[]>('/dashboard/revenue-by-month');
  return response.data;
};

/**
 * Lấy số lượng khách hàng mới theo tháng trong năm hiện tại
 */
export const getNewCustomersByMonth = async (): Promise<MonthlyCustomerDTO[]> => {
  const response = await axiosClient.get<MonthlyCustomerDTO[]>('/dashboard/new-customers-by-month');
  return response.data;
};

/**
 * Lấy top sản phẩm bán chạy nhất
 * @param limit số lượng sản phẩm cần lấy (mặc định 5)
 */
export const getTopProducts = async (limit: number = 5): Promise<TopProductDTO[]> => {
  const response = await axiosClient.get<TopProductDTO[]>('/dashboard/top-products', {
    params: { limit },
  });
  return response.data;
};

/**
 * Lấy danh sách đơn hàng gần đây
 * @param limit số lượng đơn hàng cần lấy (mặc định 5)
 */
export const getRecentSales = async (limit: number = 5): Promise<RecentSaleDTO[]> => {
  const response = await axiosClient.get<RecentSaleDTO[]>('/dashboard/recent-sales', {
    params: { limit },
  });
  return response.data;
};

