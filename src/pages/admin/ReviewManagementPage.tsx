import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import type { Review } from '../../types/product';
import { Star, Check, Trash2, CornerDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Định nghĩa kiểu dữ liệu Review mở rộng
interface ReviewWithProduct extends Review {
    product?: {
        id: number;
        name: string;
        slug: string;
    };
    replyText?: string; // Thêm trường phản hồi
    status?: 'PENDING' | 'APPROVED'; // Thêm trạng thái
}

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex">
        {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
        ))}
    </div>
);

const ReviewManagementPage: React.FC = () => {
    const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const response = await axiosClient.get('/reviews?_expand=product');
            const reviewsWithStatus = (response.data || []).map((review: ReviewWithProduct, index: number) => ({
                ...review,
                status: index % 3 === 0 ? 'PENDING' : 'APPROVED',
                replyText: index % 4 === 0 ? 'Cảm ơn bạn đã đánh giá sản phẩm này!' : undefined
            }));
            setReviews(reviewsWithStatus);
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

    const handleApprove = (id: number) => {
        setReviews(reviews.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
            setReviews(reviews.filter(r => r.id !== id));
        }
    };
    
    const handleReplySubmit = (reviewId: number) => {
        if (!replyText.trim()) return;
        // Mock logic
        setReviews(reviews.map(r => r.id === reviewId ? { ...r, replyText: replyText } : r));
        setReplyingTo(null);
        setReplyText('');
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
                    {['ALL', 'PENDING', 'APPROVED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                                filter === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {status === 'ALL' ? 'Tất cả' : (status === 'PENDING' ? 'Chờ duyệt' : 'Đã duyệt')}
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
                                            <button onClick={() => handleReplySubmit(review.id)} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Lưu</button>
                                            <button onClick={() => setReplyingTo(null)} className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Hủy</button>
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

