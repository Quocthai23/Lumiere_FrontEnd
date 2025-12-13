import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Product } from '../../types/product';
import type { CategoryWithProductsDTO } from '../../types/category';
import type { FlashSale } from '../../types/flashSale';
import ProductCard from '../../components/customer/ProductCard';
import axiosClient from '../../api/axiosClient';
import { ArrowRight, ShoppingBag, Zap, ChevronLeft, ChevronRight, Gift, Percent, CheckCircle, X } from 'lucide-react'; 
import RecentlyViewedProducts from '../../components/customer/RecentlyViewedProducts';
import FlashSaleCountdown from '../../components/customer/FlashSaleCountdown';

const HomePage: React.FC = () => {
  const location = useLocation();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryWithProductsDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [promotionFlashSale, setPromotionFlashSale] = useState<FlashSale | null>(null);
  const [promotionDiscount, setPromotionDiscount] = useState<number>(0);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [currentFlashSaleSlide, setCurrentFlashSaleSlide] = useState(0);
  const [showOrderProcessingMessage, setShowOrderProcessingMessage] = useState(false);
  const [orderProcessingInfo, setOrderProcessingInfo] = useState<{ orderCode?: string; message?: string } | null>(null);

  // Hero carousel slides data
  const heroSlides = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
      title: "Phong Cách Của Bạn, Câu Chuyện Của Bạn",
      description: "Khám phá bộ sưu tập thời trang mới nhất, nơi mỗi thiết kế đều là một tác phẩm nghệ thuật.",
      link: "/products"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
      title: "Xu Hướng Mới Nhất 2025",
      description: "Cập nhật những xu hướng thời trang hot nhất năm, làm nổi bật phong cách cá nhân của bạn.",
      link: "/products"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop",
      title: "Chất Lượng Vượt Trội, Giá Cả Hợp Lý",
      description: "Sản phẩm cao cấp với giá thành phải chăng, mang đến trải nghiệm mua sắm tuyệt vời.",
      link: "/products"
    }
  ];

  // Kiểm tra thông báo đơn hàng đang được xử lý từ location state
  useEffect(() => {
    if (location.state && (location.state as any).orderProcessing) {
      setOrderProcessingInfo({
        orderCode: (location.state as any).orderCode,
        message: (location.state as any).message || 'Đơn hàng của bạn đang được xử lý. Vui lòng chờ trong giây lát.'
      });
      setShowOrderProcessingMessage(true);
      // Xóa state để không hiển thị lại khi refresh
      window.history.replaceState({}, document.title);
      // Tự động ẩn thông báo sau 10 giây
      const timer = setTimeout(() => {
        setShowOrderProcessingMessage(false);
        setOrderProcessingInfo(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        // Fetch best-selling products
        const bestSellingResponse = await axiosClient.get('/home/best-selling', {
          params: { limit: 4 }
        });
        setFeaturedProducts(bestSellingResponse.data || []);

        // Fetch new arrivals
        const newArrivalsResponse = await axiosClient.get('/home/new-arrivals', {
          params: { limit: 4 }
        });
        setNewArrivals(newArrivalsResponse.data || []);

        // Fetch shop by category
        const categoriesResponse = await axiosClient.get('/home/shop-by-category', {
          params: { productsPerCategory: 4 }
        });
        setCategories(categoriesResponse.data || []);

        // Fetch flash sale for promotion section
        try {
          const flashSaleResponse = await axiosClient.get<FlashSale>('/flash-sales/active');
          if (flashSaleResponse.data) {
            setPromotionFlashSale(flashSaleResponse.data);
            
            // Calculate average discount percentage
            if (flashSaleResponse.data.products && flashSaleResponse.data.products.length > 0) {
              const discounts: number[] = [];
              flashSaleResponse.data.products.forEach(saleProduct => {
                // Try to get original price from product (similar to FlashSaleCountdown)
                const product = (saleProduct as any).product as Product | undefined;
                const originalPrice = product?.variants?.find((v: any) => v.isDefault)?.price || 
                                      saleProduct.productVariant?.price || 0;
                if (originalPrice > 0 && saleProduct.salePrice < originalPrice) {
                  const discount = Math.round(((originalPrice - saleProduct.salePrice) / originalPrice) * 100);
                  discounts.push(discount);
                }
              });
              
              if (discounts.length > 0) {
                const avgDiscount = Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length);
                setPromotionDiscount(avgDiscount);
              }
            }
          }
        } catch (error) {
          console.error("Không thể tải flash sale cho promotion:", error);
        }

        // Fetch all active and upcoming flash sales for carousel
        try {
          const activeFlashSalesResponse = await axiosClient.get<FlashSale[]>('/flash-sales/active');
          const upcomingFlashSalesResponse = await axiosClient.get<FlashSale[]>('/flash-sales/upcoming');
          const allFlashSales = [
            ...(activeFlashSalesResponse.data || []),
            ...(upcomingFlashSalesResponse.data || [])
          ];
          setFlashSales(allFlashSales);
        } catch (error) {
          console.error("Không thể tải danh sách flash sales:", error);
        }
      } catch (error) {
        console.error("Không thể tải dữ liệu trang chủ:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // Auto slide carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  // Flash Sale Carousel functions
  const goToFlashSaleSlide = (index: number) => {
    setCurrentFlashSaleSlide(index);
  };

  const goToFlashSalePrevious = () => {
    setCurrentFlashSaleSlide((prev) => (prev - 1 + flashSales.length) % flashSales.length);
  };

  const goToFlashSaleNext = () => {
    setCurrentFlashSaleSlide((prev) => (prev + 1) % flashSales.length);
  };

  // Auto slide flash sale carousel
  useEffect(() => {
    if (flashSales.length === 0) return;
    const interval = setInterval(() => {
      setCurrentFlashSaleSlide((prev) => (prev + 1) % flashSales.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [flashSales.length]);

  return (
    <div className="space-y-24">
      {/* Thông báo đơn hàng đang được xử lý */}
      {showOrderProcessingMessage && orderProcessingInfo && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-lg max-w-md animate-in slide-in-from-right duration-300">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">
                Đơn hàng đang được xử lý
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{orderProcessingInfo.message}</p>
                {orderProcessingInfo.orderCode && (
                  <p className="mt-1 font-semibold">Mã đơn hàng: {orderProcessingInfo.orderCode}</p>
                )}
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => {
                  setShowOrderProcessingMessage(false);
                  setOrderProcessingInfo(null);
                }}
                className="inline-flex text-green-400 hover:text-green-600 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Carousel Section */}
      <section className="relative h-[600px] rounded-lg overflow-hidden">
        {/* Slides Container */}
        <div className="relative w-full h-full">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url('${slide.image}')` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                <div className="relative container mx-auto px-6 h-full flex items-center">
                  <div className="text-center w-full z-10">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4 text-white">
                      {slide.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                      {slide.description}
          </p>
          <Link
                      to={slide.link}
            className="bg-white text-gray-900 font-bold py-3 px-10 rounded-full hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2"
          >
            <>Mua sắm ngay <ArrowRight size={20} /></>
          </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full transition-all duration-300 hover:scale-110"
          aria-label="Slide trước"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full transition-all duration-300 hover:scale-110"
          aria-label="Slide tiếp theo"
        >
          <ChevronRight size={24} />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Chuyển đến slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <FlashSaleCountdown />

      {/* Flash Sale Carousel */}
      {flashSales.length > 0 && (
        <section className="relative">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 inline-block relative">
              Chương Trình Giảm Giá Hot
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-indigo-500"></span>
            </h2>
            <p className="text-gray-500 mt-2">Khám phá các chương trình giảm giá đặc biệt đang diễn ra</p>
          </div>
          
          <div className="relative h-[400px] rounded-lg overflow-hidden">
            {/* Slides Container */}
            <div className="relative w-full h-full">
              {flashSales.map((flashSale, index) => {
                const isActive = index === currentFlashSaleSlide;
                const startTime = new Date(flashSale.startTime);
                const endTime = new Date(flashSale.endTime);
                const now = new Date();
                const isUpcoming = now < startTime;
                const statusText = isUpcoming ? 'Sắp diễn ra' : 'Đang diễn ra';
                
                return (
                  <Link
                    key={flashSale.id}
                    to={`/flash-sales/${flashSale.id}`}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    <div className="relative w-full h-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 flex items-center justify-center">
                      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                      <div className="relative z-10 text-center text-white px-6">
                        <div className="inline-block bg-yellow-400 text-red-600 font-bold px-4 py-2 rounded-full mb-4 text-sm">
                          {statusText}
                        </div>
                        <h3 className="text-4xl md:text-5xl font-extrabold mb-4">{flashSale.name}</h3>
                        <p className="text-xl md:text-2xl text-gray-100 mb-6">
                          {isUpcoming 
                            ? `Bắt đầu: ${startTime.toLocaleDateString('vi-VN')}`
                            : `Kết thúc: ${endTime.toLocaleDateString('vi-VN')}`
                          }
                        </p>
                        <div className="bg-white text-red-600 font-bold py-3 px-8 rounded-full inline-flex items-center gap-2 hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105">
                          Xem sản phẩm <ArrowRight size={20} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Navigation Arrows */}
            {flashSales.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    goToFlashSalePrevious();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full transition-all duration-300 hover:scale-110"
                  aria-label="Slide trước"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    goToFlashSaleNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full transition-all duration-300 hover:scale-110"
                  aria-label="Slide tiếp theo"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {flashSales.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.preventDefault();
                        goToFlashSaleSlide(index);
                      }}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentFlashSaleSlide
                          ? 'bg-white w-8'
                          : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                      }`}
                      aria-label={`Chuyển đến slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

    

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
        {isLoading ? (
          <p className="text-center">Đang tải danh mục...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map(category => {
              const categoryImage = category.imageUrl || 
                (category.products && category.products.length > 0 && category.products[0].attachmentDTOS && category.products[0].attachmentDTOS.length > 0 
                  ? category.products[0].attachmentDTOS[0].url 
                  : 'https://placehold.co/400x500/EFEFEF/333333?text=' + encodeURIComponent(category.name));
              const categoryHref = category.slug 
                ? `/products?category=${category.slug}` 
                : `/products?categoryId=${category.id}`;
              
              return (
                <Link to={categoryHref} key={category.id} className="group relative rounded-lg overflow-hidden h-80">
                  <img 
                    src={categoryImage} 
                    alt={category.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <h3 className="text-white text-2xl font-bold tracking-wider">{category.name}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
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
