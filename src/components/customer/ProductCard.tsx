import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';
import { useQuickView } from '../../contexts/QuickViewContext';
import { useComparison } from '../../contexts/ComparisonContext';
import StarRating from '../../pages/customer/StarRating';
import { Eye, Plus, Check } from 'lucide-react';

interface ProductCardProps {
  product: any;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { openModal } = useQuickView();
  const { isInCompare, addItem, removeItem } = useComparison();

  // Tính range giá từ variants hoặc product
  const getPriceRange = () => {
    const variants = product?.variants || [];
    
    if (variants.length > 0) {
      // Lấy giá từ variants
      const prices = variants
        .map((v: any) => v?.price)
        .filter((price: number) => price != null && price > 0);
      
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const currency = variants[0]?.currency || 'VND';
        
        if (minPrice === maxPrice) {
          return { min: minPrice, max: maxPrice, currency, isRange: false };
        }
        return { min: minPrice, max: maxPrice, currency, isRange: true };
      }
    }
    
    // Nếu không có variants, lấy từ product (nếu có)
    const productPrice = product?.price;
    if (productPrice != null && productPrice > 0) {
      return { 
        min: productPrice, 
        max: productPrice, 
        currency: product?.currency || 'VND', 
        isRange: false 
      };
    }
    
    return { min: 0, max: 0, currency: 'VND', isRange: false };
  };

  const priceRange = getPriceRange();
  const defaultVariant = product?.variants?.find((v: any) => v?.isDefault);

  // attachments: lấy ảnh chính từ productAttachments[].attachment.url
  const attachments: any[] | undefined = product?.productAttachments;
  const primaryAttachment =
      attachments?.find(a => a?.sortOrder != null) ?? attachments?.[0];


  const imageUrl =
      primaryAttachment?.attachment?.url ||
      product?.images || // nếu backend có field images sẵn thì xài luôn
      `https://placehold.co/300x400/EFEFEF/333333?text=${encodeURIComponent(product?.name ?? '')}`;


  const variantId = defaultVariant?.id;
  const isLiked = variantId ? isInWishlist(variantId) : false;
  const isComparing = isInCompare(product.id);

  const handleWishlistClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!variantId) return;
    if (isLiked) {
      removeFromWishlist(variantId);
    } else {
      addToWishlist(variantId, product, defaultVariant);
    }
  };

  const handleQuickViewClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    openModal(product);
  };

  const handleCompareClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isComparing) {
      removeItem(product.id);
    } else {
      addItem(product);
    }
  };

  return (
      <div className="group relative border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white">
        {/* Nút wishlist + compare */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <button
              onClick={handleWishlistClick}
              className="p-2 bg-white/70 rounded-full hover:bg-white transition-colors"
              title={isLiked ? 'Bỏ khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
          >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-6 w-6 ${isLiked ? 'text-red-500' : 'text-gray-400'}`}
                fill={isLiked ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
              <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
              />
            </svg>
          </button>
          <button
              onClick={handleCompareClick}
              className="p-2 bg-white/70 rounded-full hover:bg-white transition-colors"
              title={isComparing ? 'Bỏ so sánh' : 'So sánh sản phẩm'}
          >
            {isComparing ? (
                <Check size={22} className="text-green-500" />
            ) : (
                <Plus size={22} className="text-gray-500" />
            )}
          </button>
        </div>

        {/* Layer Quick View */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center z-0">
          <button
              onClick={handleQuickViewClick}
              className="flex items-center gap-2 py-2 px-4 bg-white text-gray-800 font-semibold rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
          >
            <Eye size={18} />
            Xem nhanh
          </button>
        </div>

        <Link to={`/products/${product.id}`} className="block">
          <div className="w-full h-64 bg-gray-200 overflow-hidden">
            <img
                src={imageUrl}
                alt={product?.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="p-4">
            <h3
                className="text-gray-800 font-semibold text-md truncate"
                title={product?.name}
            >
              {product?.name}
            </h3>

            <div className="mt-2 flex items-center">
              {product?.reviewCount > 0 ? (
                  <>
                    <StarRating rating={product?.averageRating} />
                    <span className="text-xs text-gray-500 ml-2">
                  ({product?.reviewCount} đánh giá)
                </span>
                  </>
              ) : (
                  <span className="text-xs text-gray-400">Chưa có đánh giá</span>
              )}
            </div>

            <p className="mt-2 text-lg font-bold text-indigo-600">
              {priceRange.isRange ? (
                <>
                  {priceRange.min.toLocaleString('vi-VN')} - {priceRange.max.toLocaleString('vi-VN')} {priceRange.currency}
                </>
              ) : (
                <>
                  {priceRange.min.toLocaleString('vi-VN')} {priceRange.currency}
                </>
              )}
            </p>
          </div>
        </Link>
      </div>
  );
};

export default ProductCard;
