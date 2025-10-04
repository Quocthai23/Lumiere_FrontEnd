import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Notification } from '../../types/notification';
import { ShoppingCart, UserPlus, HelpCircle, Archive, Bell } from 'lucide-react';

// Icon mapping for different notification types
const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
    const baseClass = "w-10 h-10 p-2 rounded-full flex items-center justify-center mr-4 flex-shrink-0";
    switch (type) {
        case 'NEW_ORDER':
            return <div className={`bg-blue-100 text-blue-600 ${baseClass}`}><ShoppingCart size={20} /></div>;
        case 'NEW_CUSTOMER':
            return <div className={`bg-green-100 text-green-600 ${baseClass}`}><UserPlus size={20} /></div>;
        case 'NEW_QA':
            return <div className={`bg-purple-100 text-purple-600 ${baseClass}`}><HelpCircle size={20} /></div>;
        case 'LOW_STOCK':
            return <div className={`bg-yellow-100 text-yellow-600 ${baseClass}`}><Archive size={20} /></div>;
        default:
            return <div className={`bg-gray-100 text-gray-600 ${baseClass}`}><Bell size={20} /></div>;
    }
};

const AdminNotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            setIsLoading(true);
            try {
                // Assuming an endpoint for admin notifications exists
                const response = await axiosClient.get('/admin/notifications');
                setNotifications(response.data || []);
            } catch (error) {
                console.error("Failed to fetch admin notifications:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotifications();
    }, []);
    
    // In a real app, you would call an API to mark notifications as read
    const markAsRead = (id: number) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Trung tâm thông báo</h1>

            {isLoading ? (
                <p>Đang tải thông báo...</p>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <h3 className="text-2xl font-semibold text-gray-700">Không có thông báo</h3>
                    <p className="text-gray-500 mt-2">Mọi cập nhật quan trọng sẽ được hiển thị tại đây.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map(notification => (
                        <Link to={notification.link || '#'} key={notification.id} onClick={() => markAsRead(notification.id)}>
                            <div className={`flex items-start p-4 rounded-lg border transition-colors ${
                                !notification.isRead ? 'bg-indigo-50 border-indigo-200' : 'bg-white hover:bg-gray-50'
                            }`}>
                                <NotificationIcon type={notification.type} />
                                <div className="flex-grow">
                                    <p className="font-semibold text-gray-800">{notification.message}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {new Date(notification.createdAt).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                                {!notification.isRead && (
                                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5 ml-4" title="Chưa đọc"></div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminNotificationsPage;
