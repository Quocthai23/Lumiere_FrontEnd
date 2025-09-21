import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Product, ProductVariant } from '../../types/product';
import VariantFormModal from '../../components/admin/VariantFormModal'; 

const AdminProductDetailPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for Variant Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);

    const fetchProductDetails = async () => {
        if (!productId) return;
        setIsLoading(true);
        try {
            const productResponse = await axiosClient.get(`/products/${productId}`);
            setProduct(productResponse.data);

            const variantsResponse = await axiosClient.get(`/product-variants?productId.equals=${productId}&sort=id,asc`);
            setVariants(variantsResponse.data);
            
            setError(null);
        } catch (err) {
            setError('Không thể tải thông tin chi tiết sản phẩm.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProductDetails();
    }, [productId]);

    const handleOpenModalForCreate = () => {
        setEditingVariant(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (variant: ProductVariant) => {
        setEditingVariant(variant);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVariant(null);
    };

    const handleSaveVariant = async (variantData: Omit<ProductVariant, 'id' | 'productId'> & { id?: number; productId?: number }) => {
        const payload = { ...variantData, product: { id: productId } };
        try {
            if (editingVariant && editingVariant.id) {
                await axiosClient.put(`/product-variants/${editingVariant.id}`, payload);
            } else {
                await axiosClient.post('/product-variants', payload);
            }
            handleCloseModal();
            fetchProductDetails();
        } catch (err) {
            console.error("Lỗi khi lưu phiên bản:", err);
            alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
        }
    };
    
    const handleDeleteVariant = async (variantId: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa phiên bản này?')) {
            try {
                await axiosClient.delete(`/product-variants/${variantId}`);
                fetchProductDetails();
            } catch (err) {
                console.error("Lỗi khi xóa phiên bản:", err);
                alert("Đã có lỗi xảy ra.");
            }
        }
    };


    if (isLoading) return <p>Đang tải...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!product) return <p>Không tìm thấy sản phẩm.</p>;

    return (
        <div>
            <Link to="/admin/products" className="text-indigo-600 hover:underline mb-4 inline-block">
                &larr; Quay lại danh sách sản phẩm
            </Link>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                <h1 className="text-2xl font-bold">{product.name}</h1>
                <p className="text-sm text-gray-500">Mã sản phẩm: {product.code}</p>
                <p className="mt-2 text-gray-700">{product.description}</p>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Các phiên bản sản phẩm</h2>
                <button onClick={handleOpenModalForCreate} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    + Thêm phiên bản
                </button>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                        <tr>
                            <th className="px-6 py-3">Tên phiên bản</th>
                            <th className="px-6 py-3">SKU</th>
                            <th className="px-6 py-3">Giá (VND)</th>
                            <th className="px-6 py-3">Tồn kho</th>
                            <th className="px-6 py-3">Mặc định</th>
                            <th className="px-6 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {variants.map(variant => (
                            <tr key={variant.id} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{variant.name.replace(product.name + ' - ', '')}</td>
                                <td className="px-6 py-4">{variant.sku}</td>
                                <td className="px-6 py-4">{variant.price.toLocaleString('vi-VN')}</td>
                                <td className="px-6 py-4">{variant.stockQuantity}</td>
                                <td className="px-6 py-4">{variant.isDefault ? '✔️' : ''}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleOpenModalForEdit(variant)} className="font-medium text-indigo-600 hover:underline mr-4">Sửa</button>
                                    <button onClick={() => handleDeleteVariant(variant.id)} className="font-medium text-red-600 hover:underline">Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {variants.length === 0 && (
                    <p className="p-4 text-center text-gray-500">Sản phẩm này chưa có phiên bản nào.</p>
                )}
            </div>

            <VariantFormModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={handleSaveVariant}
                variant={editingVariant}
                productName={product.name}
            />
        </div>
    );
};

export default AdminProductDetailPage;