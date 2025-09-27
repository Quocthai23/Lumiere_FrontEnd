import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

// Using number[] to store product IDs for simplicity
export type Wishlist = number[];

interface WishlistContextType {
  wishlist: Wishlist;
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Wishlist>(() => {
    try {
      const storedWishlist = localStorage.getItem('lumiereWishlist');
      return storedWishlist ? JSON.parse(storedWishlist) : [];
    } catch (error) {
      console.error("Lỗi khi tải wishlist từ localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('lumiereWishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (productId: number) => {
    setWishlist((prevWishlist) => [...prevWishlist, productId]);
  };

  const removeFromWishlist = (productId: number) => {
    setWishlist((prevWishlist) => prevWishlist.filter((id) => id !== productId));
  };

  const isInWishlist = (productId: number) => {
    return wishlist.includes(productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
