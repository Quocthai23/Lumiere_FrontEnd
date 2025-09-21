import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Customer } from '../../types/customer';
import type { Order } from '../../types/order';

const AdminCustomerDetailPage: React.FC = () => {
    const { customerId } = useParams<{ customerId: string }>();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!customerId) return;
            setIsLoading(true);
            try {
                const customerResponse = await axiosClient.get(`/customers/${customerId}`);
                setCustomer(customerResponse.data);

                const ordersResponse = await axiosClient.get(`/orders?customerId.equals=${customerId}&sort=placedAt,desc`);
                setOrders(ordersResponse.data);
                
                setError(null);
            } catch (err) {
                setError('Không thể tải thông tin chi tiết khách hàng.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [customerId]);

    if (isLoading) return <p>Đang tải...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!customer) return <p>Không tìm thấy khách hàng.</p>;

    return (
        <div>
            <Link to="/admin/customers" className="text-indigo-600 hover:underline mb-4 inline-block">
                &larr; Quay lại danh sách khách hàng
            </Link>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h1 className="text-2xl font-bold">{customer.firstName} {customer.lastName}</h1>
                <p className="text-gray-600">{customer.email}</p>
                <p className="text-gray-600">{customer.phone}</p>
                <p className="text-gray-600">{customer.address}</p>
            </div>

            <h2 className="text-xl font-bold mb-4">Lịch sử đơn hàng</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full text-sm text-left text-gray-500">
                     <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                        <tr>
                            <th className="px-6 py-3">Mã Đơn Hàng</th>
                            <th className="px-6 py-3">Ngày Đặt</th>
                            <th className="px-6 py-3">Tổng Tiền</th>
                            <th className="px-6 py-3">Trạng thái</th>
                            <th className="px-6 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                             <tr key={order.id} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-indigo-600">{order.code}</td>
                                <td className="px-6 py-4">{new Date(order.placedAt).toLocaleDateString('vi-VN')}</td>
                                <td className="px-6 py-4 font-medium">{order.totalAmount.toLocaleString('vi-VN')} VND</td>
                                <td className="px-6 py-4">{order.status}</td>
                                <td className="px-6 py-4 text-right">
                                     <Link to={`/admin/orders/${order.id}`} className="font-medium text-indigo-600 hover:underline">
                                        Xem
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {orders.length === 0 && (
                    <p className="p-4 text-center text-gray-500">Khách hàng này chưa có đơn hàng nào.</p>
                )}
            </div>
        </div>
    );
};

export default AdminCustomerDetailPage;
