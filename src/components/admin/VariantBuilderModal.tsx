import React, { useEffect, useMemo, useState } from 'react';
import httpClient from '../../utils/HttpClient.ts';
import type { ProductVariant } from '../../types/product';

type OptionGroupDTO = { id: number; productId: number; name: string; code: string; position?: number | null; };
type OptionSelectDTO = { id: number; optionGroupId: number; name: string; code: string; active?: boolean; position?: number | null; };

type PreviewRow = {
    name: string;
    sku: string;
    optionSelectIds: number[]; // ⬅️ quan trọng: mapping để backend assign sau khi tạo variant
};

export interface VariantBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
    productName: string;
    productCode?: string;

    /** trả về danh sách variant (chưa gọi API), FE cha merge vào state */
    onSaveMany: (
        variants: Array<Omit<ProductVariant, 'id' | 'productId'> & { id?: number; productId?: number; optionSelectIds: number[] }>
    ) => void;
}

function cartesian<T>(arrs: T[][]): T[][] {
    if (arrs.length === 0) return [];
    return arrs.reduce<T[][]>(
        (acc, curr) => acc.flatMap(a => curr.map(c => [...a, c])),
        [[]]
    );
}

const VariantBuilderModal: React.FC<VariantBuilderModalProps> = ({
                                                                     isOpen, onClose, productId, productName, productCode, onSaveMany
                                                                 }) => {
    const [groups, setGroups] = useState<OptionGroupDTO[]>([]);
    const [selects, setSelects] = useState<Record<number, OptionSelectDTO[]>>({});
    const [picked, setPicked] = useState<Record<number, number[]>>({}); // groupId -> selected selectIds
    const [defaultPrice, setDefaultPrice] = useState<number>(0);
    const [defaultStock, setDefaultStock] = useState<number>(0);

    const skuPrefix = (productCode || 'PRD').toUpperCase();

    useEffect(() => {
        if (!isOpen || !productId) return;
        (async () => {
            const gs = await httpClient.get<OptionGroupDTO[]>(`/option-groups?productId=${productId}`);
            setGroups(gs || []);
            const bag: Record<number, OptionSelectDTO[]> = {};
            await Promise.all((gs || []).map(async g => {
                const s = await httpClient.get<OptionSelectDTO[]>(`/option-selects?optionGroupId=${g.id}`);
                bag[g.id] = (s || []).filter(x => x.active !== false);
            }));
            setSelects(bag);
            setPicked({}); // reset chọn
        })();
    }, [isOpen, productId]);

    const rows: PreviewRow[] = useMemo(() => {
        if (!groups.length) return [];
        const arrays: OptionSelectDTO[][] = groups.map(g => (selects[g.id] || []).filter(s => (picked[g.id] || []).includes(s.id)));
        if (arrays.some(a => a.length === 0)) return [];
        const combos = cartesian(arrays);
        return combos.map(cs => {
            const nameSuffix = cs.map(c => c.name).join(' / ');
            const skuSuffix = cs.map(c => c.code.toUpperCase()).join('-');
            return {
                name: `${productName} - ${nameSuffix}`,
                sku: `${skuPrefix}-${skuSuffix}`,
                optionSelectIds: cs.map(c => c.id),
            };
        });
    }, [groups, selects, picked, productName, skuPrefix]);

    const togglePick = (groupId: number, selectId: number) => {
        setPicked(prev => {
            const set = new Set(prev[groupId] || []);
            set.has(selectId) ? set.delete(selectId) : set.add(selectId);
            return { ...prev, [groupId]: Array.from(set) };
        });
    };

    const handleSave = () => {
        if (!rows.length) {
            alert('Chọn ít nhất 1 lựa chọn ở mỗi nhóm.');
            return;
        }
        const payload = rows.map(r => ({
            name: r.name,
            sku: r.sku,
            price: defaultPrice,
            stockQuantity: defaultStock,
            isDefault: false,
            optionSelectIds: r.optionSelectIds, // ⬅️ đưa ra FE cha để map
        }));
        onSaveMany(payload);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-5xl rounded-lg shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Tạo biến thể từ OptionGroup</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Đóng</button>
                </div>

                {/* Groups & selects */}
                <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                    {groups.length === 0 ? (
                        <p className="text-gray-500">Chưa có nhóm. Hãy tạo ở panel bên cạnh.</p>
                    ) : groups.map(g => (
                        <div key={g.id} className="border rounded">
                            <div className="p-3 border-b font-medium">{g.name} <span className="text-xs text-gray-500">({g.code})</span></div>
                            <div className="p-3 flex flex-wrap gap-2">
                                {(selects[g.id] || []).map(s => {
                                    const selected = (picked[g.id] || []).includes(s.id);
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => togglePick(g.id, s.id)}
                                            className={`px-2 py-1 rounded border text-sm ${selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-gray-50'}`}
                                            title={s.code}
                                        >
                                            <span className="font-mono">{s.code}</span> — {s.name}
                                        </button>
                                    );
                                })}
                                {(selects[g.id] || []).length === 0 && (
                                    <div className="text-gray-500 text-sm">Chưa có lựa chọn (active).</div>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="grid md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Giá mặc định</label>
                            <input type="number" value={defaultPrice} onChange={e => setDefaultPrice(Number(e.target.value || 0))} className="border rounded px-2 py-1 w-full" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Tồn kho mặc định</label>
                            <input type="number" value={defaultStock} onChange={e => setDefaultStock(Number(e.target.value || 0))} className="border rounded px-2 py-1 w-full" />
                        </div>
                    </div>

                    {/* Preview */}
                    <div>
                        <div className="font-medium mb-2">Xem trước ({rows.length})</div>
                        <div className="max-h-60 overflow-auto border rounded">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left p-2">SKU</th>
                                    <th className="text-left p-2">Tên biến thể</th>
                                </tr>
                                </thead>
                                <tbody>
                                {rows.map((r, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="p-2 font-mono">{r.sku}</td>
                                        <td className="p-2">{r.name}</td>
                                    </tr>
                                ))}
                                {rows.length === 0 && <tr><td colSpan={2} className="p-3 text-gray-500">Chưa đủ lựa chọn.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Hủy</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Tạo biến thể</button>
                </div>
            </div>
        </div>
    );
};

export default VariantBuilderModal;
