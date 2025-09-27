import React, { useState, useEffect } from 'react';
import type { Product, ProductVariant } from '../../types/product';
import { useCart } from '../../contexts/CartContext';
import { useQuickView } from '../../contexts/QuickViewContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { Link } from 'react-router-dom';
import StockNotificationForm from '../../components/customer/StockNotificationForm';

const QuickViewModal: React.FC = () => {
  const { isModalOpen, productInView, closeModal } = useQuickView();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    if (productInView) {
      const defaultVariant = productInView.variants?.find((v) => v.isDefault) || productInView.variants?.[0];
      setSelectedVariant(defaultVariant);
      setQuantity(1); // Reset quantity when a new product is viewed
    }
  }, [productInView]);

  if (!isModalOpen || !productInView) {
    return null;
  }
  
  const handleVariantSelect = (variantId: number) => {
    const variant = productInView.variants?.find(v => v.id === variantId);
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const handleAddToCart = () => {
    if (productInView && selectedVariant) {
        addToCart(productInView, selectedVariant, quantity);
        setNotification('Đã thêm vào giỏ hàng!');
        setTimeout(() => {
            setNotification('');
            closeModal();
        }, 1500);
    }
  };
  
  const handleWishlistClick = () => {
    if (!productInView) return;
    if (isInWishlist(productInView.id)) {
        removeFromWishlist(productInView.id);
    } else {
        addToWishlist(productInView.id);
    }
  };

  const isOutOfStock = selectedVariant ? selectedVariant.stockQuantity <= 0 : true;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row">
        {/* Close Button */}
        <button onClick={closeModal} className="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow-lg z-20">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        {/* Product Image */}
        <div className="w-full md:w-1/2 p-4">
             <img src={`https://placehold.co/600x800/EFEFEF/333333?text=${encodeURIComponent(productInView.name)}`} alt={productInView.name} className="w-full h-full object-cover rounded-lg" />
        </div>

        {/* Product Details */}
        <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
             <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{productInView.name}</h2>
                 <button onClick={handleWishlistClick} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isInWishlist(productInView.id) ? 'text-red-500' : 'text-gray-400'}`} fill={isInWishlist(productInView.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
                </button>
             </div>
             
             {selectedVariant && (
                <p className="text-2xl font-semibold text-indigo-600 mb-4">
                    {selectedVariant.price.toLocaleString('vi-VN')} {selectedVariant.currency || 'VND'}
                </p>
             )}

             <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Lựa chọn phiên bản:</h3>
                <div className="flex flex-wrap gap-2">
                    {productInView.variants?.map(variant => (
                        <button key={variant.id} onClick={() => handleVariantSelect(variant.id)}
                            className={`px-3 py-1.5 border rounded-md text-sm transition-colors ${selectedVariant?.id === variant.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}`}>
                            {variant.name.replace(productInView.name + " - ", "")}
                        </button>
                    ))}
                </div>
             </div>
             
             <div className="mb-6 flex items-center gap-4">
                <h3 className="text-md font-semibold text-gray-700">Số lượng:</h3>
                 <div className="flex items-center border border-gray-300 rounded-md">
                    <button onClick={() => handleQuantityChange(-1)} className="px-3 py-1 hover:bg-gray-100">-</button>
                    <span className="px-4 py-1">{quantity}</span>
                    <button onClick={() => handleQuantityChange(1)} className="px-3 py-1 hover:bg-gray-100">+</button>
                </div>
            </div>

            <div className="mt-auto space-y-4">
                 <button onClick={handleAddToCart} disabled={isOutOfStock || !!notification}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400">
                    {notification || (isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng')}
                </button>
                 {isOutOfStock && selectedVariant && (
                    <StockNotificationForm variant={selectedVariant} />
                )}
                <Link to={`/products/${productInView.slug}`} onClick={closeModal} className="block w-full text-center text-indigo-600 font-semibold py-3 rounded-lg hover:bg-indigo-50 transition">
                    Xem chi tiết sản phẩm
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;

