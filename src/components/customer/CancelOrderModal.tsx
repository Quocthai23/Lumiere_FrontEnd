import React, { useState, useEffect, useRef } from 'react';

interface CancelOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    orderCode: string;
    isCancelling?: boolean;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    orderCode,
    isCancelling = false,
}) => {
    const [reason, setReason] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setReason('');
            // Focus vào textarea khi modal mở
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
            // Lock body scroll
            document.body.style.overflow = 'hidden';
        } else {
            // Unlock body scroll
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        function handleEscape(e: KeyboardEvent) {
            if (e.key === 'Escape' && isOpen && !isCancelling) {
                onClose();
            }
        }
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, isCancelling, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            alert('Vui lòng nhập lý do hủy đơn hàng.');
            return;
        }
        await onConfirm(reason.trim());
    };

    if (!isOpen) return null;

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
                aria-labelledby="cancel-modal-title"
            >
                <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                    <form onSubmit={handleSubmit}>
                        <div className="px-6 pt-6">
                            <h2 id="cancel-modal-title" className="text-xl font-semibold mb-2">
                                Hủy đơn hàng
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Vui lòng nhập lý do hủy đơn hàng <span className="font-semibold">#{orderCode}</span>
                            </p>
                            <textarea
                                ref={textareaRef}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Nhập lý do hủy đơn hàng..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                rows={4}
                                required
                                disabled={isCancelling}
                            />
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3 border-t px-6 py-4">
                            <button
                                type="button"
                                className="rounded-xl border px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                onClick={onClose}
                                disabled={isCancelling}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={isCancelling || !reason.trim()}
                            >
                                {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CancelOrderModal;








