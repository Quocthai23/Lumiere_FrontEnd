import axiosClient from './axiosClient';
import type { ContactMessage, ContactMessagePage, ContactStatus } from '../types/contactMessage';

export const contactApi = {
  // Submit contact message from public form (no auth required)
  submitContactMessage: async (data: Omit<ContactMessage, 'id' | 'status' | 'isRead' | 'adminNote' | 'createdAt' | 'updatedAt'>): Promise<ContactMessage> => {
    const response = await axiosClient.post<ContactMessage>('/contact-messages/submit', data);
    return response.data;
  },

  // Admin endpoints (require auth)
  getAllContactMessages: async (page: number = 0, size: number = 10, status?: ContactStatus): Promise<ContactMessagePage> => {
    const params: any = { page, size };
    if (status) {
      params.status = status;
    }
    const response = await axiosClient.get<ContactMessage[] | ContactMessagePage>('/contact-messages', { params });
    
    // Handle both array response and paginated response
    if (Array.isArray(response.data)) {
      // If backend returns array, try to get pagination info from headers
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
      // If backend returns paginated object directly
      const pageData = response.data as ContactMessagePage;
      return {
        content: pageData.content || [],
        totalElements: pageData.totalElements || 0,
        totalPages: pageData.totalPages || 1,
        size: pageData.size || size,
        number: pageData.number || page
      };
    }
  },

  getContactMessage: async (id: number): Promise<ContactMessage> => {
    const response = await axiosClient.get<ContactMessage>(`/contact-messages/${id}`);
    return response.data;
  },

  markAsRead: async (id: number): Promise<ContactMessage> => {
    const response = await axiosClient.put<ContactMessage>(`/contact-messages/${id}/mark-read`);
    return response.data;
  },

  markAsReplied: async (id: number, adminNote?: string): Promise<ContactMessage> => {
    const response = await axiosClient.put<ContactMessage>(
      `/contact-messages/${id}/mark-replied`,
      adminNote ? { adminNote } : null
    );
    return response.data;
  },

  deleteContactMessage: async (id: number): Promise<void> => {
    await axiosClient.delete(`/contact-messages/${id}`);
  },

  updateContactMessage: async (id: number, data: Partial<ContactMessage>): Promise<ContactMessage> => {
    const response = await axiosClient.put<ContactMessage>(`/contact-messages/${id}`, data);
    return response.data;
  }
};

