import React, {createContext, type ReactNode, useContext, useEffect, useState} from 'react';
import type {WishlistItem, WishlistItemDTO} from '../types/wishlist';
import type {Product, ProductVariant} from '../types/product';
import httpClient from '../utils/HttpClient.ts';
import {useAuth} from '../hooks/useAuth';

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (variantId: number, product?: Product, variant?: ProductVariant) => Promise<void>;
  removeFromWishlist: (variantId: number) => Promise<void>;
  isInWishlist: (variantId: number) => boolean;
  moveToCart: (variantId: number, quantity?: number) => Promise<void>;
  wishlistCount: number;
  // Backward compatibility
  wishlist: number[];
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    try {
      const storedWishlist = localStorage.getItem('lumiereWishlist');
      return storedWishlist ? JSON.parse(storedWishlist) : [];
    } catch (error) {
      console.error('Lỗi khi tải wishlist từ localStorage:', error);
      return [];
    }
  });

  // Sync ra localStorage để F5 không mất
  useEffect(() => {
    localStorage.setItem('lumiereWishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  // Lần đầu mount: lấy wishlist từ backend
  useEffect(() => {
    const loadWishlistFromBackend = async () => {
      // Chỉ load từ backend nếu user đã đăng nhập
      if (!isAuthenticated()) {
        return;
      }

      try {
        // Gọi API GET /wishlist với pagination
        const resp = await httpClient.get<any[]>(`/wishlist`, {
          page: 0,
          size: 1000
        });

        // Resp body là List<WishlistItemDTO> với structure:
        // { id, userId, variantId, createdAt, variantPrice, variantStock, sku, variant: { id, name, price, product: {...} } }
        const backendItems = resp as any[];

        // Map DTO -> WishlistItem
        const mapped: WishlistItem[] = backendItems.map(dto => ({
          id: dto.id,
          variantId: dto.variantId,
          productId: dto.variant?.product?.id || dto.productId || 0,
          product: dto.variant?.product || dto.product,
          variant: dto.variant
        }));

        setWishlistItems(mapped);
      } catch (e) {
        console.error('Lỗi khi load wishlist từ backend:', e);
        // Nếu lỗi thì giữ nguyên wishlist từ localStorage
      }
    };

    loadWishlistFromBackend();
  }, [isAuthenticated]);

  // Helper: tìm wishlist item theo variantId
  const findItemByVariantId = (variantId: number): WishlistItem | undefined =>
      wishlistItems.find(item => item.variantId === variantId);

  // POST /wishlist?variantId={variantId}
  const addToWishlist = async (variantId: number, product?: Product, variant?: ProductVariant) => {
    const existing = findItemByVariantId(variantId);

    // Nếu đã có trong wishlist, không thêm lại
    if (existing) {
      console.log('Variant đã có trong wishlist');
      return;
    }

    // Optimistic update
    const newItem: WishlistItem = {
      id: -Date.now(), // Temporary ID
      variantId: variantId,
      productId: product?.id || variant?.productId || 0,
      product: product || variant?.product || { id: variant?.productId || 0 } as Product,
      variant: variant
    };
    setWishlistItems(prev => [...prev, newItem]);

    // Sync với backend nếu đã đăng nhập
    if (isAuthenticated()) {
      try {
        const dto = await httpClient.post<WishlistItemDTO>('/wishlist', undefined, undefined, {
          variantId
        });

        // Update với ID và data từ backend
        setWishlistItems(prev =>
            prev.map(item =>
                item.id === newItem.id
                    ? {
                      ...item,
                      id: dto.id || item.id,
                      product: dto.product || item.product,
                      variant: dto.variant || item.variant,
                      productId: dto.productId || item.productId
                    }
                    : item
            )
        );
      } catch (error) {
        console.error('Failed to add wishlist item to backend:', error);
        // Rollback nếu API thất bại
        setWishlistItems(prev => prev.filter(item => item.id !== newItem.id));
      }
    }
  };

  // DELETE /wishlist?variantId={variantId}
  const removeFromWishlist = async (variantId: number) => {
    const item = findItemByVariantId(variantId);

    // Optimistic update
    setWishlistItems(prev => prev.filter(wi => wi.variantId !== variantId));

    // Sync với backend nếu đã đăng nhập
    if (isAuthenticated()) {
      try {
        await httpClient.delete('/wishlist', {
          variantId
        });
      } catch (e) {
        console.error('Failed to delete wishlist item on backend:', e);
        // Rollback nếu API thất bại
        if (item) {
          setWishlistItems(prev => [...prev, item]);
        }
      }
    }
  };

  // POST /wishlist/move-to-cart?variantId={variantId}&qty={qty}
  const moveToCart = async (variantId: number, quantity: number = 1) => {
    if (!isAuthenticated()) {
      console.warn('Cần đăng nhập để chuyển sang giỏ hàng');
      return;
    }

    try {
      await httpClient.post('/wishlist/move-to-cart', undefined, undefined, {
        variantId,
        qty: quantity
      });

      // Xóa khỏi wishlist sau khi chuyển thành công
      await removeFromWishlist(variantId);
    } catch (e) {
      console.error('Failed to move wishlist item to cart:', e);
    }
  };

  const isInWishlist = (variantId: number): boolean => {
    return wishlistItems.some(item => item.variantId === variantId);
  };

  // Backward compatibility: wishlist là array of product IDs
  const wishlist = wishlistItems.map(item => item.productId);

  return (
      <WishlistContext.Provider
          value={{
            wishlistItems,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            moveToCart,
            wishlistCount: wishlistItems.length,
            wishlist // Backward compatibility
          }}
      >
        {children}
      </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist phải được sử dụng bên trong WishlistProvider');
  }
  return context;
};
