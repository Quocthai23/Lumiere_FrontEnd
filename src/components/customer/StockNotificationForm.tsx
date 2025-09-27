import React, { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import type { ProductVariant } from '../../types/product';
import { Mail } from 'lucide-react';

interface StockNotificationFormProps {
  variant: ProductVariant;
}

const StockNotificationForm: React.FC<StockNotificationFormProps> = ({ variant }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      await axiosClient.post('/stock-notifications', {
        email,
        productVariantId: variant.id,
      });
      setMessage('Đăng ký thành công! Chúng tôi sẽ thông báo cho bạn khi có hàng.');
      setEmail('');
    } catch (error) {
      setMessage('Đã có lỗi xảy ra. Vui lòng thử lại.');
      console.error('Stock notification subscription failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-100 border-t border-dashed rounded-lg">
      <p className="font-semibold text-gray-700">Sản phẩm này đã hết hàng</p>
      <p className="text-sm text-gray-500 mb-3">Nhập email để nhận thông báo khi có hàng trở lại.</p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email của bạn"
            required
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-gray-800 text-white rounded-md font-semibold hover:bg-gray-700 transition disabled:bg-gray-400"
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi'}
        </button>
      </form>
      {message && <p className="text-sm text-green-600 mt-2">{message}</p>}
    </div>
  );
};

export default StockNotificationForm;