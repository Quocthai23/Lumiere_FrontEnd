import React, { useState, useEffect, useMemo } from 'react';
import axiosClient from '../../api/axiosClient';
import WarehouseFormModal from '../../components/admin/WarehouseFormModal';
import { PlusCircle, Search } from 'lucide-react';
import httpClient from "../../utils/HttpClient.ts";

// Định nghĩa kiểu dữ liệu cho Warehouse
interface Warehouse {
  id: number;
  name: string;
  address: string;
  isActive: boolean;
}

// --- Reusable UI Components ---
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 border-b ${className}`}>{children}</div>
);
const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <h3 className={`font-semibold text-lg ${className}`}>{children}</h3>
);
const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 ${className}`}>{children}</div>
);

const WarehouseManagementPage: React.FC = () => {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchWarehouses = async () => {
        setIsLoading(true);
        try {
            const response = await httpClient.get<Warehouse[]>('/warehouses?sort=id,asc');
            // Sửa lỗi: Đảm bảo setWarehouses luôn nhận được một mảng
            setWarehouses(response || []);
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

    const filteredWarehouses = useMemo(() => {
        return warehouses.filter(wh => 
            wh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wh.address.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [warehouses, searchTerm]);

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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý Kho Hàng</h1>
                <button onClick={handleOpenModalForCreate} className="flex items-center gap-2 bg-indigo-600 text-white rounded-md px-3 py-2 text-sm hover:bg-indigo-700">
                    <PlusCircle className="h-4 w-4" />
                    Thêm Kho Mới
                </button>
            </div>
            <Card>
                <CardHeader>
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <input
                            type="search"
                            placeholder="Tìm kiếm kho hàng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 pr-2 py-2 w-full border rounded-md bg-gray-50"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-500">
                            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                <tr>
                                    <th className="px-6 py-3">Tên Kho</th>
                                    <th className="px-6 py-3">Địa chỉ</th>
                                    <th className="px-6 py-3">Trạng thái</th>
                                    <th className="px-6 py-3 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr><td colSpan={4} className="text-center p-8">Đang tải...</td></tr>
                                ) : error ? (
                                     <tr><td colSpan={4} className="text-center p-8 text-red-500">{error}</td></tr>
                                ) : filteredWarehouses.map((wh) => (
                                    <tr key={wh.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-800">{wh.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{wh.address}</td>
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
                         { !isLoading && filteredWarehouses.length === 0 && (
                            <p className="p-8 text-center text-gray-500">Không có kho hàng nào được tìm thấy.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
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
