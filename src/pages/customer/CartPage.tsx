import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import type { CartItem } from '../../types/cart';

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
    onDecrease: () => void;
    onIncrease: () => void;
}
const QuantityInput: React.FC<QuantityInputProps> = ({ quantity, onDecrease, onIncrease }) => (
    <div className="flex items-center border border-gray-200 rounded-lg">
        <button onClick={onDecrease} className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg transition">-</button>
        <span className="px-4 py-1 text-center font-semibold text-gray-800 w-12">{quantity}</span>
        <button onClick={onIncrease} className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg transition">+</button>
    </div>
);

interface CartItemProps {
    item: CartItem;
    onRemove: (variantId: number) => void;
    onUpdateQuantity: (variantId: number, newQuantity: number) => void;
}
const CartItemCard: React.FC<CartItemProps> = ({ item, onRemove, onUpdateQuantity }) => (
    <div className="flex items-start bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow duration-300">
        <Link to={`/products/${item.product.slug}`} className="flex-shrink-0">
            <img 
                src={`https://placehold.co/100x120/EFEFEF/333333?text=${encodeURIComponent(item.product.name)}`} 
                alt={item.product.name} 
                className="w-24 h-32 object-cover rounded-lg" 
            />
        </Link>
        <div className="flex-grow ml-5">
            <Link to={`/products/${item.product.slug}`} className="hover:underline">
                <h2 className="font-bold text-lg text-gray-800">{item.product.name}</h2>
            </Link>
            <p className="text-sm text-gray-500 mt-1">{item.variant.name.replace(item.product.name + " - ", "")}</p>
            <p className="text-indigo-600 font-semibold text-md my-3">{item.variant.price.toLocaleString('vi-VN')} VND</p>
            <QuantityInput
                quantity={item.quantity}
                onDecrease={() => onUpdateQuantity(item.variant.id, item.quantity - 1)}
                onIncrease={() => onUpdateQuantity(item.variant.id, item.quantity + 1)}
            />
        </div>
        <div className="flex flex-col items-end justify-between h-full ml-4">
            <p className="font-bold text-lg text-gray-900">
                {(item.variant.price * item.quantity).toLocaleString('vi-VN')} VND
            </p>
            <button onClick={() => onRemove(item.variant.id)} className="text-gray-400 hover:text-red-500 transition-colors mt-auto" title="Xóa sản phẩm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        </div>
    </div>
);

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
    const { cartItems, removeFromCart, updateQuantity, cartCount, subtotal, discount, totalPrice, applyVoucher, appliedVoucher } = useCart();
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherMessage, setVoucherMessage] = useState({ type: 'success' as 'success' | 'error', text: '' });

    const handleApplyVoucher = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!voucherCode.trim()) return;
        
        const result = await applyVoucher(voucherCode);
        setVoucherMessage({ 
            type: result.success ? 'success' : 'error', 
            text: result.message 
        });
    };

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
                            key={item.variant.id}
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
                                className="flex-grow p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                            />
                            <button type="submit" className="bg-gray-800 text-white font-semibold px-5 rounded-lg hover:bg-gray-700 transition-colors">Áp dụng</button>
                        </div>
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
                        <div className="flex justify-between">
                            <span>Phí vận chuyển</span>
                            <span className="font-medium text-gray-800">Miễn phí</span>
                        </div>
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
