import React, { useRef, useState, useCallback } from 'react';
import httpClient from '../../utils/HttpClient.ts';
import type { AttachmentDTO } from '../../types/types.ts';

type UploadItem = {
    file: File;
    uploadId: string;
    progress: number;
    status: 'queued' | 'uploading' | 'done' | 'error';
    dto?: AttachmentDTO;         // ✅ lưu DTO
    error?: string;
    previewUrl: string;
};

const CHUNK_SIZE = 1 * 1024 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_SIZE = 20 * 1024 * 1024;

function genUploadId() {
    return window.crypto?.randomUUID?.() ?? `u_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}


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


export default function ChunkUploadGallery({
                                               existingAttachments,
                                               onAddAttachments,
                                               onRemoveAttachment,
                                               onSetAttachments,
                                           }: {
    existingAttachments: AttachmentDTO[];
    onAddAttachments: (atts: AttachmentDTO[]) => void;
    onRemoveAttachment: (att: AttachmentDTO) => void;
    onSetAttachments?: (atts: AttachmentDTO[]) => void;
}) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [queue, setQueue] = useState<UploadItem[]>([]);
    const [dragOver, setDragOver] = useState(false);

    const pickFiles = () => inputRef.current?.click();

    const validate = (files: File[]) => {
        const ok: File[] = [];
        const rejected: string[] = [];
        files.forEach(f => {
            if (!ACCEPTED.includes(f.type)) rejected.push(`${f.name}: loại file không hợp lệ (${f.type})`);
            else if (f.size > MAX_SIZE) rejected.push(`${f.name}: vượt quá ${MAX_SIZE / 1024 / 1024}MB`);
            else ok.push(f);
        });
        return { ok, rejected };
    };

    const enqueueAndUpload = async (files: File[]) => {
        if (!files.length) return;

        const items: UploadItem[] = files.map(f => ({
            file: f,
            uploadId: genUploadId(),
            progress: 0,
            status: 'queued',
            previewUrl: URL.createObjectURL(f),
        }));
        setQueue(prev => [...prev, ...items]);

        const added: AttachmentDTO[] = [];

        for (const it of items) {
            try {
                it.status = 'uploading';
                setQueue(q => [...q]);

                const dto = await uploadChunksWithTwoApis(it.file, it.uploadId, pct => {
                    it.progress = pct;
                    setQueue(q => [...q]);
                });

                it.dto = dto;
                it.progress = 100;
                it.status = 'done';
                setQueue(q => [...q]);

                if (dto) added.push(dto);
            } catch (err: any) {
                it.status = 'error';
                it.error = err?.message || 'Upload lỗi';
                setQueue(q => [...q]);
            }
        }

        // 🔁 Bạn muốn set nguyên cái list DTO từ lần upload này
        if (added.length) {
            if (onSetAttachments) onSetAttachments(added);
            else onAddAttachments(added); // fallback: cộng dồn
        }
    };

    const onFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const { ok, rejected } = validate(files);
        if (rejected.length) alert(rejected.join('\n'));
        await enqueueAndUpload(ok);
        e.target.value = '';
    };

    const onDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files || []);
        const { ok, rejected } = validate(files);
        if (rejected.length) alert(rejected.join('\n'));
        await enqueueAndUpload(ok);
    }, []);

    return (
        <div>
            {/* Preview từ server (AttachmentDTO.url) */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {existingAttachments.map(att => (
                    <div key={att.id ?? att.url} className="relative group">
                        <img src={att.url} alt={att.fileName} className="w-full h-32 object-cover rounded-md" />
                        <button
                            onClick={() => onRemoveAttachment(att)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Xoá"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* Kéo-thả + chọn file */}
            <div
                className={`mt-4 border-2 border-dashed rounded-md p-6 text-center cursor-pointer ${
                    dragOver ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
                }`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={pickFiles}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED.join(',')}
                    multiple
                    className="hidden"
                    onChange={onFilesSelected}
                />
                <p className="text-sm text-gray-600">
                    Kéo & thả ảnh vào đây hoặc <span className="text-indigo-600 underline">chọn file</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">Hỗ trợ JPG/PNG/WEBP/GIF, tối đa 20MB/ảnh.</p>
            </div>

            {/* Hàng đợi + progress (preview tạm thời) */}
            {queue.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3">
                    {queue.map((it, idx) => (
                        <div key={idx} className="border rounded-md p-3">
                            <div className="flex items-center gap-3">
                                <img
                                    src={it.previewUrl}
                                    alt="preview"
                                    className="w-16 h-16 object-cover rounded"
                                    onLoad={() => URL.revokeObjectURL(it.previewUrl)}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="truncate">
                                            {it.file.name} ({Math.ceil(it.file.size / 1024)} KB)
                                        </div>
                                        <div className={`ml-4 ${it.status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                                            {it.status === 'queued' && 'Chờ'}
                                            {it.status === 'uploading' && 'Đang tải lên...'}
                                            {it.status === 'done' && 'Hoàn tất'}
                                            {it.status === 'error' && (it.error || 'Lỗi')}
                                        </div>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded mt-2">
                                        <div
                                            className={`h-2 rounded ${it.status === 'error' ? 'bg-red-500' : 'bg-indigo-600'}`}
                                            style={{ width: `${it.progress}%` }}
                                        />
                                    </div>
                                    {it.dto && (
                                        <div className="mt-2 text-xs text-green-700 break-all">
                                            Saved: {it.dto.fileName} • {it.dto.size} bytes
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
