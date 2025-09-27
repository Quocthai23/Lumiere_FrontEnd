import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types/product';
import { useWishlist } from '../../contexts/WishlistContext';
import { useQuickView } from '../../contexts/QuickViewContext';
import { useComparison } from '../../contexts/ComparisonContext'; // Import
import StarRating from '../../pages/customer/StarRating';
import { Eye, Plus, Check } from 'lucide-react'; // Import icons

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { openModal } = useQuickView();
  const { isInCompare, addItem, removeItem } = useComparison(); // Get comparison functions

  const imageUrl = `https://placehold.co/300x400/EFEFEF/333333?text=${encodeURIComponent(product.name)}`;
  
  const defaultVariant = product.variants?.find(v => v.isDefault);
  const price = defaultVariant ? defaultVariant.price : 0;
  const currency = defaultVariant ? defaultVariant.currency : 'VND';

  const isLiked = isInWishlist(product.id);
  const isComparing = isInCompare(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiked) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openModal(product);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
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
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button onClick={handleWishlistClick} className="p-2 bg-white/70 rounded-full hover:bg-white transition-colors" title="Thêm vào danh sách yêu thích">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isLiked ? 'text-red-500' : 'text-gray-400'}`} fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
        </button>
        <button onClick={handleCompareClick} className="p-2 bg-white/70 rounded-full hover:bg-white transition-colors" title={isComparing ? 'Bỏ so sánh' : 'So sánh sản phẩm'}>
           {isComparing ? <Check size={22} className="text-green-500" /> : <Plus size={22} className="text-gray-500" />}
        </button>
      </div>

        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center z-0">
            <button onClick={handleQuickViewClick} className="flex items-center gap-2 py-2 px-4 bg-white text-gray-800 font-semibold rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                <Eye size={18} />
                Xem nhanh
            </button>
        </div>

      <Link to={`/products/${product.slug}`} className="block">
        <div className="w-full h-64 bg-gray-200 overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <h3 className="text-gray-800 font-semibold text-md truncate" title={product.name}>
              {product.name}
          </h3>
           <div className="mt-2 flex items-center">
            {product.reviewCount > 0 ? (
                <>
                    <StarRating rating={product.averageRating} />
                    <span className="text-xs text-gray-500 ml-2">({product.reviewCount} đánh giá)</span>
                </>
            ) : (
                <span className="text-xs text-gray-400">Chưa có đánh giá</span>
            )}
           </div>
          <p className="mt-2 text-lg font-bold text-indigo-600">
            {price.toLocaleString('vi-VN')} {currency}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
