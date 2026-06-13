export enum ContactStatus {
  NEW = 'NEW',
  READ = 'READ',
  REPLIED = 'REPLIED',
  ARCHIVED = 'ARCHIVED'
}

export interface ContactMessage {
  id?: number;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  status?: ContactStatus;
  isRead?: boolean;
  adminNote?: string;
  sessionId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactMessagePage {
  content: ContactMessage[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

