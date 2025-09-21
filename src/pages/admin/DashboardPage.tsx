import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { DashboardStats } from '../../types/dashboard';
import type { Order } from '../../types/order';
import type { Customer } from '../../types/customer';

const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const [ordersRes, customersRes, productsRes] = await Promise.all([
                    axiosClient.get('/orders?sort=placedAt,desc&page=0&size=100'), 
                    axiosClient.get('/customers?sort=id,desc&page=0&size=10'), 
                    axiosClient.get('/products') 
                ]);

                const orders: Order[] = ordersRes.data;
                const customers: Customer[] = customersRes.data;
             
                const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
                const newOrdersCount = orders.length;
                const newCustomersCount = customers.length;
                const totalProducts = productsRes.headers['x-total-count'] || 0;

                setStats({ totalRevenue, newOrdersCount, newCustomersCount, totalProducts });
                setRecentOrders(orders.slice(0, 5));
                
                setError(null);
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu dashboard:", err);
                setError('Không thể tải dữ liệu tổng quan.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) return <p>Đang tải dữ liệu...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Tổng quan</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Tổng Doanh thu</h3>
                    <p className="text-2xl font-bold mt-1">{stats?.totalRevenue.toLocaleString('vi-VN')} VND</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Đơn hàng mới (100 gần nhất)</h3>
                    <p className="text-2xl font-bold mt-1">{stats?.newOrdersCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Khách hàng mới (10 gần nhất)</h3>
                    <p className="text-2xl font-bold mt-1">{stats?.newCustomersCount}</p>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Tổng Sản phẩm</h3>
                    <p className="text-2xl font-bold mt-1">{stats?.totalProducts}</p>
                </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Đơn hàng gần đây</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                 <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                        <tr>
                            <th className="px-6 py-3">Mã Đơn Hàng</th>
                            <th className="px-6 py-3">Ngày Đặt</th>
                            <th className="px-6 py-3">Khách Hàng</th>
                            <th className="px-6 py-3">Tổng Tiền</th>
                            <th className="px-6 py-3">Trạng thái TT</th>
                            <th className="px-6 py-3">Trạng thái GH</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.map(order => (
                            <tr key={order.id} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <Link to={`/admin/orders/${order.id}`} className="font-bold text-indigo-600 hover:underline">
                                        {order.code}
                                    </Link>
                                </td>
                                <td className="px-6 py-4">{new Date(order.placedAt).toLocaleDateString('vi-VN')}</td>
                                <td className="px-6 py-4">{order.customer?.firstName || 'Khách lẻ'} {order.customer?.lastName}</td>
                                <td className="px-6 py-4 font-semibold">{order.totalAmount.toLocaleString('vi-VN')} VND</td>
                                <td className="px-6 py-4">{order.paymentStatus}</td>
                                <td className="px-6 py-4">{order.fulfillmentStatus}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
        </div>
    );
};

export default DashboardPage;
