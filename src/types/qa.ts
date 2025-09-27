// Định nghĩa cấu trúc cho một câu trả lời
export interface Answer {
  id: number;
  author: string; // Tác giả câu trả lời (vd: "Lumiere Store", "Nguyễn Văn B")
  answerText: string;
  createdAt: string;
}

// Định nghĩa cấu trúc cho một câu hỏi
export interface Question {
  id: number;
  productId: number;
  author: string; // Tác giả câu hỏi
  questionText: string;
  createdAt: string;
  answers: Answer[]; // Mỗi câu hỏi có thể có nhiều câu trả lời
}
