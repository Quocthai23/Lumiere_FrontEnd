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
    email: '',
    provinceName: '',
    districtName: '',
    wardName: '',
    addressLine: '',
    companyName: '',
    taxCode: '',
    note: '',
    isDefault: false,
  });

  useEffect(() => {
    if (address) {
      setFormData({
        fullName: address.fullName || '',
        phone: address.phone || '',
        email: address.email || '',
        provinceName: address.provinceName || '',
        districtName: address.districtName || '',
        wardName: address.wardName || '',
        addressLine: address.addressLine || '',
        companyName: address.companyName || '',
        taxCode: address.taxCode || '',
        note: address.note || '',
        isDefault: address.isDefault || false,
      });
    } else {
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        provinceName: '',
        districtName: '',
        wardName: '',
        addressLine: '',
        companyName: '',
        taxCode: '',
        note: '',
        isDefault: false,
      });
    }
  }, [address, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl my-8">
        <h2 className="text-2xl font-bold mb-4">{address ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Họ và tên <span className="text-red-500">*</span></label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại <span className="text-red-500">*</span></label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="provinceName" className="block text-sm font-medium text-gray-700">Tỉnh/Thành phố <span className="text-red-500">*</span></label>
              <input type="text" name="provinceName" value={formData.provinceName} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
            </div>
            <div>
              <label htmlFor="districtName" className="block text-sm font-medium text-gray-700">Quận/Huyện <span className="text-red-500">*</span></label>
              <input type="text" name="districtName" value={formData.districtName} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
            </div>
            <div>
              <label htmlFor="wardName" className="block text-sm font-medium text-gray-700">Phường/Xã</label>
              <input type="text" name="wardName" value={formData.wardName} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
            </div>
          </div>

          <div>
            <label htmlFor="addressLine" className="block text-sm font-medium text-gray-700">Địa chỉ cụ thể (Số nhà, tên đường) <span className="text-red-500">*</span></label>
            <input type="text" name="addressLine" value={formData.addressLine} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Tên công ty</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
            </div>
            <div>
              <label htmlFor="taxCode" className="block text-sm font-medium text-gray-700">Mã số thuế</label>
              <input type="text" name="taxCode" value={formData.taxCode} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
            </div>
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea name="note" value={formData.note} onChange={handleChange} rows={3} className="mt-1 w-full p-2 border rounded" />
          </div>

          <div className="flex items-center">
            <input id="isDefault" name="isDefault" type="checkbox" checked={formData.isDefault} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">Đặt làm địa chỉ mặc định</label>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressFormModal;
