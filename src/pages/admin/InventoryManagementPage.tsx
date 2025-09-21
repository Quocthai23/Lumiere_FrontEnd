import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import type { Inventory } from '../../types/inventory';
import StockAdjustmentModal from '../../components/admin/StockAdjustmentModal';

const InventoryManagementPage: React.FC = () => {
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);

    const fetchInventories = async () => {
        setIsLoading(true);
        try {
            const response = await axiosClient.get('/inventories?sort=id,asc');
            setInventories(response.data);
            setError(null);
        } catch (err) {
            setError('Không thể tải dữ liệu tồn kho.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInventories();
    }, []);
    
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
            await axiosClient.post('/stock-movements', stockMovementPayload);
            handleCloseModal();
            fetchInventories(); 
        } catch (err) {
            console.error("Lỗi khi điều chỉnh tồn kho:", err);
            alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
        }
    };

    if (isLoading) return <p>Đang tải...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Quản lý Tồn Kho</h1>
             <div className="overflow-x-auto bg-white rounded-lg shadow">
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
                    <tbody>
                        {inventories.map((inv) => (
                            <tr key={inv.id} className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono">{inv.productVariant.sku}</td>
                                <td className="px-6 py-4">{inv.productVariant.name}</td>
                                <td className="px-6 py-4">{inv.warehouse.name}</td>
                                <td className="px-6 py-4 font-bold">{inv.stockQuantity}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleOpenModal(inv)} className="font-medium text-indigo-600 hover:underline">
                                        Điều chỉnh
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {inventories.length === 0 && (
                    <p className="p-4 text-center text-gray-500">Chưa có dữ liệu tồn kho.</p>
                )}
            </div>
            
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
