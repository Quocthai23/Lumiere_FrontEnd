import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Order } from '../../types/order';

const OrderManagementPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            try {
                // Sắp xếp để đơn hàng mới nhất lên đầu
                const response = await axiosClient.get('/orders?sort=placedAt,desc');
                setOrders(response.data);
                setError(null);
            } catch (err) {
                setError('Không thể tải danh sách đơn hàng.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'COMPLETED':
            case 'PAID':
            case 'FULFILLED':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
            case 'UNPAID':
            case 'UNFULFILLED':
                return 'bg-yellow-100 text-yellow-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) return <p>Đang tải danh sách đơn hàng...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Quản lý Đơn hàng</h1>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                        <tr>
                            <th className="px-6 py-3">Mã Đơn Hàng</th>
                            <th className="px-6 py-3">Ngày Đặt</th>
                            <th className="px-6 py-3">Khách Hàng (ID)</th>
                            <th className="px-6 py-3">Tổng Tiền</th>
                            <th className="px-6 py-3">Trạng thái TT</th>
                            <th className="px-6 py-3">Trạng thái GH</th>
                            <th className="px-6 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-indigo-600">{order.code}</td>
                                <td className="px-6 py-4">{new Date(order.placedAt).toLocaleDateString('vi-VN')}</td>
                                <td className="px-6 py-4">{order.customer?.id || 'N/A'}</td>
                                <td className="px-6 py-4 font-medium">{order.totalAmount.toLocaleString('vi-VN')} VND</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.paymentStatus)}`}>
                                        {order.paymentStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.fulfillmentStatus)}`}>
                                        {order.fulfillmentStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link to={`/admin/orders/${order.id}`} className="font-medium text-indigo-600 hover:underline">
                                        Xem chi tiết
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {orders.length === 0 && (
                    <p className="p-4 text-center text-gray-500">Chưa có đơn hàng nào.</p>
                )}
            </div>
        </div>
    );
};

export default OrderManagementPage;
