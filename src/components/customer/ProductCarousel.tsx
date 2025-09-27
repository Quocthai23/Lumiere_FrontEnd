import React from 'react';
import type { Product } from '../../types/product';
import ProductCard from './ProductCard';

interface ProductCarouselProps {
  title: string;
  products: Product[];
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ title, products }) => {
  if (products.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      <div className="flex overflow-x-auto space-x-6 pb-4">
        {products.map(product => (
          <div key={product.id} className="flex-shrink-0 w-64">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductCarousel;
