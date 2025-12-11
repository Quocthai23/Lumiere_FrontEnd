import React, { useState, useEffect, useMemo } from 'react';
import { flashSaleApi } from '../../api/flashSaleApi';
import type { FlashSale, FlashSaleProduct } from '../../types/flashSale';
import FlashSaleFormModal from '../../components/admin/FlashSaleFormModal';
import FlashSaleProductModal from '../../components/admin/FlashSaleProductModal';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { Edit, PlusCircle, Search, Trash2, Package, Calendar, Clock } from 'lucide-react';

// Reusable UI Components
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

const AdminFlashSalePage: React.FC = () => {
    const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingFlashSale, setEditingFlashSale] = useState<FlashSale | null>(null);
    const [selectedFlashSale, setSelectedFlashSale] = useState<FlashSale | null>(null);
    const [confirmState, setConfirmState] = useState<{
        open: boolean;
        id?: number;
    }>({ open: false });
    const [deleting, setDeleting] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');

    const fetchFlashSales = async () => {
        setIsLoading(true);
        try {
            const response = await flashSaleApi.getAllFlashSales();
            setFlashSales(response || []);
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách Flash Sale.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFlashSales();
    }, []);

    const getFlashSaleStatus = (flashSale: FlashSale): 'ACTIVE' | 'UPCOMING' | 'ENDED' => {
        const now = new Date();
        const startTime = new Date(flashSale.startTime);
        const endTime = new Date(flashSale.endTime);

        if (now < startTime) return 'UPCOMING';
        if (now > endTime) return 'ENDED';
        return 'ACTIVE';
    };

    const filteredFlashSales = useMemo(() => {
        return flashSales
            .filter(fs => {
                if (activeTab === 'ALL') return true;
                const status = getFlashSaleStatus(fs);
                return status === activeTab;
            })
            .filter(fs => fs.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [flashSales, activeTab, searchTerm]);

    const handleOpenModalForCreate = () => {
        setEditingFlashSale(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (flashSale: FlashSale) => {
        setEditingFlashSale(flashSale);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingFlashSale(null);
    };

    const handleOpenProductModal = (flashSale: FlashSale) => {
        setSelectedFlashSale(flashSale);
        setIsProductModalOpen(true);
    };

    const handleCloseProductModal = () => {
        setIsProductModalOpen(false);
        setSelectedFlashSale(null);
    };

    const handleSaveFlashSale = async (flashSaleData: Omit<FlashSale, 'id' | 'products'> & { id?: number }) => {
        try {
            if (editingFlashSale?.id) {
                await flashSaleApi.updateFlashSale(editingFlashSale.id, flashSaleData);
            } else {
                await flashSaleApi.createFlashSale(flashSaleData);
            }
            handleCloseModal();
            fetchFlashSales();
        } catch (err) {
            console.error("Lỗi khi lưu Flash Sale:", err);
            alert("Đã có lỗi xảy ra.");
        }
    };

    const requestDeleteFlashSale = (id: number) => {
        setConfirmState({ open: true, id });
    };

    const handleDeleteFlashSale = async () => {
        if (!confirmState.id) return;
        try {
            setDeleting(true);
            await flashSaleApi.deleteFlashSale(confirmState.id);
            setFlashSales(prev => prev.filter(fs => fs.id !== confirmState.id));
            setConfirmState({ open: false, id: undefined });
        } catch (err) {
            console.error("Lỗi khi xóa Flash Sale:", err);
            alert("Xóa thất bại. Flash Sale có thể đang được sử dụng.");
        } finally {
            setDeleting(false);
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: 'ACTIVE' | 'UPCOMING' | 'ENDED') => {
        const classes = {
            ACTIVE: 'bg-green-100 text-green-800',
            UPCOMING: 'bg-blue-100 text-blue-800',
            ENDED: 'bg-gray-100 text-gray-800'
        };
        const labels = {
            ACTIVE: 'Đang diễn ra',
            UPCOMING: 'Sắp diễn ra',
            ENDED: 'Đã kết thúc'
        };
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${classes[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý Flash Sale</h1>
                <button 
                    onClick={handleOpenModalForCreate} 
                    className="flex items-center gap-2 bg-indigo-600 text-white rounded-md px-3 py-2 text-sm hover:bg-indigo-700"
                >
                    <PlusCircle className="h-4 w-4" />
                    Tạo Flash Sale Mới
                </button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 border rounded-md p-1 bg-gray-50">
                            <TabButton active={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')}>
                                Tất cả
                            </TabButton>
                            <TabButton active={activeTab === 'ACTIVE'} onClick={() => setActiveTab('ACTIVE')}>
                                Đang diễn ra
                            </TabButton>
                            <TabButton active={activeTab === 'UPCOMING'} onClick={() => setActiveTab('UPCOMING')}>
                                Sắp diễn ra
                            </TabButton>
                            <TabButton active={activeTab === 'ENDED'} onClick={() => setActiveTab('ENDED')}>
                                Đã kết thúc
                            </TabButton>
                        </div>
                        <div className="relative w-full md:w-1/3">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <input
                                type="search"
                                placeholder="Tìm theo tên..."
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
                                    <th className="px-6 py-3">Tên</th>
                                    <th className="px-6 py-3">Thời gian bắt đầu</th>
                                    <th className="px-6 py-3">Thời gian kết thúc</th>
                                    <th className="px-6 py-3">Trạng thái</th>
                                    <th className="px-6 py-3">Số sản phẩm</th>
                                    <th className="px-6 py-3 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr><td colSpan={6} className="text-center p-8">Đang tải...</td></tr>
                                ) : error ? (
                                    <tr><td colSpan={6} className="text-center p-8 text-red-500">{error}</td></tr>
                                ) : filteredFlashSales.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center p-8 text-gray-500">Không có Flash Sale nào.</td></tr>
                                ) : filteredFlashSales.map((fs) => {
                                    const status = getFlashSaleStatus(fs);
                                    return (
                                        <tr key={fs.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-semibold text-gray-900">{fs.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    {formatDateTime(fs.startTime)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-gray-400" />
                                                    {formatDateTime(fs.endTime)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{getStatusBadge(status)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-gray-400" />
                                                    {fs.products?.length || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end items-center gap-3">
                                                    <button
                                                        onClick={() => handleOpenProductModal(fs)}
                                                        className="text-blue-600 hover:text-blue-700 focus:outline-none p-2 rounded-lg hover:bg-blue-50"
                                                        title="Quản lý sản phẩm"
                                                    >
                                                        <Package size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModalForEdit(fs)}
                                                        className="text-indigo-600 hover:text-indigo-700 focus:outline-none p-2 rounded-lg hover:bg-indigo-50"
                                                        title="Sửa"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => fs.id && requestDeleteFlashSale(fs.id)}
                                                        className="text-red-600 hover:text-red-700 focus:outline-none p-2 rounded-lg hover:bg-red-50"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <FlashSaleFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveFlashSale}
                flashSale={editingFlashSale}
            />

            {selectedFlashSale && (
                <FlashSaleProductModal
                    isOpen={isProductModalOpen}
                    onClose={handleCloseProductModal}
                    flashSale={selectedFlashSale}
                    onUpdate={fetchFlashSales}
                />
            )}

            <ConfirmModal
                open={confirmState.open}
                title="Xóa Flash Sale?"
                message={
                    <>
                        Hành động này <b>không thể hoàn tác</b>.
                        <br />
                        Bạn có chắc muốn xóa Flash Sale này?
                    </>
                }
                confirmText="Xóa vĩnh viễn"
                cancelText="Hủy"
                loading={deleting}
                onConfirm={handleDeleteFlashSale}
                onClose={() => !deleting && setConfirmState({ open: false })}
            />
        </div>
    );
};

export default AdminFlashSalePage;

