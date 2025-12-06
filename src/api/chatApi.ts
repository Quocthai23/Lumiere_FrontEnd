import axiosClient from './axiosClient';
import type { ChatMessage } from '../utils/StompClient';

export interface ChatMessageRequest {
  message: string;
  contactMessageId: number;
  sender: 'user' | 'admin';
}

export interface ChatMessageDTO {
  id?: number;
  message: string;
  contactMessageId: number;
  sender: string;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const chatApi = {
  /**
   * Lấy tất cả tin nhắn cho một contact message
   * GET /api/chat/messages/{contactMessageId}
   */
  getMessagesByContactMessageId: async (contactMessageId: number): Promise<ChatMessage[]> => {
    const response = await axiosClient.get<ChatMessageDTO[]>(`/chat/messages/${contactMessageId}`);
    
    // Map từ ChatMessageDTO (backend format) sang ChatMessage (frontend format)
    return response.data.map((dto) => ({
      id: dto.id,
      sender: dto.sender.toLowerCase() === 'admin' ? 'admin' : 'user',
      message: dto.message,
      timestamp: dto.timestamp || dto.createdAt || new Date().toISOString(),
      contactMessageId: dto.contactMessageId,
    }));
  },

  /**
   * Tạo tin nhắn mới cho một contact message
   * POST /api/chat/messages
   */
  createMessage: async (data: ChatMessageRequest): Promise<ChatMessage> => {
    const response = await axiosClient.post<ChatMessageDTO>('/chat/messages', {
      message: data.message,
      contactMessageId: data.contactMessageId,
      sender: data.sender.toUpperCase(), // Backend expects 'USER' or 'ADMIN'
    });

    // Map từ ChatMessageDTO sang ChatMessage
    return {
      id: response.data.id,
      sender: response.data.sender.toLowerCase() === 'admin' ? 'admin' : 'user',
      message: response.data.message,
      timestamp: response.data.timestamp || response.data.createdAt || new Date().toISOString(),
      contactMessageId: response.data.contactMessageId,
    };
  },
};

