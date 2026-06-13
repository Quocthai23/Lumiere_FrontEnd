import axiosClient from './axiosClient';
import type { Question, Answer } from '../types/qa';

export const qaApi = {
  // Public endpoints (no auth required)
  // Submit a new question from customer
  submitQuestion: async (data: Omit<Question, 'id' | 'createdAt' | 'answers'>): Promise<Question> => {
    const response = await axiosClient.post<Question>('/qas', data);
    return response.data;
  },

  // Get questions by product ID (public)
  getQuestionsByProduct: async (productId: number): Promise<Question[]> => {
    const response = await axiosClient.get<Question[]>(`/qas?productId.equals=${productId}&sort=createdAt,desc`);
    return response.data;
  },

  // Admin endpoints (require auth)
  // Get all questions with pagination
  getAllQuestions: async (page: number = 0, size: number = 10, productId?: number): Promise<{
    content: Question[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> => {
    const params: any = { page, size };
    if (productId) {
      params['productId.equals'] = productId;
    }
    const response = await axiosClient.get<Question[] | { content: Question[]; totalElements: number; totalPages: number; size: number; number: number }>('/qas', { params });
    
    // Handle both array response and paginated response
    if (Array.isArray(response.data)) {
      const totalElements = parseInt(response.headers['x-total-count'] || response.headers['x-total-elements'] || '0');
      const totalPages = totalElements > 0 ? Math.ceil(totalElements / size) : 1;
      
      return {
        content: response.data,
        totalElements,
        totalPages,
        size,
        number: page
      };
    } else {
      const pageData = response.data as { content: Question[]; totalElements: number; totalPages: number; size: number; number: number };
      return {
        content: pageData.content || [],
        totalElements: pageData.totalElements || 0,
        totalPages: pageData.totalPages || 1,
        size: pageData.size || size,
        number: pageData.number || page
      };
    }
  },

  // Get question by ID
  getQuestion: async (id: number): Promise<Question> => {
    const response = await axiosClient.get<Question>(`/qas/${id}`);
    return response.data;
  },

  // Add answer to a question (admin)
  addAnswer: async (questionId: number, answerData: Omit<Answer, 'id' | 'createdAt'>): Promise<Question> => {
    const response = await axiosClient.post<Question>(`/qas/${questionId}/answers`, answerData);
    return response.data;
  },

  // Update question
  updateQuestion: async (id: number, data: Partial<Question>): Promise<Question> => {
    const response = await axiosClient.put<Question>(`/qas/${id}`, data);
    return response.data;
  },

  // Delete question
  deleteQuestion: async (id: number): Promise<void> => {
    await axiosClient.delete(`/qas/${id}`);
  },

  // Delete answer
  deleteAnswer: async (questionId: number, answerId: number): Promise<void> => {
    await axiosClient.delete(`/qas/${questionId}/answers/${answerId}`);
  }
};

