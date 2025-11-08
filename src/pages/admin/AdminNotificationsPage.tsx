import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Notification } from '../../types/notification';
import { ShoppingCart, UserPlus, HelpCircle, Archive, Bell } from 'lucide-react';
import httpClient from '../../utils/HttpClient.ts';

// Icon mapping
const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
    const baseClass =
        'w-10 h-10 p-2 rounded-full flex items-center justify-center mr-4 flex-shrink-0';
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

type ScrollRes = {
    items: Notification[];
    hasNext: boolean;
    nextCursor: number | null;
};

const PAGE_SIZE = 5;

const AdminNotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasNext, setHasNext] = useState(true);
    const [cursor, setCursor] = useState<number | null>(null);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    // Gộp mẻ mới, tránh trùng id nếu BE trả lại
    const appendUnique = useCallback((current: Notification[], next: Notification[]) => {
        const seen = new Set(current.map(n => n.id));
        const merged = [...current];
        for (const n of next) if (!seen.has(n.id)) merged.push(n);
        return merged;
    }, []);

    const fetchMore = useCallback(async () => {
        if (isLoading || !hasNext) return;
        setIsLoading(true);
        try {
            const res = await httpClient.get<ScrollRes>(`/notifications/admin/notifications/scroll?size=${PAGE_SIZE}${cursor ? `&lastId=${cursor}` : ''}`);
            const body = res;
            setNotifications(prev => appendUnique(prev, body.items || []));
            setHasNext(body.hasNext);
            setCursor(body.hasNext ? body.nextCursor ?? null : null);
        } catch (e) {
            console.error('Fetch notifications failed', e);
        } finally {
            setIsLoading(false);
        }
    }, [cursor, hasNext, isLoading, appendUnique]);

    // Trang đầu
    useEffect(() => {
        // gọi lần đầu
        fetchMore();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // IntersectionObserver để auto load khi chạm đáy
    useEffect(() => {
        const el = loaderRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) fetchMore();
            },
            { root: null, rootMargin: '200px', threshold: 0 } // nạp sớm 200px trước đáy
        );
        io.observe(el);
        return () => io.disconnect();
    }, [fetchMore]);

    const markAsRead = (id: number) => {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
        // TODO: gọi API mark-read nếu cần
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Trung tâm thông báo</h1>

            {notifications.length === 0 && !isLoading ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <h3 className="text-2xl font-semibold text-gray-700">Không có thông báo</h3>
                    <p className="text-gray-500 mt-2">Mọi cập nhật quan trọng sẽ được hiển thị tại đây.</p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {notifications.map(n => (
                            <Link to={n.link || '#'} key={n.id} onClick={() => markAsRead(n.id)}>
                                <div
                                    className={`flex items-start p-4 rounded-lg border transition-colors ${
                                        !n.isRead ? 'bg-indigo-50 border-indigo-200' : 'bg-white hover:bg-gray-50'
                                    }`}
                                >
                                    <NotificationIcon type={n.type} />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800">{n.message}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {new Date(n.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    {!n.isRead && (
                                        <div
                                            className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5 ml-4"
                                            title="Chưa đọc"
                                        />
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Loader & sentinel */}
                    <div className="flex items-center justify-center py-4">
                        {isLoading && <span className="text-sm text-gray-500">Đang tải...</span>}
                    </div>
                    {/* Cái mốc để IO bám vào. Khi thấy nó, sẽ fetchMore() */}
                    <div ref={loaderRef} className="h-1" />
                    {!hasNext && notifications.length > 0 && (
                        <p className="text-center text-xs text-gray-400 py-3">Hết dữ liệu</p>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminNotificationsPage;
