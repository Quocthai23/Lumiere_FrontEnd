import React from 'react';
import { X } from 'lucide-react';

interface VNPayQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl: string;
  orderCode: string;
  amount: number;
  onClearCart: () => Promise<void>;
}

const VNPayQRModal: React.FC<VNPayQRModalProps> = ({ isOpen, onClose, qrCodeUrl, orderCode, amount, onClearCart }) => {
  if (!isOpen) return null;

  const handleClose = async () => {
    await onClearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Thanh toán VNPay QR</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="text-center mb-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 text-left rounded">
            <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Lưu ý quan trọng:</p>
            <p className="text-xs text-yellow-700">• Vui lòng chuyển khoản <span className="font-bold">đúng số tiền</span>: {amount.toLocaleString('vi-VN')} VND</p>
            <p className="text-xs text-yellow-700">• Ghi chú chuyển khoản: <span className="font-bold">{orderCode}</span></p>
            <p className="text-xs text-yellow-700">• Đơn hàng sẽ được xử lý sau khi nhận được thanh toán</p>
          </div>
          
          <p className="text-gray-600 mb-2">Mã đơn hàng: <span className="font-semibold text-indigo-600">{orderCode}</span></p>
          <p className="text-gray-600 mb-4">Số tiền: <span className="font-semibold text-indigo-600 text-lg">{amount.toLocaleString('vi-VN')} VND</span></p>
          
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
            <img 
              src={qrCodeUrl} 
              alt="VNPay QR Code" 
              className="w-64 h-64 mx-auto"
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-2">Thông tin tài khoản:</p>
            <p className="text-xs text-gray-600"><span className="font-medium">Chủ tài khoản:</span> Nguyễn Minh Hội</p>
            <p className="text-xs text-gray-600"><span className="font-medium">Số tài khoản:</span> MB-4730865860204</p>
            <p className="text-xs text-gray-600"><span className="font-medium">Ngân hàng:</span> MbBank (MB)</p>
          </div>
          
          <p className="text-sm text-gray-500 mb-2">
            Vui lòng quét mã QR bằng ứng dụng ngân hàng để thanh toán
          </p>
          <p className="text-xs text-gray-400">
            Hoặc chuyển khoản thủ công theo thông tin tài khoản bên trên
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleClose}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Đã thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

export default VNPayQRModal;

