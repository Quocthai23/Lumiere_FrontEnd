import React, { useState, useEffect } from 'react';
import type { Inventory } from '../../types/inventory';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { newQuantity: number; note: string }) => void;
  inventoryItem: Inventory;
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ isOpen, onClose, onSave, inventoryItem }) => {
  const [newQuantity, setNewQuantity] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (inventoryItem) {
      setNewQuantity(inventoryItem.stockQuantity);
      setNote('');
    }
  }, [inventoryItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ newQuantity, note });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2">Điều chỉnh Tồn Kho</h2>
        <p className="text-sm text-gray-600 mb-4">
            Sản phẩm: <strong>{inventoryItem.productVariant.name}</strong> tại kho <strong>{inventoryItem.warehouse.name}</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentQuantity" className="block text-sm font-medium text-gray-700">Số lượng hiện tại</label>
            <input type="number" id="currentQuantity" value={inventoryItem.stockQuantity} className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm p-2" readOnly />
          </div>
          <div>
            <label htmlFor="newQuantity" className="block text-sm font-medium text-gray-700">Số lượng mới</label>
            <input type="number" id="newQuantity" value={newQuantity} onChange={(e) => setNewQuantity(parseInt(e.target.value, 10) || 0)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
           <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700">Ghi chú (Lý do điều chỉnh)</label>
            <input type="text" id="note" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Xác nhận</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;
