import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Collection } from '../../types/collection';
import type { Product } from '../../types/product';
import { ChevronLeft, Image as ImageIcon, Save } from 'lucide-react';

const AdminCollectionEditPage: React.FC = () => {
    const { collectionId } = useParams<{ collectionId: string }>();
    const navigate = useNavigate();
    const isCreating = !collectionId;

    const [collection, setCollection] = useState<Partial<Collection>>({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        look: { lookImageUrl: '', productIds: [] }
    });
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productsPromise = axiosClient.get('/products');
                if (!isCreating) {
                    const collectionPromise = axiosClient.get(`/collections/${collectionId}`);
                    const [productsRes, collectionRes] = await Promise.all([productsPromise, collectionPromise]);
                    setAllProducts(productsRes.data || []);
                    setCollection(collectionRes.data || {});
                } else {
                    const productsRes = await productsPromise;
                    setAllProducts(productsRes.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [collectionId, isCreating]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCollection(prev => ({ ...prev, [name]: value }));
    };
    
    const handleLookInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCollection(prev => ({
            ...prev,
            look: { ...prev.look!, [name]: value }
        }));
    };
    
    const handleProductSelect = (productId: number) => {
        setCollection(prev => {
            const currentIds = prev.look?.productIds || [];
            const newIds = currentIds.includes(productId)
                ? currentIds.filter(id => id !== productId)
                : [...currentIds, productId];
            return { ...prev, look: { ...prev.look!, productIds: newIds } };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Mock save logic
        console.log("Saving collection:", collection);
        alert('Lưu thành công (giả lập)!');
        navigate('/admin/collections');
    };

    if (isLoading) return <p>Đang tải...</p>;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <Link to="/admin/collections" className="p-2 rounded-md hover:bg-gray-100">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">
                    {isCreating ? 'Tạo Bộ sưu tập mới' : 'Chỉnh sửa Bộ sưu tập'}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                         <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
                         <div className="space-y-4">
                             <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên Bộ sưu tập</label>
                                <input type="text" name="name" id="name" value={collection.name} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md" required />
                             </div>
                             <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả</label>
                                <textarea name="description" id="description" value={collection.description} onChange={handleInputChange} rows={4} className="mt-1 w-full p-2 border rounded-md" />
                             </div>
                         </div>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow-sm border">
                         <h2 className="text-lg font-semibold mb-4">Shop The Look</h2>
                         <div className="space-y-4">
                             <div>
                                <label htmlFor="lookImageUrl" className="block text-sm font-medium text-gray-700">URL Hình ảnh "Look"</label>
                                <input type="text" name="lookImageUrl" id="lookImageUrl" value={collection.look?.lookImageUrl} onChange={handleLookInputChange} className="mt-1 w-full p-2 border rounded-md" />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-2">Chọn sản phẩm cho "Look"</label>
                                 <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
                                     {allProducts.map(product => (
                                         <label key={product.id} className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                                             <input
                                                type="checkbox"
                                                checked={collection.look?.productIds?.includes(product.id) || false}
                                                onChange={() => handleProductSelect(product.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-3 text-sm text-gray-700">{product.name}</span>
                                         </label>
                                     ))}
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
                {/* Sidebar */}
                <div className="space-y-6">
                     <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Ảnh bìa</h2>
                         <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">URL Ảnh bìa</label>
                            <input type="text" name="imageUrl" id="imageUrl" value={collection.imageUrl} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md" />
                         </div>
                         <div className="mt-4 aspect-video rounded-md border-2 border-dashed bg-gray-50 flex items-center justify-center">
                             {collection.imageUrl ? (
                                <img src={collection.imageUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                             ) : (
                                <div className="text-center text-gray-400">
                                    <ImageIcon className="mx-auto h-12 w-12" />
                                    <p className="mt-2 text-sm">Xem trước ảnh bìa</p>
                                </div>
                             )}
                         </div>
                    </div>
                     <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <button type="submit" className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            <Save size={18} />
                            Lưu Bộ sưu tập
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default AdminCollectionEditPage;
