import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import type { Product, ProductVariant } from '../../types/product';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useRecentlyViewed } from '../../contexts/RecentlyViewedContext';
import axiosClient from '../../api/axiosClient';
import ProductReviews from './ProductReviews';
import ProductCarousel from '../../components/customer/ProductCarousel';
import ProductQA from '../../components/customer/ProductQA';
import StarRating from './StarRating';
import { Heart, ShoppingCart, Info, MessageSquare, Star, X } from 'lucide-react';
import Breadcrumb from '../../components/customer/Breadcrumb';
import ProductImageGallery from '../../components/customer/ProductImageGallery';
import SocialShareButtons from '../../components/customer/SocialShareButtons';
import StockNotificationForm from '../../components/customer/StockNotificationForm';

// --- Component Modal Xác Nhận ---
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fadeIn">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors"
                    >
                        Đồng ý
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const ProductDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate(); // Khởi tạo hook navigate
    const { addToCart } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const { addProductToHistory } = useRecentlyViewed();
    
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
    const [quantity, setQuantity] = useState(1);
    const [notification, setNotification] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [activeTab, setActiveTab] = useState('description');

    // State cho modal xác nhận wishlist
    const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!slug) return;
            window.scrollTo(0, 0);
            setIsLoading(true);
            setError(null);
            try {
                const response = await axiosClient.get(`/products?slug.equals=${slug}`);
                if (response.data && response.data.length > 0) {
                    const foundProduct = response.data[0];
                    setProduct(foundProduct);
                    addProductToHistory(foundProduct.id); 
                    const defaultVariant = foundProduct.variants?.find((v: ProductVariant) => v.isDefault) || foundProduct.variants?.[0];
                    setSelectedVariant(defaultVariant);

                    if (foundProduct.category) {
                        const relatedResponse = await axiosClient.get('/products', {
                            params: { 'category.in': foundProduct.category, 'status.equals': 'ACTIVE', size: 5 }
                        });
                        const filteredRelated = relatedResponse.data.filter((p: Product) => p.id !== foundProduct.id).slice(0, 4);
                        setRelatedProducts(filteredRelated);
                    }
                } else {
                    setError('Không tìm thấy sản phẩm.');
                }
            } catch (err) {
                setError('Không thể tải thông tin sản phẩm. Vui lòng thử lại.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [slug, addProductToHistory]);

    if (isLoading) return <div className="text-center py-20">Đang tải thông tin sản phẩm...</div>;
    if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
    if (!product) return <div className="text-center py-20">Không có thông tin sản phẩm để hiển thị.</div>;

    const handleVariantSelect = (variantId: number) => {
        const variant = product.variants?.find(v => v.id === variantId);
        setSelectedVariant(variant);
        setQuantity(1); 
    };

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

    // Xử lý khi nhấn nút trái tim
    const handleWishlistClick = () => {
        if (!product) return;
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            setIsWishlistModalOpen(true);
        }
    };

    // Hàm thực sự thêm vào wishlist và chuyển trang khi người dùng đồng ý
    const confirmAddToWishlist = () => {
        if (product) {
            addToWishlist(product.id);
            setIsWishlistModalOpen(false);
            // Chuyển hướng đến trang Wishlist
            navigate('/account/wishlist');
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

    return (
        <div className="container mx-auto px-4 py-8">
            {notification && (
                <div className="fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce z-50">
                    {notification}
                </div>
            )}
            <div className="mb-6">
                <Breadcrumb category={product.category} productName={product.name} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <ProductImageGallery images={product.images || []} altText={product.name} />

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
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">{product.description.substring(0, 150)}...</p>

                    <div className="mb-6">
                        <h3 className="text-md font-semibold text-gray-700 mb-2">Lựa chọn phiên bản:</h3>
                        <div className="flex flex-wrap gap-2">
                            {product.variants?.map(variant => (
                                <button
                                    key={variant.id}
                                    onClick={() => handleVariantSelect(variant.id)}
                                    className={`px-4 py-2 border rounded-md transition-colors duration-200 text-sm font-medium ${
                                        selectedVariant?.id === variant.id
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                    {variant.name.replace(product.name + " - ", "")}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-8 mb-6">
                        <h3 className="text-md font-semibold text-gray-700">Số lượng:</h3>
                         <div className="flex items-center border border-gray-300 rounded-lg">
                            <button onClick={() => handleQuantityChange(-1)} className="px-4 py-2 text-lg font-bold hover:bg-gray-100 rounded-l-lg">-</button>
                            <span className="px-5 py-2 text-lg font-semibold">{quantity}</span>
                            <button onClick={() => handleQuantityChange(1)} className="px-4 py-2 text-lg font-bold hover:bg-gray-100 rounded-r-lg">+</button>
                        </div>
                    </div>

                    <p className="text-sm font-semibold mb-6">
                        Tình trạng: 
                        <span className={`ml-2 ${isOutOfStock ? "text-red-500" : "text-green-600"}`}>
                            {isOutOfStock ? 'Hết hàng' : 'Còn hàng'}
                        </span>
                    </p>

                    <div className="flex items-stretch gap-4">
                       {isOutOfStock ? (
                           <button 
                                disabled
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-400 text-white py-3 rounded-lg font-semibold text-lg cursor-not-allowed shadow-md">
                                <ShoppingCart size={20} />
                                Đã hết hàng
                            </button>
                        ) : (
                            <button 
                                onClick={handleAddToCart}
                                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-transform transform hover:scale-105 shadow-md">
                                <ShoppingCart size={20} />
                                Thêm vào giỏ
                            </button>
                        )}
                        <button onClick={handleWishlistClick} className="p-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors" title={isInWishlist(product.id) ? "Bỏ yêu thích" : "Thêm vào yêu thích"}>
                             <Heart className={`w-6 h-6 ${isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-500'}`} />
                        </button>
                    </div>

                    {isOutOfStock && selectedVariant && (
                        <StockNotificationForm variant={selectedVariant} />
                    )}

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

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isWishlistModalOpen}
                onClose={() => setIsWishlistModalOpen(false)}
                onConfirm={confirmAddToWishlist}
                title="Thêm vào danh sách yêu thích"
                message={`Bạn có chắc chắn muốn thêm "${product.name}" vào danh sách yêu thích không?`}
            />
        </div>
    );
};

export default ProductDetailPage;
