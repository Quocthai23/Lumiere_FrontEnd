// src/pages/admin/InventoryManagementPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import httpClient from '../../utils/HttpClient.ts';
import type { Inventory } from '../../types/inventory';

/* ---------- UI helpers ---------- */
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-4 border-b ${className}`}>{children}</div>
);
const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-4 ${className}`}>{children}</div>
);

/* ---------- Minimal types ---------- */
type ProductLite = { id: number; name: string; code?: string };
type ProductVariantLite = {
    id: number;
    name: string;
    sku?: string;
    imageUrl?: string | null;
    product?: { id: number };
};
type InventoryRow = Inventory & { productVariant?: ProductVariantLite };

/* ---------- Modal types ---------- */
type RowItem = {
    variantId: number;
    name: string;
    sku?: string;
    imageUrl?: string | null;
    currentTotal: number;
    delta: number; // không âm, áp riêng từng dòng
};

type DistStrategy = 'largest' | 'first';

/* ---------- Helper chọn inventoryId theo chiến lược ---------- */
function pickInventoryIdForVariant(
    variantId: number,
    allInventories: Array<{ id: number; productVariant?: { id: number }; stockQuantity?: number }>,
    strategy: DistStrategy = 'largest'
) {
    const rows = allInventories.filter((r) => r.productVariant?.id === variantId);
    if (rows.length === 0) return null;
    if (strategy === 'largest') {
        return rows.slice().sort((a, b) => (b.stockQuantity ?? 0) - (a.stockQuantity ?? 0))[0].id;
    }
    return rows[0].id;
}

/* ================= Modal: Bulk Per-Item Adjustment ================= */
function BulkPerItemModal({
                              open,
                              initialRows,
                              productIdForSearch,
                              inventories, // <-- truyền toàn bộ inventories để map ra inventoryId
                              onClose,
                              onCommitted,
                          }: {
    open: boolean;
    initialRows: RowItem[];
    productIdForSearch?: number | null;
    inventories: InventoryRow[];
    onClose: () => void;
    onCommitted: () => Promise<void>;
}) {
    const [rows, setRows] = useState<RowItem[]>([]);
    const [searchKw, setSearchKw] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<ProductVariantLite[]>([]);
    const [refType, setRefType] = useState('');
    const [refCode, setRefCode] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [strategy, setStrategy] = useState<DistStrategy>('largest');

    useEffect(() => {
        if (open) {
            setRows(initialRows);
            setRefType('');
            setRefCode('');
            setNote('');
            setSearchKw('');
            setResults([]);
            setSubmitting(false);
            setStrategy('largest');
        }
    }, [open, initialRows]);

    if (!open) return null;

    const onChangeDelta = (variantId: number, val: number) => {
        const v = Number.isFinite(val) ? Math.max(0, Math.trunc(val)) : 0;
        setRows((prev) => prev.map((r) => (r.variantId === variantId ? { ...r, delta: v } : r)));
    };

    const removeRow = (variantId: number) => {
        setRows((prev) => prev.filter((r) => r.variantId !== variantId));
    };

    const doSearch = async () => {
        const q = searchKw.trim();
        if (!q) return;
        setSearching(true);
        try {
            let url: string;
            if (productIdForSearch) {
                url = `/product-variants?productId.equals=${productIdForSearch}&name.contains=${encodeURIComponent(q)}&sort=id,asc`;
            } else {
                url = `/product-variants/search?q=${encodeURIComponent(q)}`;
            }
            const list = (await httpClient.get<ProductVariantLite[]>(url)) || [];
            setResults(list);
        } catch (e) {
            console.error(e);
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    const addVariant = async (v: ProductVariantLite) => {
        let currentTotal = 0;
        try {
            const inv = (await httpClient.get<InventoryRow[]>(`/inventories/by-variant/${v.id}`)) || [];
            currentTotal = inv.reduce((s, it) => s + (it.stockQuantity ?? 0), 0);
        } catch {
            currentTotal = 0;
        }
        setRows((prev) => {
            if (prev.some((r) => r.variantId === v.id)) return prev;
            return [
                ...prev,
                { variantId: v.id, name: v.name, sku: v.sku, imageUrl: v.imageUrl, currentTotal, delta: 0 },
            ];
        });
    };

    const commit = async () => {
        if (!rows.length) {
            onClose();
            return;
        }
        // Map từng dòng sang { inventoryId, delta }
        const items: Array<{ inventoryId: number; delta: number }> = [];
        for (const r of rows) {
            const invId = pickInventoryIdForVariant(r.variantId, inventories, strategy);
            if (!invId) {
                return;
            }
            items.push({ inventoryId: invId, delta: Math.trunc(r.delta || 0) });
        }

        setSubmitting(true);
        try {
            const payload = {
                type: 'INCREASE',
                allowNegative: false,
                refType: refType?.trim() || null,
                refCode: refCode?.trim() || null,
                note: note?.trim() || null,
                items,
            };
            await httpClient.post('/inventories/bulk-adjust', payload);
            await onCommitted();
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white w-full max-w-5xl rounded-lg shadow-xl p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Điều chỉnh theo dòng</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Đóng</button>
                </div>

                {/* finder */}
                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="md:col-span-2 flex items-center gap-2">
                        <input
                            value={searchKw}
                            onChange={(e) => setSearchKw(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                            placeholder="Tìm biến thể để thêm (tên / SKU)"
                            className="border rounded px-3 py-2 w-full"
                        />
                        <button
                            className="px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200"
                            onClick={doSearch}
                            disabled={searching}
                        >
                            Tìm
                        </button>
                    </div>
                    {/* strategy */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Phân bổ kho</label>
                        <select
                            value={strategy}
                            onChange={(e) => setStrategy(e.target.value as DistStrategy)}
                            className="border rounded px-2 py-2"
                        >
                            <option value="largest">Đổ vào kho có tồn lớn nhất</option>
                            <option value="first">Kho đầu tiên tìm thấy</option>
                        </select>
                    </div>
                </div>

                {results.length > 0 && (
                    <div className="mb-4 max-h-40 overflow-y-auto border rounded p-2">
                        {results.map((v) => (
                            <div key={v.id} className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={v.imageUrl || ''}
                                        onError={(e: any) => (e.currentTarget.style.display = 'none')}
                                        alt=""
                                        className="w-8 h-8 rounded object-cover border"
                                    />
                                    <div>
                                        <div className="text-sm font-medium">{v.name}</div>
                                        <div className="text-xs text-gray-500">{v.sku || '-'}</div>
                                    </div>
                                </div>
                                <button
                                    className="inline-flex items-center gap-1 px-2 py-1 border rounded text-sm hover:bg-gray-50"
                                    onClick={() => addVariant(v)}
                                >
                                    <Plus size={14} /> Thêm
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* grid */}
                <div className="overflow-x-auto border rounded">
                    <table className="min-w-full text-sm text-left text-gray-700">
                        <thead className="bg-gray-50 text-xs uppercase">
                        <tr>
                            <th className="px-3 py-2">Ảnh</th>
                            <th className="px-3 py-2">SKU</th>
                            <th className="px-3 py-2">Tên phân loại</th>
                            <th className="px-3 py-2 text-right">Tồn hiện tại</th>
                            <th className="px-3 py-2 text-right">Sản phẩm nhận</th>
                            <th className="px-3 py-2 text-right">Sau nhận</th>
                            <th className="px-3 py-2"></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {rows.map((r) => {
                            const preview = r.currentTotal + (Number.isFinite(r.delta) ? r.delta : 0);
                            return (
                                <tr key={r.variantId}>
                                    <td className="px-3 py-2">
                                        {r.imageUrl ? (
                                            <img
                                                src={r.imageUrl}
                                                onError={(e: any) => (e.currentTarget.style.display = 'none')}
                                                alt=""
                                                className="w-10 h-10 rounded object-cover border"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-gray-100 border" />
                                        )}
                                    </td>
                                    <td className="px-3 py-2 font-mono">{r.sku || '-'}</td>
                                    <td className="px-3 py-2">{r.name}</td>
                                    <td className="px-3 py-2 text-right font-semibold">{r.currentTotal}</td>
                                    <td className="px-3 py-2 text-right">
                                        <input
                                            type="number"
                                            min={0}
                                            step={1}
                                            value={r.delta ?? 0}
                                            inputMode="numeric"
                                            className="border rounded px-2 py-1 w-28 text-right"
                                            onKeyDown={(e) => {
                                                if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') e.preventDefault();
                                            }}
                                            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                            onPaste={(e) => {
                                                const txt = e.clipboardData.getData('text');
                                                if (/[-+eE]/.test(txt)) e.preventDefault();
                                            }}
                                            onChange={(e) => onChangeDelta(r.variantId, e.target.valueAsNumber)}
                                        />
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold">{preview}</td>
                                    <td className="px-3 py-2 text-right">
                                        <button
                                            className="text-red-600 hover:text-red-700"
                                            title="Xoá dòng"
                                            onClick={() => removeRow(r.variantId)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {rows.length === 0 && (
                            <tr>
                                <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                                    Chưa có dòng nào. Tìm và thêm biến thể ở trên.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* refs */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                        placeholder="Ref Type (ORDER / GRN / RETURN …)"
                        value={refType}
                        onChange={(e) => setRefType(e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                    />
                    <input
                        placeholder="Ref Code (mã chứng từ)"
                        value={refCode}
                        onChange={(e) => setRefCode(e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                    />
                </div>
                <div className="mt-3">
          <textarea
              placeholder="Ghi chú"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="border rounded px-3 py-2 w-full"
          />
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={submitting}>
                        Hủy
                    </button>
                    <button
                        onClick={commit}
                        className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-300"
                        disabled={submitting || rows.length === 0}
                    >
                        {submitting ? 'Đang cập nhật…' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* =================== PAGE =================== */
const InventoryManagementPage: React.FC = () => {
    const [inventories, setInventories] = useState<InventoryRow[]>([]);
    const [products, setProducts] = useState<ProductLite[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [invLoading, setInvLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [productSearch, setProductSearch] = useState('');
    const [variantSearch, setVariantSearch] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

    const [selectedVariantIds, setSelectedVariantIds] = useState<Set<number>>(new Set());
    const [modalOpen, setModalOpen] = useState(false);

    const invAbortRef = useRef<AbortController | null>(null);

    const fetchProducts = async () => {
        setProductsLoading(true);
        try {
            const productRes = await httpClient.get<ProductLite[]>('/products?sort=id,asc');
            const list = productRes || [];
            setProducts(list);
            if (!selectedProductId && list.length > 0) setSelectedProductId(list[0].id);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Không thể tải danh sách sản phẩm.');
        } finally {
            setProductsLoading(false);
        }
    };

    const fetchInventoriesByProduct = async (productId: number) => {
        if (invAbortRef.current) invAbortRef.current.abort();
        const controller = new AbortController();
        invAbortRef.current = controller;

        setInvLoading(true);
        setInventories([]);
        try {
            const invRes = await httpClient.get<InventoryRow[]>(
                `/inventories/by-product/${productId}`,
                { signal: controller.signal } as any
            );
            setInventories(invRes || []);
            setError(null);
        } catch (err: any) {
            if (err?.name === 'AbortError') return;
            console.error(err);
            setError('Không thể tải tồn kho theo sản phẩm.');
        } finally {
            setInvLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);
    useEffect(() => {
        if (selectedProductId) {
            setSelectedVariantIds(new Set());
            fetchInventoriesByProduct(selectedProductId);
        }
    }, [selectedProductId]);

    const filteredProducts = useMemo(() => {
        const kw = productSearch.trim().toLowerCase();
        if (!kw) return products;
        return products.filter(
            (p) => (p.name && p.name.toLowerCase().includes(kw)) || (p.code && p.code.toLowerCase().includes(kw))
        );
    }, [products, productSearch]);

    const aggregatedByVariant = useMemo(() => {
        const map = new Map<number, { variant: ProductVariantLite; total: number }>();
        for (const inv of inventories) {
            const vid = inv.productVariant?.id;
            if (!vid) continue;
            const prev = map.get(vid);
            const qty = inv.stockQuantity ?? 0;
            if (prev) prev.total += qty;
            else map.set(vid, { variant: inv.productVariant!, total: qty });
        }
        let rows = Array.from(map.values());
        const kw = variantSearch.trim().toLowerCase();
        if (kw) {
            rows = rows.filter(
                (r) =>
                    (r.variant.name && r.variant.name.toLowerCase().includes(kw)) ||
                    (r.variant.sku && r.variant.sku.toLowerCase().includes(kw))
            );
        }
        return rows.sort((a, b) => (a.variant.name || '').localeCompare(b.variant.name || ''));
    }, [inventories, variantSearch]);

    const toggleVariant = (id: number) => {
        setSelectedVariantIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };
    const toggleAll = (checked: boolean) => {
        if (!checked) { setSelectedVariantIds(new Set()); return; }
        setSelectedVariantIds(new Set(aggregatedByVariant.map((r) => r.variant.id)));
    };

    const openPerItemModal = () => {
        if (!selectedVariantIds.size) return;
        setModalOpen(true);
    };

    const buildInitialRows = (): RowItem[] => {
        const picked = aggregatedByVariant.filter((r) => selectedVariantIds.has(r.variant.id));
        return picked.map((r) => ({
            variantId: r.variant.id,
            name: r.variant.name,
            sku: r.variant.sku,
            imageUrl: r.variant.imageUrl,
            currentTotal: r.total,
            delta: 0,
        }));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Quản lý Tồn Kho</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: products */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <input
                                type="search"
                                placeholder="Tìm theo tên / mã Product..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="pl-8 pr-2 py-2 w-full border rounded-md bg-gray-50"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {productsLoading ? (
                            <p className="text-gray-500">Đang tải sản phẩm...</p>
                        ) : error ? (
                            <p className="text-red-500">{error}</p>
                        ) : filteredProducts.length === 0 ? (
                            <p className="text-gray-500">Không tìm thấy sản phẩm.</p>
                        ) : (
                            <ul className="divide-y">
                                {filteredProducts.map((p) => (
                                    <li
                                        key={p.id}
                                        onClick={() => setSelectedProductId(p.id)}
                                        className={`p-3 cursor-pointer hover:bg-gray-50 rounded-md ${
                                            selectedProductId === p.id ? 'bg-indigo-50 border border-indigo-200' : ''
                                        }`}
                                    >
                                        <div className="font-medium text-gray-900">{p.name}</div>
                                        {p.code && <div className="text-xs text-gray-500">Mã: {p.code}</div>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* RIGHT: variants */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="font-semibold">
                                    {selectedProductId ? 'Tồn kho' : 'Chọn một sản phẩm để xem tồn kho'}
                                </div>
                                {selectedProductId && (
                                    <div className="text-sm text-gray-600">
                                        Đã chọn: <b>{selectedVariantIds.size}</b>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative w-full max-w-xs">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <input
                                        type="search"
                                        placeholder="Lọc theo tên Variant / SKU..."
                                        value={variantSearch}
                                        onChange={(e) => setVariantSearch(e.target.value)}
                                        className="pl-8 pr-2 py-2 w-full border rounded-md bg-gray-50"
                                    />
                                </div>
                                <button
                                    className="px-3 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300"
                                    disabled={!selectedVariantIds.size}
                                    onClick={openPerItemModal}
                                >
                                    Điều chỉnh theo dòng
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {invLoading ? (
                            <p className="text-gray-500">Đang tải tồn kho...</p>
                        ) : error ? (
                            <p className="text-red-500">{error}</p>
                        ) : !selectedProductId ? (
                            <p className="text-gray-500">Chưa chọn product.</p>
                        ) : aggregatedByVariant.length === 0 ? (
                            <p className="text-gray-500">Không có inventory cho product này.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left text-gray-600">
                                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                onChange={(e) => toggleAll(e.target.checked)}
                                                checked={
                                                    selectedVariantIds.size > 0 &&
                                                    selectedVariantIds.size === aggregatedByVariant.length
                                                }
                                                aria-label="Chọn tất cả"
                                            />
                                        </th>
                                        <th className="px-6 py-3">Ảnh</th>
                                        <th className="px-6 py-3">SKU</th>
                                        <th className="px-6 py-3">Tên phân loại</th>
                                        <th className="px-6 py-3 text-right">Tổng tồn</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                    {aggregatedByVariant.map((row) => {
                                        const id = row.variant.id;
                                        const checked = selectedVariantIds.has(id);
                                        return (
                                            <tr key={id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleVariant(id)}
                                                        aria-label={`Chọn ${row.variant.name}`}
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    {row.variant.imageUrl ? (
                                                        <img
                                                            src={row.variant.imageUrl}
                                                            onError={(e: any) => (e.currentTarget.style.display = 'none')}
                                                            alt=""
                                                            className="w-10 h-10 object-cover rounded border"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded bg-gray-100 border" />
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 font-mono text-gray-700">{row.variant.sku || '-'}</td>
                                                <td className="px-6 py-3 font-medium text-gray-800">{row.variant.name}</td>
                                                <td className="px-6 py-3 font-bold text-indigo-600 text-right">{row.total}</td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal per-item */}
            <BulkPerItemModal
                open={modalOpen}
                initialRows={buildInitialRows()}
                productIdForSearch={selectedProductId}
                inventories={inventories}
                onClose={() => setModalOpen(false)}
                onCommitted={async () => {
                    if (selectedProductId) await fetchInventoriesByProduct(selectedProductId);
                    setSelectedVariantIds(new Set());
                }}
            />
        </div>
    );
};

export default InventoryManagementPage;
