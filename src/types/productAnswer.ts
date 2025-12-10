export interface ProductAnswerDTO {
  id?: number;
  questionId?: number; // Dùng cho Q&A
  productReviewId?: number; // Dùng cho Reviews
  answerText: string;
  author?: string;
  createdAt?: string;
}

