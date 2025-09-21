import React, { useState, useEffect } from 'react';
import type { Voucher } from '../../types/voucher';

interface VoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voucher: Omit<Voucher, 'id' | 'usageCount'> & { id?: number }) => void;
  voucher: Voucher | null;
}

const VoucherFormModal: React.FC<VoucherFormModalProps> = ({ isOpen, onClose, onSave, voucher }) => {
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    value: 0,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    startDate: '',
    endDate: '',
    usageLimit: 0,
  });

  useEffect(() => {
    if (voucher) {
      setFormData({
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        status: voucher.status === 'EXPIRED' ? 'INACTIVE' : voucher.status,
        startDate: voucher.startDate ? voucher.startDate.substring(0, 10) : '',
        endDate: voucher.endDate ? voucher.endDate.substring(0, 10) : '',
        usageLimit: voucher.usageLimit || 0,
      });
    } else {
      setFormData({ code: '', type: 'PERCENTAGE', value: 0, status: 'ACTIVE', startDate: '', endDate: '', usageLimit: 0 });
    }
  }, [voucher, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      value: Number(formData.value),
      usageLimit: Number(formData.usageLimit) || null, // Gửi null nếu là 0
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">{voucher ? 'Chỉnh sửa' : 'Tạo mới'} Mã giảm giá</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Mã Code</label>
            <input name="code" value={formData.code} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Loại</label>
                <select name="type" value={formData.type} onChange={handleChange} className="mt-1 w-full p-2 border rounded">
                  <option value="PERCENTAGE">Phần trăm</option>
                  <option value="FIXED_AMOUNT">Số tiền cố định</option>
                </select>
              </div>
               <div>
                <label>Giá trị</label>
                <input name="value" type="number" value={formData.value} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required />
              </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Ngày bắt đầu</label>
                <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
              </div>
               <div>
                <label>Ngày kết thúc</label>
                <input name="endDate" type="date" value={formData.endDate} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
              </div>
          </div>
           <div>
            <label>Giới hạn lượt sử dụng (0 là không giới hạn)</label>
            <input name="usageLimit" type="number" value={formData.usageLimit} onChange={handleChange} className="mt-1 w-full p-2 border rounded" />
          </div>
           <div>
                <label>Trạng thái</label>
                <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full p-2 border rounded">
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Không hoạt động</option>
                </select>
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

export default VoucherFormModal;
