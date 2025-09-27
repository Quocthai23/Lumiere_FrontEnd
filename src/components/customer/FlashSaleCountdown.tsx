import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Zap } from 'lucide-react';
import type { FlashSale } from '../../types/flashSale';
import type { Product } from '../../types/product';

interface SaleProduct extends Product {
    salePrice: number;
    quantity: number;
    sold: number;
}

// Component thẻ sản phẩm dành riêng cho Flash Sale, được nâng cấp giao diện
const FlashSaleProductCard: React.FC<{ saleProduct: SaleProduct }> = ({ saleProduct }) => {
    const { variants, name, slug, images, salePrice, quantity, sold } = saleProduct;
    // Sử dụng optional chaining `?.` để tránh lỗi khi variants không tồn tại
    const originalPrice = variants?.find(v => v.isDefault)?.price || 0;
    const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;
    const soldPercent = quantity > 0 ? (sold / quantity) * 100 : 0;

    return (
        // Giữ nguyên thiết kế thẻ sản phẩm cơ bản để đồng bộ
        <Link to={`/products/${slug}`} className="group relative border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white block">
            {/* Huy hiệu giảm giá */}
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10 flex items-center gap-1">
                <Zap size={12} />
                <span>-{discountPercent}%</span>
            </div>
            {/* Hình ảnh sản phẩm */}
            <div className="w-full h-64 bg-gray-200 overflow-hidden">
                <img
                    src={images?.[0] || `https://placehold.co/300x400/EFEFEF/333333?text=${encodeURIComponent(name)}`}
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


const FlashSaleCountdown: React.FC = () => {
    const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSaleProducts = async () => {
            setIsLoading(true);
            try {
                // Sửa đổi để truy cập đúng vào `data`
                const response = await axiosClient.get<FlashSale>('/flash-sales/active');
                setFlashSale(response.data);
            } catch (error) {
                console.error("Không thể tải sự kiện flash sale:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSaleProducts();
    }, []);

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
        // Có thể thêm skeleton loading ở đây
        return null;
    }

    if (!flashSale || !flashSale.products || flashSale.products.length === 0) {
        return null;
    }

    // Kết hợp thông tin sản phẩm và thông tin sale
    const saleProducts: SaleProduct[] = flashSale.products.map(p => ({
        // Giả sử p.product là một đối tượng Product đầy đủ
        ...(p.product as Product),
        salePrice: p.salePrice,
        quantity: p.quantity,
        sold: p.sold
    }));

    const formatTime = (time: number) => time.toString().padStart(2, '0');

    return (
        <section className="bg-indigo-50 p-8 rounded-lg">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Zap className="w-8 h-8 text-indigo-500" />
                    {flashSale.name}
                </h2>
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <span className="font-semibold text-gray-600">Kết thúc trong:</span>
                    <div className="flex gap-2 text-center">
                        <span className="bg-white text-indigo-600 px-3 py-2 rounded-md font-bold text-lg shadow-sm border">{formatTime(timeLeft.hours)}</span>
                        <span className="font-bold text-lg text-gray-500 pt-1">:</span>
                        <span className="bg-white text-indigo-600 px-3 py-2 rounded-md font-bold text-lg shadow-sm border">{formatTime(timeLeft.minutes)}</span>
                        <span className="font-bold text-lg text-gray-500 pt-1">:</span>
                        <span className="bg-white text-indigo-600 px-3 py-2 rounded-md font-bold text-lg shadow-sm border">{formatTime(timeLeft.seconds)}</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {saleProducts.map(saleProduct => (
                    saleProduct && saleProduct.id ? <FlashSaleProductCard key={saleProduct.id} saleProduct={saleProduct} /> : null
                ))}
            </div>
        </section>
    );
};

export default FlashSaleCountdown;

