import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Product, ProductVariant } from '../../types/product';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useRecentlyViewed } from '../../contexts/RecentlyViewedContext';
import ProductReviews from './ProductReviews';
import ProductCarousel from '../../components/customer/ProductCarousel';
import ProductQA from '../../components/customer/ProductQA';
import StarRating from './StarRating';
import { Heart, ShoppingCart, Info, MessageSquare, Star } from 'lucide-react';
import Breadcrumb from '../../components/customer/Breadcrumb';
import ProductImageGallery from '../../components/customer/ProductImageGallery';
import SocialShareButtons from '../../components/customer/SocialShareButtons';
import StockNotificationForm from '../../components/customer/StockNotificationForm';
import httpClient from '../../utils/HttpClient.ts';
import VariantOptionSelector from '../../components/customer/VariantOptionSelect.tsx';
import HttpClient from "../../utils/HttpClient.ts";

const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { addToCart } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const { addProductToHistory } = useRecentlyViewed();

    const [product, setProduct] = useState<Product | null>(null);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
    const [quantity, setQuantity] = useState(1);
    const [notification, setNotification] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [activeTab, setActiveTab] = useState('description');

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            const productId = Number(id);
            if (Number.isNaN(productId)) {
                setError('ID sản phẩm không hợp lệ.');
                setIsLoading(false);
                return;
            }

            window.scrollTo(0, 0);
            setIsLoading(true);
            setError(null);

            try {
                // 1) Lấy product theo id
                const foundProduct = await httpClient.get<Product>(`/products/${productId}`);
                if (!foundProduct) {
                    setError('Không tìm thấy sản phẩm.');
                    setIsLoading(false);
                    return;
                }

                setProduct(foundProduct);
                addProductToHistory(foundProduct.id);

                // 2) Lấy variants theo productId
                const variantList = await httpClient.get<ProductVariant[]>(
                    `/product-variants?productId.equals=${productId}&sort=id,asc`
                );
                setVariants(variantList || []);

                const defaultVariant =
                    variantList?.find(v => v.isDefault) ||
                    (variantList && variantList[0]) ||
                    undefined;

                setSelectedVariant(defaultVariant);

                // 3) Sản phẩm liên quan
                if (foundProduct.categoryId) {
                    console.log("Fetching related products for category:", foundProduct.categoryId);
                    const allParams: Record<string, any> = {
                        'category.in': foundProduct.categoryId,
                        size: 5,
                        page: 0
                    };
                    const relatedResponse = await HttpClient.get<any>('/products/search', allParams
                    );
                    const filteredRelated = relatedResponse.content.
                        filter((p: Product) => p.id !== foundProduct.id)
                        .slice(0,4)
                    setRelatedProducts(filteredRelated);
                }
            } catch (err) {
                console.error(err);
                setError('Không thể tải thông tin sản phẩm. Vui lòng thử lại.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, addProductToHistory]);

    if (isLoading) return <div className="text-center py-20">Đang tải thông tin sản phẩm...</div>;
    if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
    if (!product) return <div className="text-center py-20">Không có thông tin sản phẩm để hiển thị.</div>;

    const handleQuantityChange = (amount: number) => {
        setQuantity(prev => Math.max(1, prev + amount));
    };

    const handleAddToCart = () => {
        if (product && selectedVariant) {
            addToCart(product, selectedVariant, quantity);
            setNotification(`${quantity} x "${selectedVariant.name}" đã được thêm vào giỏ hàng!`);
            setTimeout(() => setNotification(''), 3000);
        }
    };

    const handleWishlistClick = async () => {
        if (!product) return;
        
        // Dùng selectedVariant hoặc variant đầu tiên nếu chưa chọn
        const variantToUse = selectedVariant || variants[0];
        if (!variantToUse) {
            console.warn('Không có variant để thêm vào wishlist');
            return;
        }
        
        const variantId = variantToUse.id;
        if (isInWishlist(variantId)) {
            await removeFromWishlist(variantId);
            setNotification('Đã xóa khỏi danh sách yêu thích');
            setTimeout(() => setNotification(''), 3000);
        } else {
            await addToWishlist(variantId, product, variantToUse);
            setNotification('Đã thêm vào danh sách yêu thích');
            setTimeout(() => setNotification(''), 3000);
        }
    };

    const isOutOfStock = selectedVariant ? selectedVariant.stockQuantity <= 0 : true;
    const productUrl = window.location.href;

    const TabButton = ({ id, label, icon }: { id: string; label: string; icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 font-semibold rounded-t-lg transition-colors ${
                activeTab === id ? 'bg-white text-indigo-600' : 'bg-transparent text-gray-500 hover:bg-gray-100'
            }`}
        >
            {icon}
            {label}
        </button>
    );


    const imageUrls =
        selectedVariant && (selectedVariant as any).urlImage
            ? [(selectedVariant as any).urlImage]
            : (
                product.attachmentDTOS
                    ?.map((pa: any) => pa?.attachment?.url)
                    .filter((u: any) => !!u) || []
            );

    console.log("Product Detail:",imageUrls);

    return (
        <div className="container mx-auto px-4 py-8">
            {notification && (
                <div className="fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce z-50">
                    {notification}
                </div>
            )}

            <div className="mb-6">
                <Breadcrumb category={product.categoryId} productName={product.name} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <ProductImageGallery images={imageUrls} altText={product.name} />

                <div className="flex flex-col">
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">{product.name}</h1>

                    <div className="flex items-center gap-4 mb-4">
                        <StarRating rating={product.averageRating} />
                        <span className="text-sm text-gray-500">({product.reviewCount} đánh giá)</span>
                    </div>

                    {selectedVariant && (
                        <p className="text-3xl font-bold text-indigo-600 mb-4">
                            {selectedVariant.price.toLocaleString('vi-VN')} {selectedVariant.currency || 'VND'}
                        </p>
                    )}

                    <p className="text-gray-600 mb-6 leading-relaxed">
                        {product.description.substring(0, 150)}...
                    </p>

                    <VariantOptionSelector
                        productId={product.id}
                        variants={variants}
                        selectedVariant={selectedVariant}
                        onVariantChange={v => {
                            setSelectedVariant(v);
                            setQuantity(1);
                        }}
                    />

                    <div className="flex items-center gap-8 mb-6">
                        <h3 className="text-md font-semibold text-gray-700">Số lượng:</h3>
                        <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                                onClick={() => handleQuantityChange(-1)}
                                className="px-4 py-2 text-lg font-bold hover:bg-gray-100 rounded-l-lg"
                            >
                                -
                            </button>
                            <span className="px-5 py-2 text-lg font-semibold">{quantity}</span>
                            <button
                                onClick={() => handleQuantityChange(1)}
                                className="px-4 py-2 text-lg font-bold hover:bg-gray-100 rounded-r-lg"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <p className="text-sm font-semibold mb-6">
                        Tình trạng:
                        <span className={`ml-2 ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
              {isOutOfStock ? 'Hết hàng' : 'Còn hàng'}
            </span>
                    </p>

                    <div className="flex items-stretch gap-4">
                        {isOutOfStock ? (
                            <button
                                disabled
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-400 text-white py-3 rounded-lg font-semibold text-lg cursor-not-allowed shadow-md"
                            >
                                <ShoppingCart size={20} />
                                Đã hết hàng
                            </button>
                        ) : (
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-transform transform hover:scale-105 shadow-md"
                            >
                                <ShoppingCart size={20} />
                                Thêm vào giỏ
                            </button>
                        )}
                        <button
                            onClick={handleWishlistClick}
                            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={(selectedVariant || variants[0]) && isInWishlist((selectedVariant || variants[0])?.id) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                            disabled={variants.length === 0}
                        >
                            <Heart
                                className={`w-6 h-6 ${
                                    (selectedVariant || variants[0]) && isInWishlist((selectedVariant || variants[0])?.id) ? 'text-red-500 fill-current' : 'text-gray-500'
                                }`}
                            />
                        </button>
                    </div>

                    {isOutOfStock && selectedVariant && <StockNotificationForm variant={selectedVariant} />}

                    <div className="mt-8 border-t pt-4">
                        <SocialShareButtons productUrl={productUrl} productName={product.name} />
                    </div>
                </div>
            </div>

            <div className="mt-16 bg-gray-50 p-4 rounded-lg">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                        <TabButton id="description" label="Mô tả chi tiết" icon={<Info size={18} />} />
                        <TabButton id="reviews" label="Đánh giá" icon={<Star size={18} />} />
                        <TabButton id="qa" label="Hỏi & Đáp" icon={<MessageSquare size={18} />} />
                    </nav>
                </div>
                <div className="bg-white p-6 rounded-b-lg">
                    {activeTab === 'description' && (
                        <div className="prose max-w-none text-gray-700">
                            <p>{product.description}</p>
                        </div>
                    )}
                    {activeTab === 'reviews' && <ProductReviews product={product} />}
                    {activeTab === 'qa' && <ProductQA product={product} />}
                </div>
            </div>

            <ProductCarousel title="Có thể bạn cũng thích" products={relatedProducts} />

        </div>
    );
};

export default ProductDetailPage;
