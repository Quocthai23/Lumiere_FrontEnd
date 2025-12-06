import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { WishlistItem } from '../../types/wishlist';
import { useCart } from '../../contexts/CartContext';
import { ShoppingCart, Trash2 } from 'lucide-react';
import httpClient from '../../utils/HttpClient';
import { useAuth } from '../../hooks/useAuth';

interface WishlistCardProps {
  item: WishlistItem;
  onRemove: (variantId: number) => void | Promise<void>;
}

const WishlistCard: React.FC<WishlistCardProps> = ({ item, onRemove }) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const variant = item.variant;
  const product = item.product;

  const handleAddToCart = async () => {
    if (!product || !variant) return;
    
    setIsAddingToCart(true);
    try {
      // Gọi API để thêm vào giỏ hàng
      if (isAuthenticated()) {
        // Nếu đã đăng nhập, có thể gọi API backend
        // Hoặc chỉ dùng context như hiện tại
        await addToCart(product, variant, 1);
      } else {
        // Guest: chỉ dùng context/localStorage
        await addToCart(product, variant, 1);
      }
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      alert('Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      // Gọi API DELETE /wishlist?variantId={variantId}
      if (isAuthenticated()) {
        await httpClient.delete('/wishlist', {
          variantId: item.variantId
        });
      }
      
      // Gọi callback để cập nhật UI (context/localStorage)
      await onRemove(item.variantId);
    } catch (error) {
      console.error('Lỗi khi xóa khỏi wishlist:', error);
      alert('Không thể xóa sản phẩm khỏi danh sách yêu thích. Vui lòng thử lại.');
    } finally {
      setIsRemoving(false);
    }
  };

  const imageUrl = variant?.urlImage || 
                   product?.attachmentDTOS?.[0]?.url || 
                   `https://placehold.co/200x250/EFEFEF/333333?text=${encodeURIComponent(product.name)}`;

  return (
    <div className="flex items-start bg-white p-4 rounded-xl shadow-sm border hover:shadow-md transition-shadow duration-300">
      <Link to={`/products/${product?.slug || product?.id}`} className="flex-shrink-0">
        <img 
          src={imageUrl}
          alt={product?.name}
          className="w-24 h-32 object-cover rounded-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://placehold.co/200x250/EFEFEF/333333?text=${encodeURIComponent(product?.name || '')}`;
          }}
        />
      </Link>
      
      <div className="flex-grow ml-5">
        <Link to={`/products/${product?.slug || product?.id}`} className="hover:underline">
          <h2 className="font-bold text-lg text-gray-800">{product?.name}</h2>
        </Link>
        
        {variant && (
          <>
            <p className="text-sm text-gray-500 mt-1">
              {variant.name.replace((product?.name || '') + ' - ', '')}
            </p>
            <p className="text-indigo-600 font-semibold text-md my-3">
              {variant.price.toLocaleString('vi-VN')} {variant.currency || 'VND'}
            </p>
            {variant.stockQuantity !== undefined && (
              <p className={`text-xs mt-2 ${
                variant.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {variant.stockQuantity > 0 
                  ? `Còn ${variant.stockQuantity} sản phẩm` 
                  : 'Hết hàng'}
              </p>
            )}
          </>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleAddToCart}
            disabled={!variant || (variant.stockQuantity ?? 0) === 0 || isAddingToCart}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            <ShoppingCart size={16} />
            {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ'}
          </button>
          
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="p-2 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors text-gray-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Xóa khỏi danh sách yêu thích"
          >
            {isRemoving ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;

