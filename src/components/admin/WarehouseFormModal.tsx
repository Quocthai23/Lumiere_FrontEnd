import React, { useState, useEffect } from 'react';

interface Warehouse {
  id: number;
  name: string;
  address: string;
  isActive: boolean;
}

interface WarehouseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (warehouse: Omit<Warehouse, 'id'> & { id?: number }) => void;
  warehouse: Warehouse | null;
}

const WarehouseFormModal: React.FC<WarehouseFormModalProps> = ({ isOpen, onClose, onSave, warehouse }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    isActive: true,
  });

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name,
        address: warehouse.address,
        isActive: warehouse.isActive,
      });
    } else {
      setFormData({ name: '', address: '', isActive: true });
    }
  }, [warehouse, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(warehouse ? { ...formData, id: warehouse.id } : formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">{warehouse ? 'Chỉnh sửa Kho' : 'Thêm Kho Mới'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên Kho</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Địa chỉ</label>
            <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
          <div className="flex items-center">
            <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Đang hoạt động
            </label>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarehouseFormModal;
