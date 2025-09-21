import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import type { Order } from '../../types/order';

const OrderConfirmationPage: React.FC = () => {
  const location = useLocation();
  const order = location.state?.order as Order;

  if (!order) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto text-center py-20">
      <h1 className="text-4xl font-bold text-green-600 mb-4">Đặt hàng thành công!</h1>
      <p className="text-lg text-gray-700">Cảm ơn bạn đã mua sắm tại Lumiere.</p>
      <div className="bg-gray-50 border rounded-lg p-6 max-w-md mx-auto my-8 text-left">
        <h2 className="text-xl font-semibold mb-4">Thông tin đơn hàng</h2>
        <p><strong>Mã đơn hàng:</strong> #{order.code}</p>
        <p><strong>Tổng tiền:</strong> {order.totalAmount.toLocaleString('vi-VN')} VND</p>
        <p><strong>Trạng thái:</strong> Đang xử lý</p>
        <p className="mt-4">Chúng tôi sẽ liên hệ với bạn để xác nhận đơn hàng trong thời gian sớm nhất.</p>
      </div>
      <div className="space-x-4">
        <Link to="/products" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-md hover:bg-indigo-700 transition-colors">
          Tiếp tục mua sắm
        </Link>
        <Link to="/account/orders" className="bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-md hover:bg-gray-300 transition-colors">
          Xem lịch sử đơn hàng
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
