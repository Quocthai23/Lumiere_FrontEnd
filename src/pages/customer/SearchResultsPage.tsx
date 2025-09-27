import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/customer/ProductCard';
import type { Product } from '../../types/product';
import axiosClient from '../../api/axiosClient';

const SearchResultsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('query');

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!query) {
            setProducts([]);
            setIsLoading(false);
            return;
        }

        const fetchSearchResults = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Thay đổi tham số từ 'name.contains' thành 'query' để kích hoạt logic tìm kiếm mới
                const response = await axiosClient.get(`/products`, {
                    params: { 'query': query }
                });
                setProducts(response.data);
            } catch (err) {
                setError('Không thể thực hiện tìm kiếm. Vui lòng thử lại sau.');
                console.error("Lỗi khi tìm kiếm:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSearchResults();
    }, [query]);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
                Kết quả tìm kiếm cho: <span className="text-indigo-600">"{query}"</span>
            </h1>

            {isLoading ? (
                <div className="text-center py-10">Đang tìm kiếm...</div>
            ) : error ? (
                <div className="text-center py-10 text-red-500">{error}</div>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">Không tìm thấy sản phẩm nào phù hợp.</div>
            )}
        </div>
    );
};

export default SearchResultsPage;
