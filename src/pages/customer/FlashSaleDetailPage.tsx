import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { flashSaleApi } from '../../api/flashSaleApi';
import type { FlashSale } from '../../types/flashSale';
import type { Product } from '../../types/product';
import { ArrowLeft, Zap } from 'lucide-react';

interface SaleProduct extends Product {
    salePrice: number;
    quantity: number;
    sold: number;
    
}

// Component thẻ sản phẩm dành riêng cho Flash Sale
const FlashSaleProductCard: React.FC<{ saleProduct: SaleProduct }> = ({ saleProduct }) => {
    const { variants, name, id, attachmentDTOS, salePrice, quantity, sold } = saleProduct;
    const originalPrice = variants?.find(v => v.isDefault)?.price || 0;
    const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;
    const soldPercent = quantity > 0 ? (sold / quantity) * 100 : 0;
    const productImage = attachmentDTOS && attachmentDTOS.length > 0 
        ? attachmentDTOS[0].url 
        : `https://placehold.co/300x400/EFEFEF/333333?text=${encodeURIComponent(name)}`;

    return (
        <Link to={`/products/${id}`} className="group relative border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white block">
            {/* Huy hiệu giảm giá */}
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10 flex items-center gap-1">
                <Zap size={12} />
                <span>-{discountPercent}%</span>
            </div>
            {/* Hình ảnh sản phẩm */}
            <div className="w-full h-64 bg-gray-200 overflow-hidden">
                <img
                    src={productImage}
                    alt={name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
            </div>
            {/* Thông tin sản phẩm */}
            <div className="p-4 flex flex-col h-48">
                <h3 className="text-gray-800 font-semibold text-md truncate" title={name}>
                    {name}
                </h3>
                <div className="mt-2">
                    <span className="text-xl font-bold text-red-600">{salePrice.toLocaleString('vi-VN')} đ</span>
                    {originalPrice > salePrice && (
                        <span className="ml-2 text-sm text-gray-400 line-through">{originalPrice.toLocaleString('vi-VN')} đ</span>
                    )}
                </div>
                {/* Thanh tiến trình bán hàng */}
                <div className="mt-auto">
                    <div className="w-full bg-gray-200 rounded-full h-5 relative overflow-hidden border border-gray-300">
                        <div
                            className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white z-10"
                            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                        >
                           {soldPercent > 70 ? "Sắp hết hàng" : `Đã bán ${sold}`}
                        </div>
                        <div
                            className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full transition-width duration-500"
                            style={{ width: `${soldPercent}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const FlashSaleDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
    const [saleProducts, setSaleProducts] = useState<SaleProduct[]>([]);
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFlashSaleData = async () => {
            if (!id) return;
            window.scrollTo(0, 0);
            setIsLoading(true);
            setError(null);
            
            try {
                const flashSaleId = parseInt(id, 10);
                
                // Fetch flash sale info
                const flashSaleResponse = await flashSaleApi.getFlashSale(flashSaleId);
                setFlashSale(flashSaleResponse);
                
                // Fetch flash sale products sorted by discount using new API endpoint
                const allFlashSaleProducts = await flashSaleApi.getFlashSaleProductsSortedByDiscount();
                console.log('Tất cả flash sale products từ API:', allFlashSaleProducts.length);
                
                // Filter products by flash sale id and ensure flashSale and productVariant are not null
                const flashSaleProductsResponse = allFlashSaleProducts.filter(
                    (flashSaleProduct) => 
                        flashSaleProduct.flashSale?.id === flashSaleId &&
                        flashSaleProduct.productVariant != null &&
                        flashSaleProduct.flashSale != null
                );
                console.log(`Sản phẩm thuộc flash sale ${flashSaleId}:`, flashSaleProductsResponse.length);
                
                // Fetch all products in parallel
                const productPromises = flashSaleProductsResponse.map(async (flashSaleProduct) => {
                    const variant = flashSaleProduct.productVariant!;
                    
                    // Get productId from variant.productId or variant.product?.id
                    let productId = variant.productId || variant.product?.id;
                    
                    // Nếu không có productId, thử fetch variant để lấy product
                    if (!productId && variant.id) {
                        try {
                            const variantResponse = await axiosClient.get(`/product-variants/${variant.id}`);
                            const fullVariant = variantResponse.data;
                            productId = fullVariant.productId || fullVariant.product?.id;
                        } catch (err) {
                            console.warn(`Không thể fetch variant ${variant.id}:`, err);
                        }
                    }
                    
                    if (!productId) {
                        console.warn(`ProductVariant ${variant.id} không có productId, bỏ qua sản phẩm này`);
                        return null;
                    }
                    
                    try {
                        // Fetch full product info
                        const productResponse = await axiosClient.get<Product>(`/products/${productId}`);
                        const product = productResponse.data;
                        
                        return {
                            ...product,
                            salePrice: flashSaleProduct.salePrice,
                            quantity: flashSaleProduct.quantity,
                            sold: flashSaleProduct.sold
                        } as SaleProduct;
                    } catch (err) {
                        console.error(`Không thể tải sản phẩm ${productId}:`, err);
                        return null;
                    }
                });
                
                const products = await Promise.all(productPromises);
                const validProducts = products.filter((p): p is SaleProduct => p !== null);
                console.log('Sản phẩm hợp lệ để hiển thị:', validProducts.length);
                
                // Products đã được sắp xếp theo discount từ API, không cần sort lại
                setSaleProducts(validProducts);
            } catch (err) {
                setError('Không thể tải thông tin flash sale.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFlashSaleData();
    }, [id]);

    useEffect(() => {
        if (!flashSale?.endTime) return;

        const endTime = new Date(flashSale.endTime);
        const timer = setInterval(() => {
            const now = new Date();
            const distance = endTime.getTime() - now.getTime();

            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            } else {
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft({ hours, minutes, seconds });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [flashSale?.endTime]);

    if (isLoading) {
        return <div className="text-center py-20">Đang tải...</div>;
    }

    if (error || !flashSale) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 mb-4">{error || 'Không tìm thấy flash sale.'}</p>
                <Link to="/" className="text-indigo-600 hover:underline">Quay về trang chủ</Link>
            </div>
        );
    }


    const formatTime = (time: number) => time.toString().padStart(2, '0');
    const startTime = new Date(flashSale.startTime);
    const endTime = new Date(flashSale.endTime);
    const now = new Date();
    const isUpcoming = now < startTime;
    const isActive = now >= startTime && now <= endTime;

    return (
        <div>
            {/* Header Section */}
            <section className="relative h-96 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-lg overflow-hidden mb-12">
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                <div className="relative z-10 text-center text-white px-6 py-12 h-full flex flex-col items-center justify-center">
                    <div className="inline-block bg-yellow-400 text-red-600 font-bold px-4 py-2 rounded-full mb-4 text-sm">
                        {isUpcoming ? 'Sắp diễn ra' : isActive ? 'Đang diễn ra' : 'Đã kết thúc'}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{flashSale.name}</h1>
                    {isActive && (
                        <div className="flex items-center gap-4 mt-6">
                            <span className="font-semibold">Kết thúc trong:</span>
                            <div className="flex gap-2 text-center">
                                <span className="bg-white text-red-600 px-4 py-2 rounded-md font-bold text-lg shadow-sm">
                                    {formatTime(timeLeft.hours)}
                                </span>
                                <span className="font-bold text-lg pt-1">:</span>
                                <span className="bg-white text-red-600 px-4 py-2 rounded-md font-bold text-lg shadow-sm">
                                    {formatTime(timeLeft.minutes)}
                                </span>
                                <span className="font-bold text-lg pt-1">:</span>
                                <span className="bg-white text-red-600 px-4 py-2 rounded-md font-bold text-lg shadow-sm">
                                    {formatTime(timeLeft.seconds)}
                                </span>
                            </div>
                        </div>
                    )}
                    {isUpcoming && (
                        <p className="text-xl mt-4">
                            Bắt đầu: {startTime.toLocaleDateString('vi-VN', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    )}
                </div>
            </section>

            {/* Products Section */}
            {!isLoading && saleProducts.length > 0 ? (
                <section>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-800 inline-block relative">
                            Sản Phẩm Giảm Giá
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-indigo-500"></span>
                        </h2>
                        <p className="text-gray-500 mt-2">
                            {saleProducts.length} sản phẩm đang được giảm giá trong chương trình này
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {saleProducts.map(saleProduct => (
                            <FlashSaleProductCard key={saleProduct.id} saleProduct={saleProduct} />
                        ))}
                    </div>
                </section>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Chưa có sản phẩm nào trong chương trình này.</p>
                </div>
            )}

            {/* Back Button */}
            <div className="text-center mt-12">
                <Link 
                    to="/" 
                    className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-2"
                >
                    <ArrowLeft size={16} /> Quay về trang chủ
                </Link>
            </div>
        </div>
    );
};

export default FlashSaleDetailPage;

