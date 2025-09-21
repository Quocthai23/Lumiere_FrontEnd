import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Order, OrderItem } from '../../types/order';
import type { Customer } from '../../types/customer'; 

const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'REFUNDED'];
const FULFILLMENT_STATUSES = ['UNFULFILLED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'FAILED'];

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
            fetchOrderDetails();
        } catch (err) {
            alert('Cập nhật thất bại. Vui lòng thử lại.');
            console.error(err);
        }
    };

    if (isLoading) return <p>Đang tải...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!order) return <p>Không tìm thấy đơn hàng.</p>;

    return (
        <div>
            <Link to="/admin/orders" className="text-indigo-600 hover:underline mb-4 inline-block">
                &larr; Quay lại danh sách đơn hàng
            </Link>
            
            <h1 className="text-2xl font-bold mb-4">Chi tiết đơn hàng #{order.code}</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                        <h2 className="font-bold text-lg mb-2">Các sản phẩm trong đơn</h2>
                        {order.orderItems?.map((item: OrderItem) => (
                             <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-none">
                                <div>
                                    <p className="font-medium">{item.productVariant?.name}</p>
                                    <p className="text-sm text-gray-500">SKU: {item.productVariant?.sku}</p>
                                </div>
                                <div>
                                    {item.unitPrice.toLocaleString('vi-VN')} x {item.quantity} = <strong>{(item.unitPrice * item.quantity).toLocaleString('vi-VN')} VND</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
                         <h2 className="font-bold text-lg mb-2">Thông tin khách hàng</h2>
                         <p><strong>Tên:</strong> {customer?.firstName || ''} {customer?.lastName || ''}</p>
                         <p><strong>Email:</strong> {customer?.email}</p>
                         <p><strong>SĐT:</strong> {customer?.phone}</p>
                         <p><strong>Địa chỉ:</strong> {customer?.address}</p>
                    </div>
                     <div className="bg-white p-4 rounded-lg shadow-sm border">
                         <h2 className="font-bold text-lg mb-4">Cập nhật trạng thái</h2>
                         <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Trạng thái đơn hàng</label>
                                <select name="status" value={statusData.status} onChange={handleStatusChange} className="w-full mt-1 p-2 border-gray-300 rounded-md">
                                    {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Trạng thái thanh toán</label>
                                <select name="paymentStatus" value={statusData.paymentStatus} onChange={handleStatusChange} className="w-full mt-1 p-2 border-gray-300 rounded-md">
                                    {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Trạng thái giao hàng</label>
                                <select name="fulfillmentStatus" value={statusData.fulfillmentStatus} onChange={handleStatusChange} className="w-full mt-1 p-2 border-gray-300 rounded-md">
                                    {FULFILLMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <button onClick={handleUpdateStatus} className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
                                Lưu thay đổi
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetailPage;
