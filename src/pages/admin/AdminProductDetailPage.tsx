import React, {useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import type {Product, ProductVariant} from '../../types/product';
import VariantFormModal from '../../components/admin/VariantFormModal';
import {PlusCircle} from 'lucide-react';
import ChunkUploadGallery from "../../components/admin/ChunkUploadGallery.tsx";
import httpClient from "../../utils/HttpClient.ts";
import type {Category} from "../../types/category.ts";

// NEW: Option builder & manager
import OptionGroupManager from '../../components/admin/OptionGroupManager';
import VariantBuilderModal from '../../components/admin/VariantBuilderModal';
import VariantEditModal from "../../components/admin/VariantEditModal.tsx";

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

    const [categories, setCategories] = useState<Category[]>([]);

    // Builder state
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);

    // VariantRow: thêm optionSelectIds để map OptionVariant sau khi tạo variant
    type VariantRow = Partial<ProductVariant> & { optionSelectIds?: number[] };
    const [variants, setVariants] = useState<VariantRow[]>([]);

    const [product, setProduct] = useState<Partial<Product>>({
        name: '',
        description: '',
        code: '',
        slug: '',
        status: 'ACTIVE',
        categoryId: undefined,
        material: 'Cotton',
        attachmentDTOS: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState<Partial<ProductVariant> | null>(null);

    useEffect(() => {
        if (!isCreating) {
            fetchProductDetails();
        }
    }, [productId]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await httpClient.get<Category[]>('/categories?size=1000&sort=id,asc');
            setCategories(res);
        } catch (e) {
            console.error('Không tải được danh mục', e);
        }
    };

    const fetchProductDetails = async () => {
        setIsLoading(true);
        try {
            const [productResponse, variantsResponse] = await Promise.all([
                httpClient.get<Product>(`/products/${productId}`),
                httpClient.get<ProductVariant[]>(`/product-variants?productId.equals=${productId}&sort=id,asc`)
            ]);

            const p = productResponse as Product;

            setProduct(prev => ({
                ...prev,
                ...p,
                categoryId: (p as any).categoryId ?? (p as any).category?.id,
            }));

            // Cast sang VariantRow, KHÔNG có optionSelectIds từ API lúc load danh sách
            setVariants((variantsResponse || []) as VariantRow[]);

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

    // Merge các variant sinh từ builder (kèm optionSelectIds). Nếu trùng SKU thì cập nhật.
    const mergeGeneratedVariants = (
        news: Array<Omit<ProductVariant,'id'|'productId'> & { id?: number; productId?: number; optionSelectIds: number[] }>
    ) => {
        setVariants(prev => {
            const map = new Map<string, VariantRow>();
            prev.forEach(v => { if (v.sku) map.set(v.sku, v); });
            news.forEach(nv => {
                const exist = nv.sku ? map.get(nv.sku) : undefined;
                if (exist) {
                    map.set(nv.sku!, { ...exist, ...nv, optionSelectIds: nv.optionSelectIds });
                } else {
                    map.set(nv.sku!, { ...nv, id: -Date.now() + Math.random(), optionSelectIds: nv.optionSelectIds });
                }
            });
            return Array.from(map.values());
        });
    };

    const handleSaveProduct = async () => {
        try {
            setIsLoading(true);
            const productPayload = { ...product };
            let savedProduct: Product;

            if (isCreating) {
                savedProduct = await httpClient.post<Product>('/products', productPayload);
            } else {
                savedProduct = await httpClient.put<Product>(`/products/${productId}`, productPayload);
            }

            // Save variants và gán OptionVariant nếu có optionSelectIds
            for (const v of variants) {
                const variantPayload = { ...v, product: { id: savedProduct.id } };
                let savedVariant: any;

                if (v.id && Number(v.id) > 0) {
                    savedVariant = await httpClient.put(`/product-variants/${v.id}`, variantPayload);
                } else {
                    savedVariant = await httpClient.post('/product-variants', variantPayload);
                }

                if (Array.isArray(v.optionSelectIds) && v.optionSelectIds.length > 0) {
                    await httpClient.post('/option-variants/assign', {
                        variantId: savedVariant.id,
                        selectIds: v.optionSelectIds,
                    });
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

    const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

    async function handleSetDefaultVariant(variantId: number) {
        if (!product?.id) return;
        const target = variants.find(v => v.id === variantId);
        if (!target) return;
        if (target.isDefault) return;

        // Lưu snapshot để rollback nếu lỗi
        const prev = variants;

        // Optimistic update: set duy nhất variantId = true, còn lại = false
        setVariants(curr =>
            curr.map(v => ({ ...v, isDefault: v.id === variantId }))
        );

        try {
            setSettingDefaultId(variantId);
            await httpClient.put(`/product-variants/${product.id}/default/${variantId}`);
        } catch (e) {
            // rollback UI khi lỗi
            setVariants(prev);
            // tuỳ hệ thống toast:
            console.error(e);
            // showToastError('Cập nhật mặc định thất bại');
        } finally {
            setSettingDefaultId(null);
        }
    }

    // --- Variant Modal Handlers (thêm/sửa thủ công 1 variant) ---
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
        if (editingVariant) {
            setVariants(variants.map(v => v.sku === editingVariant.sku ? { ...v, ...variantData } : v));
        } else {
            setVariants([...variants, { ...variantData, id: -Date.now() }]); // temp id âm
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
                <button
                    onClick={handleSaveProduct}
                    disabled={isLoading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                >
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
                                <input
                                    type="text"
                                    name="name"
                                    value={product.name}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                                <textarea
                                    name="description"
                                    value={product.description}
                                    onChange={handleInputChange}
                                    rows={6}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Hình ảnh</CardTitle></CardHeader>
                        <CardContent>
                            <Card>
                                <CardHeader><CardTitle>Hình ảnh</CardTitle></CardHeader>
                                <CardContent>
                                    <ChunkUploadGallery
                                        existingAttachments={product.attachmentDTOS || []}
                                        onAddAttachments={(atts) =>
                                            setProduct(p => ({ ...p, attachmentDTOS: [ ...(p.attachmentDTOS || []), ...atts ] }))
                                        }
                                        onSetAttachments={(atts) =>
                                            setProduct(p => ({ ...p, attachmentDTOS: atts }))
                                        }
                                        onRemoveAttachment={(att) =>
                                            setProduct(p => ({
                                                ...p,
                                                attachmentDTOS: p.attachmentDTOS?.filter(a => (a.id ?? a.url) !== (att.id ?? att.url))
                                            }))
                                        }
                                    />
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Biến thể sản phẩm</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <table className="min-w-full text-sm">
                                <thead>
                                <tr>
                                    <th className="text-left p-2">SKU</th>
                                    <th className="text-left p-2">Tên</th>
                                    <th className="text-left p-2">Giá</th>
                                    <th className="text-left p-2">Tồn kho</th>
                                    <th className="text-left p-2">Mặc định</th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {variants.map(v => (
                                    <tr key={v.sku} className="border-t">
                                        <td className="p-2 font-mono">{v.sku}</td>
                                        <td className="p-2">{v.name?.replace((product.name || '') + ' - ', '')}</td>
                                        <td className="p-2">{(v.price ?? 0).toLocaleString('vi-VN')} ₫</td>
                                        <td className="p-2">{v.stockQuantity ?? 0}</td>
                                        <td className="p-2">
                                            <input
                                                type="radio"
                                                name="default-variant"
                                                checked={!!v.isDefault}
                                                onChange={() => handleSetDefaultVariant(v.id!)}
                                                disabled={settingDefaultId !== null}
                                                className="h-4 w-4 align-middle"
                                                aria-label={`Đặt ${v.sku} làm mặc định`}
                                            />
                                        </td>

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
                            <select
                                name="status"
                                value={product.status}
                                onChange={handleInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            >
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
                                <select
                                    name="categoryId"
                                    value={product.categoryId ?? ''}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setProduct(p => ({ ...p, categoryId: (v) }));
                                    }}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                >
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name ?? `#${c.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Chất liệu</label>
                                <input
                                    type="text"
                                    name="material"
                                    value={product.material}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Thuộc tính (OptionGroup)</CardTitle></CardHeader>
                        <CardContent>
                            {product.id ? (
                                <OptionGroupManager productId={Number(product.id)} />
                            ) : (
                                <p className="text-gray-500 text-sm">Lưu sản phẩm trước để quản lý thuộc tính.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <VariantEditModal
                open={isModalOpen}
                variant={editingVariant}
                onClose={() => setIsModalOpen(false)}
                onSaved={handleSaveVariant}
            />

            {/* NEW: Builder modal – mix theo OptionGroup */}
            {product.id && (
                <VariantBuilderModal
                    isOpen={isBuilderOpen}
                    onClose={() => setIsBuilderOpen(false)}
                    productId={Number(product.id)}
                    productName={product.name || 'Sản phẩm'}
                    productCode={product.code || product.slug || 'PRD'}
                    onSaveMany={mergeGeneratedVariants}
                />
            )}



        </div>
    );
};

export default AdminProductDetailPage;
