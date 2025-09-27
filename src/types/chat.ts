export interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: number;
  customerId: number;
  messages: ChatMessage[];
}
