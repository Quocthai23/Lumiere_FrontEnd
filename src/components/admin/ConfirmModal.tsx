// src/components/common/ConfirmModal.tsx
import React, { useEffect, useRef } from "react";

type Props = {
    open: boolean;
    title?: string;
    message?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onClose: () => void;
    loading?: boolean;
};

const ConfirmModal: React.FC<Props> = ({
                                           open,
                                           title = "Xác nhận",
                                           message = "Bạn có chắc muốn thực hiện thao tác này?",
                                           confirmText = "Xóa",
                                           cancelText = "Hủy",
                                           onConfirm,
                                           onClose,
                                           loading = false,
                                       }) => {
    const firstBtnRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (open) {
            document.addEventListener("keydown", onKey);
            // focus nút hủy để tránh Enter lỡ tay
            setTimeout(() => firstBtnRef.current?.focus(), 0);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className="absolute inset-0 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
            >
                <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                    <div className="px-6 pt-6">
                        <h2 id="confirm-title" className="text-lg font-semibold">
                            {title}
                        </h2>
                        <div className="mt-3 text-sm text-gray-600">{message}</div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3 border-t px-6 py-4">
                        <button
                            ref={firstBtnRef}
                            type="button"
                            className="rounded-xl border px-4 py-2 text-gray-700 hover:bg-gray-50"
                            onClick={onClose}
                            disabled={loading}
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-60"
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {loading ? "Đang xóa..." : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
