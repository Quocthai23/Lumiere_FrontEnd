import React, { useState, useEffect } from 'react';
import type { Order, OrderItem } from '../../types/order';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusStyles: { [key: string]: { text: string; bg: string; icon: JSX.Element } } = {
        PENDING: { text: 'Chờ xử lý', bg: 'bg-yellow-100 text-yellow-800', icon: <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
        PROCESSING: { text: 'Đang xử lý', bg: 'bg-blue-100 text-blue-800', icon: <svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5"></path></svg> },
        COMPLETED: { text: 'Hoàn thành', bg: 'bg-green-100 text-green-800', icon: <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> },
        DELIVERED: { text: 'Đã giao', bg: 'bg-green-100 text-green-800', icon: <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> },
        SHIPPED: { text: 'Đang giao', bg: 'bg-cyan-100 text-cyan-800', icon: <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17H6v-6l4-4h5l4 4v6h-4M17 9v6h-4M6 17H2v-4l4-4h3"></path></svg> },
        CANCELLED: { text: 'Đã hủy', bg: 'bg-red-100 text-red-800', icon: <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> },
    };

    const style = statusStyles[status] || { text: status, bg: 'bg-gray-100 text-gray-800', icon: <></> };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${style.bg}`}>
            {style.icon}
            {style.text}
        </span>
    );
};

const OrderSkeleton: React.FC = () => (
    <div className="bg-white p-6 rounded-xl shadow-md border animate-pulse">
        <div className="flex justify-between items-center mb-4">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="flex space-x-2 mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
            <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
            <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
        </div>
        <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
        </div>
    </div>
);


const OrderHistoryPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axiosClient.get('/orders?sort=placedAt,desc');
                setOrders(response.data);
                setFilteredOrders(response.data); 
            } catch (err) {
                console.error("Lỗi khi tải lịch sử đơn hàng:", err);
                setError("Không thể tải lịch sử đơn hàng. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, []);
    
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredOrders(orders);
        } else {
            const lowercasedFilter = searchTerm.toLowerCase();
            const filtered = orders.filter(order =>
                order.code.toLowerCase().includes(lowercasedFilter)
            );
            setFilteredOrders(filtered);
        }
    }, [searchTerm, orders]);


    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, index) => <OrderSkeleton key={index} />)}
                </div>
            );
        }

        if (error) {
            return <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg">{error}</div>;
        }

        if (orders.length === 0) {
            return (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <h3 className="text-2xl font-semibold text-gray-700">Chưa có đơn hàng nào</h3>
                    <p className="text-gray-500 mt-2 mb-6">Tất cả các đơn hàng của bạn sẽ được hiển thị tại đây.</p>
                    <Link to="/products" className="inline-block bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-transform transform hover:scale-105">
                        Bắt đầu mua sắm
                    </Link>
                </div>
            );
        }
        
        if (filteredOrders.length === 0) {
            return (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <h3 className="text-2xl font-semibold text-gray-700">Không tìm thấy đơn hàng</h3>
                    <p className="text-gray-500 mt-2">Không có đơn hàng nào khớp với tìm kiếm của bạn.</p>
                </div>
            )
        }

        return (
            <div className="space-y-6">
                {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white p-6 rounded-xl shadow-md border hover:shadow-lg transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 pb-4 border-b">
                            <div>
                                <p className="font-bold text-lg text-gray-800">
                                    Đơn hàng #{order.code}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Ngày đặt: {new Date(order.placedAt).toLocaleString('vi-VN')}
                                </p>
                            </div>
                            <div className="mt-2 sm:mt-0">
                                <StatusBadge status={order.status} />
                            </div>
                        </div>
                        
                        {order.orderItems && order.orderItems.length > 0 && (
                            <div className="flex items-center space-x-3 my-4">
                                {order.orderItems.slice(0, 4).map((item: OrderItem) => (
                                     <img 
                                        key={item.id}
                                        src={`https://placehold.co/100x100/EFEFEF/333333?text=${encodeURIComponent(item.productVariant?.name.split(' ')[0] || 'Item')}`} 
                                        alt={item.productVariant?.name} 
                                        className="w-16 h-16 object-cover rounded-md border"
                                        title={item.productVariant?.name}
                                     />
                                ))}
                                {order.orderItems.length > 4 && (
                                    <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center text-gray-600 font-semibold">
                                        +{order.orderItems.length - 4}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-4">
                            <div>
                                <p className="text-sm text-gray-500">Tổng tiền</p>
                                <p className="font-bold text-xl text-indigo-600">{order.totalAmount.toLocaleString('vi-VN')} VND</p>
                            </div>
                            <div className="mt-4 sm:mt-0">
                                <Link 
                                    to={`/account/orders/${order.id}`} 
                                    className="inline-flex items-center bg-indigo-100 text-indigo-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition-colors"
                                >
                                    Xem chi tiết
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Lịch sử Mua hàng</h2>

            <div className="relative mb-8">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input
                    type="text"
                    placeholder="Tìm kiếm theo mã đơn hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
            </div>

            {renderContent()}
        </div>
    );
};

export default OrderHistoryPage;