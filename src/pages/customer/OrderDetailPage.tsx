import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Order, OrderItem } from '../../types/order';
import axiosClient from '../../api/axiosClient';
import OrderStatusTracker from '../../components/customer/OrderStatusTracker'; // Import component mới

const OrderDetailPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            if (!orderId) return;
            try {
                const response = await axiosClient.get<Order>(`/orders/${orderId}`);
                setOrder(response.data);
            } catch (err) {
                console.error("Lỗi khi tải chi tiết đơn hàng:", err);
                setError("Không tìm thấy đơn hàng hoặc đã có lỗi xảy ra.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderDetail();
    }, [orderId]);

    if (isLoading) {
        return <div>Đang tải chi tiết đơn hàng...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (!order) {
        return <div>Không có thông tin đơn hàng.</div>
    }

    return (
        <div>
            <Link to="/account/orders" className="text-indigo-600 hover:underline mb-6 inline-block">&larr; Quay lại danh sách</Link>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Chi tiết đơn hàng #{order.code}</h2>
                        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-2">
                            <p><strong>Ngày đặt:</strong> {new Date(order.placedAt).toLocaleString('vi-VN')}</p>
                            <p><strong>Tổng tiền:</strong> <span className="font-bold text-indigo-600">{order.totalAmount.toLocaleString('vi-VN')} VND</span></p>
                            <p className="pt-2"><strong>Ghi chú giao hàng:</strong> {order.note || 'Không có'}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold mb-4">Các sản phẩm đã mua</h3>
                        <div className="space-y-4">
                            {order.orderItems?.map((item: OrderItem) => (
                                <div key={item.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm border">
                                    <img src={`https://placehold.co/80x80/EFEFEF/333333?text=Item`} alt={item.productVariant?.name} className="w-20 h-20 object-cover rounded-md" />
                                    <div className="flex-grow ml-4">
                                        <p className="font-bold text-gray-800">{item.productVariant?.name}</p>
                                        <p className="text-sm text-gray-500">SKU: {item.productVariant?.sku}</p>
                                        <p className="text-sm">Số lượng: {item.quantity}</p>
                                    </div>
                                    <p className="font-semibold text-gray-900">{(item.unitPrice * item.quantity).toLocaleString('vi-VN')} VND</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    {order.orderStatusHistory && (
                        <OrderStatusTracker history={order.orderStatusHistory} currentStatus={order.status} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;
