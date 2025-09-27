import React from 'react';
import type { OrderStatusHistory } from '../../types/order';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';

interface OrderStatusTrackerProps {
  history: OrderStatusHistory[];
  currentStatus: string;
}

const statusConfig: { [key: string]: { icon: React.ElementType; text: string } } = {
  PENDING: { icon: Package, text: 'Đã đặt hàng' },
  CONFIRMED: { icon: CheckCircle, text: 'Đã xác nhận' },
  SHIPPING: { icon: Truck, text: 'Đang vận chuyển' },
  DELIVERED: { icon: Home, text: 'Đã giao hàng' },
  // Thêm các trạng thái khác nếu cần
};

const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({ history, currentStatus }) => {
  if (!history || history.length === 0) {
    return null;
  }

  const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const currentStatusIndex = sortedHistory.findIndex(item => item.status === currentStatus);

  return (
    <div className="p-6 bg-gray-50 rounded-lg border">
      <h3 className="text-xl font-semibold mb-6">Lịch sử đơn hàng</h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200"></div>

        <ul className="space-y-8">
          {sortedHistory.map((item, index) => {
            const config = statusConfig[item.status] || { icon: CheckCircle, text: item.status };
            const Icon = config.icon;
            const isCompleted = currentStatusIndex >= index;

            return (
              <li key={item.id} className="flex items-start">
                <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${isCompleted ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-4">
                  <h4 className={`font-semibold ${isCompleted ? 'text-gray-800' : 'text-gray-500'}`}>
                    {config.text}
                  </h4>
                  <p className="text-sm text-gray-500">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(item.timestamp).toLocaleString('vi-VN')}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default OrderStatusTracker;
