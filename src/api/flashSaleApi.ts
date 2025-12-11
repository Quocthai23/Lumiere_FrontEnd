import httpClient from '../utils/HttpClient';
import type { FlashSale, FlashSaleProduct } from '../types/flashSale';

export const flashSaleApi = {
  // Get all flash sales
  getAllFlashSales: async (): Promise<FlashSale[]> => {
    return await httpClient.get<FlashSale[]>('/flash-sales');
  },

  // Get active flash sales
  getActiveFlashSales: async (): Promise<FlashSale[]> => {
    return await httpClient.get<FlashSale[]>('/flash-sales/active');
  },

  // Get upcoming flash sales
  getUpcomingFlashSales: async (): Promise<FlashSale[]> => {
    return await httpClient.get<FlashSale[]>('/flash-sales/upcoming');
  },

  // Get ended flash sales
  getEndedFlashSales: async (): Promise<FlashSale[]> => {
    return await httpClient.get<FlashSale[]>('/flash-sales/ended');
  },

  // Get current flash sale
  getCurrentFlashSale: async (): Promise<FlashSale | null> => {
    try {
      return await httpClient.get<FlashSale>('/flash-sales/current');
    } catch {
      return null;
    }
  },

  // Get flash sale by ID
  getFlashSale: async (id: number): Promise<FlashSale> => {
    return await httpClient.get<FlashSale>(`/flash-sales/${id}`);
  },

  // Create flash sale
  createFlashSale: async (data: Omit<FlashSale, 'id'>): Promise<FlashSale> => {
    return await httpClient.post<FlashSale>('/flash-sales', data);
  },

  // Update flash sale
  updateFlashSale: async (id: number, data: Partial<FlashSale>): Promise<FlashSale> => {
    return await httpClient.put<FlashSale>(`/flash-sales/${id}`, data);
  },

  // Delete flash sale
  deleteFlashSale: async (id: number): Promise<void> => {
    return await httpClient.delete(`/flash-sales/${id}`);
  },

  // Flash Sale Products
  // Get all flash sale products
  getAllFlashSaleProducts: async (): Promise<FlashSaleProduct[]> => {
    return await httpClient.get<FlashSaleProduct[]>('/flash-sale-products');
  },

  // Get flash sale products by flash sale ID
  getFlashSaleProductsByFlashSaleId: async (flashSaleId: number): Promise<FlashSaleProduct[]> => {
    return await httpClient.get<FlashSaleProduct[]>(`/flash-sale-products/flash-sale/${flashSaleId}`);
  },

  // Get flash sale product by ID
  getFlashSaleProduct: async (id: number): Promise<FlashSaleProduct> => {
    return await httpClient.get<FlashSaleProduct>(`/flash-sale-products/${id}`);
  },

  // Create flash sale product
  createFlashSaleProduct: async (data: Omit<FlashSaleProduct, 'id'>): Promise<FlashSaleProduct> => {
    return await httpClient.post<FlashSaleProduct>('/flash-sale-products', data);
  },

  // Update flash sale product
  updateFlashSaleProduct: async (id: number, data: Partial<FlashSaleProduct>): Promise<FlashSaleProduct> => {
    return await httpClient.put<FlashSaleProduct>(`/flash-sale-products/${id}`, data);
  },

  // Delete flash sale product
  deleteFlashSaleProduct: async (id: number): Promise<void> => {
    return await httpClient.delete(`/flash-sale-products/${id}`);
  },

  // Get available flash sale products
  getAvailableFlashSaleProducts: async (): Promise<FlashSaleProduct[]> => {
    return await httpClient.get<FlashSaleProduct[]>('/flash-sale-products/available');
  },
};

