import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Order, OrderItem, OrderStatusHistory } from '../../types/order';
import type { Customer } from '../../types/customer'; 
import { CheckCircle, Circle, Package, Truck, Home, CreditCard, User, Mail, Phone, MapPin } from 'lucide-react';


const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'REFUNDED'];
const FULFILLMENT_STATUSES = ['UNFULFILLED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'FAILED'];

// Reusable UI Components
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

// Order Timeline Component
const OrderTimeline: React.FC<{ history: OrderStatusHistory[] }> = ({ history }) => {
    const statusConfig: { [key: string]: { icon: React.ElementType; text: string } } = {
      PENDING: { icon: Package, text: 'Đã đặt hàng' },
      CONFIRMED: { icon: CheckCircle, text: 'Đã xác nhận' },
      SHIPPING: { icon: Truck, text: 'Đang vận chuyển' },
      DELIVERED: { icon: Home, text: 'Đã giao hàng' },
      COMPLETED: { icon: CheckCircle, text: 'Hoàn thành' },
      CANCELLED: { icon: Circle, text: 'Đã hủy' },
    };

    const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return (
        <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"></div>

            <ul className="space-y-6">
            {sortedHistory.map((item, index) => {
                const config = statusConfig[item.status] || { icon: Circle, text: item.status };
                const Icon = config.icon;

                return (
                <li key={item.id} className="flex items-start">
                    <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 bg-indigo-600 text-white">
                        <Icon className="w-4 h-4" />
                    </div>
                    <div className="ml-4">
                    <h4 className="font-semibold text-gray-800 text-sm">{config.text}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(item.timestamp).toLocaleString('vi-VN')}</p>
                    </div>
                </li>
                );
            })}
            </ul>
        </div>
    );
};


const AdminOrderDetailPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [statusData, setStatusData] = useState({
        status: '',
        paymentStatus: '',
        fulfillmentStatus: '',
    });

    const fetchOrderDetails = async () => {
        if (!orderId) return;
        setIsLoading(true);
        try {
            const orderResponse = await axiosClient.get(`/orders/${orderId}`);
            setOrder(orderResponse.data);
            setStatusData({
                status: orderResponse.data.status,
                paymentStatus: orderResponse.data.paymentStatus,
                fulfillmentStatus: orderResponse.data.fulfillmentStatus,
            });

            if (orderResponse.data.customer?.id) {
                const customerResponse = await axiosClient.get(`/customers/${orderResponse.data.customer.id}`);
                setCustomer(customerResponse.data);
            }

            setError(null);
        } catch (err) {
            setError('Không thể tải chi tiết đơn hàng.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setStatusData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateStatus = async () => {
        if (!order) return;
        try {
            await axiosClient.patch(`/orders/${order.id}`, statusData);
            alert('Cập nhật trạng thái thành công!');
            fetchOrderDetails(); // Refetch to update history
        } catch (err) {
            alert('Cập nhật thất bại. Vui lòng thử lại.');
            console.error(err);
        }
    };

    if (isLoading) return <p>Đang tải...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!order) return <p>Không tìm thấy đơn hàng.</p>;

    const subtotal = order.orderItems?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                     <Link to="/admin/orders" className="text-indigo-600 hover:underline mb-2 inline-block text-sm">&larr; Quay lại danh sách</Link>
                     <h1 className="text-2xl font-bold">Đơn hàng #{order.code}</h1>
                     <p className="text-sm text-gray-500">{new Date(order.placedAt).toLocaleString('vi-VN')}</p>
                </div>
                 <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm">In hóa đơn</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Chi tiết đơn hàng ({order.orderItems?.length || 0})</CardTitle></CardHeader>
                        <CardContent>
                             <table className="min-w-full text-sm">
                                <thead className="text-gray-500">
                                    <tr>
                                        <th className="text-left font-medium p-2">Sản phẩm</th>
                                        <th className="text-right font-medium p-2">Số lượng</th>
                                        <th className="text-right font-medium p-2">Đơn giá</th>
                                        <th className="text-right font-medium p-2">Tổng</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                {order.orderItems?.map((item: OrderItem) => (
                                    <tr key={item.id}>
                                        <td className="p-2">
                                            <p className="font-medium">{item.productVariant?.name}</p>
                                            <p className="text-xs text-gray-500">SKU: {item.productVariant?.sku}</p>
                                        </td>
                                        <td className="p-2 text-right">{item.quantity}</td>
                                        <td className="p-2 text-right">{item.unitPrice.toLocaleString('vi-VN')} ₫</td>
                                        <td className="p-2 text-right font-semibold">{item.totalPrice.toLocaleString('vi-VN')} ₫</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Thanh toán</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Tạm tính:</span> <span>{subtotal.toLocaleString('vi-VN')} ₫</span></div>
                            <div className="flex justify-between"><span>Phí vận chuyển:</span> <span>0 ₫</span></div>
                            <div className="flex justify-between"><span>Giảm giá:</span> <span>- 0 ₫</span></div>
                            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>Tổng cộng:</span> <span>{order.totalAmount.toLocaleString('vi-VN')} ₫</span></div>
                             <div className="flex items-center gap-2 pt-2"><CreditCard size={16} className="text-gray-500"/> <span>Thanh toán qua {order.paymentMethod}</span></div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                         <CardHeader><CardTitle>Khách hàng</CardTitle></CardHeader>
                         <CardContent className="space-y-3 text-sm">
                             <Link to={`/admin/customers/${customer?.id}`} className="flex items-center gap-2 font-semibold text-indigo-600 hover:underline">
                                <User size={16}/> {customer?.firstName || ''} {customer?.lastName || 'Khách lẻ'}
                             </Link>
                             <div className="flex items-center gap-2 text-gray-600"><Mail size={16}/> {customer?.email}</div>
                             <div className="flex items-center gap-2 text-gray-600"><Phone size={16}/> {customer?.phone}</div>
                             <div className="flex items-start gap-2 text-gray-600"><MapPin size={16} className="mt-0.5 flex-shrink-0"/> {customer?.address}</div>
                         </CardContent>
                    </Card>
                     <Card>
                         <CardHeader><CardTitle>Cập nhật trạng thái</CardTitle></CardHeader>
                         <CardContent className="space-y-4">
                             <div>
                                <label className="block text-xs font-medium">Trạng thái đơn hàng</label>
                                <select name="status" value={statusData.status} onChange={handleStatusChange} className="w-full mt-1 p-2 border-gray-300 rounded-md text-sm">
                                    {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-xs font-medium">Trạng thái thanh toán</label>
                                <select name="paymentStatus" value={statusData.paymentStatus} onChange={handleStatusChange} className="w-full mt-1 p-2 border-gray-300 rounded-md text-sm">
                                    {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <button onClick={handleUpdateStatus} className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
                                Cập nhật
                            </button>
                         </CardContent>
                    </Card>
                    {order.orderStatusHistory && (
                        <Card>
                            <CardHeader><CardTitle>Lịch sử đơn hàng</CardTitle></CardHeader>
                            <CardContent>
                                <OrderTimeline history={order.orderStatusHistory} />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetailPage;
