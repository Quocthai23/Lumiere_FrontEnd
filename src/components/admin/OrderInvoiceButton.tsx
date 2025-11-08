import React, { useState } from 'react';
import httpClient from "../../utils/HttpClient.ts"; // dùng client có token sẵn

type Props = { orderId: number };

const OrderInvoiceButton: React.FC<Props> = ({ orderId }) => {
    const [downloading, setDownloading] = useState(false);

    async function downloadInvoice(orderId: number) {
        setDownloading(true);
        try {
            // trả về { data: Blob, headers: Record<string,string> }
            const res = await httpClient.get<Blob>(`/orders/${orderId}/invoice`, {
                responseType: 'blob',
            } as any);

            const blob: Blob = (res instanceof Blob) ? res : new Blob([res], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });

            // Lấy tên file từ header (nếu có)
            let filename = `invoice_${orderId}.xlsx`;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Không thể tải hóa đơn.');
        } finally {
            setDownloading(false);
        }
    }


    return (
        <button
            onClick={()=>{downloadInvoice(orderId);}}
            disabled={downloading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm disabled:opacity-60"
        >
            {downloading ? 'Đang tạo…' : 'In hóa đơn'}
        </button>
    );
};

export default OrderInvoiceButton;
