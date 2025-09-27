import React from 'react';
import { Link } from 'react-router-dom';
import { useComparison } from '../../contexts/ComparisonContext';
import { X, Star } from 'lucide-react';

const ComparisonPage: React.FC = () => {
  const { items, removeItem, clearCompare } = useComparison();

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4">Danh sách so sánh trống</h1>
        <p className="text-gray-600 mb-6">Hãy chọn một vài sản phẩm để bắt đầu so sánh.</p>
        <Link to="/products" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700">
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  // Tạo một danh sách tất cả các thuộc tính có thể so sánh
  const attributes = ['Giá', 'Điểm đánh giá', 'Số lượt đánh giá', 'Mô tả'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">So sánh sản phẩm ({items.length})</h1>
        <button onClick={clearCompare} className="text-sm font-semibold text-red-600 hover:underline">
          Xóa tất cả
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead>
            <tr>
              <th className="w-1/5 p-4 border-b font-semibold">Thuộc tính</th>
              {items.map(product => (
                <th key={product.id} className="w-1/5 p-4 border-b font-semibold text-center relative">
                  <button onClick={() => removeItem(product.id)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500">
                    <X size={18} />
                  </button>
                  <Link to={`/products/${product.slug}`}>
                    <img src={`https://placehold.co/150x200/EFEFEF/333333?text=${encodeURIComponent(product.name)}`} alt={product.name} className="w-24 h-32 object-cover rounded-md mx-auto mb-2" />
                    <p className="text-indigo-600 hover:underline">{product.name}</p>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attributes.map(attr => (
              <tr key={attr} className="hover:bg-gray-50">
                <td className="p-4 border-b font-medium text-gray-600">{attr}</td>
                {items.map(product => {
                  let value: React.ReactNode = '-';
                  const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];

                  switch (attr) {
                    case 'Giá':
                      value = defaultVariant ? `${defaultVariant.price.toLocaleString('vi-VN')} VND` : '-';
                      break;
                    case 'Điểm đánh giá':
                      value = (
                        <div className="flex items-center justify-center">
                          <Star className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" />
                          <span>{product.averageRating.toFixed(1)}</span>
                        </div>
                      );
                      break;
                    case 'Số lượt đánh giá':
                      value = `${product.reviewCount} lượt`;
                      break;
                    case 'Mô tả':
                      value = <p className="text-sm text-gray-600 line-clamp-4">{product.description}</p>;
                      break;
                  }
                  return (
                    <td key={product.id} className="p-4 border-b text-center align-top">{value}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonPage;
