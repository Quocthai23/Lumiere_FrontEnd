import React, { useState, useEffect } from 'react';
import type { Review } from '../../types/product';
import { Star, Check, Trash2, CornerDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import httpClient from "../../utils/HttpClient.ts";
import { productAnswerApi } from '../../api/productAnswerApi';

// Định nghĩa kiểu dữ liệu Review mở rộng
interface ReviewWithProduct extends Review {
    product?: {
        id: number;
        name: string;
        slug: string;
    };
    replyText?: string; // Thêm trường phản hồi
    productAnswerId?: number; // ID của câu trả lời để có thể update
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'; // Thêm trạng thái
}

// Hàm chuyển đổi rating enum string sang số
const convertRatingToNumber = (rating: number | string): number => {
    if (typeof rating === 'number') {
        return rating;
    }
    
    const ratingMap: Record<string, number> = {
        'ONE': 1,
        'TWO': 2,
        'THREE': 3,
        'FOUR': 4,
        'FIVE': 5
    };
    
    return ratingMap[rating.toUpperCase()] || 0;
};

const StarRating = ({ rating }: { rating: number | string }) => {
    const numericRating = convertRatingToNumber(rating);
    return (
        <div className="flex">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < numericRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
            ))}
        </div>
    );
};

const ReviewManagementPage: React.FC = () => {
    const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const response = await httpClient.get<ReviewWithProduct[]>('/product-reviews?_expand=product');
            
            // Fetch product answers để lấy replyText cho reviews
            let productAnswers: any[] = [];
            try {
                productAnswers = await productAnswerApi.getAllProductAnswers();
            } catch (err) {
                console.warn('Không thể tải danh sách câu trả lời:', err);
            }
            
            // Map product answers vào reviews
            const reviewsWithAnswers = (response || []).map((review: ReviewWithProduct) => {
                // Tìm product answer tương ứng với review này
                const answer = productAnswers.find(a => a.productReviewId === review.id);
                
                return {
                    ...review,
                    replyText: answer?.answerText,
                    productAnswerId: answer?.id
                };
            });
            
            setReviews(reviewsWithAnswers);
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách đánh giá.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);
    
    const filteredReviews = reviews.filter(review => {
        if (filter === 'ALL') return true;
        return review.status === filter;
    });

    const handleApprove = async (id: number) => {
        try {
            const currentReview = reviews.find(r => r.id === id);
            if (!currentReview) return;
            
            // Gọi API PUT để cập nhật status
            const updatedReview = await httpClient.put<ReviewWithProduct>(
                `/product-reviews/${id}`,
                {
                    ...currentReview,
                    status: 'APPROVED'
                }
            );
            
            // Cập nhật state với review đã được duyệt từ server
            setReviews(reviews.map(r => r.id === id ? updatedReview : r));
        } catch (err) {
            console.error('Lỗi khi duyệt đánh giá:', err);
            alert('Không thể duyệt đánh giá. Vui lòng thử lại.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
            return;
        }
        
        try {
            // Gọi API DELETE để xóa review
            await httpClient.delete(`/product-reviews/${id}`);
            
            // Cập nhật state sau khi xóa thành công
            setReviews(reviews.filter(r => r.id !== id));
        } catch (err) {
            console.error('Lỗi khi xóa đánh giá:', err);
            alert('Không thể xóa đánh giá. Vui lòng thử lại.');
        }
    };
    
    const handleReplySubmit = async (reviewId: number) => {
        if (!replyText.trim()) return;
        
        setIsSubmittingReply(true);
        try {
            const currentReview = reviews.find(r => r.id === reviewId);
            
            if (currentReview?.productAnswerId) {
                // Update existing answer
                const updatedAnswer = await productAnswerApi.updateProductAnswer(
                    currentReview.id,
                    { answerText: replyText }
                );
                setReviews(reviews.map(r => 
                    r.id === reviewId 
                        ? { ...r, replyText: updatedAnswer.answerText, productAnswerId: updatedAnswer.id } 
                        : r
                ));
            } else {
                // Create new answer
                const newAnswer = await productAnswerApi.createProductAnswer({
                    questionId: reviewId,
                    answerText: replyText,
                    author: 'Lumiere Store'
                });
                setReviews(reviews.map(r => 
                    r.id === reviewId 
                        ? { ...r, replyText: newAnswer.answerText, productAnswerId: newAnswer.id } 
                        : r
                ));
            }
            
            setReplyingTo(null);
            setReplyText('');
        } catch (err) {
            console.error('Lỗi khi gửi câu trả lời:', err);
            alert('Không thể gửi câu trả lời. Vui lòng thử lại.');
        } finally {
            setIsSubmittingReply(false);
        }
    };
    
    const startReplying = (reviewId: number) => {
        setReplyingTo(reviewId);
        const currentReview = reviews.find(r => r.id === reviewId);
        setReplyText(currentReview?.replyText || '');
    };


    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Đánh giá</h1>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                                filter === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {status === 'ALL' ? 'Tất cả' : (status === 'PENDING' ? 'Chờ duyệt' : (status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'))}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <p>Đang tải danh sách đánh giá...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <div className="space-y-4">
                    {filteredReviews.length > 0 ? filteredReviews.map(review => (
                        <div key={review.id} className="border rounded-lg p-4 transition-shadow hover:shadow-md">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-4 mb-2">
                                        <StarRating rating={review.rating} />
                                        <span className="font-bold text-gray-800">{review.author}</span>
                                    </div>
                                    <p className="text-gray-600 italic">"{review.comment}"</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        về sản phẩm{' '}
                                        <Link to={`/products/${review.product?.slug}`} target="_blank" className="font-semibold text-indigo-600 hover:underline">
                                             {review.product?.name || 'Không rõ'}
                                        </Link>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 mt-4 sm:mt-0 flex-shrink-0">
                                    {review.status === 'PENDING' && (
                                        <button onClick={() => handleApprove(review.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 rounded-md hover:bg-green-200">
                                            <Check size={14} />
                                            Duyệt
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(review.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 rounded-md hover:bg-red-200">
                                        <Trash2 size={14} />
                                        Xóa
                                    </button>
                                </div>
                            </div>
                            {/* Reply Section */}
                            <div className="pl-12 mt-4">
                                {review.replyText && replyingTo !== review.id && (
                                    <div className="border-l-2 border-indigo-200 pl-4">
                                        <p className="font-semibold text-sm text-indigo-700">Phản hồi từ cửa hàng:</p>
                                        <p className="text-sm text-gray-600">{review.replyText}</p>
                                    </div>
                                )}
                                {replyingTo === review.id ? (
                                    <div className="mt-2">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Viết phản hồi của bạn..."
                                            rows={2}
                                            className="w-full p-2 border rounded-md mb-2 text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleReplySubmit(review.id)} 
                                                disabled={isSubmittingReply}
                                                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmittingReply ? 'Đang lưu...' : 'Lưu'}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setReplyingTo(null);
                                                    setReplyText('');
                                                }} 
                                                disabled={isSubmittingReply}
                                                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => startReplying(review.id)} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline mt-2">
                                        <CornerDownRight size={14} />
                                        {review.replyText ? 'Chỉnh sửa phản hồi' : 'Phản hồi'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 py-8">Không có đánh giá nào trong mục này.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReviewManagementPage;

