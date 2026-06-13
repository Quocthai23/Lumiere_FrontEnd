import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient.ts';
import type { Notification } from '../../types/notification';
import { ShoppingCart, UserPlus, HelpCircle, Archive, Bell } from 'lucide-react';
import httpClient from "../../utils/HttpClient.ts";

// Icon mapping for different notification types
const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
    const baseClass = "w-8 h-8 p-1.5 rounded-full flex items-center justify-center mr-3 flex-shrink-0";
    switch (type) {
        case 'NEW_ORDER':
            return <div className={`bg-blue-100 text-blue-600 ${baseClass}`}><ShoppingCart size={16} /></div>;
        case 'NEW_CUSTOMER':
            return <div className={`bg-green-100 text-green-600 ${baseClass}`}><UserPlus size={16} /></div>;
        case 'NEW_QA':
            return <div className={`bg-purple-100 text-purple-600 ${baseClass}`}><HelpCircle size={16} /></div>;
        case 'LOW_STOCK':
            return <div className={`bg-yellow-100 text-yellow-600 ${baseClass}`}><Archive size={16} /></div>;
        default:
            return <div className={`bg-gray-100 text-gray-600 ${baseClass}`}><Bell size={16} /></div>;
    }
};


const AdminNotificationDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const fetchNotifications = async () => {
            setIsLoading(true);
            try {
                const response = await httpClient.get<Notification[]>('/notifications/admin/notifications');
                setNotifications(response || []);
            } catch (error) {
                console.error("Failed to fetch admin notifications:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const markAsRead = (id: number) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border overflow-hidden z-20">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Thông báo</h3>
                        <span className="text-xs font-bold text-white bg-red-500 rounded-full px-2 py-0.5">{unreadCount} Mới</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500">
                                <Bell size={32} className="mx-auto text-gray-300 mb-2"/>
                                Không có thông báo mới.
                            </div>
                        ) : (
                            <ul>
                                {notifications.map(notification => (
                                    <li key={notification.id} className={`border-b last:border-none ${!notification.isRead ? 'bg-indigo-50' : ''}`}>
                                        <Link
                                            to={notification.link || '#'}
                                            className="flex items-start p-3 hover:bg-gray-100"
                                            onClick={() => {
                                                markAsRead(notification.id);
                                                setIsOpen(false);
                                            }}
                                        >
                                             <NotificationIcon type={notification.type} />
                                             <div className="flex-grow">
                                                 <p className="text-sm text-gray-800 leading-tight">{notification.message}</p>
                                                 <p className="text-xs text-gray-500 mt-1">
                                                     {new Date(notification.createdAt).toLocaleString('vi-VN')}
                                                 </p>
                                             </div>
                                             {!notification.isRead && (
                                                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5 ml-2" title="Chưa đọc"></div>
                                             )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="p-2 bg-gray-50 border-t">
                        <Link to="/admin/notifications" onClick={() => setIsOpen(false)} className="block text-center text-sm font-semibold text-indigo-600 hover:underline">
                            Xem tất cả thông báo
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotificationDropdown;

