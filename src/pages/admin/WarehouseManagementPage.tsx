import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import WarehouseFormModal from '../../components/admin/WarehouseFormModal';

// Định nghĩa kiểu dữ liệu cho Warehouse
interface Warehouse {
  id: number;
  name: string;
  address: string;
  isActive: boolean;
}

const WarehouseManagementPage: React.FC = () => {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

    const fetchWarehouses = async () => {
        setIsLoading(true);
        try {
            const response = await axiosClient.get('/warehouses?sort=id,asc');
            setWarehouses(response.data);
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách kho hàng.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const handleOpenModalForCreate = () => {
        setEditingWarehouse(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (warehouse: Warehouse) => {
        setEditingWarehouse(warehouse);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingWarehouse(null);
    };

    const handleSaveWarehouse = async (warehouseData: Omit<Warehouse, 'id'> & { id?: number }) => {
        try {
            if (editingWarehouse) {
                await axiosClient.put(`/warehouses/${editingWarehouse.id}`, warehouseData);
            } else {
                await axiosClient.post('/warehouses', warehouseData);
            }
            handleCloseModal();
            fetchWarehouses();
        } catch (err) {
            console.error("Lỗi khi lưu kho hàng:", err);
            alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
        }
    };

    if (isLoading) return <p>Đang tải...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý Kho Hàng</h1>
                <button onClick={handleOpenModalForCreate} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    + Thêm Kho Mới
                </button>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                        <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Tên Kho</th>
                            <th className="px-6 py-3">Địa chỉ</th>
                            <th className="px-6 py-3">Trạng thái</th>
                            <th className="px-6 py-3 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {warehouses.map((wh) => (
                            <tr key={wh.id} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold">{wh.id}</td>
                                <td className="px-6 py-4">{wh.name}</td>
                                <td className="px-6 py-4">{wh.address}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${wh.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {wh.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleOpenModalForEdit(wh)} className="font-medium text-indigo-600 hover:underline">
                                        Sửa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <WarehouseFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveWarehouse}
                warehouse={editingWarehouse}
            />
        </div>
    );
};

export default WarehouseManagementPage;
