import React, { useState } from 'react';
import httpClient from "../../utils/HttpClient.ts"; // dùng client có token sẵn

type Props = { orderId: number };

const OrderInvoiceButton: React.FC<Props> = ({ orderId }) => {
    const [downloading, setDownloading] = useState(false);

    async function downloadInvoice(orderId: number) {
        setDownloading(true);
        try {
            // Sử dụng endpoint mới từ backend: GET /orders/{id}/invoice
            // Endpoint này trả về blob (Excel file), cần dùng fetch trực tiếp
            const token = localStorage.getItem('accessToken');
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
            const response = await fetch(`${baseUrl}/orders/${orderId}/invoice`, {
                method: 'GET',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            
            // Lấy tên file từ header (nếu có)
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `invoice_${orderId}.xlsx`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

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
