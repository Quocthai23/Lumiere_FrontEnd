import React, { useState, useEffect } from 'react';
import type { ProductVariant } from '../../types/product';

interface VariantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (variant: Omit<ProductVariant, 'id' | 'productId'> & { id?: number; productId?: number }) => void;
  variant: ProductVariant | null;
  productName: string;
}

const VariantFormModal: React.FC<VariantFormModalProps> = ({ isOpen, onClose, onSave, variant, productName }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: 0,
    stockQuantity: 0,
    isDefault: false,
  });

  useEffect(() => {
    if (variant) {
      setFormData({
        name: variant.name.replace(`${productName} - `, ''), 
        sku: variant.sku,
        price: variant.price,
        stockQuantity: variant.stockQuantity,
        isDefault: variant.isDefault,
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        price: 0,
        stockQuantity: 0,
        isDefault: false,
      });
    }
  }, [variant, productName, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    
    setFormData(prev => ({ 
        ...prev, 
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const variantDataToSave = {
        ...formData,
        name: `${productName} - ${formData.name}`,
    };
    onSave(variant ? { ...variantDataToSave, id: variant.id } : variantDataToSave);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">{variant ? 'Chỉnh sửa phiên bản' : 'Thêm phiên bản mới'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Tên phiên bản (ví dụ: Đỏ, XL)</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">SKU</label>
            <input type="text" name="sku" id="sku" value={formData.sku} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Giá</label>
            <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
          <div>
            <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">Số lượng tồn kho</label>
            <input type="number" name="stockQuantity" id="stockQuantity" value={formData.stockQuantity} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
           <div className="flex items-center">
            <input id="isDefault" name="isDefault" type="checkbox" checked={formData.isDefault} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
              Đặt làm phiên bản mặc định
            </label>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VariantFormModal;
