import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../contexts/WishlistContext';
import WishlistCard from '../../components/customer/WishlistCard';
import { Heart } from 'lucide-react';

const WishlistPage: React.FC = () => {
  const { wishlistItems, wishlistCount, removeFromWishlist } = useWishlist();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Danh sách Yêu thích</h1>
        <p className="mt-2 text-lg text-gray-500">Các sản phẩm bạn đã lưu lại ({wishlistCount})</p>
      </div>

      {wishlistItems.length > 0 ? (
        <div className="space-y-5">
          {wishlistItems.map(item => (
            <WishlistCard
              key={item.id}
              item={item}
              onRemove={removeFromWishlist}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <Heart className="mx-auto h-24 w-24 text-gray-300" />
          <h3 className="text-2xl font-semibold text-gray-700 mt-6">Danh sách trống</h3>
          <p className="text-gray-500 mt-2 mb-6">Lưu lại những sản phẩm bạn yêu thích để xem lại sau nhé.</p>
          <Link 
            to="/products" 
            className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-8 rounded-full hover:shadow-lg transition-all transform hover:scale-105"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
