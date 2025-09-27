import React, { useState, useEffect } from 'react';
import type { Address } from '../../types/address';

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Omit<Address, 'id' | 'customerId'> & { id?: number }) => void;
  address: Omit<Address, 'id' | 'customerId'> & { id?: number } | null;
}

const AddressFormModal: React.FC<AddressFormModalProps> = ({ isOpen, onClose, onSave, address }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    isDefault: false,
  });

  useEffect(() => {
    if (address) {
      setFormData({
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        city: address.city,
        isDefault: address.isDefault,
      });
    } else {
      setFormData({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        isDefault: false,
      });
    }
  }, [address, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(address ? { ...formData, id: address.id } : formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{address ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Họ và tên</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
          </div>
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700">Địa chỉ cụ thể (Số nhà, tên đường, phường/xã)</label>
            <input type="text" name="street" value={formData.street} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">Tỉnh/Thành phố, Quận/Huyện</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
          </div>
          <div className="flex items-center">
            <input id="isDefault" name="isDefault" type="checkbox" checked={formData.isDefault} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">Đặt làm địa chỉ mặc định</label>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressFormModal;
