import React from 'react';
import type { Product } from '../types/product';

const MAX_COMPARE_ITEMS = 4;

interface ComparisonContextType {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  isInCompare: (productId: number) => boolean;
  clearCompare: () => void;
  compareCount: number;
}

const ComparisonContext = React.createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = React.useState<Product[]>(() => {
    try {
      const storedItems = localStorage.getItem('lumiereCompare');
      return storedItems ? JSON.parse(storedItems) : [];
    } catch (error) {
      console.error("Lỗi khi tải danh sách so sánh:", error);
      return [];
    }
  });

  React.useEffect(() => {
    localStorage.setItem('lumiereCompare', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product) => {
    setItems((prevItems) => {
      if (prevItems.find(p => p.id === product.id)) {
        return prevItems; // Already exists
      }
      if (prevItems.length >= MAX_COMPARE_ITEMS) {
        alert(`Bạn chỉ có thể so sánh tối đa ${MAX_COMPARE_ITEMS} sản phẩm.`);
        return prevItems;
      }
      return [...prevItems, product];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prevItems) => prevItems.filter((p) => p.id !== productId));
  };

  const isInCompare = (productId: number) => {
    return items.some((p) => p.id === productId);
  };

  const clearCompare = () => {
    setItems([]);
  };

  return (
    <ComparisonContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        isInCompare,
        clearCompare,
        compareCount: items.length,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = (): ComparisonContextType => {
  const context = React.useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};

