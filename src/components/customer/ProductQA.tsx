import React, { useState, useEffect } from 'react';
import type { Product } from '../../types/product';
import type { Question } from '../../types/qa';
import axiosClient from '../../api/axiosClient';

interface ProductQAProps {
  product: Product;
}

const ProductQA: React.FC<ProductQAProps> = ({ product }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newQuestionText, setNewQuestionText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQuestions = async () => {
    if (!product?.id) return;
    setIsLoading(true);
    try {
      const response = await axiosClient.get(`/qas?productId.equals=${product.id}&sort=createdAt,desc`);
      setQuestions(response.data);
    } catch (err) {
      console.error("Lỗi khi tải câu hỏi:", err);
      setError("Không thể tải phần hỏi đáp cho sản phẩm này.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [product.id]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !authorName.trim()) {
      alert("Vui lòng nhập tên và câu hỏi của bạn.");
      return;
    }
    setIsSubmitting(true);
    const newQuestionPayload = {
      productId: product.id,
      author: authorName,
      questionText: newQuestionText,
      answers: [], // Câu hỏi mới chưa có câu trả lời
    };

    try {
      await axiosClient.post('/qas', newQuestionPayload);
      setNewQuestionText('');
      setAuthorName('');
      await fetchQuestions(); // Tải lại danh sách câu hỏi
    } catch (err) {
      alert("Gửi câu hỏi thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border mt-16">
      <h2 className="text-2xl font-bold mb-6">Hỏi & Đáp về sản phẩm</h2>

      {/* Form to ask a new question */}
      <form onSubmit={handleSubmitQuestion} className="mb-8 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Gửi câu hỏi của bạn</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Tên của bạn"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        <textarea
          placeholder="Viết câu hỏi của bạn ở đây..."
          value={newQuestionText}
          onChange={(e) => setNewQuestionText(e.target.value)}
          rows={3}
          className="w-full p-2 border rounded-md"
          required
        ></textarea>
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi câu hỏi'}
        </button>
      </form>

      {/* List of questions and answers */}
      <div className="space-y-8">
        {isLoading && <p>Đang tải câu hỏi...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!isLoading && !error && questions.map(q => (
          <div key={q.id} className="border-t pt-6">
            {/* Question */}
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-200 text-gray-600 font-bold rounded-full">Q</div>
              <div className="ml-4">
                <p className="font-semibold text-gray-800">{q.questionText}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Bởi {q.author} - {new Date(q.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
            {/* Answers */}
            {q.answers.map(a => (
              <div key={a.id} className="flex items-start mt-4 ml-8 pl-6 border-l-2 border-indigo-200">
                 <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold rounded-full">A</div>
                 <div className="ml-4">
                    <p className="text-gray-700">{a.answerText}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Bởi {a.author} - {new Date(a.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                 </div>
              </div>
            ))}
          </div>
        ))}
        {!isLoading && questions.length === 0 && (
          <p className="text-center text-gray-500 py-8">Chưa có câu hỏi nào cho sản phẩm này. Hãy là người đầu tiên đặt câu hỏi!</p>
        )}
      </div>
    </div>
  );
};

export default ProductQA;
