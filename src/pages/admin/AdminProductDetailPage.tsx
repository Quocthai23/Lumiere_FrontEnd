import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Product, ProductVariant } from '../../types/product';
import VariantFormModal from '../../components/admin/VariantFormModal'; 
import { Upload, X, PlusCircle } from 'lucide-react';

// --- Reusable UI Components ---
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 border-b ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <h3 className={`font-semibold text-lg ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 ${className}`}>{children}</div>
);

// --- Main Component ---
const AdminProductDetailPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const isCreating = !productId;

    const [product, setProduct] = useState<Partial<Product>>({
        name: '',
        description: '',
        code: '',
        slug: '',
        status: 'ACTIVE',
        category: 'Áo Thun',
        material: 'Cotton',
        images: [],
    });
    const [variants, setVariants] = useState<Partial<ProductVariant>[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState<Partial<ProductVariant> | null>(null);
    const [newImageUrl, setNewImageUrl] = useState('');

    useEffect(() => {
        if (!isCreating) {
            fetchProductDetails();
        }
    }, [productId]);

    const fetchProductDetails = async () => {
        setIsLoading(true);
        try {
            const [productResponse, variantsResponse] = await Promise.all([
                 axiosClient.get(`/products/${productId}`),
                 axiosClient.get(`/product-variants?productId.equals=${productId}&sort=id,asc`)
            ]);
            setProduct(productResponse.data);
            setVariants(variantsResponse.data);
            setError(null);
        } catch (err) {
            setError('Không thể tải thông tin chi tiết sản phẩm.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleAddImage = () => {
        if (newImageUrl && !product.images?.includes(newImageUrl)) {
            setProduct(prev => ({
                ...prev,
                images: [...(prev.images || []), newImageUrl]
            }));
            setNewImageUrl('');
        }
    };
    
    const handleRemoveImage = (urlToRemove: string) => {
        setProduct(prev => ({
            ...prev,
            images: prev.images?.filter(url => url !== urlToRemove)
        }));
    };
    
    const handleSaveProduct = async () => {
        // Validation could be added here
        try {
            setIsLoading(true);
            const productPayload = { ...product };
            let savedProduct;
            if (isCreating) {
                const response = await axiosClient.post('/products', productPayload);
                savedProduct = response.data;
            } else {
                const response = await axiosClient.put(`/products/${productId}`, productPayload);
                savedProduct = response.data;
            }

            // Save variants
            for (const variant of variants) {
                const variantPayload = { ...variant, product: { id: savedProduct.id } };
                if (variant.id) {
                    await axiosClient.put(`/product-variants/${variant.id}`, variantPayload);
                } else {
                    await axiosClient.post('/product-variants', variantPayload);
                }
            }
            alert('Lưu sản phẩm thành công!');
            navigate('/admin/products');

        } catch (err) {
            console.error("Lỗi khi lưu sản phẩm:", err);
            setError("Đã có lỗi xảy ra khi lưu sản phẩm.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Variant Modal Handlers ---
    const handleOpenModalForCreate = () => {
        setEditingVariant(null);
        setIsModalOpen(true);
    };
    const handleOpenModalForEdit = (variant: Partial<ProductVariant>) => {
        setEditingVariant(variant);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveVariant = (variantData: Omit<ProductVariant, 'id' | 'productId'> & { id?: number }) => {
        if (editingVariant) { // Editing existing variant
            setVariants(variants.map(v => v.sku === editingVariant.sku ? { ...v, ...variantData } : v));
        } else { // Adding new variant
             setVariants([...variants, { ...variantData, id: -Date.now() }]); // Use negative temp ID
        }
        handleCloseModal();
    };
    
    const handleDeleteVariant = (variantToDelete: Partial<ProductVariant>) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa phiên bản này?')) {
            setVariants(variants.filter(v => v.sku !== variantToDelete.sku));
        }
    };

    if (isLoading && !isCreating) return <p>Đang tải...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Link to="/admin/products" className="text-indigo-600 hover:underline mb-4 inline-block">&larr; Quay lại danh sách</Link>
                    <h1 className="text-2xl font-bold">{isCreating ? 'Tạo sản phẩm mới' : 'Chỉnh sửa sản phẩm'}</h1>
                </div>
                <button onClick={handleSaveProduct} disabled={isLoading} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                    {isLoading ? 'Đang lưu...' : 'Lưu sản phẩm'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Thông tin chi tiết</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                                <input type="text" name="name" value={product.name} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                                <textarea name="description" value={product.description} onChange={handleInputChange} rows={6} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Hình ảnh</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {product.images?.map(url => (
                                    <div key={url} className="relative group">
                                        <img src={url} alt="Product" className="w-full h-32 object-cover rounded-md" />
                                        <button onClick={() => handleRemoveImage(url)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                             <div className="mt-4 flex gap-2">
                                <input type="text" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="Dán URL hình ảnh..." className="flex-grow border border-gray-300 rounded-md shadow-sm p-2"/>
                                <button onClick={handleAddImage} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Thêm</button>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Biến thể sản phẩm</CardTitle>
                                <button onClick={handleOpenModalForCreate} className="flex items-center gap-1 text-sm text-indigo-600 font-semibold"><PlusCircle size={16}/> Thêm biến thể</button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <table className="min-w-full text-sm">
                                <thead><tr><th className="text-left p-2">SKU</th><th className="text-left p-2">Tên</th><th className="text-left p-2">Giá</th><th className="text-left p-2">Tồn kho</th><th></th></tr></thead>
                                <tbody>
                                    {variants.map(v => (
                                        <tr key={v.sku} className="border-t">
                                            <td className="p-2 font-mono">{v.sku}</td>
                                            <td className="p-2">{v.name?.replace(product.name + ' - ', '')}</td>
                                            <td className="p-2">{v.price?.toLocaleString('vi-VN')} ₫</td>
                                            <td className="p-2">{v.stockQuantity}</td>
                                            <td className="p-2 text-right">
                                                <button onClick={() => handleOpenModalForEdit(v)} className="font-medium text-indigo-600 hover:underline mr-2">Sửa</button>
                                                <button onClick={() => handleDeleteVariant(v)} className="font-medium text-red-600 hover:underline">Xóa</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {variants.length === 0 && <p className="text-center text-gray-500 py-4">Chưa có biến thể nào.</p>}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                     <Card>
                        <CardHeader><CardTitle>Trạng thái</CardTitle></CardHeader>
                        <CardContent>
                             <select name="status" value={product.status} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                <option value="ACTIVE">Đang bán</option>
                                <option value="INACTIVE">Ngừng bán</option>
                                <option value="DRAFT">Bản nháp</option>
                            </select>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Phân loại</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                                <input type="text" name="category" value={product.category} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Chất liệu</label>
                                <input type="text" name="material" value={product.material} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <VariantFormModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={handleSaveVariant}
                variant={editingVariant as ProductVariant | null}
                productName={product.name || 'Sản phẩm mới'}
            />
        </div>
    );
};

export default AdminProductDetailPage;
