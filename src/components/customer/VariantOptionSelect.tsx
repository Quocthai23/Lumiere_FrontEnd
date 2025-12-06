import React, { useEffect, useRef, useState } from 'react';
import httpClient from '../../utils/HttpClient.ts';

type AnyVariant = any;

interface VariantOptionSelectorProps {
    productId: number;
    variants: AnyVariant[];
    selectedVariant: AnyVariant | undefined;
    onVariantChange: (v: AnyVariant | undefined) => void;
}

const VariantOptionSelector: React.FC<VariantOptionSelectorProps> = ({
                                                                         productId,
                                                                         variants,
                                                                         selectedVariant,
                                                                         onVariantChange,
                                                                     }) => {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [variantSelectMap, setVariantSelectMap] = useState<Record<number, number[]>>({});
    const [selectedByGroup, setSelectedByGroup] = useState<Record<number, number | null>>({});
    const initializedRef = useRef(false);

    // 1) Fetch option groups theo product
    useEffect(() => {
        const loadGroups = async () => {
            try {
                const res = await httpClient.get<any[]>(`/option-groups?productId=${productId}`);
                const data = (res as any).data ?? res;

                setGroups(data || []);

                const groupsWithOptions = (data || []).filter(
                    (g: any) => Array.isArray(g.optionSelectDTOS) && g.optionSelectDTOS.length > 0
                );

                // chỉ init selectedByGroup lần đầu
                if (!initializedRef.current) {
                    const initSelected: Record<number, number | null> = {};
                    groupsWithOptions.forEach((g: any) => {
                        initSelected[g.id] = null;
                    });
                    setSelectedByGroup(initSelected);
                    initializedRef.current = true;
                }
            } catch (e) {
                console.error('Failed to load option groups', e);
            } finally {
                setLoading(false);
            }
        };
        loadGroups();
    }, [productId]);

    // 2) Fetch mapping variant -> selectIds
    useEffect(() => {
        const loadVariantMapping = async () => {
            const map: Record<number, number[]> = {};

            for (const v of variants || []) {
                try {
                    const res = await httpClient.get<any[]>(`/option-variants/by-variant/${v.id}`);
                    const data = (res as any).data ?? res;

                    const selectIds = (data || []).map((ov: any) => ov.selectId);
                    map[v.id] = selectIds;
                } catch (e) {
                    console.error('Failed to load option-variants for variant', v.id, e);
                }
            }

            setVariantSelectMap(map);
        };

        if (variants && variants.length > 0) {
            loadVariantMapping();
        }
    }, [variants]);

    const fetchVariantBySelects = async (selectedIds: number[]) => {
        try {
            const res = await httpClient.post<any>('/option-variants/find-by-selects', selectedIds);
            const data = (res as any).data ?? res;
            onVariantChange(data || undefined);
        } catch (e: any) {
            if (e?.response?.status === 404) {
                onVariantChange(undefined);
            } else {
                console.error('Failed to fetch variant by selects', e);
            }
        }
    };

    const handleSelectChange = (groupId: number, selectId: number) => {
        const updated = { ...selectedByGroup, [groupId]: selectId };
        setSelectedByGroup(updated);

        const groupsWithOptions = groups.filter(
            (g: any) => Array.isArray(g.optionSelectDTOS) && g.optionSelectDTOS.length > 0
        );

        const selectedIds: number[] = Object.entries(updated)
            .filter(
                ([gid, v]) =>
                    v !== null && groupsWithOptions.some((g: any) => g.id === Number(gid))
            )
            .map(([, v]) => Number(v));

        if (selectedIds.length !== groupsWithOptions.length) {
            onVariantChange(undefined);
            return;
        }

        fetchVariantBySelects(selectedIds);
    };

    if (loading) {
        return <div>Đang tải lựa chọn phiên bản...</div>;
    }

    if (!groups || groups.length === 0) {
        return null;
    }

    return (
        <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-700 mb-2">Lựa chọn phiên bản:</h3>

            {groups.map((group: any) => (
                <div key={group.id} className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">{group.name}</p>
                    <div className="flex flex-wrap gap-2">
                        {(group.optionSelectDTOS || []).map((sel: any) => {
                            const isSelected = selectedByGroup[group.id] === sel.id;
                            return (
                                <button
                                    key={sel.id}
                                    onClick={() => handleSelectChange(group.id, sel.id)}
                                    className={
                                        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ' +
                                        'transform transition-all duration-150 ' +
                                        (isSelected
                                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg ring-2 ring-indigo-400 scale-105'
                                            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100 hover:border-indigo-400 hover:text-indigo-700')
                                    }
                                >
                                    <span>{sel.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default VariantOptionSelector;
