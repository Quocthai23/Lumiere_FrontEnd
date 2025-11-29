import React, {createContext, type ReactNode, useContext, useEffect, useState} from 'react';
import type {CartItem} from '../types/cart';
import type {Product, ProductVariant} from '../types/product';
import httpClient from '../utils/HttpClient.ts';

interface Voucher {
  code: string;
  discountPercentage: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity: number) => Promise<void>;
  removeFromCart: (variantId: number) => Promise<void>;
  updateQuantity: (variantId: number, newQuantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
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
      console.error('Lỗi khi tải giỏ hàng từ localStorage:', error);
      return [];
    }
  });

  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [redeemedPoints, setRedeemedPoints] = useState(0);

  // Sync ra localStorage để F5 không mất
  useEffect(() => {
    localStorage.setItem('lumiereCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Lần đầu mount: lấy giỏ hàng từ backend
  useEffect(() => {
    const loadCartFromBackend = async () => {
      try {
        const resp = await httpClient.get<CartItem[]>('/cart-items', {
          params: { page: 0, size: 1000 } // tuỳ ông set
        });

        // Resp body từ Resource là List<CartItemDTO>
        const backendItems = resp as any[];

        // TODO: map DTO -> CartItem nếu naming khác
        const mapped: CartItem[] = backendItems.map(dto => ({
          id: dto.id,
          product: dto.product,           // hoặc tự fetch /products nếu DTO chỉ có productId
          variant: dto.variant,           // tương tự
          quantity: dto.quantity
        }));

        setCartItems(mapped);
      } catch (e) {
        console.error('Lỗi khi load giỏ hàng từ backend:', e);
        // nếu lỗi thì tạm dùng localStorage
      }
    };

    loadCartFromBackend();
  }, []);

  // Helper: tìm cart item theo variantId
  const findItemByVariantId = (variantId: number): CartItem | undefined =>
      cartItems.find(item => item.variant.id === variantId);

  // POST /cart-items
  const addToCart = async (product: Product, variant: ProductVariant, quantity: number) => {
    const existing = findItemByVariantId(variant.id);

    // Nếu đã có item → có thể gọi PUT tăng quantity
    if (existing && existing.id != null) {
      const updatedQuantity = existing.quantity + quantity;

      try {
        const payload = {
          id: existing.id,
          // tuỳ DTO: productId / variantId / productVariantId...
          productId: product.id,
          variantId: variant.id,
          quantity: updatedQuantity
        };

        const updatedDto = await httpClient.put<CartItem>(`/cart-items/${existing.id}`, payload);

        setCartItems(prev =>
            prev.map(item =>
                item.id === existing.id
                    ? {
                      ...item,
                      quantity: updatedDto.quantity ?? updatedQuantity
                    }
                    : item
            )
        );
      } catch (e) {
        console.error('Failed to update cart item on backend:', e);
      }

      return;
    }

    // Chưa có item → tạo mới
    const payload = {
      productId: product.id,
      variantId: variant.id,
      quantity
    };

    try {
      const dto = await httpClient.post<CartItem>('/cart-items', payload);

      const newItem: CartItem = {
        id: dto.id,
        product,  // hoặc dto.product nếu backend trả kèm
        variant,  // hoặc dto.variant
        quantity: dto.quantity ?? quantity
      };

      setCartItems(prev => [...prev, newItem]);
    } catch (error) {
      console.error('Failed to add cart item to backend:', error);
    }
  };

  // DELETE /cart-items/{id}
  const removeFromCart = async (variantId: number) => {
    const item = findItemByVariantId(variantId);

    if (item?.id != null) {
      try {
        await httpClient.delete(`/cart-items/${item.id}`);
      } catch (e) {
        console.error('Failed to delete cart item on backend:', e);
      }
    }

    setCartItems(prev => prev.filter(ci => ci.variant.id !== variantId));
  };

  // PUT /cart-items/{id}
  const updateQuantity = async (variantId: number, newQuantity: number) => {
    const item = findItemByVariantId(variantId);
    if (!item) return;

    if (newQuantity <= 0) {
      await removeFromCart(variantId);
      return;
    }

    if (item.id == null) {
      // chưa sync được id backend -> chỉ update local để khỏi crash
      setCartItems(prev =>
          prev.map(ci =>
              ci.variant.id === variantId ? { ...ci, quantity: newQuantity } : ci
          )
      );
      return;
    }

    try {
      const payload = {
        id: item.id,
        productId: item.product.id,
        variantId: item.variant.id,
        quantity: newQuantity
      };

      const dto = await httpClient.put<CartItem>(`/cart-items/${item.id}`, payload);

      setCartItems(prev =>
          prev.map(ci =>
              ci.id === item.id
                  ? {
                    ...ci,
                    quantity: dto.quantity ?? newQuantity
                  }
                  : ci
          )
      );
    } catch (e) {
      console.error('Failed to update quantity on backend:', e);
    }
  };

  // Xoá hết: gọi nhiều DELETE hoặc tự tạo API DELETE /cart-items
  const clearCart = async () => {
    try {
      // Nếu ông tạo thêm endpoint riêng:
      // await httpClient.delete('/cart-items');

      // Tạm thời: xoá từng cái
      const ids = cartItems
          .map(ci => ci.id)
          .filter((id): id is number => id != null);

      await Promise.all(ids.map(id => httpClient.delete(`/cart-items/${id}`)));
    } catch (e) {
      console.error('Failed to clear cart on backend:', e);
    }

    setCartItems([]);
    setAppliedVoucher(null);
    setRedeemedPoints(0);
  };

  const applyVoucher = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Sau này ông có thể call API validate voucher thay vì hard-code
      if (code.toUpperCase() === 'LUMIERE10') {
        const voucherData: Voucher = { code: 'LUMIERE10', discountPercentage: 10 };
        setAppliedVoucher(voucherData);
        return { success: true, message: `Áp dụng thành công mã "${voucherData.code}"!` };
      } else {
        setAppliedVoucher(null);
        return { success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' };
      }
    } catch (error) {
      console.error('Lỗi khi áp dụng voucher:', error);
      setAppliedVoucher(null);
      return { success: false, message: 'Đã có lỗi xảy ra. Vui lòng thử lại.' };
    }
  };

  const applyPoints = (points: number): { success: boolean; message: string } => {
    setRedeemedPoints(points);
    return { success: true, message: `Đã áp dụng ${points.toLocaleString('vi-VN')} điểm.` };
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.variant.price * item.quantity, 0);
  const discount = appliedVoucher ? (subtotal * appliedVoucher.discountPercentage) / 100 : 0;
  const pointsDiscount = redeemedPoints * 1000;
  const totalPrice = Math.max(0, subtotal - discount - pointsDiscount);

  return (
      <CartContext.Provider
          value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            applyVoucher,
            applyPoints,
            cartCount,
            subtotal,
            discount,
            pointsDiscount,
            totalPrice,
            appliedVoucher,
            redeemedPoints
          }}
      >
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
