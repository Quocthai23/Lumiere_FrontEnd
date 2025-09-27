import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, ShoppingCart, MessageSquare, CheckCheck } from 'lucide-react';
import type { Notification } from '../../types/notification';

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
    const baseClass = "w-6 h-6 p-3 rounded-full flex items-center justify-center mr-4";
    switch (type) {
        case 'ORDER_UPDATE':
            return <div className={`bg-blue-100 text-blue-600 ${baseClass}`}><ShoppingCart size={20} /></div>;
        case 'NEW_ANSWER':
            return <div className={`bg-green-100 text-green-600 ${baseClass}`}><MessageSquare size={20} /></div>;
        default:
            return <div className={`bg-gray-100 text-gray-600 ${baseClass}`}><Bell size={20} /></div>;
    }
};

const NotificationsPage: React.FC = () => {
    const { notifications, isLoading, markAllAsRead, unreadCount } = useNotifications();

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Thông báo</h2>
                {unreadCount > 0 && (
                    <button 
                        onClick={markAllAsRead} 
                        className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
                    >
                        <CheckCheck size={16}/>
                        Đánh dấu tất cả là đã đọc
                    </button>
                )}
            </div>

            {isLoading ? (
                <p>Đang tải thông báo...</p>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <h3 className="text-2xl font-semibold text-gray-700">Không có thông báo</h3>
                    <p className="text-gray-500 mt-2">Mọi cập nhật sẽ được hiển thị tại đây.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map(notification => (
                        <Link to={notification.link || '#'} key={notification.id}>
                            <div className={`flex items-start p-4 rounded-lg border transition-colors ${
                                !notification.isRead ? 'bg-indigo-50 border-indigo-200' : 'bg-white hover:bg-gray-50'
                            }`}>
                                <NotificationIcon type={notification.type} />
                                <div className="flex-grow">
                                    <p className="text-gray-800">{notification.message}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(notification.createdAt).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                                {!notification.isRead && (
                                    <div className="w-3 h-3 bg-indigo-500 rounded-full flex-shrink-0 mt-1"></div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
