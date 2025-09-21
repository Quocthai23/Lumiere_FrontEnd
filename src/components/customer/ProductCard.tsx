import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types/product';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const imageUrl = `https://placehold.co/300x400/EFEFEF/333333?text=${encodeURIComponent(product.name)}`;
  
  // Lấy giá từ biến thể mặc định (nếu có)
  const defaultVariant = product.variants?.find(v => v.isDefault);
  const price = defaultVariant ? defaultVariant.price : 0;
  const currency = defaultVariant ? defaultVariant.currency : 'VND';

  return (
    <div className="group relative border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white">
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
          <p className="mt-2 text-lg font-bold text-indigo-600">
            {price.toLocaleString('vi-VN')} {currency}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;

