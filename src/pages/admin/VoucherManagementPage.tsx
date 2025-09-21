import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import VoucherFormModal from '../../components/admin/VoucherFormModal';
import type { Voucher } from '../../types/voucher';

const VoucherManagementPage: React.FC = () => {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

    const fetchVouchers = async () => {
        setIsLoading(true);
        try {
            const response = await axiosClient.get('/vouchers?sort=id,asc');
            setVouchers(response.data);
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách mã giảm giá.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    const handleOpenModalForCreate = () => {
        setEditingVoucher(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (voucher: Voucher) => {
        setEditingVoucher(voucher);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVoucher(null);
    };

    const handleSaveVoucher = async (voucherData: Omit<Voucher, 'id' | 'usageCount'> & { id?: number }) => {
        try {
            if (editingVoucher) {
                await axiosClient.put(`/vouchers/${editingVoucher.id}`, voucherData);
            } else {
                await axiosClient.post('/vouchers', voucherData);
            }
            handleCloseModal();
            fetchVouchers();
        } catch (err) {
            console.error("Lỗi khi lưu mã giảm giá:", err);
            alert("Đã có lỗi xảy ra.");
        }
    };
    
    const getStatusClass = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800';
            case 'INACTIVE': return 'bg-gray-100 text-gray-800';
            case 'EXPIRED': return 'bg-red-100 text-red-800';
            default: return '';
        }
    };

    if (isLoading) return <p>Đang tải...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý Mã Giảm Giá</h1>
                <button onClick={handleOpenModalForCreate} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    + Thêm Mã Mới
                </button>
            </div>
             <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                        <tr>
                            <th className="px-6 py-3">Mã Code</th>
                            <th className="px-6 py-3">Loại</th>
                            <th className="px-6 py-3">Giá trị</th>
                            <th className="px-6 py-3">Trạng thái</th>
                            <th className="px-6 py-3">Đã dùng / Giới hạn</th>
                            <th className="px-6 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vouchers.map((v) => (
                            <tr key={v.id} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono font-bold text-indigo-600">{v.code}</td>
                                <td className="px-6 py-4">{v.type === 'PERCENTAGE' ? 'Phần trăm' : 'Số tiền cố định'}</td>
                                <td className="px-6 py-4">{v.type === 'PERCENTAGE' ? `${v.value}%` : `${v.value.toLocaleString('vi-VN')} VND`}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(v.status)}`}>
                                        {v.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{v.usageCount || 0} / {v.usageLimit || '∞'}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleOpenModalForEdit(v)} className="font-medium text-indigo-600 hover:underline">
                                        Sửa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <VoucherFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveVoucher}
                voucher={editingVoucher}
            />
        </div>
    );
};

export default VoucherManagementPage;
