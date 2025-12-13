import axiosClient from './axiosClient';
import type { ChatMessage } from '../utils/StompClient';

export interface ChatMessageRequest {
  message: string;
  contactMessageId: number;
  sender: 'user' | 'admin';
}

export interface ChatMessageDTO {
  id?: number;
  text?: string; // Backend field
  message?: string; // Frontend field (for compatibility)
  contactMessageId?: number;
  sender: string;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatSessionDTO {
  id?: number;
  customerId?: number;
  contactMessageId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const chatApi = {
  /**
   * Lấy chat session theo ID
   * GET /api/chat-sessions/{id}
   */
  getChatSession: async (sessionId: number): Promise<ChatSessionDTO> => {
    const response = await axiosClient.get<ChatSessionDTO>(`/chat-sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Lấy tất cả tin nhắn cho một contact message
   * GET /api/chat/messages/{contactMessageId}
   */
  getMessagesByContactMessageId: async (contactMessageId: number): Promise<ChatMessage[]> => {
    const response = await axiosClient.get<ChatMessageDTO[]>(`/chat/messages/${contactMessageId}`);
    
    // Map từ ChatMessageDTO (backend format) sang ChatMessage (frontend format)
    return response.data.map((dto) => ({
      id: dto.id,
      sender: dto.sender.toLowerCase() === 'admin' || dto.sender.toLowerCase() === 'bot' ? 'admin' : 'user',
      message: dto.text || dto.message || '', // Backend trả về 'text', frontend dùng 'message'
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
      sender: response.data.sender.toLowerCase() === 'admin' || response.data.sender.toLowerCase() === 'bot' ? 'admin' : 'user',
      message: response.data.text || response.data.message || '', // Backend trả về 'text', frontend dùng 'message'
      timestamp: response.data.timestamp || response.data.createdAt || new Date().toISOString(),
      contactMessageId: response.data.contactMessageId,
    };
  },
};

