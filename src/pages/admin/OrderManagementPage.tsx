import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Order } from '../../types/order';
import { File, ListFilter, Search } from 'lucide-react';
import httpClient from "../../utils/HttpClient.ts";

// Reusable UI Components
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 border-b ${className}`}>{children}</div>
);
const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 ${className}`}>{children}</div>
);

const StatusBadge = ({ status }: { status: string }) => {
    const statusStyles: { [key: string]: string } = {
        COMPLETED: 'bg-green-100 text-green-800',
        DELIVERED: 'bg-green-100 text-green-800',
        PAID: 'bg-green-100 text-green-800',
        FULFILLED: 'bg-green-100 text-green-800',
        PENDING: 'bg-yellow-100 text-yellow-800',
        UNPAID: 'bg-yellow-100 text-yellow-800',
        UNFULFILLED: 'bg-yellow-100 text-yellow-800',
        PROCESSING: 'bg-blue-100 text-blue-800',
        SHIPPING: 'bg-blue-100 text-blue-800',
        CANCELLED: 'bg-red-100 text-red-800',
        FAILED: 'bg-red-100 text-red-800',
        REFUNDED: 'bg-gray-100 text-gray-800',
    };
    const style = statusStyles[status] || 'bg-gray-100 text-gray-800';
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>{status}</span>;
};

const OrderManagementPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const response = await httpClient.get<Order[]>('/orders?sort=placedAt,desc');
            const ordersWithCustomer = response.map((order: any) => ({
                ...order,
                customerName: order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() : 'Guest'
            }));
            setOrders(ordersWithCustomer);
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách đơn hàng.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredOrders = useMemo(() => {
        return orders
            .filter(order => {
                if (activeTab === 'All') return true;
                return order.status === activeTab;
            })
            .filter(order => {
                const term = searchTerm.toLowerCase();
                if (!term) return true;
                return (
                    order.code.toLowerCase().includes(term) ||
                    (order as any).customerName.toLowerCase().includes(term)
                );
            });
    }, [orders, activeTab, searchTerm]);
    
    const TABS = ['All', 'PENDING', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Quản lý Đơn hàng</h1>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm hover:bg-gray-50">
                        <ListFilter className="h-4 w-4" />
                        <span>Lọc</span>
                    </button>
                    <button className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm hover:bg-gray-50">
                        <File className="h-4 w-4" />
                        <span>Xuất file</span>
                    </button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex border-b">
                            {TABS.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 ${
                                        activeTab === tab
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <input
                                type="search"
                                placeholder="Tìm kiếm đơn hàng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-2 py-2 w-full md:w-[250px] border rounded-md bg-gray-50"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                <tr>
                                    <th className="px-6 py-3">Mã Đơn Hàng</th>
                                    <th className="px-6 py-3">Ngày Đặt</th>
                                    <th className="px-6 py-3">Khách Hàng</th>
                                    <th className="px-6 py-3">Trạng thái</th>
                                    <th className="px-6 py-3">Thanh toán</th>
                                    <th className="px-6 py-3 text-right">Tổng Tiền</th>
                                    <th className="px-6 py-3 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr><td colSpan={7} className="text-center p-8">Đang tải...</td></tr>
                                ) : error ? (
                                     <tr><td colSpan={7} className="text-center p-8 text-red-500">{error}</td></tr>
                                ) : filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-bold text-indigo-600">
                                            <Link to={`/admin/orders/${order.id}`}>{order.code}</Link>
                                        </td>
                                        <td className="px-6 py-4">{new Date(order.placedAt).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-6 py-4">{(order as any).customerName || 'N/A'}</td>
                                        <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                        <td className="px-6 py-4"><StatusBadge status={order.paymentStatus} /></td>
                                        <td className="px-6 py-4 font-medium text-right">{order.totalAmount.toLocaleString('vi-VN')} ₫</td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to={`/admin/orders/${order.id}`} className="font-medium text-indigo-600 hover:underline">
                                                Xem chi tiết
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                         { !isLoading && filteredOrders.length === 0 && (
                            <p className="p-8 text-center text-gray-500">Không có đơn hàng nào phù hợp.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OrderManagementPage;
