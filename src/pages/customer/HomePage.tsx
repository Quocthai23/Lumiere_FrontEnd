import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types/product';
import ProductCard from '../../components/customer/ProductCard';
import axiosClient from '../../api/axiosClient';
import { ArrowRight, ShoppingBag, Zap } from 'lucide-react'; 
import RecentlyViewedProducts from '../../components/customer/RecentlyViewedProducts';
import FlashSaleCountdown from '../../components/customer/FlashSaleCountdown';

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await axiosClient.get('/products', {
          params: {
            'status.equals': 'ACTIVE',
            page: 0,
            size: 8, 
          }
        });
        const activeProducts = response.data;
        setFeaturedProducts(activeProducts.slice(0, 4));

        setNewArrivals(activeProducts.slice(4, 8));
      } catch (error) {
        console.error("Không thể tải sản phẩm trang chủ:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = [
    { name: 'Áo Thun', href: '/products?category=t-shirt', image: 'https://placehold.co/400x500/EFEFEF/333333?text=T-Shirts' },
    { name: 'Áo Sơ Mi', href: '/products?category=shirt', image: 'https://placehold.co/400x500/EFEFEF/333333?text=Shirts' },
    { name: 'Quần Jeans', href: '/products?category=jeans', image: 'https://placehold.co/400x500/EFEFEF/333333?text=Jeans' },
    { name: 'Váy', href: '/products?category=dress', image: 'https://placehold.co/400x500/EFEFEF/333333?text=Dresses' },
  ];

  return (
    <div className="space-y-24">
      <section 
        className="relative h-[600px] bg-cover bg-center text-white flex items-center rounded-lg overflow-hidden"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative container mx-auto px-6 text-center z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4">
            Phong Cách Của Bạn, Câu Chuyện Của Bạn
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Khám phá bộ sưu tập thời trang mới nhất, nơi mỗi thiết kế đều là một tác phẩm nghệ thuật.
          </p>
          <Link
            to="/products"
            className="bg-white text-gray-900 font-bold py-3 px-10 rounded-full hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2"
          >
            <>Mua sắm ngay <ArrowRight size={20} /></>
          </Link>
        </div>
      </section>

      <FlashSaleCountdown />

      <section>
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 inline-block relative">
                Sản Phẩm Bán Chạy
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-indigo-500"></span>
            </h2>
            <p className="text-gray-500 mt-2">Những sản phẩm được yêu thích nhất tại Lumiere.</p>
        </div>
         {isLoading ? (
          <p className="text-center">Đang tải sản phẩm...</p>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
                ))}
            </div>
        )}
      </section>

      <section className="bg-white p-12 rounded-lg shadow-sm">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 inline-block relative">
                Mua Sắm Theo Danh Mục
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-indigo-500"></span>
            </h2>
            <p className="text-gray-500 mt-2">Tìm kiếm phong cách yêu thích của bạn một cách dễ dàng.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map(category => (
                <Link to={category.href} key={category.name} className="group relative rounded-lg overflow-hidden h-80">
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <h3 className="text-white text-2xl font-bold tracking-wider">{category.name}</h3>
                    </div>
                </Link>
            ))}
        </div>
      </section>

       <section>
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 inline-block relative">
                Hàng Mới Về <Zap className="inline-block text-yellow-400" />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-indigo-500"></span>
            </h2>
            <p className="text-gray-500 mt-2">Đừng bỏ lỡ những thiết kế mới nhất vừa cập bến.</p>
        </div>
        {isLoading ? (
          <p className="text-center">Đang tải sản phẩm...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {newArrivals.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
          </div>
        )}
        <div className="text-center mt-12">
            <Link to="/products" className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-2">
                <>Xem tất cả sản phẩm <ArrowRight size={16} /></>
            </Link>
        </div>
      </section>
      
      <RecentlyViewedProducts />

      <section className="bg-indigo-50 rounded-lg p-12">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
                <ShoppingBag size={40} className="text-indigo-600 mb-4"/>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Chất Lượng Hàng Đầu</h3>
                <p className="text-gray-600">Chúng tôi cam kết sử dụng những chất liệu tốt nhất để tạo ra sản phẩm bền đẹp theo thời gian.</p>
            </div>
            <div className="flex flex-col items-center">
                <Zap size={40} className="text-indigo-600 mb-4"/>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Thiết Kế Tinh Tế</h3>
                <p className="text-gray-600">Mỗi sản phẩm đều được thiết kế tỉ mỉ, bắt kịp xu hướng và mang đậm dấu ấn riêng của Lumiere.</p>
            </div>
             <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 mb-4"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Dịch Vụ Tận Tâm</h3>
                <p className="text-gray-600">Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ để bạn có trải nghiệm mua sắm tốt nhất.</p>
            </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
