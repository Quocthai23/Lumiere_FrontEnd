import { useEffect, useMemo, useState } from 'react';
import httpClient from '../../utils/HttpClient.ts';

/** ===== Types ===== */
type OptionGroupDTO = {
    id?: number;
    productId: number;
    name: string;
    code: string;
    position?: number | null;
};

type OptionSelectDTO = {
    id?: number;
    optionGroupId: number;
    name: string;
    code: string;
    position?: number | null;
    active?: boolean;
};

type GroupModalState =
    | { open: false }
    | { open: true; mode: 'create' | 'edit'; data: OptionGroupDTO; newSelectNames: string[] };

type SelectModalState =
    | { open: false }
    | { open: true; mode: 'create' | 'edit'; groupId: number; data: OptionSelectDTO };

type GroupSelectReq = { groupId: number; selectIds: number[] };
type SyncMixResult = {
    createdVariantIds: number[];
    deletedVariantIds: number[];
    keptVariantIds: number[];
};

/** ===== Helpers ===== */
function toCodeFromName(name: string): string {
    const slug = name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '').replace(/-+/g, '-');
    return slug.toUpperCase() || 'OPT';
}

// Lấy snapshot groups/selects mới nhất từ server để build payload sync
async function fetchGroupsSnapshot(productId: number) {
    const groupsSnap: OptionGroupDTO[] =
        (await httpClient.get<OptionGroupDTO[]>(`/option-groups?productId=${productId}`)) || [];
    // sort group theo position asc (fallback 0)
    groupsSnap.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const selectsSnap: Record<number, OptionSelectDTO[]> = {};
    await Promise.all(
        groupsSnap.map(async g => {
            const list =
                (await httpClient.get<OptionSelectDTO[]>(`/option-selects?optionGroupId=${g.id}`)) || [];
            // sort select theo position asc (fallback 0)
            list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            selectsSnap[g.id!] = list;
        })
    );

    return { groupsSnap, selectsSnap };
}

function buildGroupSelectPayload(
    groupsSnap: OptionGroupDTO[],
    selectsSnap: Record<number, OptionSelectDTO[]>
): GroupSelectReq[] {
    const payload: GroupSelectReq[] = [];

    for (const g of groupsSnap) {
        const sel = (selectsSnap[g.id!] || []).filter(s => s.active !== false); // active==true hoặc undefined coi như bật
        if (sel.length === 0) continue; // group không có lựa chọn bật → bỏ qua
        payload.push({
            groupId: g.id!,
            selectIds: sel.map(s => s.id!) // đã sort theo position ở trên
        });
    }

    return payload;
}
/** ===== Component ===== */
export default function OptionGroupManager({ productId }: { productId: number }) {
    const [groups, setGroups] = useState<OptionGroupDTO[]>([]);
    const [selects, setSelects] = useState<Record<number, OptionSelectDTO[]>>({});
    const [loading, setLoading] = useState(false);
    const [kw, setKw] = useState('');
    const [working, setWorking] = useState(false);

    // Modals
    const [groupModal, setGroupModal] = useState<GroupModalState>({ open: false });
    const [selectModal, setSelectModal] = useState<SelectModalState>({ open: false });
    const [deleteConfirm, setDeleteConfirm] = useState<
        { open: false } | { open: true; type: 'group' | 'select'; id: number; groupId?: number }
    >({ open: false });

    const filteredGroups = useMemo(() => {
        const q = kw.trim().toLowerCase();
        if (!q) return groups;
        return groups.filter(g => g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q));
    }, [groups, kw]);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await httpClient.get<OptionGroupDTO[]>(`/option-groups?productId=${productId}`);
            setGroups(res || []);
            const bag: Record<number, OptionSelectDTO[]> = {};
            await Promise.all((res || []).map(async g => {
                const s = await httpClient.get<OptionSelectDTO[]>(`/option-selects?optionGroupId=${g.id}`);
                bag[g.id!] = s || [];
            }));
            setSelects(bag);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (productId) fetchGroups(); }, [productId]);

    /** ===== Group CRUD ===== */
    const openCreateGroup = () => {
        setGroupModal({
            open: true,
            mode: 'create',
            data: { productId, name: '', code: '', position: (groups?.length || 0) + 1 },
            newSelectNames: []
        });
    };

    const openEditGroup = (g: OptionGroupDTO) => {
        setGroupModal({
            open: true,
            mode: 'edit',
            data: { ...g },
            newSelectNames: []
        });
    };

    const saveGroup = async () => {
        if (!groupModal.open) return;
        const { mode, data, newSelectNames } = groupModal;
        const name = (data.name || '').trim();
        if (!name) return;

        if (mode === 'create') {
            // 1) create group
            const created = await httpClient.post<OptionGroupDTO>('/option-groups', {
                productId: data.productId,
                name,
                code: toCodeFromName(name),
                position: (groups?.length || 0) + 1
            });

            // 2) bulk create selects (if any)
            const names = newSelectNames.map(s => s.trim()).filter(Boolean);
            if (names.length) {
                const items: OptionSelectDTO[] = names.map((n, idx) => ({
                    optionGroupId: created.id!,
                    name: n,
                    code: toCodeFromName(n),
                    position: idx + 1,
                    active: true
                }));
                const createdList = await httpClient.post<OptionSelectDTO[]>('/option-selects/bulk', items);
                setSelects(prev => ({ ...prev, [created.id!]: [ ...(prev[created.id!] || []), ...(createdList || []) ] }));
            } else {
                setSelects(prev => ({ ...prev, [created.id!]: [] }));
            }

            setGroups(g => [...g, created]);
        } else {
            // update group (keep code)
            const updated = await httpClient.put<OptionGroupDTO>(`/option-groups/${data.id}`, {
                ...data,
                name,
                code: data.code
            });
            setGroups(list => list.map(x => x.id === updated.id ? updated : x));

            // bulk append new selects
            const names = newSelectNames.map(s => s.trim()).filter(Boolean);
            if (names.length) {
                const baseLen = (selects[data.id!] || []).length;
                const items: OptionSelectDTO[] = names.map((n, idx) => ({
                    optionGroupId: data.id!,
                    name: n,
                    code: toCodeFromName(n),
                    position: baseLen + idx + 1,
                    active: true
                }));
                const createdList = await httpClient.post<OptionSelectDTO[]>('/option-selects/bulk', items);
                setSelects(prev => ({ ...prev, [data.id!]: [ ...(prev[data.id!] || []), ...(createdList || []) ] }));
            }
        }

        setGroupModal({ open: false });
    };

    const confirmDeleteGroup = (id?: number) => {
        if (!id) return;
        setDeleteConfirm({ open: true, type: 'group', id });
    };
    const deleteGroup = async () => {
        if (!deleteConfirm.open || deleteConfirm.type !== 'group') return;
        await httpClient.delete(`/option-groups/${deleteConfirm.id}`);
        setGroups(list => list.filter(g => g.id !== deleteConfirm.id));
        setSelects(s => { const t = { ...s }; delete t[deleteConfirm.id]; return t; });
        setDeleteConfirm({ open: false });
    };

    /** ===== Select CRUD (single) ===== */
    const openCreateSelect = (groupId: number) => {
        setSelectModal({
            open: true,
            mode: 'create',
            groupId,
            data: { optionGroupId: groupId, name: '', code: '', position: ((selects[groupId]?.length) || 0) + 1, active: true }
        });
    };

    const openEditSelect = (s: OptionSelectDTO) => {
        setSelectModal({ open: true, mode: 'edit', groupId: s.optionGroupId, data: { ...s } });
    };

    const saveSelect = async () => {
        if (!selectModal.open) return;
        const { mode, data, groupId } = selectModal;
        const name = (data.name || '').trim();
        if (!name) return;

        if (mode === 'create') {
            const created = await httpClient.post<OptionSelectDTO>('/option-selects', {
                optionGroupId: groupId,
                name,
                code: toCodeFromName(name),
                position: ((selects[groupId]?.length) || 0) + 1,
                active: true
            });
            setSelects(prev => ({ ...prev, [groupId]: [ ...(prev[groupId] || []), created ] }));
        } else {
            const updated = await httpClient.put<OptionSelectDTO>(`/option-selects/${data.id}`, {
                ...data,
                name,
                code: data.code // keep code
            });
            setSelects(prev => ({
                ...prev,
                [groupId]: (prev[groupId] || []).map(x => x.id === updated.id ? updated : x),
            }));
        }
        setSelectModal({ open: false });
    };

    const confirmDeleteSelect = (s: OptionSelectDTO) => {
        setDeleteConfirm({ open: true, type: 'select', id: s.id!, groupId: s.optionGroupId });
    };
    const deleteSelect = async () => {
        if (!deleteConfirm.open || deleteConfirm.type !== 'select') return;
        await httpClient.delete(`/option-selects/${deleteConfirm.id}`);
        const gid = deleteConfirm.groupId!;
        setSelects(prev => ({ ...prev, [gid]: (prev[gid] || []).filter(x => x.id !== deleteConfirm.id) }));
        setDeleteConfirm({ open: false });
    };

    /** ===== Auto split from variants + SYNC mixes ===== */
    const autoSplitFromVariants = async () => {
        try {
            setWorking(true);

            // 1) lấy snapshot mới nhất
            const { groupsSnap, selectsSnap } = await fetchGroupsSnapshot(productId);

            // 2) build payload theo group/select (active)
            const payload = buildGroupSelectPayload(groupsSnap, selectsSnap);
            if (!payload.length) {
                return;
            }

            // 3) gọi API sync
             await httpClient.post<SyncMixResult>(
                `/option-variants/products/${productId}/variants/sync-by-groups`,
                payload
            );

            await fetchGroups();

        } catch (e) {
            console.error(e);
        } finally {
            setWorking(false);
        }
    };

    const addNewSelectName = (raw: string) => {
        const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
        if (!parts.length) return;
        setGroupModal(m => m.open ? ({ ...m, newSelectNames: Array.from(new Set([ ...m.newSelectNames, ...parts ])) }) : m);
    };
    const removeNewSelectName = (name: string) => {
        setGroupModal(m => m.open ? ({ ...m, newSelectNames: m.newSelectNames.filter(x => x !== name) }) : m);
    };

    /** ===== Render ===== */
    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="rounded-xl border bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 p-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[220px] max-w-[420px]">
                        <input
                            placeholder="Tìm nhóm..."
                            value={kw}
                            onChange={e => setKw(e.target.value)}
                            className="h-10 w-full rounded-full border border-gray-200 px-4 pr-10 text-sm placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">⌕</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={autoSplitFromVariants}
                            disabled={working}
                            className="h-10 rounded-full bg-emerald-600 px-4 text-white text-sm font-medium shadow-sm
                         hover:bg-emerald-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-emerald-500
                         disabled:bg-emerald-300 transition"
                            title="Phân tích tên biến thể và tự tạo nhóm/lựa chọn + đồng bộ mix"
                        >
                            {working ? 'Đang chia…' : 'Chia phân loại'}
                        </button>
                        <button
                            onClick={openCreateGroup}
                            className="h-10 rounded-full bg-indigo-600 px-4 text-white text-sm font-medium shadow-sm
                         hover:bg-indigo-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        >
                            + Thêm nhóm
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <p>Đang tải...</p>
            ) : filteredGroups.length === 0 ? (
                <p className="text-gray-500">Chưa có nhóm.</p>
            ) : (
                <div className="space-y-4">
                    {filteredGroups.map(g => (
                        <div key={g.id} className="border rounded-xl shadow-sm bg-white">
                            {/* Group header */}
                            <div className="p-3 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-gray-800">
                                        {g.name} <span className="text-xs text-gray-500">({g.code})</span>
                                    </div>
                                    {typeof g.position === 'number' && (
                                        <div className="text-[11px] text-gray-400 mt-0.5">Pos: {g.position}</div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => openEditGroup(g)} className="text-indigo-600 hover:underline">Sửa</button>
                                    <button onClick={() => confirmDeleteGroup(g.id)} className="text-red-600 hover:underline">Xoá</button>
                                </div>
                            </div>

                            {/* Select list */}
                            <div className="p-3 border-t">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-semibold text-gray-700 tracking-wide">Lựa chọn</div>
                                    <button
                                        onClick={() => openCreateSelect(g.id!)}
                                        className="text-xs md:text-sm h-8 rounded-full px-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition"
                                    >
                                        + Thêm lựa chọn
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {(selects[g.id!] || []).map(s => (
                                        <div
                                            key={s.id}
                                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm"
                                        >
                                            <span className="font-mono text-gray-700">{s.code}</span>
                                            <span className="text-gray-700">— {s.name}</span>
                                            <button onClick={() => openEditSelect(s)} className="text-indigo-600 text-xs hover:underline">Sửa</button>
                                            <button onClick={() => confirmDeleteSelect(s)} className="text-red-600 text-xs hover:underline">Xoá</button>
                                        </div>
                                    ))}
                                    {(selects[g.id!] || []).length === 0 && (
                                        <div className="text-gray-500 text-sm">Chưa có lựa chọn.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ===== Modal: Group Create/Edit ===== */}
            {groupModal.open && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <div className="bg-white w-full max-w-lg rounded-lg shadow-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold">
                                {groupModal.mode === 'create' ? 'Thêm nhóm thuộc tính' : 'Sửa nhóm thuộc tính'}
                            </h3>
                            <button onClick={() => setGroupModal({ open: false })} className="text-gray-500 hover:text-gray-700">Đóng</button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Tên nhóm</label>
                                <input
                                    value={groupModal.data.name}
                                    onChange={e => setGroupModal(m => m.open ? ({ ...m, data: { ...m.data, name: e.target.value } }) : m)}
                                    className="border rounded px-2 py-1 w-full"
                                />
                                {groupModal.mode === 'edit' && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Mã: <span className="font-mono">{groupModal.data.code}</span> (tự sinh, không chỉnh sửa)
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Thêm lựa chọn trong nhóm</label>
                                <QuickAddSelectNames onAdd={(names) => addNewSelectName(names)} />
                                {groupModal.newSelectNames.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {groupModal.newSelectNames.map(n => (
                                            <span key={n} className="px-2 py-1 rounded border text-sm flex items-center gap-1">
                        {n}
                                                <button
                                                    className="text-red-600 text-xs"
                                                    onClick={() => removeNewSelectName(n)}
                                                    title="Xoá"
                                                >
                          ✕
                        </button>
                      </span>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Nhập nhiều bằng dấu phẩy, Enter để thêm.</p>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button onClick={() => setGroupModal({ open: false })} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
                                Hủy
                            </button>
                            <button onClick={saveGroup} className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Modal: Select Create/Edit ===== */}
            {selectModal.open && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <div className="bg-white w-full max-w-lg rounded-lg shadow-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold">
                                {selectModal.mode === 'create' ? 'Thêm lựa chọn' : 'Sửa lựa chọn'}
                            </h3>
                            <button onClick={() => setSelectModal({ open: false })} className="text-gray-500 hover:text-gray-700">Đóng</button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Tên lựa chọn</label>
                                <input
                                    value={selectModal.data.name}
                                    onChange={e => setSelectModal(m => m.open ? ({ ...m, data: { ...m.data, name: e.target.value } }) : m)}
                                    className="border rounded px-2 py-1 w-full"
                                />
                            </div>
                            {selectModal.mode === 'edit' && (
                                <p className="text-xs text-gray-500">
                                    Mã: <span className="font-mono">{selectModal.data.code}</span> (tự sinh, không chỉnh sửa)
                                </p>
                            )}
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button onClick={() => setSelectModal({ open: false })} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
                                Hủy
                            </button>
                            <button onClick={saveSelect} className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Modal: Confirm delete ===== */}
            {deleteConfirm.open && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-xl p-5">
                        <div className="mb-3">
                            <h3 className="text-lg font-semibold">Xác nhận xoá</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                {deleteConfirm.type === 'group'
                                    ? 'Xoá nhóm sẽ xoá cả các lựa chọn bên trong. Bạn chắc chứ?'
                                    : 'Bạn chắc chắn muốn xoá lựa chọn này?'}
                            </p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteConfirm({ open: false })} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
                                Hủy
                            </button>
                            <button
                                onClick={deleteConfirm.type === 'group' ? deleteGroup : deleteSelect}
                                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Xoá
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/** Input nhập nhanh nhiều lựa chọn (gõ, Enter hoặc nhập 'Đỏ, Xanh, Vàng') */
function QuickAddSelectNames({ onAdd }: { onAdd: (names: string) => void }) {
    const [val, setVal] = useState('');
    const commit = () => {
        const v = val.trim();
        if (!v) return;
        onAdd(v);
        setVal('');
    };
    return (
        <div className="flex items-center gap-2">
            <input
                value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
                placeholder="Nhập tên lựa chọn, ví dụ: Đỏ, Xanh"
                className="border rounded px-2 py-1 w-full"
            />
            <button onClick={commit} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Thêm</button>
        </div>
    );
}
