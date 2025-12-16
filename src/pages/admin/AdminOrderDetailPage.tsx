import React, {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import type {Order, OrderItem, OrderStatusHistory} from '../../types/order';
import type {Customer} from '../../types/customer';
import {
    CheckCircle,
    Circle,
    CreditCard,
    Home,
    Medal,
    Package,
    Phone,
    Truck,
    User
} from 'lucide-react';
import httpClient from "../../utils/HttpClient.ts";
import OrderInvoiceButton from "../../components/admin/OrderInvoiceButton.tsx";



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
      PROCESSING: { icon: Package, text: 'Đang đóng hàng' },
      SHIPPING: { icon: Truck, text: 'Đang vận chuyển' },
      DELIVERED: { icon: Home, text: 'Đã giao hàng' },
      COMPLETED: { icon: CheckCircle, text: 'Hoàn thành' },
      CANCELLED: { icon: Circle, text: 'Đã hủy' },
    };

    if (!history || history.length === 0) {
        return <p className="text-sm text-gray-500">Chưa có lịch sử trạng thái</p>;
    }

    const sortedHistory = [...(history || [])].sort((a, b) => {
        const timeA = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
    });

    return (
        <div className="relative">
            {sortedHistory.length > 1 && (
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"></div>
            )}

            <ul className="space-y-6">
            {sortedHistory.map((item) => {
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

    const [nextStatus, setNextStatus] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    const fetchOrderDetails = async () => {
        if (!orderId) return;
        setIsLoading(true);
        try {
            const orderResponse = await httpClient.get<Order>(`/orders/${orderId}`);

            // Gắn vào orderResponse
            orderResponse.orderItems = await httpClient.get<OrderItem[]>(`/order-items/by-order/${orderId}`);

            // Lấy lịch sử trạng thái từ endpoint mới: GET /orders/{id}/status-history
            try {
                const statusHistoryResponse = await httpClient.get<OrderStatusHistory[]>(`/orders/${orderId}/status-history`);
                orderResponse.orderStatusHistory = statusHistoryResponse;
            } catch (historyErr) {
                console.warn("Không thể tải lịch sử trạng thái:", historyErr);
            }

            setOrder(orderResponse);

            // Fetch next status (chỉ fetch nếu đơn hàng chưa hoàn thành hoặc hủy)
            if (orderResponse.status !== 'COMPLETED' && orderResponse.status !== 'CANCELLED') {
                try {
                    const nextStatusResponse = await httpClient.get<string | null>(`/orders/${orderId}/next-status`);
                    // Nếu response là null hoặc empty string, set null
                    setNextStatus(nextStatusResponse && nextStatusResponse.trim() !== '' ? nextStatusResponse : null);
                } catch (err: any) {
                    // Nếu lỗi 404 hoặc không tìm thấy, set null (đơn hàng đã hoàn thành)
                    if (err?.status === 404 || err?.response?.status === 404) {
                        setNextStatus(null);
                    } else {
                        console.warn("Không thể tải trạng thái tiếp theo:", err);
                        setNextStatus(null);
                    }
                }
            } else {
                setNextStatus(null);
            }

            if (orderResponse.customer?.id) {
                const customerResponse = await httpClient.get<Customer>(`/customers/${orderResponse.customer.id}`);
                setCustomer(customerResponse);
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


    const handleConfirmPayment = async () => {
        if (!order) return;
        try {
            await httpClient.put(`/orders/${order.id}/confirm-payment`);
            alert('Xác nhận thanh toán thành công!');
            fetchOrderDetails(); // Refetch to update order data
        } catch (err) {
            alert('Xác nhận thanh toán thất bại. Vui lòng thử lại.');
            console.error(err);
        }
    };

    const handleCancelOrder = async () => {
        if (!order) return;
        
        const reason = prompt('Vui lòng nhập lý do hủy đơn hàng:');
        if (!reason) return;

        if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;

        setIsCancelling(true);
        try {
            await httpClient.put(`/orders/${order.id}/cancel`, { reason });
            alert('Đơn hàng đã được hủy thành công!');
            fetchOrderDetails(); // Refetch to update order data
        } catch (err) {
            alert('Không thể hủy đơn hàng. Vui lòng thử lại.');
            console.error(err);
        } finally {
            setIsCancelling(false);
        }
    };

    // Map status to Vietnamese
    const getStatusText = (status: string): string => {
        const statusMap: { [key: string]: string } = {
            'PENDING': 'Chờ xử lý',
            'CONFIRMED': 'Đã xác nhận',
            'PROCESSING': 'Đang đóng hàng',
            'SHIPPING': 'Đang vận chuyển',
            'DELIVERED': 'Đã giao hàng',
            'COMPLETED': 'Hoàn thành',
            'CANCELLED': 'Đã hủy',
            'DRAFT': 'Nháp'
        };
        return statusMap[status] || status;
    };

    // Map payment status to Vietnamese
    const getPaymentStatusText = (status: string): string => {
        const statusMap: { [key: string]: string } = {
            'UNPAID': 'Chưa thanh toán',
            'PAID': 'Đã thanh toán',
            'REFUNDED': 'Đã hoàn tiền'
        };
        return statusMap[status] || status;
    };

    if (isLoading) return <p>Đang tải...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!order) return <p>Không tìm thấy đơn hàng.</p>;

    const subtotal = order.orderItems?.reduce((sum, item) => sum + (item?.totalPrice || 0), 0) || 0;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                     <Link to="/admin/orders" className="text-indigo-600 hover:underline mb-2 inline-block text-sm">&larr; Quay lại danh sách</Link>
                     <h1 className="text-2xl font-bold">Đơn hàng #{order.code}</h1>
                     <p className="text-sm text-gray-500">{new Date(order.placedAt).toLocaleString('vi-VN')}</p>
                </div>
                <OrderInvoiceButton orderId={order.id} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Chi tiết đơn hàng ({order.orderItems?.length || 0})</CardTitle
                            ></CardHeader>
                        <CardContent>
                             <table className="min-w-full text-sm">
                                <thead className="text-gray-500">
                                    <tr>
                                        <th className="text-left font-medium p-2"></th>
                                        <th className="text-left font-medium p-2">Sản phẩm</th>
                                        <th className="text-right font-medium p-2">Số lượng</th>
                                        <th className="text-right font-medium p-2">Đơn giá</th>
                                        <th className="text-right font-medium p-2">Tổng</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                {order.orderItems && order.orderItems.length > 0 ? (
                                    order.orderItems.map((item: OrderItem) => (
                                        <tr key={item.id}>
                                            {/* Ảnh */}
                                            <td className="p-2 w-14">
                                                {item.productVariant?.urlImage ? (
                                                    <img
                                                        src={item.productVariant.urlImage}
                                                        alt={item.productVariant?.name || 'Ảnh'}
                                                        className="w-10 h-10 rounded object-cover border"
                                                        onError={(e: any) => (e.currentTarget.style.display = 'none')}
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded bg-gray-100 border" />
                                                )}
                                            </td>

                                            {/* Tên & SKU */}
                                            <td className="p-2">
                                                <p className="font-medium">{item.productVariant?.name || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">SKU: {item.productVariant?.sku || 'N/A'}</p>
                                            </td>

                                            <td className="p-2 text-right">{item.quantity || 0}</td>
                                            <td className="p-2 text-right">
                                                {item.productVariant?.promotionPrice != null && 
                                                 item.productVariant.promotionPrice < item.productVariant.price ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-block bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
                                                                FLASH SALE
                                                            </span>
                                                            <span className="font-semibold text-red-600">
                                                                {(item.productVariant.promotionPrice || 0).toLocaleString('vi-VN')} ₫
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-gray-500 line-through">
                                                            {(item.productVariant.price || item.unitPrice || 0).toLocaleString('vi-VN')} ₫
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span>{(item.unitPrice || 0).toLocaleString('vi-VN')} ₫</span>
                                                )}
                                            </td>
                                            <td className="p-2 text-right font-semibold">
                                                {item.productVariant?.promotionPrice != null && 
                                                 item.productVariant.promotionPrice < item.productVariant.price ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-red-600">
                                                            {((item.productVariant.promotionPrice || 0) * (item.quantity || 0)).toLocaleString('vi-VN')} ₫
                                                        </span>
                                                        <span className="text-sm text-gray-500 line-through font-normal">
                                                            {((item.productVariant.price || item.unitPrice || 0) * (item.quantity || 0)).toLocaleString('vi-VN')} ₫
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span>{(item.totalPrice || 0).toLocaleString('vi-VN')} ₫</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-gray-500">
                                            Không có sản phẩm trong đơn hàng
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Thanh toán</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Tạm tính:</span> <span>{subtotal.toLocaleString('vi-VN')} ₫</span></div>
                            <div className="flex justify-between"><span>Phí vận chuyển:</span> <span>{(order.shippingCost || 0).toLocaleString('vi-VN')} ₫</span></div>
                            <div className="flex justify-between"><span>Giảm giá:</span> <span>- 0 ₫</span></div>
                            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2"><span>Tổng cộng:</span> <span>{order.totalAmount.toLocaleString('vi-VN')} ₫</span></div>
                             <div className="flex items-center gap-2 pt-2"><CreditCard size={16} className="text-gray-500"/> <span>Thanh toán qua {order.paymentMethod}</span></div>
                        </CardContent>
                    </Card>
                    {order.shippingInfo && (() => {
                        try {
                            const shippingData = JSON.parse(order.shippingInfo);
                            return (
                                <Card>
                                    <CardHeader><CardTitle>Thông tin giao hàng</CardTitle></CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div><strong>Họ tên người nhận:</strong> {shippingData.fullName || 'N/A'}</div>
                                        <div><strong>Số điện thoại:</strong> {shippingData.phone || 'N/A'}</div>
                                        <div><strong>Địa chỉ:</strong> {shippingData.street || 'N/A'}</div>
                                        <div><strong>Thành phố/Tỉnh:</strong> {shippingData.city || 'N/A'}</div>
                                        {shippingData.note && (
                                            <div><strong>Ghi chú:</strong> {shippingData.note}</div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        } catch (e) {
                            // Nếu không parse được JSON, hiển thị raw text
                            return (
                                <Card>
                                    <CardHeader><CardTitle>Thông tin giao hàng</CardTitle></CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="whitespace-pre-wrap">{order.shippingInfo}</div>
                                    </CardContent>
                                </Card>
                            );
                        }
                    })()}
                </div>

                <div className="space-y-6">
                    <Card>
                         <CardHeader><CardTitle>Khách hàng</CardTitle></CardHeader>
                         <CardContent className="space-y-3 text-sm">
                             <Link to={`/admin/customers/${customer?.id}`} className="flex items-center gap-2 font-semibold text-indigo-600 hover:underline">
                                <User size={16}/> {customer?.firstName || ''} {customer?.lastName || 'Khách lẻ'}
                             </Link>
                             <div className="flex items-center gap-2 text-gray-600"><Phone size={16}/> {customer?.phone}</div>
                             <div className="flex items-start gap-2 text-gray-600"><Medal  size={16} className="mt-0.5 flex-shrink-0"/> {customer?.loyaltyPoints}</div>
                         </CardContent>
                    </Card>
                     <Card>
                         <CardHeader><CardTitle>Trạng thái đơn hàng</CardTitle></CardHeader>
                         <CardContent className="space-y-4">
                             <div className="bg-gray-50 p-3 rounded-md">
                                 <div className="text-xs text-gray-600 mb-1">Trạng thái hiện tại</div>
                                 <div className="font-semibold text-gray-800">{getStatusText(order.status)}</div>
                             </div>
                             <div className="bg-gray-50 p-3 rounded-md">
                                 <div className="text-xs text-gray-600 mb-1">Trạng thái thanh toán</div>
                                 <div className="font-semibold text-gray-800">{getPaymentStatusText(order.paymentStatus)}</div>
                             </div>
                             {nextStatus && (
                                 <div>
                                     <label className="block text-xs font-medium mb-2">Cập nhật trạng thái đơn hàng</label>
                                     <div className="bg-blue-50 p-3 rounded-md mb-3">
                                         <div className="text-xs text-gray-600 mb-1">Trạng thái tiếp theo</div>
                                         <div className="font-semibold text-blue-800">{getStatusText(nextStatus)}</div>
                                     </div>
                                     <button 
                                         onClick={async () => {
                                             if (!order) return;
                                             try {
                                                 await httpClient.put(`/orders/${order.id}/status`, {
                                                     status: nextStatus,
                                                     description: `Cập nhật trạng thái đơn hàng thành ${getStatusText(nextStatus)}`
                                                 });
                                                 alert('Cập nhật trạng thái thành công!');
                                                 fetchOrderDetails(); // Refetch to update history
                                             } catch (err) {
                                                 alert('Cập nhật thất bại. Vui lòng thử lại.');
                                                 console.error(err);
                                             }
                                         }} 
                                         className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
                                     >
                                         Cập nhật trạng thái
                                     </button>
                                 </div>
                             )}
                             {order.paymentMethod === 'QR' && order.paymentStatus !== 'PAID' && (
                                 <button 
                                     onClick={handleConfirmPayment}
                                     className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
                                 >
                                     Xác nhận đã thanh toán
                                 </button>
                             )}
                             {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.status !== 'COMPLETED' && (
                                 <button 
                                     onClick={handleCancelOrder}
                                     disabled={isCancelling}
                                     className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400"
                                 >
                                     {isCancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                                 </button>
                             )}
                         </CardContent>
                    </Card>
                    {order.orderStatusHistory && order.orderStatusHistory.length > 0 && (
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
