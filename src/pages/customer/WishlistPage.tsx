import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';
import axiosClient from '../../api/axiosClient';
import type { Product } from '../../types/product';
import ProductCard from '../../components/customer/ProductCard';

const WishlistPage: React.FC = () => {
  const { wishlist, wishlistCount } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // In a real app, you might have an endpoint like /products?ids=1,2,3
        // For mock API, we fetch all and filter.
        const response = await axiosClient.get('/products');
        const allProducts: Product[] = response.data;
        const wishlistProducts = allProducts.filter(p => wishlist.includes(p.id));
        setProducts(wishlistProducts);
      } catch (error) {
        console.error("Không thể tải sản phẩm trong wishlist:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlist]);

  if (isLoading) {
    return <div className="text-center py-20">Đang tải danh sách yêu thích...</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Danh sách Yêu thích ({wishlistCount})</h2>
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
         <div className="text-center py-20 bg-gray-50 rounded-xl">
            <h3 className="text-2xl font-semibold text-gray-700">Danh sách trống</h3>
            <p className="text-gray-500 mt-2 mb-6">Lưu lại những sản phẩm bạn yêu thích để xem lại sau nhé.</p>
            <Link to="/products" className="inline-block bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700">
                Khám phá sản phẩm
            </Link>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
