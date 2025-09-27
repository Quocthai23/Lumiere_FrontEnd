import React, { useState, useEffect } from 'react';
import type { Product, Review } from '../../types/product';
import axiosClient from '../../api/axiosClient';
import StarRating from './StarRating';

interface ProductReviewsProps {
  product: Product;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ product }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newAuthor, setNewAuthor] = useState('');

  const fetchReviews = async () => {
    if (!product?.id) return;
    setIsLoading(true);
    try {
      const response = await axiosClient.get(`/reviews?productId.equals=${product.id}`);
      setReviews(response.data);
    } catch (err) {
      console.error("Lỗi khi tải đánh giá:", err);
      setError("Không thể tải đánh giá cho sản phẩm này.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [product.id]);
  
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !newAuthor.trim()) {
      alert("Vui lòng nhập tên và nội dung đánh giá.");
      return;
    }
    const newReview = {
      productId: product.id,
      author: newAuthor,
      rating: newRating,
      comment: newComment,
    };
    try {
      await axiosClient.post('/reviews', newReview);
      setNewRating(5);
      setNewComment('');
      setNewAuthor('');
      fetchReviews(); 
    } catch (err) {
      alert("Gửi đánh giá thất bại. Vui lòng thử lại.");
    }
  };

  // FIX: Cung cấp giá trị mặc định là 0 cho averageRating nếu nó không tồn tại.
  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : product.averageRating || 0;

  const ratingDistribution = [0, 0, 0, 0, 0];
  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingDistribution[5 - review.rating]++;
    }
  });
  const totalReviews = reviews.length;

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold mb-6">Đánh giá sản phẩm</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Summary */}
        <div className="flex flex-col items-center justify-center border-r pr-8">
          <div className="text-5xl font-bold text-gray-800">
             {/* FIX: Đảm bảo averageRating luôn là một số trước khi gọi toFixed */}
            {(averageRating || 0).toFixed(1)} 
          </div>
          <StarRating rating={averageRating} size="large" />
          <p className="text-gray-500 mt-2">({totalReviews} đánh giá)</p>
        </div>
        
        {/* Distribution Bars */}
        <div className="md:col-span-2">
          {ratingDistribution.map((count, index) => {
            const star = 5 - index;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-4 mb-2">
                <span className="text-sm font-medium text-gray-600">{star} sao</span>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                </div>
                <span className="text-sm font-medium text-gray-600 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-10 border-t pt-8">
        {/* Review List */}
        <div className="space-y-6 mb-8">
          {isLoading && <p>Đang tải đánh giá...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!isLoading && !error && reviews.map(review => (
            <div key={review.id} className="border-b pb-4">
              <div className="flex items-center mb-2">
                <StarRating rating={review.rating} />
                <p className="ml-4 font-bold text-gray-800">{review.author}</p>
              </div>
              <p className="text-gray-600">{review.comment}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
          ))}
          {!isLoading && reviews.length === 0 && <p className="text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</p>}
        </div>
        
        {/* Review Form */}
        <form onSubmit={handleSubmitReview} className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Viết đánh giá của bạn</h3>
            <div className="flex items-center mb-4">
                <span className="mr-4">Đánh giá của bạn:</span>
                <div className="flex">
                    {[5, 4, 3, 2, 1].map(star => (
                        <label key={star} className="cursor-pointer">
                            <input type="radio" name="rating" value={star} checked={newRating === star} onChange={() => setNewRating(star)} className="sr-only" />
                            <svg className={`w-6 h-6 ${newRating >= star ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                        </label>
                    ))}
                </div>
            </div>
            <div className="mb-4">
                <input type="text" placeholder="Tên của bạn" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div className="mb-4">
                <textarea placeholder="Viết đánh giá của bạn ở đây..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={4} className="w-full p-2 border rounded" required></textarea>
            </div>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Gửi đánh giá</button>
        </form>
      </div>
    </div>
  );
};

export default ProductReviews;