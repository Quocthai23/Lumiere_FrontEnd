import React, { useState, useEffect } from 'react';
import type { FlashSale } from '../../types/flashSale';

interface FlashSaleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (flashSale: Omit<FlashSale, 'id' | 'products'> & { id?: number }) => void;
  flashSale: FlashSale | null;
}

const FlashSaleFormModal: React.FC<FlashSaleFormModalProps> = ({ isOpen, onClose, onSave, flashSale }) => {
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    if (flashSale) {
      const startDate = new Date(flashSale.startTime);
      const endDate = new Date(flashSale.endTime);
      
      // Format datetime-local: YYYY-MM-DDTHH:mm
      const formatDateTimeLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        name: flashSale.name,
        startTime: formatDateTimeLocal(startDate),
        endTime: formatDateTimeLocal(endDate),
      });
    } else {
      setFormData({
        name: '',
        startTime: '',
        endTime: '',
      });
    }
  }, [flashSale, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.startTime || !formData.endTime) {
      alert('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    const startTime = new Date(formData.startTime).toISOString();
    const endTime = new Date(formData.endTime).toISOString();

    if (new Date(endTime) <= new Date(startTime)) {
      alert('Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }

    const payload = {
      ...(flashSale?.id && { id: flashSale.id }),
      name: formData.name,
      startTime,
      endTime,
    };
    
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {flashSale ? 'Chỉnh sửa' : 'Tạo mới'} Flash Sale
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên Flash Sale <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              placeholder="Ví dụ: Flash Sale Black Friday"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thời gian bắt đầu <span className="text-red-500">*</span>
            </label>
            <input
              name="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thời gian kết thúc <span className="text-red-500">*</span>
            </label>
            <input
              name="endTime"
              type="datetime-local"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              {flashSale ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FlashSaleFormModal;

