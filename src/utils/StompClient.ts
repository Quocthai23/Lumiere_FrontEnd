import {Client, type IMessage, type StompSubscription} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getUser } from './AuthUtils';

type AuthUser = { token?: string };

export interface ChatMessage {
  id?: number;
  sender: 'user' | 'admin';
  message: string;
  timestamp: string;
  contactMessageId?: number;
  type?: string;
}

class StompClientService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  connect(
    onConnect: () => void,
    onError?: (error: any) => void,
    onMessage?: (message: ChatMessage) => void
  ): void {
    if (this.client && this.isConnected) {
      onConnect();
      return;
    }

    // Lấy access token giống như HttpClient.ts
    const tokenFromLS = localStorage.getItem('accessToken');
    const tokenFromUser = (getUser() as AuthUser | undefined)?.token;
    const accessToken = tokenFromLS ?? tokenFromUser;
    
    // Tạo SockJS connection với URL đầy đủ
    // LƯU Ý: Request /ws/info (SockJS handshake) không thể thêm custom headers
    // Token sẽ được gửi trong STOMP CONNECT frame sau khi SockJS connection được thiết lập
    // Backend nên cho phép /ws/info không cần auth hoặc đọc token từ cookie
    const WS_BASE_URL = 'http://localhost:8080';
    const socket = new SockJS(`${WS_BASE_URL}/ws`);
    
    // Tạo STOMP client với connect headers chứa Bearer token
    // Token này sẽ được gửi trong STOMP CONNECT frame, không phải trong SockJS handshake
    this.client = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: accessToken ? {
        Authorization: `Bearer ${accessToken}`
      } : {},
      onConnect: (frame) => {
        console.log('STOMP Connected:', frame);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        onConnect();
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        this.isConnected = false;
        if (onError) {
          onError(frame);
        }
        this.attemptReconnect(onConnect, onError, onMessage);
      },
      onWebSocketClose: () => {
        console.log('WebSocket closed');
        this.isConnected = false;
        this.attemptReconnect(onConnect, onError, onMessage);
      },
    });

    this.client.activate();
  }

  private attemptReconnect(
    onConnect: () => void,
    onError?: (error: any) => void,
    onMessage?: (message: ChatMessage) => void
  ): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = 3000 * this.reconnectAttempts;
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        if (this.client && !this.isConnected) {
          this.client.deactivate();
          this.client = null;
          this.connect(onConnect, onError, onMessage);
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  subscribeToPublic(onMessage: (message: ChatMessage) => void): string | null {
    if (!this.client || !this.isConnected) {
      console.warn('STOMP client not connected');
      return null;
    }

    const subscription = this.client.subscribe('/topic/public', (message: IMessage) => {
      try {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        onMessage(chatMessage);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    const subId = 'public';
    this.subscriptions.set(subId, subscription);
    return subId;
  }

  subscribeToSession(
    sessionId: number,
    onMessage: (message: ChatMessage) => void
  ): string | null {
    if (!this.client || !this.isConnected) {
      console.warn('STOMP client not connected');
      return null;
    }

    const topic = `/topic/session/${sessionId}`;
    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        onMessage(chatMessage);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    const subId = `session-${sessionId}`;
    this.subscriptions.set(subId, subscription);
    return subId;
  }

  subscribeToContactMessage(
    contactMessageId: number,
    onMessage: (message: ChatMessage) => void
  ): string | null {
    if (!this.client || !this.isConnected) {
      console.warn('STOMP client not connected');
      return null;
    }

    const topic = `/topic/contact/${contactMessageId}`;
    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        onMessage(chatMessage);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    const subId = `contact-${contactMessageId}`;
    this.subscriptions.set(subId, subscription);
    return subId;
  }

  sendMessage(
    text: string,
    sender: 'user' | 'admin',
    contactMessageId?: number,
    sessionId?: number
  ): void {
    if (!this.client || !this.isConnected) {
      console.error('STOMP client not connected');
      return;
    }

    const message = {
      text,
      sender: sender.toUpperCase(),
      contactMessageId,
      session: sessionId ? { id: sessionId } : undefined,
      timestamp: new Date().toISOString(),
    };

    this.client.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(message),
    });
  }

  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
    }
  }

  disconnect(): void {
    // Unsubscribe all
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();

    // Disconnect client
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  getConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const stompClientService = new StompClientService();

