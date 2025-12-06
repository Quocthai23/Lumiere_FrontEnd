import React, { useState, useEffect } from 'react';
import ProductCard from '../../components/customer/ProductCard';
import type { Product } from '../../types/product';
import ProductFilterSidebar from '../../components/customer/ProductFilterSidebar';
import httpClient from '../../utils/HttpClient.ts';

const ProductSkeleton: React.FC = () => (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white animate-pulse">
        <div className="w-full h-64 bg-gray-200"></div>
        <div className="p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
    </div>
);

type Filters = { [key: string]: string };

const ProductPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [sort, setSort] = useState('id,asc');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const productsPerPage = 9;
    const [filters, setFilters] = useState<Filters>({});

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const allParams: Record<string, any> = {
                    page: currentPage.toString(),
                    size: productsPerPage.toString(),
                    ...filters,
                };

                const data = await httpClient.get<any>('/products/search', allParams);
                let productsList = data.content || [];

                // Fetch variants cho các product chưa có variants
                const productsWithoutVariants = productsList.filter(
                    (p: Product) => !p.variants || p.variants.length === 0
                );
                
                if (productsWithoutVariants.length > 0) {
                    const productIds = productsWithoutVariants.map((p: Product) => p.id);
                    try {
                        const variantsRes = await httpClient.get<any[]>(
                            `/product-variants/by-product-ids?productIds=${productIds.join(',')}`
                        );
                        
                        // Gom variants theo productId
                        const variantsByProduct = (variantsRes || []).reduce<Record<number, any[]>>((acc, v) => {
                            if (!v?.product?.id) return acc;
                            (acc[v.product.id] ||= []).push(v);
                            return acc;
                        }, {});
                        
                        // Gán variants vào products
                        productsList = productsList.map((p: Product) => {
                            if (variantsByProduct[p.id]) {
                                return { ...p, variants: variantsByProduct[p.id] };
                            }
                            return p;
                        });
                    } catch (variantsErr) {
                        console.warn('Không thể tải variants:', variantsErr);
                        // Tiếp tục với products không có variants
                    }
                }

                setProducts(productsList);
                setTotalPages(data.totalPages);
            } catch (err) {
                setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
                console.error('Lỗi khi fetch sản phẩm:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [sort, filters, currentPage]);

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSort(e.target.value);
        setCurrentPage(0);
    };

    const handleApplyFilters = (newFilters: Filters) => {
        setFilters(newFilters);
        setCurrentPage(0);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: productsPerPage }).map((_, index) => (
                        <ProductSkeleton key={index} />
                    ))}
                </div>
            );
        }

        if (error) {
            return <div className="text-center py-10 text-red-500 col-span-full">{error}</div>;
        }

        if (products.length === 0) {
            return (
                <div className="text-center py-20 col-span-full bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-700">Không tìm thấy sản phẩm</h3>
                    <p className="text-gray-500 mt-2">Vui lòng thử lại với bộ lọc khác.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    <div className="lg:col-span-1">
                        <ProductFilterSidebar onApplyFilters={handleApplyFilters} />
                    </div>
                    <main className="lg:col-span-3">
                        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border">
                            <h2 className="text-xl font-semibold text-gray-800">Tất cả sản phẩm</h2>
                            <div>
                                <select
                                    id="sort"
                                    value={sort}
                                    onChange={handleSortChange}
                                    className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                >
                                    <option value="id,asc">Mới nhất</option>
                                    <option value="name,asc">Tên: A-Z</option>
                                    <option value="name,desc">Tên: Z-A</option>
                                </select>
                            </div>
                        </div>

                        {renderContent()}

                        {totalPages > 1 && (
                            <div className="mt-12 flex justify-center items-center space-x-2">
                                {Array.from({ length: totalPages }, (_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentPage(index)}
                                        className={`h-10 w-10 rounded-full text-sm font-semibold transition-colors ${
                                            currentPage === index
                                                ? 'bg-indigo-600 text-white shadow-md'
                                                : 'bg-white text-gray-700 hover:bg-indigo-100'
                                        }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
