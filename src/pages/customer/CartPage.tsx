import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import type { CartItem } from '../../types/cart';
import httpClient from '../../utils/HttpClient.ts';
import { useAuth } from '../../hooks/useAuth';
import type { UserDTO } from '../../types/user';
import type { VoucherCalculateRequestDTO, VoucherCalculateResponseDTO } from '../../types/voucher';
import { HttpError } from '../../utils/HttpClient';

interface NotificationProps {
    message: string;
    type: 'success' | 'error';
}
const Notification: React.FC<NotificationProps> = ({ message, type }) => {
    if (!message) return null;
    const baseClasses = "text-sm mt-3 px-4 py-2 rounded-lg";
    const typeClasses = type === 'success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
    return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
};

interface QuantityInputProps {
    quantity: number;
    stockQuantity: number | null | undefined;
    onDecrease: () => void;
    onIncrease: () => void;
}
const QuantityInput: React.FC<QuantityInputProps> = ({ quantity, stockQuantity, onDecrease, onIncrease }) => {
    // Nếu stockQuantity là null/undefined, coi như không giới hạn (cho phép tăng)
    const hasStockLimit = stockQuantity != null;
    const availableStock = stockQuantity ?? Infinity;
    const isOutOfStock = hasStockLimit && availableStock === 0;
    const isMaxQuantity = hasStockLimit && quantity >= availableStock;
    const canDecrease = quantity > 1;
    const canIncrease = !isMaxQuantity && !isOutOfStock;

    return (
        <div className="space-y-2">
            <div className="flex items-center border border-gray-200 rounded-lg">
                <button 
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        if (canDecrease && !isOutOfStock) {
                            onDecrease();
                        }
                    }} 
                    disabled={!canDecrease || isOutOfStock}
                    className={`px-3 py-1 rounded-l-lg transition ${
                        !canDecrease || isOutOfStock
                            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                            : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                >
                    -
                </button>
                <span className={`px-4 py-1 text-center font-semibold w-12 ${
                    isOutOfStock ? 'text-gray-400' : 'text-gray-800'
                }`}>
                    {quantity}
                </span>
                <button 
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        if (canIncrease) {
                            onIncrease();
                        }
                    }} 
                    disabled={!canIncrease}
                    className={`px-3 py-1 rounded-r-lg transition ${
                        !canIncrease
                            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                            : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                >
                    +
                </button>
            </div>
            {isOutOfStock && (
                <p className="text-sm text-red-600 font-medium">Sản phẩm đã hết hàng</p>
            )}
            {!isOutOfStock && hasStockLimit && availableStock > 0 && (
                <p className="text-xs text-gray-500">
                    Còn lại: {availableStock} sản phẩm
                </p>
            )}
        </div>
    );
};

interface CartItemProps {
    item: CartItem;
    onRemove: (variantId: number) => void | Promise<void>;
    onUpdateQuantity: (variantId: number, newQuantity: number) => void | Promise<void>;
}
const CartItemCard: React.FC<CartItemProps> = ({ item, onRemove, onUpdateQuantity }) => {
    // Helper function để lấy giá đúng (ưu tiên promotionPrice nếu có và nhỏ hơn price)
    const getEffectivePrice = (): number => {
        const promotionPrice = typeof item.variant.promotionPrice === 'string' 
            ? parseFloat(item.variant.promotionPrice) 
            : item.variant.promotionPrice;
        const price = typeof item.variant.price === 'string' 
            ? parseFloat(item.variant.price) 
            : item.variant.price;
        
        if (promotionPrice != null && promotionPrice > 0 && promotionPrice < price) {
            return promotionPrice;
        }
        return price;
    };

    const effectivePrice = getEffectivePrice();
    const promotionPrice = typeof item.variant.promotionPrice === 'string' 
        ? parseFloat(item.variant.promotionPrice) 
        : item.variant.promotionPrice;
    const price = typeof item.variant.price === 'string' 
        ? parseFloat(item.variant.price) 
        : item.variant.price;
    const hasPromotion = promotionPrice != null && promotionPrice > 0 && promotionPrice < price;

    return (
    <div className="flex items-start bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow duration-300">
        <Link to={`/products/${item?.product?.slug}`} className="flex-shrink-0">
            <img 
                src={item.variant.urlImage || item.product.attachmentDTOS?.[0]?.url || `https://placehold.co/100x120/EFEFEF/333333?text=${encodeURIComponent(item.product.name)}`} 
                alt={item?.product?.name}
                className="w-24 h-32 object-cover rounded-lg" 
                onError={(e) => {
                    // Fallback nếu ảnh lỗi
                    const target = e.target as HTMLImageElement;
                    target.src = `https://placehold.co/100x120/EFEFEF/333333?text=${encodeURIComponent(item.product.name)}`;
                }}
            />
        </Link>
        <div className="flex-grow ml-5">
            <Link to={`/products/${item?.product?.slug}`} className="hover:underline">
                <h2 className="font-bold text-lg text-gray-800">{item.product.name}</h2>
            </Link>
            <p className="text-sm text-gray-500 mt-1">{item.variant.name.replace(item.product.name + " - ", "")}</p>
            <div className="my-3">
              {hasPromotion ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-block bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
                    FLASH SALE
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-semibold text-md">
                      {promotionPrice.toLocaleString('vi-VN')} {item.variant.currency || 'VND'}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {price.toLocaleString('vi-VN')} {item.variant.currency || 'VND'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-indigo-600 font-semibold text-md">
                  {price.toLocaleString('vi-VN')} {item.variant.currency || 'VND'}
                </p>
              )}
            </div>
            <QuantityInput
                quantity={item?.quantity}
                stockQuantity={item.variant.stockQuantity}
                onDecrease={() => {
                    const currentQty = item.quantity;
                    if (currentQty > 1) {
                        onUpdateQuantity(item.variant.id, currentQty - 1);
                    }
                }}
                onIncrease={() => {
                    const currentQty = item.quantity;
                    const stockQty = item.variant.stockQuantity;
                    // Nếu stockQuantity là null/undefined, cho phép tăng
                    // Nếu có stockQuantity, chỉ tăng khi chưa đạt max
                    if (stockQty == null || stockQty === 0 || currentQty < stockQty) {
                        onUpdateQuantity(item.variant.id, currentQty + 1);
                    }
                }}
            />
        </div>
        <div className="flex flex-col items-end justify-between h-full ml-4">
            <p className="font-bold text-lg text-gray-900">
                {(effectivePrice * item.quantity).toLocaleString('vi-VN')} {item.variant.currency || 'VND'}
            </p>
            <button onClick={() => onRemove(item.variant.id)} className="text-gray-400 hover:text-red-500 transition-colors mt-auto" title="Xóa sản phẩm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        </div>
    </div>
    );
};

const EmptyCart: React.FC = () => (
    <div className="text-center py-20 bg-gray-50 rounded-xl">
        <svg className="mx-auto h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        <h1 className="mt-6 text-3xl font-bold text-gray-800">Giỏ hàng trống</h1>
        <p className="text-gray-500 mt-4">Có vẻ như bạn chưa thêm sản phẩm nào. Hãy khám phá ngay!</p>
        <Link to="/products" className="mt-8 inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-8 rounded-full hover:shadow-lg transition-all transform hover:scale-105">
            Khám phá sản phẩm
        </Link>
    </div>
);

const CartPage: React.FC = () => {
    const { cartItems, removeFromCart, updateQuantity, cartCount, subtotal, discount, totalPrice, applyVoucherWithDiscount, removeVoucher, appliedVoucher } = useCart();
    const { isAuthenticated } = useAuth();
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherMessage, setVoucherMessage] = useState({ type: 'success' as 'success' | 'error', text: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

    // Fetch cart items từ backend khi vào trang
    useEffect(() => {
        const fetchCartItems = async () => {
            if (!isAuthenticated()) {
                return;
            }

            setIsLoading(true);
            try {
                // Lấy userId từ account endpoint
                const userResponse = await httpClient.get<UserDTO>('/account');
                const userId = userResponse.id;

                if (!userId) {
                    console.warn('Không tìm thấy userId');
                    setIsLoading(false);
                    return;
                }

                // Gọi API lấy cart items theo userId
                const resp = await httpClient.get<any[]>(`/cart-items/user/${userId}`);

                // Response structure: [{ id, customerId, productId, variantId, quantity, unitPrice, totalPrice, variant: { id, name, price, product: {...} } }]
                console.log('Cart items from API:', resp);
                
                // CartContext sẽ tự động sync, nhưng có thể log để debug
            } catch (error) {
                console.error('Lỗi khi fetch cart items:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCartItems();
    }, [isAuthenticated]);

    const handleApplyVoucher = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!voucherCode.trim()) {
            setVoucherMessage({ 
                type: 'error', 
                text: 'Vui lòng nhập mã giảm giá' 
            });
            return;
        }

        setIsApplyingVoucher(true);
        setVoucherMessage({ type: 'success', text: '' });

        try {
            // Tính subtotal hiện tại (theo promotionPrice nếu có)
            const currentSubtotal = cartItems.reduce((total, item) => {
                const itemPrice = (item?.variant?.promotionPrice != null && item?.variant?.promotionPrice < item?.variant?.price)
                    ? item.variant.promotionPrice
                    : item?.variant?.price;
                return total + itemPrice * item?.quantity;
            }, 0);

            // Gọi API tính giảm giá
            const request: VoucherCalculateRequestDTO = {
                voucherCode: voucherCode.trim().toUpperCase(),
                orderAmount: currentSubtotal
            };

            const response = await httpClient.post<VoucherCalculateResponseDTO>(
                '/vouchers/calculate',
                request
            );

            // Áp dụng voucher và discount amount từ API response
            applyVoucherWithDiscount(response.voucher, response.discountAmount);

            setVoucherMessage({ 
                type: 'success', 
                text: `Áp dụng thành công mã "${response.voucher.code}"! Giảm ${response.discountAmount.toLocaleString('vi-VN')} VND` 
            });
            setVoucherCode(''); // Xóa mã sau khi áp dụng thành công

        } catch (error) {
            console.error('Lỗi khi tính giảm giá voucher:', error);
            
            // Xóa voucher nếu có lỗi
            removeVoucher();

            let errorMessage = 'Đã có lỗi xảy ra khi áp dụng mã giảm giá. Vui lòng thử lại.';
            
            if (error instanceof HttpError) {
                // Xử lý lỗi từ API
                if (error.status === 400) {
                    errorMessage = error.data?.message || error.data?.error || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.';
                } else if (error.status === 401) {
                    errorMessage = 'Vui lòng đăng nhập để sử dụng mã giảm giá.';
                } else if (error.status === 404) {
                    errorMessage = 'Không tìm thấy mã giảm giá này.';
                }
            }

            setVoucherMessage({ 
                type: 'error', 
                text: errorMessage 
            });
        } finally {
            setIsApplyingVoucher(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600">Đang tải giỏ hàng...</p>
                </div>
            </div>
        );
    }

    if (cartCount === 0) {
        return <EmptyCart />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Giỏ hàng của bạn</h1>
                <p className="mt-2 text-lg text-gray-500">Xem lại các sản phẩm và tiến hành thanh toán.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                <div className="lg:col-span-8 space-y-5">
                    {cartItems.map(item => (
                        <CartItemCard 
                            key={item?.variant?.id}
                            item={item}
                            onRemove={removeFromCart}
                            onUpdateQuantity={updateQuantity}
                        />
                    ))}
                </div>


                <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-lg border h-fit sticky top-24">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">Tổng kết đơn hàng</h2>
                    <form onSubmit={handleApplyVoucher} className="space-y-3 mb-6">
                        <label htmlFor="voucher" className="font-semibold text-gray-700">Mã giảm giá</label>
                        <div className="flex gap-2">
                             <input
                                id="voucher"
                                type="text"
                                value={voucherCode}
                                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                placeholder="Nhập mã..."
                                disabled={isApplyingVoucher}
                                className="flex-grow p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                            <button 
                                type="submit" 
                                disabled={isApplyingVoucher}
                                className="bg-gray-800 text-white font-semibold px-5 rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isApplyingVoucher ? 'Đang xử lý...' : 'Áp dụng'}
                            </button>
                        </div>
                        {appliedVoucher && (
                            <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                                <span className="text-sm text-green-700">
                                    Mã <strong>{appliedVoucher.code}</strong> đã được áp dụng
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        removeVoucher();
                                        setVoucherCode('');
                                        setVoucherMessage({ type: 'success', text: '' });
                                    }}
                                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                    Xóa
                                </button>
                            </div>
                        )}
                        <Notification message={voucherMessage.text} type={voucherMessage.type} />
                    </form>
                    
                    <div className="space-y-3 text-gray-600">
                        <div className="flex justify-between">
                            <span>Tạm tính</span>
                            <span className="font-medium text-gray-800">{subtotal.toLocaleString('vi-VN')} VND</span>
                        </div>
                         {appliedVoucher && (
                            <div className="flex justify-between text-green-600">
                                <span>Giảm giá ({appliedVoucher.code}):</span>
                                <span className="font-medium">- {discount.toLocaleString('vi-VN')} VND</span>
                            </div>
                         )}
                    </div>
                    
                    <div className="my-6 border-t border-dashed"></div>
                    
                    <div className="flex justify-between items-center font-bold text-xl">
                        <span className="text-gray-900">Tổng cộng</span>
                        <span className="text-indigo-600">{totalPrice.toLocaleString('vi-VN')} VND</span>
                    </div>
                    <Link to="/checkout" className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-full font-semibold text-center block hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-lg">
                        <span className="flex items-center justify-center">
                            Tiến hành thanh toán
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
