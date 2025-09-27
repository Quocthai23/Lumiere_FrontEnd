import React, { createContext, useState, ReactNode, useContext } from 'react';
import type { Product } from '../types/product';

interface QuickViewContextType {
  isModalOpen: boolean;
  productInView: Product | null;
  openModal: (product: Product) => void;
  closeModal: () => void;
}

const QuickViewContext = createContext<QuickViewContextType | undefined>(undefined);

export const QuickViewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productInView, setProductInView] = useState<Product | null>(null);

  const openModal = (product: Product) => {
    setProductInView(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setProductInView(null);
  };

  return (
    <QuickViewContext.Provider value={{ isModalOpen, productInView, openModal, closeModal }}>
      {children}
    </QuickViewContext.Provider>
  );
};

export const useQuickView = (): QuickViewContextType => {
  const context = useContext(QuickViewContext);
  if (context === undefined) {
    throw new Error('useQuickView must be used within a QuickViewProvider');
  }
  return context;
};
