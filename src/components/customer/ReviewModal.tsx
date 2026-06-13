import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import type { ProductVariant } from '../../types/product';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  orderItemId: number | null;
  productVariant: ProductVariant | null;
  onReviewSubmitted?: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ 
  isOpen, 
  onClose, 
  orderId,
  orderItemId,
  productVariant,
  onReviewSubmitted 
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert số rating (1-5) thành enum string (ONE, TWO, THREE, FOUR, FIVE)
  const convertRatingToEnum = (ratingNumber: number): string => {
    const ratingMap: { [key: number]: string } = {
      1: 'ONE',
      2: 'TWO',
      3: 'THREE',
      4: 'FOUR',
      5: 'FIVE',
    };
    return ratingMap[ratingNumber] || 'FIVE';
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setRating(5);
      setComment('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderId || !orderItemId) {
      alert('Không tìm thấy thông tin đơn hàng.');
      return;
    }

    if (!comment.trim()) {
      alert('Vui lòng nhập nội dung đánh giá.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Gửi request đến /orders/{orderId}/reviews với format CreateOrderReviewDTO
      await axiosClient.post(`/orders/${orderId}/reviews`, [
        {
          orderItemId: orderItemId,
          rating: convertRatingToEnum(rating), // Convert sang enum: ONE, TWO, THREE, FOUR, FIVE
          comment: comment || undefined,
        }
      ]);
      
      alert('Đánh giá đã được gửi thành công!');
      onReviewSubmitted?.();
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi gửi đánh giá:', err);
      const errorMessage = err.response?.data?.message || 'Gửi đánh giá thất bại. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
          <div className="px-6 pt-6">
            <h2 id="review-modal-title" className="text-xl font-semibold mb-2">
              Thêm đánh giá
            </h2>
            {productVariant && (
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <img
                  src={productVariant.urlImage}
                  alt={productVariant.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div>
                  <p className="font-medium text-gray-800">{productVariant.name}</p>
                  <p className="text-sm text-gray-500">SKU: {productVariant.sku}</p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đánh giá của bạn:
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <svg
                      className={`w-8 h-8 ${
                        rating >= star ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung đánh giá:
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Viết đánh giá của bạn ở đây..."
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border px-4 py-2 text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;

