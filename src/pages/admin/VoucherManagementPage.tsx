import React, { useState, useEffect, useMemo } from 'react';
import axiosClient from '../../api/axiosClient';
import VoucherFormModal from '../../components/admin/VoucherFormModal';
import type { Voucher } from '../../types/voucher';
import { PlusCircle, Search } from 'lucide-react';

// --- Reusable UI Components ---
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 border-b ${className}`}>{children}</div>
);
const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 ${className}`}>{children}</div>
);
const TabButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-medium rounded-md ${active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
    >
        {children}
    </button>
);


const VoucherManagementPage: React.FC = () => {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');

    const fetchVouchers = async () => {
        setIsLoading(true);
        try {
            const response = await axiosClient.get('/vouchers?sort=id,asc');
            // Sửa lỗi: Đảm bảo setVouchers luôn nhận được một mảng
            setVouchers(response.data || []);
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

    const filteredVouchers = useMemo(() => {
        return vouchers
            .filter(v => {
                if (activeTab === 'ALL') return true;
                return v.status === activeTab;
            })
            .filter(v => v.code.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [vouchers, activeTab, searchTerm]);

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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý Mã Giảm Giá</h1>
                <button onClick={handleOpenModalForCreate} className="flex items-center gap-2 bg-indigo-600 text-white rounded-md px-3 py-2 text-sm hover:bg-indigo-700">
                    <PlusCircle className="h-4 w-4" />
                    Thêm Mã Mới
                </button>
            </div>
             <Card>
                <CardHeader>
                     <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 border rounded-md p-1 bg-gray-50">
                            <TabButton active={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')}>Tất cả</TabButton>
                            <TabButton active={activeTab === 'ACTIVE'} onClick={() => setActiveTab('ACTIVE')}>Hoạt động</TabButton>
                            <TabButton active={activeTab === 'INACTIVE'} onClick={() => setActiveTab('INACTIVE')}>Không hoạt động</TabButton>
                            <TabButton active={activeTab === 'EXPIRED'} onClick={() => setActiveTab('EXPIRED')}>Hết hạn</TabButton>
                        </div>
                        <div className="relative w-full md:w-1/3">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <input
                                type="search"
                                placeholder="Tìm theo mã code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-2 py-2 w-full border rounded-md bg-gray-50"
                            />
                        </div>
                    </div>
                </CardHeader>
                 <CardContent>
                    <div className="overflow-x-auto">
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
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr><td colSpan={6} className="text-center p-8">Đang tải...</td></tr>
                                ) : error ? (
                                     <tr><td colSpan={6} className="text-center p-8 text-red-500">{error}</td></tr>
                                ) : filteredVouchers.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50">
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
                        { !isLoading && filteredVouchers.length === 0 && (
                            <p className="p-8 text-center text-gray-500">Không có mã giảm giá nào phù hợp.</p>
                        )}
                    </div>
                 </CardContent>
            </Card>

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
