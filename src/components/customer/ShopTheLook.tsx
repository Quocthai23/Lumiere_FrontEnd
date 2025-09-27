import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product, ProductVariant } from '../../types/product';
import type { Look } from '../../types/collection';
import axiosClient from '../../api/axiosClient';
import { useCart } from '../../contexts/CartContext';
import { ShoppingCart } from 'lucide-react';

interface ShopTheLookProps {
  look: Look;
}

const ShopTheLook: React.FC<ShopTheLookProps> = ({ look }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      if (!look.productIds || look.productIds.length === 0) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Fetch all products and filter locally for mock API
        const response = await axiosClient.get('/products');
        const allProducts: Product[] = response.data;
        const lookProducts = allProducts.filter(p => look.productIds.includes(p.id));
        setProducts(lookProducts);
      } catch (error) {
        console.error("Failed to fetch products for the look:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [look.productIds]);

  const handleAddAllToCart = () => {
    products.forEach(product => {
      const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
      if (defaultVariant && defaultVariant.stockQuantity > 0) {
        addToCart(product, defaultVariant, 1);
      }
    });
    setNotification('Đã thêm các sản phẩm vào giỏ hàng!');
    setTimeout(() => setNotification(''), 3000);
  };

  if (isLoading) {
    return <div>Đang tải sản phẩm...</div>;
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border">
       {notification && (
            <div className="fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce z-50">
                {notification}
            </div>
        )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Shop The Look</h3>
          <img src={look.lookImageUrl} alt="Shop the look" className="w-full rounded-lg shadow-md" />
        </div>
        <div>
          <div className="space-y-4">
            {products.map(product => {
              const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
              return (
                <div key={product.id} className="flex items-center">
                  <img
                    src={`https://placehold.co/80x80/EFEFEF/333333?text=${encodeURIComponent(product.name)}`}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="ml-4 flex-grow">
                    <Link to={`/products/${product.slug}`} className="font-semibold text-gray-800 hover:underline">
                      {product.name}
                    </Link>
                    <p className="text-indigo-600 font-medium">
                      {defaultVariant?.price.toLocaleString('vi-VN')} VND
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={handleAddAllToCart}
            className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <ShoppingCart size={20} />
            Thêm tất cả vào giỏ hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopTheLook;
