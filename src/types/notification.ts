export interface Notification {
  id: number;
  customerId: number;
  message: string;
  type: 'ORDER_UPDATE' | 'NEW_ANSWER' | 'PROMOTION';
  isRead: boolean;
  link?: string;
  createdAt: string;
}
