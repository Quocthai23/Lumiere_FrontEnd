import React, {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import type {Customer} from '../../types/customer';
import type {Order} from '../../types/order';
import {DollarSign, Edit, Mail, MapPin, Phone, ShoppingCart, Star, User} from 'lucide-react';
import httpClient from "../../utils/HttpClient.ts";

// --- Reusable UI Components ---
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 border-b ${className}`}>{children}</div>
);
const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <h3 className={`font-semibold text-lg ${className}`}>{children}</h3>
);
const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 ${className}`}>{children}</div>
);
const StatusBadge = ({ status }: { status: string }) => {
    const statusStyles: { [key: string]: string } = {
        COMPLETED: 'bg-green-100 text-green-800',
        DELIVERED: 'bg-green-100 text-green-800',
        PENDING: 'bg-yellow-100 text-yellow-800',
        PROCESSING: 'bg-blue-100 text-blue-800',
        SHIPPING: 'bg-blue-100 text-blue-800',
        CANCELLED: 'bg-red-100 text-red-800',
    };
    const style = statusStyles[status] || 'bg-gray-100 text-gray-800';
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${style}`}>{status}</span>;
};

// --- Main Component ---
const AdminCustomerDetailPage: React.FC = () => {
    const { customerId } = useParams<{ customerId: string }>();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalSpent, setTotalSpent] = useState(0);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!customerId) return;
            setIsLoading(true);
            try {
                const customerResponse = await httpClient.get<Customer>(`/customers/${customerId}`);
                setCustomer(customerResponse);

                const customerOrders = await httpClient.get<Order[]>(`/orders?customerId.equals=${customerId}&sort=placedAt,desc`);
                setOrders(customerOrders);
                
                // Calculate total spent from completed orders
                const spent = customerOrders
                    .filter((o: Order) => o.status === 'COMPLETED' || o.status === 'DELIVERED')
                    .reduce((sum: number, o: Order) => sum + o.totalAmount, 0);
                setTotalSpent(spent);
                
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
            <div className="flex justify-between items-start mb-6">
                 <div>
                     <Link to="/admin/customers" className="text-indigo-600 hover:underline mb-2 inline-block text-sm">&larr; Quay lại danh sách</Link>
                     <h1 className="text-2xl font-bold">{customer.firstName} {customer.lastName}</h1>
                </div>
                <Link to={`/admin/customers/edit/${customerId}`} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm">
                    <Edit size={14}/> Chỉnh sửa
                </Link>
            </div>
            
             {/* Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng chi tiêu</CardTitle>
                        <DollarSign className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSpent.toLocaleString('vi-VN')} ₫</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.length}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Điểm tích lũy</CardTitle>
                        <Star className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customer.loyaltyPoints?.toLocaleString('vi-VN')}</div>
                    </CardContent>
                </Card>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader><CardTitle>Lịch sử đơn hàng gần đây</CardTitle></CardHeader>
                        <CardContent>
                            <table className="min-w-full text-sm">
                                <thead className="text-gray-500">
                                    <tr>
                                        <th className="text-left font-medium p-2">Mã Đơn Hàng</th>
                                        <th className="text-left font-medium p-2">Ngày Đặt</th>
                                        <th className="text-left font-medium p-2">Trạng thái</th>
                                        <th className="text-right font-medium p-2">Tổng Tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {orders.slice(0, 5).map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="p-2 font-semibold text-indigo-600">
                                                <Link to={`/admin/orders/${order.id}`}>{order.code}</Link>
                                            </td>
                                            <td className="p-2">{new Date(order.placedAt).toLocaleDateString('vi-VN')}</td>
                                            <td className="p-2"><StatusBadge status={order.status} /></td>
                                            <td className="p-2 text-right font-medium">{order.totalAmount.toLocaleString('vi-VN')} ₫</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {orders.length === 0 && <p className="text-center text-gray-500 py-4">Chưa có đơn hàng nào.</p>}
                        </CardContent>
                    </Card>
                </div>

                 <div>
                    <Card>
                         <CardHeader><CardTitle>Thông tin liên hệ</CardTitle></CardHeader>
                         <CardContent className="space-y-3 text-sm">
                             <div className="flex items-center gap-2 text-gray-600"><User size={16}/> {customer.firstName} {customer.lastName}</div>
                             <div className="flex items-center gap-2 text-gray-600"><Mail size={16}/> {customer.email}</div>
                             <div className="flex items-center gap-2 text-gray-600"><Phone size={16}/> {customer.phone}</div>
                             <div className="flex items-start gap-2 text-gray-600"><MapPin size={16} className="mt-0.5 flex-shrink-0"/> {customer.address || 'Chưa có địa chỉ'}</div>
                         </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminCustomerDetailPage;


