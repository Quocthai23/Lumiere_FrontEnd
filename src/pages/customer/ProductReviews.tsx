import React, { useState, useEffect } from 'react';
import type { Product, Review } from '../../types/product';
import axiosClient from '../../api/axiosClient';
import StarRating from './StarRating';

interface ProductReviewsProps {
  product: Product;
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

const ProductReviews: React.FC<ProductReviewsProps> = ({ product }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    if (!product?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get(`/product-reviews/by-product/${product.id}`, {
        params: {
          approvedOnly: false,
          page: 0,
          size: 10
        }
      });
      // Response từ axios có cấu trúc { data: Review[] }
      setReviews(Array.isArray(response.data) ? response.data : []);
      console.log('Đã fetch reviews thành công:', response.data);
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

  // FIX: Cung cấp giá trị mặc định là 0 cho averageRating nếu nó không tồn tại.
  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, review) => acc + convertRatingToNumber(review.rating), 0) / reviews.length 
    : product.averageRating || 0;

  const ratingDistribution = [0, 0, 0, 0, 0];
  reviews.forEach(review => {
    const numericRating = convertRatingToNumber(review.rating);
    if (numericRating >= 1 && numericRating <= 5) {
      ratingDistribution[5 - numericRating]++;
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
          <StarRating rating={averageRating} />
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
                <StarRating rating={convertRatingToNumber(review.rating)} />
                <p className="ml-4 font-bold text-gray-800">{review.author}</p>
              </div>
              <p className="text-gray-600">{review.comment}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
              {review.reply && (
                <div className="mt-4 pl-6 border-l-2 border-indigo-200">
                  <p className="font-semibold text-sm text-indigo-700 mb-1">Phản hồi từ cửa hàng:</p>
                  <p className="text-sm text-gray-600">{review.reply}</p>
                </div>
              )}
            </div>
          ))}
          {!isLoading && reviews.length === 0 && <p className="text-gray-500">Chưa có đánh giá nào cho sản phẩm này.</p>}
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;