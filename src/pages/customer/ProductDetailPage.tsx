import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import type { Product, ProductVariant } from '../../types/product';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useRecentlyViewed } from '../../contexts/RecentlyViewedContext';
import ProductReviews from './ProductReviews';
import ProductCarousel from '../../components/customer/ProductCarousel';
import StarRating from './StarRating';
import { Heart, ShoppingCart, Info, MessageSquare, Star, X } from 'lucide-react';
import Breadcrumb from '../../components/customer/Breadcrumb';
import ProductImageGallery from '../../components/customer/ProductImageGallery';
import SocialShareButtons from '../../components/customer/SocialShareButtons';
import StockNotificationForm from '../../components/customer/StockNotificationForm';
import httpClient from '../../utils/HttpClient.ts';
import VariantOptionSelector from '../../components/customer/VariantOptionSelect.tsx';

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
const useProductDetail = (productId: number | null) => {
    const { addProductToHistory } = useRecentlyViewed();
    const [product, setProduct] = useState<Product | null>(null);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [imagesMap, setImagesMap] = useState<ImagesMap | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!productId || Number.isNaN(productId)) {
            setError('ID sản phẩm không hợp lệ.');
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            window.scrollTo(0, 0);
            setIsLoading(true);
            setError(null);

            try {
                // Fetch song song để tối ưu performance
                const [foundProduct, variantList, imagesMapData] = await Promise.all([
                    httpClient.get<Product>(`/products/${productId}`),
                    httpClient.get<ProductVariant[]>(
                        `/product-variants?productId.equals=${productId}&sort=id,asc`
                    ),
                    httpClient.get<ImagesMap>(`/products/${productId}/images-map`).catch(() => null)
                ]);

                if (!foundProduct) {
                    setError('Không tìm thấy sản phẩm.');
                    setIsLoading(false);
                    return;
                }

                setProduct(foundProduct);
                setVariants(variantList || []);
                setImagesMap(imagesMapData || null);
                addProductToHistory(foundProduct.id);

                // Fetch sản phẩm liên quan nếu có categoryId
                if (foundProduct.categoryId) {
                    httpClient.get<{ content: Product[] }>('/products/search', {
                        'category.in': foundProduct.categoryId,
                        size: 5,
                        page: 0
                    }).then(relatedResponse => {
                        const filteredRelated = (relatedResponse.content || [])
                            .filter((p: Product) => p.id !== foundProduct.id)
                            .slice(0, 4);
                        setRelatedProducts(filteredRelated);
                    }).catch(err => {
                        console.error('Lỗi khi tải sản phẩm liên quan:', err);
                    });
                }
            } catch (err) {
                console.error('Lỗi khi tải thông tin sản phẩm:', err);
                setError('Không thể tải thông tin sản phẩm. Vui lòng thử lại.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [productId, addProductToHistory]);

    return { product, variants, relatedProducts, imagesMap, isLoading, error };
};

// Component TabButton tách riêng để tối ưu
const TabButton: React.FC<{
    id: string;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = React.memo(({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 font-semibold rounded-t-lg transition-colors ${
            isActive ? 'bg-white text-indigo-600' : 'bg-transparent text-gray-500 hover:bg-gray-100'
        }`}
    >
        {icon}
        {label}
    </button>
));
TabButton.displayName = 'TabButton';

const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate(); // Khởi tạo hook navigate
    const { addToCart } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

    // State cho modal xác nhận wishlist
    const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);

    const productId = id ? Number(id) : null;
    const { product, variants, relatedProducts, imagesMap, isLoading, error } = useProductDetail(productId);

    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
    const [quantity, setQuantity] = useState(1);
    const [notification, setNotification] = useState('');
    const [activeTab, setActiveTab] = useState('description');
    const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    


    // Set default variant khi variants được load
    useEffect(() => {
        if (variants.length > 0 && !selectedVariant) {
            const defaultVariant = variants.find(v => v.isDefault) || variants[0];
            setSelectedVariant(defaultVariant);
        }
    }, [variants, selectedVariant]);

    // Đảm bảo selectedVariant luôn có đầy đủ thông tin từ danh sách variants
    // (quan trọng khi variant được chọn từ API option-variants/find-by-selects)
    useEffect(() => {
        if (selectedVariant?.id && variants.length > 0) {
            const fullVariant = variants.find(v => v.id === selectedVariant.id);
            if (fullVariant) {
                // Merge thông tin: ưu tiên dữ liệu từ variant đầy đủ, nhưng giữ lại các field từ API nếu có
                setSelectedVariant({
                    ...fullVariant,
                    ...selectedVariant,
                    // Ưu tiên urlImage từ variant đầy đủ nếu variant từ API không có
                    urlImage: selectedVariant.urlImage || fullVariant.urlImage
                });
            }
        }
    }, [selectedVariant?.id, variants]);

    // Cleanup notification timeout
    useEffect(() => {
        return () => {
            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
            }
        };
    }, []);



    // Memoized handlers để tránh re-render không cần thiết
    const handleQuantityChange = useCallback((amount: number) => {
        setQuantity(prev => Math.max(1, prev + amount));
    }, []);

    const handleVariantChange = useCallback(async (v: ProductVariant | undefined) => {
        console.log("handleVariantChange called with:", v);
        
        if (!v) {
            setSelectedVariant(undefined);
            return;
        }
        
        // Nếu variant từ API có id, fetch variant đầy đủ từ server
        if (v.id) {
            try {
                // Fetch variant đầy đủ từ API để có đầy đủ thông tin bao gồm urlImage
                const fullVariant = await httpClient.get<ProductVariant>(`/product-variants/${v.id}`);
                console.log("Fetched full variant from API:", fullVariant);
                if (fullVariant) {
                    setSelectedVariant(fullVariant);
                    setQuantity(1);
                    return;
                }
            } catch (err) {
                console.error('Lỗi khi fetch variant đầy đủ:', err);
            }
            
            // Fallback: tìm variant đầy đủ từ danh sách variants đã có
            if (variants.length > 0) {
                const fullVariant = variants.find(variant => variant.id === v.id);
                console.log("Found variant in local list:", fullVariant);
                if (fullVariant) {
                    const mergedVariant = {
                        ...fullVariant,
                        ...v,
                        urlImage: v.urlImage || fullVariant.urlImage
                    };
                    console.log("Merged variant:", mergedVariant);
                    setSelectedVariant(mergedVariant);
                    setQuantity(1);
                    return;
                }
            }
        }
        
        // Nếu không tìm thấy variant đầy đủ, dùng variant từ API
        console.log("Using variant from API as-is:", v);
        setSelectedVariant(v);
        setQuantity(1);
    }, [variants]);

    const showNotification = useCallback((message: string) => {
        setNotification(message);
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
        notificationTimeoutRef.current = setTimeout(() => {
            setNotification('');
            notificationTimeoutRef.current = null;
        }, 3000);
    }, []);

    const handleAddToCart = useCallback(() => {
        if (product && selectedVariant) {
            addToCart(product, selectedVariant, quantity);
            showNotification(`${quantity} x "${selectedVariant.name}" đã được thêm vào giỏ hàng!`);
        }
    }, [product, selectedVariant, quantity, addToCart, showNotification]);

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

    const productUrl = useMemo(() => window.location.href, []);

    // Helper để build URL ảnh từ filename
    const buildImageUrl = useCallback((filename: string): string => {
        if (!filename) return '';
        // Nếu đã là URL đầy đủ, trả về luôn
        if (filename.startsWith('http://') || filename.startsWith('https://')) {
            return filename;
        }
        // Build URL từ filename
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
        return `${baseUrl}/attachments/${filename}`;
    }, []);

    const imageUrls = useMemo(() => {
        console.log("Computing imageUrls - selectedVariant:", selectedVariant);
        console.log("Computing imageUrls - imagesMap:", imagesMap);
        
        // Ưu tiên sử dụng imagesMap nếu có
        if (imagesMap) {
            const urls: string[] = [];
            
            // Lấy ảnh chung của product (key "0")
            if (imagesMap["0"]) {
                urls.push(buildImageUrl(imagesMap["0"]));
            }
            
            // Lấy ảnh của các variants (key là variantId)
            Object.entries(imagesMap).forEach(([key, filename]) => {
                if (key !== "0" && filename) {
                    urls.push(buildImageUrl(filename));
                }
            });
            
            // Nếu có variant được chọn, đặt ảnh của variant lên đầu
            if (selectedVariant?.id && imagesMap[selectedVariant.id.toString()]) {
                const variantImageUrl = buildImageUrl(imagesMap[selectedVariant.id.toString()]);
                // Xóa ảnh variant khỏi vị trí cũ và đặt lên đầu
                const filtered = urls.filter(url => url !== variantImageUrl);
                return [variantImageUrl, ...filtered];
            }
            
            console.log("imageUrls from imagesMap:", urls);
            return urls;
        }
        
        // Fallback: sử dụng logic cũ nếu không có imagesMap
        if (selectedVariant?.urlImage) {
            const variantImage = [selectedVariant.urlImage];
            const productImages = product?.attachmentDTOS
                ?.map(pa => pa?.url)
                .filter((url): url is string => !!url && url !== selectedVariant.urlImage) || [];
            return [...variantImage, ...productImages];
        }
        
        const productImages = product?.attachmentDTOS
            ?.map(pa => pa?.url)
            .filter((url): url is string => !!url) || [];
        
        return productImages;
    }, [selectedVariant, product, imagesMap, buildImageUrl]);

    const currentVariant = useMemo(
        () => selectedVariant || variants[0],
        [selectedVariant, variants]
    );

    const isWishlisted = useMemo(
        () => currentVariant ? isInWishlist(currentVariant.id) : false,
        [currentVariant, isInWishlist]
    );

    const handleTabChange = useCallback((tabId: string) => {
        setActiveTab(tabId);
    }, []);

    // Xử lý khi click vào ảnh variant từ images-map
    const handleImageClick = useCallback((variantId: number | null) => {
        if (variantId === null || variantId === 0) {
            // Click vào ảnh default (key = 0), chọn variant default hoặc variant đầu tiên
            const defaultVariant = variants.find(v => v.isDefault) || variants[0];
            if (defaultVariant) {
                setSelectedVariant(defaultVariant);
                setQuantity(1);
            }
        } else {
            // Click vào ảnh variant, chọn variant tương ứng
            const variant = variants.find(v => v.id === variantId);
            if (variant) {
                setSelectedVariant(variant);
                setQuantity(1);
            }
        }
    }, [variants]);

    if (isLoading) {
        return <div className="text-center py-20">Đang tải thông tin sản phẩm...</div>;
    }
    
    if (error) {
        return <div className="text-center py-20 text-red-500">{error}</div>;
    }
    
    if (!product) {
        return <div className="text-center py-20">Không có thông tin sản phẩm để hiển thị.</div>;
    }

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
                {imageUrls.length > 0 ? (
                    <ProductImageGallery 
                        images={imageUrls} 
                        productName={product.name}
                        imagesMap={imagesMap}
                        buildImageUrl={buildImageUrl}
                        selectedVariantId={selectedVariant?.id}
                        onImageClick={handleImageClick}
                    />
                ) : (
                    <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ minHeight: '500px' }}>
                        <p className="text-gray-500">Đang tải ảnh sản phẩm...</p>
                    </div>
                )}

                <div className="flex flex-col">
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">{product.name}</h1>

                    <div className="flex items-center gap-4 mb-4">
                        <StarRating rating={product.averageRating} />
                        <span className="text-sm text-gray-500">({product.reviewCount} đánh giá)</span>
                    </div>

                    {selectedVariant && (
                        <div className="mb-4">
                            {selectedVariant.promotionPrice != null && 
                             selectedVariant.promotionPrice < selectedVariant.price ? (
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="inline-block bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                                        FLASH SALE
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl font-bold text-red-600">
                                            {selectedVariant.promotionPrice.toLocaleString('vi-VN')} {selectedVariant.currency || 'VND'}
                                        </span>
                                        <span className="text-xl text-gray-500 line-through">
                                            {selectedVariant.price.toLocaleString('vi-VN')} {selectedVariant.currency || 'VND'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-3xl font-bold text-indigo-600">
                                    {selectedVariant.price.toLocaleString('vi-VN')} {selectedVariant.currency || 'VND'}
                                </p>
                            )}
                        </div>
                    )}

                    <p className="text-gray-600 mb-6 leading-relaxed">
                        {product.description.substring(0, 150)}...
                    </p>

                    <VariantOptionSelector
                        productId={product.id}
                        variants={variants}
                        selectedVariant={selectedVariant}
                        onVariantChange={handleVariantChange}
                    />

                    <div className="flex items-center gap-8 mb-6">
                        <h3 className="text-md font-semibold text-gray-700">Số lượng:</h3>
                        <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                                onClick={() => handleQuantityChange(-1)}
                                className="px-4 py-2 text-lg font-bold hover:bg-gray-100 rounded-l-lg transition-colors"
                                aria-label="Giảm số lượng"
                            >
                                -
                            </button>
                            <span className="px-5 py-2 text-lg font-semibold">{quantity}</span>
                            <button
                                onClick={() => handleQuantityChange(1)}
                                className="px-4 py-2 text-lg font-bold hover:bg-gray-100 rounded-r-lg transition-colors"
                                aria-label="Tăng số lượng"
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
                        <button onClick={handleWishlistClick} className="p-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors" title={isInWishlist(product.id) ? "Bỏ yêu thích" : "Thêm vào yêu thích"}>
                             <Heart className={`w-6 h-6 ${isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-500'}`} />
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
                        <TabButton 
                            id="description" 
                            label="Mô tả chi tiết" 
                            icon={<Info size={18} />}
                            isActive={activeTab === 'description'}
                            onClick={() => handleTabChange('description')}
                        />
                        <TabButton 
                            id="reviews" 
                            label="Đánh giá" 
                            icon={<Star size={18} />}
                            isActive={activeTab === 'reviews'}
                            onClick={() => handleTabChange('reviews')}
                        />
                    </nav>
                </div>
                <div className="bg-white p-6 rounded-b-lg">
                    {activeTab === 'description' && (
                        <div className="prose max-w-none text-gray-700">
                            <p>{product.description}</p>
                        </div>
                    )}
                    {activeTab === 'reviews' && <ProductReviews product={product} />}
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
