import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import type { Question, Answer } from '../../types/qa';
import { Link } from 'react-router-dom';
import { MessageSquare, CornerDownRight } from 'lucide-react';
import httpClient from "../../utils/HttpClient.ts";

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

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const response = await httpClient.get<Question[]>('/qas?_expand=product');
            setQuestions(response || []);
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

    const handleReplySubmit = (questionId: number) => {
        if (!replyText.trim()) return;

        // Mock logic: In a real app, this would be a POST request to an answers endpoint
        console.log(`Replying to question ${questionId}: ${replyText}`);
        const newAnswer: Answer = {
            id: Date.now(),
            author: 'Lumiere Store',
            answerText: replyText,
            createdAt: new Date().toISOString()
        };

        setQuestions(questions.map(q => 
            q.id === questionId 
                ? { ...q, answers: [...q.answers, newAnswer] } 
                : q
        ));

        setReplyingTo(null);
        setReplyText('');
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
                                                <button onClick={() => handleReplySubmit(q.id)} className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Gửi</button>
                                                <button onClick={() => setReplyingTo(null)} className="px-4 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Hủy</button>
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
