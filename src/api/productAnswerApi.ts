import axiosClient from './axiosClient';
import type { ProductAnswerDTO } from '../types/productAnswer';

export const productAnswerApi = {
  // Create a new product answer
  createProductAnswer: async (data: Omit<ProductAnswerDTO, 'id' | 'createdAt'>): Promise<ProductAnswerDTO> => {
    const response = await axiosClient.post<ProductAnswerDTO>('/product-answers', data);
    return response.data;
  },

  // Update an existing product answer
  updateProductAnswer: async (id: number, data: Partial<ProductAnswerDTO>): Promise<ProductAnswerDTO> => {
    const response = await axiosClient.put<ProductAnswerDTO>(`/product-answers/${id}`, data);
    return response.data;
  },

  // Get all product answers
  getAllProductAnswers: async (): Promise<ProductAnswerDTO[]> => {
    const response = await axiosClient.get<ProductAnswerDTO[]>('/product-answers');
    return response.data;
  },

  // Get product answer by ID
  getProductAnswer: async (id: number): Promise<ProductAnswerDTO> => {
    const response = await axiosClient.get<ProductAnswerDTO>(`/product-answers/${id}`);
    return response.data;
  },

  // Delete product answer
  deleteProductAnswer: async (id: number): Promise<void> => {
    await axiosClient.delete(`/product-answers/${id}`);
  },
};

