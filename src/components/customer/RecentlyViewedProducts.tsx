import React, { useState, useEffect } from 'react';
import { useRecentlyViewed } from '../../contexts/RecentlyViewedContext';
import axiosClient from '../../api/axiosClient';
import type { Product } from '../../types/product';
import ProductCarousel from './ProductCarousel';

const RecentlyViewedProducts: React.FC = () => {
  const { recentlyViewedIds } = useRecentlyViewed();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      if (recentlyViewedIds.length === 0) {
        setProducts([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await axiosClient.get('/products');
        const allProducts: Product[] = response.data;
        // Filter and maintain the order from recentlyViewedIds
        const viewedProducts = recentlyViewedIds
          .map(id => allProducts.find(p => p.id === id))
          .filter((p): p is Product => p !== undefined);
        setProducts(viewedProducts);
      } catch (error) {
        console.error("Không thể tải sản phẩm đã xem:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [recentlyViewedIds]);

  if (isLoading || products.length === 0) {
    return null;
  }

  return <ProductCarousel title="Sản phẩm đã xem gần đây" products={products} />;
};

export default RecentlyViewedProducts;
