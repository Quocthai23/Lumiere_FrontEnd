import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';

const MAX_RECENTLY_VIEWED = 10;

interface RecentlyViewedContextType {
  recentlyViewedIds: number[];
  addProductToHistory: (productId: number) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export const RecentlyViewedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>(() => {
    try {
      const storedItems = localStorage.getItem('lumiereRecentlyViewed');
      return storedItems ? JSON.parse(storedItems) : [];
    } catch (error) {
      console.error("Lỗi khi tải lịch sử xem sản phẩm:", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('lumiereRecentlyViewed', JSON.stringify(recentlyViewedIds));
  }, [recentlyViewedIds]);

  const addProductToHistory = useCallback((productId: number) => {
    setRecentlyViewedIds(prevIds => {
      // Remove the id if it already exists to move it to the front
      const newIds = prevIds.filter(id => id !== productId);
      // Add the new id to the beginning
      newIds.unshift(productId);
      // Limit the history size
      return newIds.slice(0, MAX_RECENTLY_VIEWED);
    });
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ recentlyViewedIds, addProductToHistory }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = (): RecentlyViewedContextType => {
  const context = useContext(RecentlyViewedContext);
  if (context === undefined) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  }
  return context;
};
