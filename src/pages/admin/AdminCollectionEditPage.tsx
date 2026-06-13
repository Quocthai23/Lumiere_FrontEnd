import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { Product } from '../../types/product';
import { ChevronLeft, Image as ImageIcon, Save } from 'lucide-react';
import httpClient from "../../utils/HttpClient.ts";
import type { AttachmentDTO } from "../../types/types.ts";
import type { Collection } from "../../types/collection.ts";

/** ================= Chunk Upload Config + Helper ================= */
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB/part

/**
 * Upload qua 2 API:
 *  - POST /chunk-upload/chunk  (headers: Upload-Id, Chunk-Index)
 *  - POST /chunk-upload/complete (x-www-form-urlencoded; trả về { url })
 */
async function uploadChunksWithTwoApis(
    file: File,
    uploadId: string,
    onProgress: (pct: number) => void
): Promise<AttachmentDTO> {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadedBytes = 0;

    for (let index = 0; index < totalChunks; index++) {
        const start = index * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const blob = file.slice(start, end);

        const form = new FormData();
        form.append('file', blob, `${file.name}.part${index}`);

        await httpClient.post<string>('/chunk-upload/chunk', form, {
            'Upload-Id': uploadId,
            'Chunk-Index': String(index),
        });

        uploadedBytes = end;
        const pct = Math.floor((uploadedBytes / file.size) * 100);
        onProgress(Math.min(99, pct));
    }

    const completeForm = new URLSearchParams();
    completeForm.set('uploadId', uploadId);
    completeForm.set('totalChunks', String(totalChunks));
    completeForm.set('fileName', file.name);

    const dto = await httpClient.post<AttachmentDTO>(
        '/chunk-upload/complete',
        completeForm,
        { 'Content-Type': 'application/x-www-form-urlencoded' }
    );

    onProgress(100);
    return dto;
}

function genUploadId() {
    return 'up_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** ================= Page ================= */
const AdminCollectionEditPage: React.FC = () => {
    const { collectionId } = useParams<{ collectionId: string }>();
    const navigate = useNavigate();
    const isCreating = !collectionId;

    // Local model (không còn productIds gửi BE; chỉ dùng cho UI)
    const [collection, setCollection] = useState<{
        name?: string;
        slug?: string;
        description?: string;
        imageUrl?: string;
    }>({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
    });

    // IDs được chọn trong UI
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Upload UI state
    const [uploading, setUploading] = useState(false);
    const [uploadPct, setUploadPct] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productsPromise = httpClient.get<Product[]>('/products');

                if (!isCreating) {
                    const collectionPromise = httpClient.get<Collection & any>(`/collections/${collectionId}`);
                    const [productsRes, collectionRes] = await Promise.all([productsPromise, collectionPromise]);
                    setAllProducts(productsRes || []);

                    const c = collectionRes || {};
                    setCollection({
                        name: c.name || '',
                        slug: c.slug || '',
                        description: c.description || '',
                        imageUrl: c.imageUrl || '',
                    });

                    // Hỗ trợ cả 2 kiểu payload BE có thể trả:
                    // - c.productIds: number[]
                    // - c.products: Array<{id: number, ...}>
                    let ids: number[] = [];
                    if (Array.isArray(c.productIds)) {
                        ids = c.productIds.filter((x: any) => typeof x === 'number');
                    } else if (Array.isArray(c.products)) {
                        ids = c.products
                            .map((p: any) => p?.id)
                            .filter((x: any) => typeof x === 'number');
                    }
                    setSelectedProductIds(ids);
                } else {
                    const productsRes = await productsPromise;
                    setAllProducts(productsRes || []);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
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

    const toggleSelectProduct = (productId: number) => {
        setSelectedProductIds(prev => {
            const exists = prev.includes(productId);
            return exists ? prev.filter(id => id !== productId) : [...prev, productId];
        });
    };

    async function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        // Reset để lần sau chọn cùng file vẫn trigger
        e.target.value = '';
        if (!file) return;

        try {
            setUploading(true);
            setUploadPct(0);
            const uploadId = genUploadId();
            const dto = await uploadChunksWithTwoApis(file, uploadId, pct => setUploadPct(pct));
            if (!dto?.url) throw new Error('Server không trả về url');
            setCollection(prev => ({ ...prev, imageUrl: dto.url }));
        } catch (err) {
            console.error(err);
            alert('Upload ảnh thất bại.');
        } finally {
            setUploading(false);
            setUploadPct(0);
        }
    }

    function clearCoverImage() {
        setCollection(prev => ({ ...prev, imageUrl: '' }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const productsPayload = (selectedProductIds || []).map(id => ({ id }));

            const payload: any = {
                id: collectionId ? Number(collectionId) : undefined,
                name: collection.name?.trim(),
                slug: collection.slug?.trim(),
                description: collection.description?.trim(),
                imageUrl: collection.imageUrl || null,
                products: productsPayload,
            };

            if (isCreating) {
                await httpClient.post('/collections', payload);
            } else {
                await httpClient.put(`/collections/${collectionId}`, payload);
            }

            navigate('/admin/collections');
        } catch (err) {
            console.error(err);
        }
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
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={collection.name || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 w-full p-2 border rounded-md"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
                                <input
                                    type="text"
                                    name="slug"
                                    id="slug"
                                    value={collection.slug || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 w-full p-2 border rounded-md"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Mô tả</label>
                                <textarea
                                    name="description"
                                    id="description"
                                    value={collection.description || ''}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="mt-1 w-full p-2 border rounded-md"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Products pick for Collection */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Chọn sản phẩm cho Bộ sưu tập</h2>
                        <div className="max-h-72 overflow-y-auto border rounded-md p-2 space-y-2">
                            {allProducts.map(product => (
                                <label key={product.id} className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedProductIds.includes(product.id)}
                                        onChange={() => toggleSelectProduct(product.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="ml-3 text-sm text-gray-700">{product.name}</span>
                                </label>
                            ))}
                            {allProducts.length === 0 && (
                                <p className="text-sm text-gray-500">Không có sản phẩm.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Cover Image with Chunk Upload */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Ảnh bìa</h2>

                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="coverInput"
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-md text-sm cursor-pointer inline-flex"
                            >
                                Tải ảnh (Chunk Upload)
                            </label>
                            {collection.imageUrl && (
                                <button
                                    type="button"
                                    onClick={clearCoverImage}
                                    className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md text-sm text-red-700"
                                >
                                    Gỡ ảnh
                                </button>
                            )}
                        </div>

                        <input
                            id="coverInput"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handlePickFile}
                            multiple={false}
                        />

                        {uploading && (
                            <div className="mt-3 w-full h-2 bg-gray-200 rounded">
                                <div
                                    className="h-2 bg-emerald-500 rounded transition-all"
                                    style={{ width: `${uploadPct}%` }}
                                />
                            </div>
                        )}

                        <div className="mt-4 aspect-video rounded-md border-2 border-dashed bg-gray-50 flex items-center justify-center">
                            {collection.imageUrl ? (
                                <img src={collection.imageUrl} alt="Preview image" className="max-h-full max-w-full object-contain" />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <ImageIcon className="mx-auto h-12 w-12" />
                                    <p className="mt-2 text-sm">Xem trước ảnh bìa</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <button
                            type="submit"
                            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                            disabled={uploading}
                        >
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
