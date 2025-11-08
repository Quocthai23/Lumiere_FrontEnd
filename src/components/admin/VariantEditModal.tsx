import React, { useEffect, useMemo, useRef, useState } from 'react';
import httpClient from '../../utils/HttpClient.ts';

type Props = {
    open: boolean;
    variant?: any | null;           // dùng any theo yêu cầu
    onClose: () => void;
    onSaved?: (v: any) => void;     // trả về variant đã lưu
};

/** ===== Config & Utils cho chunk upload ===== */
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB/part

function genUploadId() {
    // uuid đơn giản
    return 'up_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Trả về đối tượng có ít nhất field url để binding vào imageUrl */
type AttachmentDTO = { id?: number; url: string; [k: string]: any };

/** Upload theo 2 API: /chunk-upload/chunk và /chunk-upload/complete */
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

        // Tùy HttpClient.ts của bạn: nếu yêu cầu headers bọc trong {headers:{}}, sửa lại cho khớp.
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

/** ===== Helpers khác ===== */
function formatVND(n?: number | null) {
    const v = typeof n === 'number' ? n : 0;
    return v.toLocaleString('vi-VN');
}

const VariantEditModal: React.FC<Props> = ({ open, variant, onClose, onSaved }) => {
    // form state
    const [name, setName] = useState<string>(variant?.name ?? '');
    const [priceRaw, setPriceRaw] = useState<number>(variant?.price ?? 0);
    const [imageUrl, setImageUrl] = useState<string | null>(variant?.urlImage ?? null);

    // UI state
    const [saving, setSaving] = useState(false);

    // upload state
    const [uploadPct, setUploadPct] = useState<number>(0);
    const [uploading, setUploading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // reset khi mở
    useEffect(() => {
        if (open) {
            setName(variant?.name ?? '');
            setPriceRaw(variant?.price ?? 0);
            setImageUrl(variant?.urlImage ?? null);
            setSaving(false);
            setUploading(false);
            setUploadPct(0);
        }
    }, [open, variant?.id]);

    const priceDisplay = useMemo(() => formatVND(priceRaw), [priceRaw]);

    function parseVNDInput(val: string) {
        const digits = val.replace(/[^\d]/g, '');
        setPriceRaw(digits ? Number(digits) : 0);
    }

    async function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            setUploadPct(0);

            const uploadId = genUploadId();
            const dto = await uploadChunksWithTwoApis(file, uploadId, (pct) => setUploadPct(pct));

            // Chỉ lấy url để lưu
            if (!dto?.url) {
                throw new Error('Server không trả về url');
            }
            setImageUrl(dto.url);
        } catch (err) {
            console.error(err);
            alert('Upload ảnh thất bại.');
        } finally {
            setUploading(false);
            setUploadPct(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    function triggerPickFile() {
        fileInputRef.current?.click();
    }

    function clearImage() {
        setImageUrl(null);
    }

    async function save() {
        if (!variant?.id) return;
        const trimmed = (name || '').trim();
        if (!trimmed) return;

        try {
            setSaving(true);

            const payload: any = {
                id: variant.id,
                productId: variant.productId,
                name: trimmed,
                price: priceRaw,
                urlImage: imageUrl || null,   // chỉ gửi imageUrl
            };

            const updated = await httpClient.put<any>(`/product-variants/${variant.id}`, payload);
            onSaved?.(updated);
            onClose();
        } catch (e) {
            console.error(e);
            alert('Lưu biến thể thất bại.');
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Sửa biến thể</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Đóng</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: fields */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Tên biến thể</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="border rounded px-2 py-2 w-full"
                                placeholder="VD: Đỏ / M"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Giá (VND)</label>
                            <input
                                value={priceDisplay}
                                onChange={(e) => parseVNDInput(e.target.value)}
                                inputMode="numeric"
                                className="border rounded px-2 py-2 w-full tracking-wider"
                                placeholder="VD: 199.000"
                            />
                            <p className="text-xs text-gray-500 mt-1">Giá trị lưu: {priceRaw.toString()} ₫</p>
                        </div>

                        {/* Upload chunk */}
                        <div className="space-y-2">
                            <label className="block text-sm text-gray-700">Tải ảnh (chunk upload)</label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={triggerPickFile}
                                    className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm"
                                    disabled={uploading}
                                >
                                    Chọn file
                                </button>
                                {imageUrl && (
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="px-3 py-2 rounded bg-red-50 hover:bg-red-100 border border-red-200 text-sm text-red-700"
                                    >
                                        Gỡ ảnh
                                    </button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePickFile}
                            />
                            {uploading && (
                                <div className="w-full h-2 bg-gray-200 rounded">
                                    <div
                                        className="h-2 bg-emerald-500 rounded transition-all"
                                        style={{ width: `${uploadPct}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: image url + preview */}
                    <div className="space-y-2">
                        <div className="w-56 h-56 border rounded-md bg-gray-50 overflow-hidden flex items-center justify-center">
                            {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={imageUrl} alt="preview" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <span className="text-gray-400 text-sm">Chưa có ảnh</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        disabled={saving || uploading}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={save}
                        className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-300"
                        disabled={saving || uploading}
                    >
                        {saving ? 'Đang lưu…' : 'Lưu'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VariantEditModal;
