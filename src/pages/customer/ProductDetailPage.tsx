import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Product, ProductVariant } from '../../types/product';
import { useCart } from '../../contexts/CartContext';
import axiosClient from '../../api/axiosClient';

const ProductDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { addToCart } = useCart();
    
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
    const [quantity, setQuantity] = useState(1);
    const [notification, setNotification] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!slug) return;
            setIsLoading(true);
            setError(null);
            try {
                // Gọi API để lấy sản phẩm theo slug
                const response = await axiosClient.get(`/products?slug.equals=${slug}`);
                if (response.data && response.data.length > 0) {
                    const foundProduct = response.data[0];
                    setProduct(foundProduct);
                    // Tự động chọn biến thể mặc định hoặc biến thể đầu tiên
                    const defaultVariant = foundProduct.variants?.find((v: ProductVariant) => v.isDefault) || foundProduct.variants?.[0];
                    setSelectedVariant(defaultVariant);
                } else {
                    setError('Không tìm thấy sản phẩm.');
                }
            } catch (err) {
                setError('Không thể tải thông tin sản phẩm. Vui lòng thử lại.');
                console.error("Lỗi khi fetch chi tiết sản phẩm:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [slug]);

    if (isLoading) {
        return <div className="text-center py-20">Đang tải thông tin sản phẩm...</div>;
    }

    if (error) {
        return <div className="text-center py-20 text-red-500">{error}</div>;
    }
    
    if (!product) {
        return <div className="text-center py-20">Không có thông tin sản phẩm để hiển thị.</div>
    }

    const handleVariantSelect = (variantId: number) => {
        const variant = product.variants?.find(v => v.id === variantId);
        setSelectedVariant(variant);
        setQuantity(1); // Reset số lượng khi đổi variant
    };

    const handleQuantityChange = (amount: number) => {
        setQuantity(prev => Math.max(1, prev + amount));
    }
    
    const handleAddToCart = () => {
        if (product && selectedVariant) {
            addToCart(product, selectedVariant, quantity);
            setNotification(`${quantity} x "${selectedVariant.name}" đã được thêm vào giỏ hàng!`);
            setTimeout(() => setNotification(''), 3000);
        }
    };

    const imageUrl = `https://placehold.co/600x800/EFEFEF/333333?text=${encodeURIComponent(product.name)}`;
    const isOutOfStock = selectedVariant ? selectedVariant.stockQuantity <= 0 : true;

    return (
        <div className="container mx-auto p-4">
            {notification && (
                <div className="fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce z-50">
                    {notification}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="w-full flex justify-center items-center">
                    <img src={imageUrl} alt={product.name} className="max-w-full h-auto rounded-lg shadow-md" />
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
                    {selectedVariant && (
                         <p className="text-2xl font-semibold text-indigo-600 mb-4">
                            {selectedVariant.price.toLocaleString('vi-VN')} {selectedVariant.currency || 'VND'}
                        </p>
                    )}
                    <p className="text-gray-600 mb-6">{product.description}</p>
                    
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Lựa chọn phiên bản:</h3>
                        <div className="flex flex-wrap gap-2">
                            {product.variants?.map(variant => (
                                <button
                                    key={variant.id}
                                    onClick={() => handleVariantSelect(variant.id)}
                                    className={`px-4 py-2 border rounded-md transition-colors duration-200 ${
                                        selectedVariant?.id === variant.id
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    {variant.name.replace(product.name + " - ", "")}
                                </button>
                            ))}
                        </div>
                    </div>

                     <div className="mb-6 flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-gray-700">Số lượng:</h3>
                         <div className="flex items-center border border-gray-300 rounded-md">
                            <button onClick={() => handleQuantityChange(-1)} className="px-3 py-1 text-lg font-bold hover:bg-gray-100 rounded-l-md">-</button>
                            <span className="px-4 py-1 text-lg">{quantity}</span>
                            <button onClick={() => handleQuantityChange(1)} className="px-3 py-1 text-lg font-bold hover:bg-gray-100 rounded-r-md">+</button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-700">Tình trạng: 
                            <span className={isOutOfStock ? "text-red-500 ml-2" : "text-green-600 ml-2"}>
                                {isOutOfStock ? 'Hết hàng' : 'Còn hàng'}
                            </span>
                        </h3>
                    </div>

                    <button 
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors duration-300 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isOutOfStock ? 'Đã hết hàng' : 'Thêm vào giỏ hàng'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
