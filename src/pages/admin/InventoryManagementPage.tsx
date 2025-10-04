import React, { useState, useEffect, useMemo } from 'react';
import axiosClient from '../../api/axiosClient';
import type { Inventory } from '../../types/inventory';
import type { Warehouse } from '../../types/warehouse';
import StockAdjustmentModal from '../../components/admin/StockAdjustmentModal';
import { Search } from 'lucide-react';

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


const InventoryManagementPage: React.FC = () => {
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);

    // State for filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState('all');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [inventoryRes, warehouseRes] = await Promise.all([
                axiosClient.get('/inventories?sort=id,asc'),
                axiosClient.get('/warehouses?sort=id,asc')
            ]);
            
            // Sửa lỗi: Đảm bảo setInventories luôn nhận được một mảng
            setInventories(inventoryRes.data || []);
            setWarehouses(warehouseRes.data || []);
            setError(null);
        } catch (err) {
            setError('Không thể tải dữ liệu tồn kho.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const filteredInventories = useMemo(() => {
        return inventories
            .filter(inv => {
                if (selectedWarehouse === 'all') return true;
                return inv.warehouse.id === parseInt(selectedWarehouse, 10);
            })
            .filter(inv => 
                inv.productVariant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.productVariant.sku.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [inventories, searchTerm, selectedWarehouse]);

    const handleOpenModal = (inventory: Inventory) => {
        setSelectedInventory(inventory);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedInventory(null);
    };
    
    const handleSaveStockAdjustment = async (adjustmentData: { newQuantity: number; note: string; }) => {
        if (!selectedInventory) return;
        
        const { newQuantity, note } = adjustmentData;
        const quantityChange = newQuantity - selectedInventory.stockQuantity;

        const stockMovementPayload = {
            reason: 'ADJUSTMENT',
            quantityChange: quantityChange,
            note: note,
            productVariant: { id: selectedInventory.productVariant.id },
            warehouse: { id: selectedInventory.warehouse.id },
        };
        
        try {
            // Note: This endpoint might not exist in mock API, but this is the correct logic
            await axiosClient.post('/stock-movements', stockMovementPayload);
            
            // For mock API, we directly update the state to reflect change
            const updatedInventories = inventories.map(inv => 
                inv.id === selectedInventory.id ? { ...inv, stockQuantity: newQuantity } : inv
            );
            setInventories(updatedInventories);

            handleCloseModal();
        } catch (err) {
            console.error("Lỗi khi điều chỉnh tồn kho:", err);
            alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Quản lý Tồn Kho</h1>
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4">
                         <div className="relative w-full md:w-1/2 lg:w-1/3">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <input
                                type="search"
                                placeholder="Tìm theo tên sản phẩm, SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-2 py-2 w-full border rounded-md bg-gray-50"
                            />
                        </div>
                        <select 
                            value={selectedWarehouse}
                            onChange={(e) => setSelectedWarehouse(e.target.value)}
                            className="border rounded-md p-2 bg-gray-50 w-full md:w-auto"
                        >
                            <option value="all">Tất cả kho</option>
                            {warehouses.map(wh => (
                                <option key={wh.id} value={wh.id}>{wh.name}</option>
                            ))}
                        </select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-500">
                            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                <tr>
                                    <th className="px-6 py-3">SKU</th>
                                    <th className="px-6 py-3">Tên Phiên bản</th>
                                    <th className="px-6 py-3">Kho</th>
                                    <th className="px-6 py-3">Số lượng tồn</th>
                                    <th className="px-6 py-3 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="text-center p-8">Đang tải...</td></tr>
                                ) : error ? (
                                     <tr><td colSpan={5} className="text-center p-8 text-red-500">{error}</td></tr>
                                ) : filteredInventories.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-gray-700">{inv.productVariant.sku}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800">{inv.productVariant.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{inv.warehouse.name}</td>
                                        <td className="px-6 py-4 font-bold text-lg text-indigo-600">{inv.stockQuantity}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleOpenModal(inv)} className="font-medium text-indigo-600 hover:underline">
                                                Điều chỉnh
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        { !isLoading && filteredInventories.length === 0 && (
                            <p className="p-8 text-center text-gray-500">Không có dữ liệu tồn kho phù hợp.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
            
            {selectedInventory && (
                 <StockAdjustmentModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSaveStockAdjustment}
                    inventoryItem={selectedInventory}
                />
            )}
        </div>
    );
};

export default InventoryManagementPage;
