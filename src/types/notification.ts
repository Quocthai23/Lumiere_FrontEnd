export interface Notification {
  id: number;
  customerId?: number; // Make optional for admin notifications
  message: string;
  type: 'ORDER_UPDATE' | 'NEW_ANSWER' | 'PROMOTION' | 'NEW_ORDER' | 'NEW_CUSTOMER' | 'NEW_QA' | 'LOW_STOCK';
  isRead: boolean;
  link?: string;
  createdAt: string;
}
