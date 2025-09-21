import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../hooks/useAuth';
import axiosClient from '../../api/axiosClient';

const CheckoutPage: React.FC = () => {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth(); // Lấy thông tin người dùng đang đăng nhập
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    note: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Chuẩn bị dữ liệu để gửi lên backend
    const orderPayload = {
      // Backend sẽ tự lấy customerId từ user đang đăng nhập
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      fulfillmentStatus: 'UNFULFILLED',
      totalAmount: totalPrice,
      note: `Tên: ${formData.fullName}, SĐT: ${formData.phone}, Địa chỉ: ${formData.address}. Ghi chú: ${formData.note}`,
      orderItems: cartItems.map(item => ({
        quantity: item.quantity,
        unitPrice: item.variant.price,
        totalPrice: item.variant.price * item.quantity,
        productVariant: { id: item.variant.id } // Chỉ cần gửi ID của variant
      }))
    };

    try {
      const response = await axiosClient.post('/orders', orderPayload);
      const newOrder = response.data;
      clearCart();
      navigate('/order-confirmation', { state: { order: newOrder } });

    } catch (err) {
      console.error("Lỗi khi tạo đơn hàng:", err);
      setError("Không thể tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
        <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Giỏ hàng của bạn đang trống</h1>
            <p className="text-gray-600">Hãy thêm sản phẩm vào giỏ để tiến hành thanh toán.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-10">Thanh toán</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-semibold mb-6">Thông tin giao hàng</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Họ và tên</label>
              <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Địa chỉ</label>
              <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
             <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700">Ghi chú (tùy chọn)</label>
              <textarea id="note" name="note" rows={3} value={formData.note} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-400">
              {isLoading ? 'Đang xử lý...' : 'Hoàn tất đơn hàng'}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border">
          <h2 className="text-2xl font-semibold mb-6">Tóm tắt đơn hàng</h2>
          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.variant.id} className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{item.product.name}</p>
                  <p className="text-sm text-gray-500">{item.variant.name.replace(item.product.name + " - ", "")} x {item.quantity}</p>
                </div>
                <p className="font-medium">{(item.variant.price * item.quantity).toLocaleString('vi-VN')} VND</p>
              </div>
            ))}
          </div>
          <hr className="my-6" />
          <div className="flex justify-between font-bold text-xl">
            <span>Tổng cộng</span>
            <span>{totalPrice.toLocaleString('vi-VN')} VND</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

