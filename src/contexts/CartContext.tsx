import React, {createContext, type ReactNode, useContext, useEffect, useState} from 'react';
import type {CartItem} from '../types/cart';
import type {Product, ProductVariant} from '../types/product';
import httpClient from '../utils/HttpClient.ts';
import {useAuth} from '../hooks/useAuth';
import type {UserDTO} from '../types/user';
import type {Voucher} from '../types/voucher';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity: number) => Promise<void>;
  removeFromCart: (variantId: number) => Promise<void>;
  updateQuantity: (variantId: number, newQuantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyVoucher: (code: string) => Promise<{ success: boolean; message: string }>;
  applyVoucherWithDiscount: (voucher: Voucher, discountAmount: number) => void;
  removeVoucher: () => void;
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
  const { isAuthenticated } = useAuth();
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
  const [voucherDiscountAmount, setVoucherDiscountAmount] = useState<number>(0);
  const [redeemedPoints, setRedeemedPoints] = useState(0);

  // Sync ra localStorage để F5 không mất
  useEffect(() => {
    localStorage.setItem('lumiereCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Lần đầu mount: lấy giỏ hàng từ backend
  useEffect(() => {
    const loadCartFromBackend = async () => {
      // Chỉ load từ backend nếu user đã đăng nhập
      if (!isAuthenticated()) {
        return;
      }

      try {
        // Lấy userId từ account endpoint
        const userResponse = await httpClient.get<UserDTO>('/account');
        const userId = userResponse.id;

        if (!userId) {
          console.warn('Không tìm thấy userId, không thể load giỏ hàng từ backend');
          return;
        }

        // Gọi API lấy cart items theo userId
        const resp = await httpClient.get<any[]>(`/cart-items/user/${userId}`);

        // Resp body là List<CartItemDTO> với structure:
        // { id, customerId, productId, variantId, quantity, unitPrice, totalPrice, variant: { id, name, price, product: {...} } }
        const backendItems = resp as any[];

        // Map DTO -> CartItem
        const mapped: CartItem[] = backendItems.map(dto => ({
          id: dto.id,
          product: dto.variant?.product || dto.product,           // product nằm trong variant.product
          variant: dto.variant,           // variant object từ response
          quantity: dto.quantity
        }));

        setCartItems(mapped);
      } catch (e) {
        console.error('Lỗi khi load giỏ hàng từ backend:', e);
        // Nếu lỗi thì giữ nguyên cart từ localStorage
      }
    };

    loadCartFromBackend();
  }, [isAuthenticated]);

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
          quantity: updatedQuantity,
          unitPrice: variant.price
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
      quantity,
      unitPrice: variant.price
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
    if (!item) {
      console.warn('Cart item not found for variantId:', variantId);
      return;
    }

    if (newQuantity <= 0) {
      await removeFromCart(variantId);
      return;
    }

    // Validate: không cho vượt quá stock quantity
    const stockQuantity = item.variant.stockQuantity ?? 0;
    if (stockQuantity > 0 && newQuantity > stockQuantity) {
      console.warn(`Số lượng không thể vượt quá ${stockQuantity} (số lượng tồn kho)`);
      // Giới hạn ở stock quantity
      newQuantity = stockQuantity;
    }

    // Optimistic update: cập nhật UI ngay lập tức
    setCartItems(prev =>
        prev.map(ci =>
            ci.variant.id === variantId ? { ...ci, quantity: newQuantity } : ci
        )
    );

    if (item.id == null) {
      // chưa sync được id backend -> chỉ update local
      console.warn('Cart item chưa có id từ backend, chỉ update local');
      return;
    }

    try {
      const payload = {
        id: item.id,
        productId: item.product.id,
        variantId: item.variant.id,
        quantity: newQuantity,
        unitPrice: item.variant.price
      };

      await httpClient.put(`/cart-items/${item.id}`, payload);

      // Fetch lại cart item từ backend để đảm bảo data đồng bộ
      try {
        const updatedDto = await httpClient.get<any>(`/cart-items/${item.id}`);
        
        // Map response từ backend về CartItem format
        const updatedItem: CartItem = {
          id: updatedDto.id,
          product: updatedDto.variant?.product || item.product,
          variant: updatedDto.variant || item.variant,
          quantity: updatedDto.quantity
        };

        // Update state với data mới từ backend (có thể khác với optimistic update)
        setCartItems(prev =>
            prev.map(ci =>
                ci.id === item.id ? updatedItem : ci
            )
        );
      } catch (fetchError) {
        console.error('Failed to fetch updated cart item:', fetchError);
        // Giữ nguyên optimistic update nếu fetch thất bại
      }
    } catch (e) {
      console.error('Failed to update quantity on backend:', e);
      // Rollback optimistic update nếu API thất bại
      setCartItems(prev =>
          prev.map(ci =>
              ci.variant.id === variantId ? { ...ci, quantity: item.quantity } : ci
          )
      );
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
    setVoucherDiscountAmount(0);
    setRedeemedPoints(0);
  };

  const applyVoucher = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Giữ lại logic cũ để backward compatibility (nếu có code khác dùng)
      // Nhưng thực tế CartPage sẽ gọi API calculate và dùng applyVoucherWithDiscount
      if (code.toUpperCase() === 'LUMIERE10') {
        // Logic cũ - tính theo percentage
        const currentSubtotal = cartItems.reduce((total, item) => total + item?.variant?.price * item?.quantity, 0);
        const discountAmount = (currentSubtotal * 10) / 100;
        const voucherData: Voucher = { 
          id: 0,
          code: 'LUMIERE10', 
          type: 'PERCENTAGE',
          value: 10,
          status: 'ACTIVE'
        };
        setAppliedVoucher(voucherData);
        setVoucherDiscountAmount(discountAmount);
        return { success: true, message: `Áp dụng thành công mã "${voucherData.code}"!` };
      } else {
        setAppliedVoucher(null);
        setVoucherDiscountAmount(0);
        return { success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' };
      }
    } catch (error) {
      console.error('Lỗi khi áp dụng voucher:', error);
      setAppliedVoucher(null);
      setVoucherDiscountAmount(0);
      return { success: false, message: 'Đã có lỗi xảy ra. Vui lòng thử lại.' };
    }
  };

  // Function để set voucher và discount amount từ API response
  const applyVoucherWithDiscount = (voucher: Voucher, discountAmount: number) => {
    setAppliedVoucher(voucher);
    setVoucherDiscountAmount(discountAmount);
  };

  // Function để xóa voucher
  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherDiscountAmount(0);
  };

  const applyPoints = (points: number): { success: boolean; message: string } => {
    setRedeemedPoints(points);
    return { success: true, message: `Đã áp dụng ${points.toLocaleString('vi-VN')} điểm.` };
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item?.variant?.price * item?.quantity, 0);
  const discount = voucherDiscountAmount; // Dùng discount amount từ API
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
            applyVoucherWithDiscount,
            removeVoucher,
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
