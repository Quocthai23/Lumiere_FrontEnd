import React, { useState, useEffect } from 'react';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  imagesMap?: { [key: string]: string } | null;
  buildImageUrl?: (filename: string) => string;
  selectedVariantId?: number;
  onImageClick?: (variantId: number | null) => void;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ 
  images, 
  productName,
  imagesMap,
  buildImageUrl,
  selectedVariantId,
  onImageClick
}) => {
  const defaultImage = `https://placehold.co/600x800/EFEFEF/333333?text=${encodeURIComponent(productName)}`;
  const [mainImage, setMainImage] = useState(images[0] || defaultImage);
  
  // Cập nhật mainImage khi images thay đổi
  useEffect(() => {
    if (images && images.length > 0) {
      setMainImage(images[0]);
    } else {
      setMainImage(defaultImage);
    }
  }, [images, defaultImage]);
  
  // Helper để lấy variantId từ image URL
  const getVariantIdFromImage = (imageUrl: string): number | null => {
    if (!imagesMap || !buildImageUrl) return null;
    
    // Tìm variantId tương ứng với imageUrl
    for (const [key, filename] of Object.entries(imagesMap)) {
      if (key !== "0" && buildImageUrl(filename) === imageUrl) {
        return Number(key);
      }
    }
    return null;
  };
  
  const handleThumbnailClick = (img: string) => {
    setMainImage(img);
    
    // Nếu có callback và imagesMap, gọi callback với variantId
    if (onImageClick && imagesMap) {
      const variantId = getVariantIdFromImage(img);
      onImageClick(variantId);
    }
  };
  
  console.log("ProductImageGallery - images:", images);
  console.log("ProductImageGallery - mainImage:", mainImage);
  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-3">
          {images.map((img, index) => {
            const variantId = getVariantIdFromImage(img);
            const isSelected = variantId !== null && variantId === selectedVariantId;
            
            return (
              <button
                key={index}
                onClick={() => handleThumbnailClick(img)}
                className={`w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                  mainImage === img || isSelected 
                    ? 'border-indigo-500 ring-2 ring-indigo-300' 
                    : 'border-transparent hover:border-gray-300'
                }`}
                title={variantId ? `Variant ${variantId}` : 'Product image'}
              >
                <img 
                  src={img} 
                  alt={`${productName} thumbnail ${index + 1}`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Error loading thumbnail image:", img);
                    (e.target as HTMLImageElement).src = defaultImage;
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
      {/* Main Image */}
      <div className="flex-1">
        <img
          src={mainImage}
          alt={productName}
          className="w-full h-full object-cover rounded-lg shadow-md"
          onError={(e) => {
            console.error("Error loading main image:", mainImage);
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
      </div>
    </div>
  );
};

export default ProductImageGallery;
