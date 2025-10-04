import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Product } from '../../types/product';

const ProductManagementPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axiosClient.get('/products?sort=id,asc');
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);
  
  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không? Thao tác này không thể hoàn tác.')) {
        try {
            await axiosClient.delete(`/products/${productId}`);
            fetchProducts();
        } catch (error) {
            console.error("Lỗi khi xóa sản phẩm:", error);
            alert("Xóa sản phẩm thất bại. Vui lòng thử lại.");
        }
    }
  };

  if (isLoading) return <p>Đang tải danh sách sản phẩm...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Sản phẩm</h1>
        <Link to="/admin/products/new" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          + Thêm sản phẩm
        </Link>
      </div>
      
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
            <tr>
              <th scope="col" className="px-6 py-3">ID</th>
              <th scope="col" className="px-6 py-3">Tên sản phẩm</th>
              <th scope="col" className="px-6 py-3">Mã sản phẩm</th>
              <th scope="col" className="px-6 py-3">Trạng thái</th>
              <th scope="col" className="px-6 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{product.id}</td>
                <td className="px-6 py-4">{product.name}</td>
                <td className="px-6 py-4">{product.code}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    product.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link to={`/admin/products/edit/${product.id}`} className="font-medium text-indigo-600 hover:underline mr-4">
                    Chỉnh sửa
                  </Link>
                  <button onClick={() => handleDeleteProduct(product.id)} className="font-medium text-red-600 hover:underline">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductManagementPage;
