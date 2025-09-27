import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, ShoppingCart, MessageSquare } from 'lucide-react';
import type { Notification } from '../../types/notification';

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
    switch (type) {
        case 'ORDER_UPDATE':
            return <ShoppingCart className="w-5 h-5 text-blue-500" />;
        case 'NEW_ANSWER':
            return <MessageSquare className="w-5 h-5 text-green-500" />;
        default:
            return <Bell className="w-5 h-5 text-gray-500" />;
    }
};

const NotificationDropdown: React.FC = () => {
  const { notifications, isLoading, markAsRead } = useNotifications();
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border overflow-hidden z-20">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-800">Thông báo</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
        ) : recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">Bạn không có thông báo mới.</div>
        ) : (
          <ul>
            {recentNotifications.map(notification => (
              <li key={notification.id} className={`border-b last:border-none ${!notification.isRead ? 'bg-indigo-50' : ''}`}>
                <Link 
                  to={notification.link || '#'} 
                  className="flex items-start p-4 hover:bg-gray-100"
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex-shrink-0 mt-1">
                    <NotificationIcon type={notification.type} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-2 bg-gray-50">
        <Link to="/account/notifications" className="block text-center text-sm font-semibold text-indigo-600 hover:underline">
          Xem tất cả thông báo
        </Link>
      </div>
    </div>
  );
};

export default NotificationDropdown;
