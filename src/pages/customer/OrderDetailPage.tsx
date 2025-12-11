import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Order, OrderItem } from '../../types/order';
import axiosClient from '../../api/axiosClient';
import OrderStatusTracker from '../../components/customer/OrderStatusTracker';
import ReviewModal from '../../components/customer/ReviewModal';
import CancelOrderModal from '../../components/customer/CancelOrderModal';
import { QrCode } from 'lucide-react';

const OrderDetailPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedOrderItem, setSelectedOrderItem] = useState<OrderItem | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            if (!orderId) return;
            try {
                const response = await axiosClient.get<Order>(`/orders/${orderId}`);
                const orderData = response.data;
                
                try {
                    const statusHistoryResponse = await axiosClient.get(`/orders/${orderId}/status-history`);
                    orderData.orderStatusHistory = statusHistoryResponse.data;
                } catch (historyErr) {
                    console.warn("Không thể tải lịch sử trạng thái:", historyErr);
                }
                
                setOrder(orderData);
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

    // Kiểm tra xem order có status là finish (COMPLETED hoặc DELIVERED)
    const isOrderFinished = order.status === 'COMPLETED' || order.status === 'DELIVERED';
    // Kiểm tra xem có thể hủy đơn hàng không (chưa giao và chưa hoàn thành)
    const canCancel = order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.status !== 'COMPLETED';

    const handleOpenReviewModal = (orderItem: OrderItem) => {
        setSelectedOrderItem(orderItem);
        setReviewModalOpen(true);
    };

    const handleCloseReviewModal = () => {
        setReviewModalOpen(false);
        setSelectedOrderItem(null);
    };

    const handleReviewSubmitted = () => {
        // Refresh order data sau khi submit review
        if (orderId) {
            axiosClient.get<Order>(`/orders/${orderId}`).then(response => {
                setOrder(response.data);
            }).catch(err => {
                console.error('Lỗi khi tải lại đơn hàng:', err);
            });
        }
    };

    const handleOpenCancelModal = () => {
        setCancelModalOpen(true);
    };

    const handleCloseCancelModal = () => {
        setCancelModalOpen(false);
    };

    const handleCancelOrder = async (reason: string) => {
        if (!orderId || !order) return;

        setIsCancelling(true);
        try {
            await axiosClient.put(`/orders/${orderId}/cancel`, { reason });
            alert('Đơn hàng đã được hủy thành công!');
            setCancelModalOpen(false);
            // Refresh order data
            const response = await axiosClient.get<Order>(`/orders/${orderId}`);
            setOrder(response.data);
        } catch (err) {
            console.error('Lỗi khi hủy đơn hàng:', err);
            alert('Không thể hủy đơn hàng. Vui lòng thử lại.');
        } finally {
            setIsCancelling(false);
        }
    };

    // Generate QR code URL nếu paymentMethod là QR
    const generateQRCodeUrl = (): string | null => {
        if (order.paymentMethod === 'QR') {
            const accountName = encodeURIComponent('NGUYỄN MINH HỘI');
            const amount = order.totalAmount;
            const contractCode = order.code;
            return `https://img.vietqr.io/image/MB-4730865860204-compact2.png?accountName=${accountName}&amount=${amount}&addInfo=${contractCode}`;
        }
        return null;
    };

    const qrCodeUrl = generateQRCodeUrl();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <Link to="/account/orders" className="text-indigo-600 hover:underline">&larr; Quay lại danh sách</Link>
                <div className="flex gap-2">
                    {canCancel && (
                        <button
                            onClick={handleOpenCancelModal}
                            disabled={isCancelling}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400"
                        >
                            Hủy đơn hàng
                        </button>
                    )}
                    {isOrderFinished && order.canReview && (
                        <button
                            onClick={() => {
                                // Mở modal với orderItem đầu tiên hoặc tất cả orderItems
                                if (order.orderItems && order.orderItems.length > 0) {
                                    handleOpenReviewModal(order.orderItems[0]);
                                }
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            Đánh giá đơn hàng
                        </button>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Chi tiết đơn hàng #{order.code}</h2>
                        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-2">
                            <p><strong>Ngày đặt:</strong> {new Date(order.placedAt).toLocaleString('vi-VN')}</p>
                            <p><strong>Tổng tiền:</strong> <span className="font-bold text-indigo-600">{order.totalAmount.toLocaleString('vi-VN')} VND</span></p>
                            {order.shippingCost !== undefined && order.shippingCost !== null && (
                                <p><strong>Phí vận chuyển:</strong> {order.shippingCost === 0 ? <span className="text-green-600">Miễn phí</span> : <span>{order.shippingCost.toLocaleString('vi-VN')} VND</span>}</p>
                            )}
                            <p><strong>Phương thức thanh toán:</strong> {order.paymentMethod === 'QR' ? 'VNPay QR' : order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod}</p>
                            <p className="pt-2"><strong>Ghi chú giao hàng:</strong> {order.note || 'Không có'}</p>
                        </div>
                    </div>

                    {order.shippingInfo && (() => {
                        try {
                            const shippingData = JSON.parse(order.shippingInfo);
                            return (
                                <div>
                                    <h3 className="text-xl font-semibold mb-4">Thông tin giao hàng</h3>
                                    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-2">
                                        <p><strong>Họ tên người nhận:</strong> {shippingData.fullName || 'N/A'}</p>
                                        <p><strong>Số điện thoại:</strong> {shippingData.phone || 'N/A'}</p>
                                        <p><strong>Địa chỉ:</strong> {shippingData.street || 'N/A'}</p>
                                        <p><strong>Thành phố/Tỉnh:</strong> {shippingData.city || 'N/A'}</p>
                                        {shippingData.note && (
                                            <p><strong>Ghi chú:</strong> {shippingData.note}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        } catch (e) {
                            return null;
                        }
                    })()}

                    <div>
                        <h3 className="text-xl font-semibold mb-4">Các sản phẩm đã mua</h3>
                        <div className="space-y-4">
                            {order.orderItems?.map((item: OrderItem) => (
                                <div key={item.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm border">
                                    <img src={item.productVariant?.urlImage} alt={item.productVariant?.name} className="w-20 h-20 object-cover rounded-md" />
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

                <div className="lg:col-span-1 space-y-6">
                    {order.orderStatusHistory && (
                        <OrderStatusTracker history={order.orderStatusHistory} currentStatus={order.status} />
                    )}
                    
                    {qrCodeUrl && (
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center gap-2 mb-4">
                                <QrCode className="w-6 h-6 text-indigo-600" />
                                <h3 className="text-xl font-semibold">Mã QR thanh toán</h3>
                            </div>
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 text-left rounded">
                                <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Lưu ý quan trọng:</p>
                                <p className="text-xs text-yellow-700">• Vui lòng chuyển khoản <span className="font-bold">đúng số tiền</span>: {order.totalAmount.toLocaleString('vi-VN')} VND</p>
                                <p className="text-xs text-yellow-700">• Ghi chú chuyển khoản: <span className="font-bold">{order.code}</span></p>
                                <p className="text-xs text-yellow-700">• Đơn hàng sẽ được xử lý sau khi nhận được thanh toán</p>
                            </div>
                            <div className="text-center">
                                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
                                    <img 
                                        src={qrCodeUrl} 
                                        alt="VNPay QR Code" 
                                        className="w-48 h-48 mx-auto"
                                    />
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg text-left">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Thông tin tài khoản:</p>
                                    <p className="text-xs text-gray-600"><span className="font-medium">Chủ tài khoản:</span> Nguyễn Minh Hội</p>
                                    <p className="text-xs text-gray-600"><span className="font-medium">Số tài khoản:</span> MB-4730865860204</p>
                                    <p className="text-xs text-gray-600"><span className="font-medium">Ngân hàng:</span> Techcombank (TPB)</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-4">
                                    Vui lòng quét mã QR bằng ứng dụng ngân hàng để thanh toán
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={handleCloseReviewModal}
                orderId={orderId ? Number(orderId) : null}
                orderItemId={selectedOrderItem?.id || null}
                productVariant={selectedOrderItem?.productVariant || null}
                onReviewSubmitted={handleReviewSubmitted}
            />

            {order && (
                <CancelOrderModal
                    isOpen={cancelModalOpen}
                    onClose={handleCloseCancelModal}
                    onConfirm={handleCancelOrder}
                    orderCode={order.code}
                    isCancelling={isCancelling}
                />
            )}
        </div>
    );
};

export default OrderDetailPage;
