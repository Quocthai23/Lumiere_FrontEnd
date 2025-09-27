import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import type { CartItem } from '../types/cart';
import type { Product, ProductVariant } from '../types/product';
import axiosClient from '../api/axiosClient';

// Thêm kiểu dữ liệu cho Voucher
interface Voucher {
  code: string;
  discountPercentage: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  removeFromCart: (variantId: number) => void;
  updateQuantity: (variantId: number, newQuantity: number) => void;
  clearCart: () => void;
  applyVoucher: (code: string) => Promise<{ success: boolean; message: string }>;
  applyPoints: (points: number) => { success: boolean; message: string };
  cartCount: number;
  subtotal: number;
  discount: number;
  pointsDiscount: number;
  totalPrice: number;
  appliedVoucher: Voucher | null;
  redeemedPoints: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const storedCart = localStorage.getItem('lumiereCart');
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng từ localStorage:", error);
      return [];
    }
  });

  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [redeemedPoints, setRedeemedPoints] = useState(0);

  useEffect(() => {
    localStorage.setItem('lumiereCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, variant: ProductVariant, quantity: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.variant.id === variant.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, variant, quantity }];
    });
  };

  const removeFromCart = (variantId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.variant.id !== variantId));
  };

  const updateQuantity = (variantId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(variantId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.variant.id === variantId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };
  
  const clearCart = () => {
      setCartItems([]);
      setAppliedVoucher(null); 
      setRedeemedPoints(0);
  };

  const applyVoucher = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (code.toUpperCase() === 'LUMIERE10') {
        const voucherData: Voucher = { code: 'LUMIERE10', discountPercentage: 10 };
        setAppliedVoucher(voucherData);
        return { success: true, message: `Áp dụng thành công mã "${voucherData.code}"!` };
      } else {
        setAppliedVoucher(null);
        return { success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' };
      }
    } catch (error) {
      console.error("Lỗi khi áp dụng voucher:", error);
      setAppliedVoucher(null);
      return { success: false, message: 'Đã có lỗi xảy ra. Vui lòng thử lại.' };
    }
  };

  const applyPoints = (points: number): { success: boolean; message: string } => {
    // Tạm thời chưa có logic kiểm tra điểm tối đa, sẽ thêm sau
    setRedeemedPoints(points);
    return { success: true, message: `Đã áp dụng ${points.toLocaleString('vi-VN')} điểm.`};
  };


  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + (item.variant.price * item.quantity), 0);
  const discount = appliedVoucher ? (subtotal * appliedVoucher.discountPercentage) / 100 : 0;
  
  // Logic quy đổi điểm: 1 điểm = 1,000 VND
  const pointsDiscount = redeemedPoints * 1000;
  const totalPrice = Math.max(0, subtotal - discount - pointsDiscount);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, applyVoucher, applyPoints, cartCount, subtotal, discount, pointsDiscount, totalPrice, appliedVoucher, redeemedPoints }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart phải được sử dụng bên trong CartProvider');
  }
  return context;
};
