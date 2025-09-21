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
  cartCount: number;
  subtotal: number;
  discount: number;
  totalPrice: number;
  appliedVoucher: Voucher | null;
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
      return { success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại.' };
    }
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + (item.variant.price * item.quantity), 0);
  const discount = appliedVoucher ? (subtotal * appliedVoucher.discountPercentage) / 100 : 0;
  const totalPrice = subtotal - discount;

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, applyVoucher, cartCount, subtotal, discount, totalPrice, appliedVoucher }}>
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
