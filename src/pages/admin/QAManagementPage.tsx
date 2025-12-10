import React, { useState, useEffect } from 'react';
import type { Question, Answer } from '../../types/qa';
import { Link } from 'react-router-dom';
import { MessageSquare, CornerDownRight } from 'lucide-react';
import { qaApi } from '../../api/qaApi';
import { productAnswerApi } from '../../api/productAnswerApi';

// Giả định kiểu Question được mở rộng để chứa thông tin sản phẩm
interface QuestionWithProduct extends Question {
    product?: {
        id: number;
        name: string;
        slug: string;
    };
}

const QAManagementPage: React.FC = () => {
    const [questions, setQuestions] = useState<QuestionWithProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const result = await qaApi.getAllQuestions(0, 100);
            
            // Fetch product answers để hiển thị câu trả lời
            let productAnswers: any[] = [];
            try {
                productAnswers = await productAnswerApi.getAllProductAnswers();
            } catch (err) {
                console.warn('Không thể tải danh sách câu trả lời:', err);
            }
            
            // Map product answers vào questions
            const questionsWithAnswers = (result.content || []).map((question: QuestionWithProduct) => {
                const answers = productAnswers
                    .filter(a => a.questionId === question.id)
                    .map(a => ({
                        id: a.id,
                        answerText: a.answerText,
                        author: a.author || 'Lumiere Store',
                        createdAt: a.createdAt || new Date().toISOString()
                    }));
                
                return {
                    ...question,
                    answers: answers.length > 0 ? answers : question.answers
                };
            });
            
            setQuestions(questionsWithAnswers);
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách câu hỏi.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleReplySubmit = async (questionId: number) => {
        if (!replyText.trim()) return;

        setIsSubmittingReply(true);
        try {
            // Tạo product answer mới
            debugger

            const newAnswer = await productAnswerApi.createProductAnswer({
                questionId: questionId,
                answerText: replyText,
                author: 'Lumiere Store'
            });

            // Cập nhật state với câu trả lời mới
            setQuestions(questions.map(q => 
                q.id === questionId 
                    ? { 
                        ...q, 
                        answers: [...q.answers, {
                            id: newAnswer.id!,
                            answerText: newAnswer.answerText,
                            author: newAnswer.author || 'Lumiere Store',
                            createdAt: newAnswer.createdAt || new Date().toISOString()
                        }]
                    } 
                    : q
            ));

            setReplyingTo(null);
            setReplyText('');
        } catch (err) {
            console.error('Lỗi khi gửi câu trả lời:', err);
            alert('Không thể gửi câu trả lời. Vui lòng thử lại.');
        } finally {
            setIsSubmittingReply(false);
        }
    };
    
    const startReplying = (questionId: number) => {
        setReplyingTo(questionId);
        setReplyText('');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý Hỏi & Đáp</h1>

            {isLoading ? (
                <p>Đang tải danh sách câu hỏi...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <div className="space-y-6">
                    {questions.length > 0 ? questions.map(q => (
                        <div key={q.id} className="border rounded-lg p-4">
                            {/* Question Section */}
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 text-gray-600 font-bold rounded-full">Q</div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-gray-800">{q.questionText}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Bởi <span className="font-medium">{q.author}</span> về sản phẩm{' '}
                                        <Link to={`/products/${q.product?.slug}`} target="_blank" className="font-semibold text-indigo-600 hover:underline">
                                             {q.product?.name || 'Không rõ'}
                                        </Link>
                                    </p>
                                </div>
                            </div>
                            
                            {/* Answers Section */}
                            <div className="pl-14 mt-4 space-y-4">
                                {q.answers.map(answer => (
                                     <div key={answer.id} className="flex items-start gap-4">
                                         <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold rounded-full">A</div>
                                         <div className="flex-grow">
                                            <p className="text-gray-700">{answer.answerText}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                              Bởi <span className="font-medium">{answer.author}</span> vào ngày {new Date(answer.createdAt).toLocaleDateString('vi-VN')}
                                            </p>
                                         </div>
                                     </div>
                                ))}

                                {/* Reply Form */}
                                {replyingTo === q.id ? (
                                    <div className="flex items-start gap-4">
                                         <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold rounded-full">A</div>
                                         <div className="flex-grow">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Viết câu trả lời của bạn..."
                                                rows={3}
                                                className="w-full p-2 border rounded-md mb-2"
                                            />
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleReplySubmit(q.id)} 
                                                    disabled={isSubmittingReply}
                                                    className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isSubmittingReply ? 'Đang gửi...' : 'Gửi'}
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setReplyingTo(null);
                                                        setReplyText('');
                                                    }} 
                                                    disabled={isSubmittingReply}
                                                    className="px-4 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                         </div>
                                    </div>
                                ) : (
                                     <button onClick={() => startReplying(q.id)} className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline">
                                        <CornerDownRight size={16} />
                                        Trả lời
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 py-8">Chưa có câu hỏi nào.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default QAManagementPage;
