import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { Truck, Star, Plus, QrCode } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import type { Customer } from '../../types/customer';
import type { Address, CustomerInfoDTO } from '../../types/address';
import AddressFormModal from '../../components/customer/AddressFormModal';
import VNPayQRModal from '../../components/customer/VNPayQRModal';

const CheckoutPage: React.FC = () => {
  const { cartItems, totalPrice, subtotal, discount, appliedVoucher, clearCart, applyPoints, pointsDiscount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    note: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [isAddressModalOpen, setAddressModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [pendingOrder, setPendingOrder] = useState<any>(null);


  // Map backend DTO to frontend Address format
  const mapBackendToFrontend = (dto: CustomerInfoDTO): Address => {
    return {
        id: dto.id,
        customerId: dto.customerId,
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        provinceName: dto.provinceName,
        districtName: dto.districtName,
        wardName: dto.wardName,
        addressLine: dto.addressLine,
        companyName: dto.companyName,
        taxCode: dto.taxCode,
        note: dto.note,
        isDefault: dto.isDefault || false,
    };
  };

  // Map frontend Address to backend DTO format
  const mapFrontendToBackend = (address: Address): CustomerInfoDTO => {
    return {
        id: address.id,
        customerId: address.customerId,
        fullName: address.fullName,
        phone: address.phone,
        email: address.email,
        provinceName: address.provinceName,
        districtName: address.districtName,
        wardName: address.wardName,
        addressLine: address.addressLine,
        companyName: address.companyName,
        taxCode: address.taxCode,
        note: address.note,
        isDefault: address.isDefault || false,
    };
  };

  // Fetch data for logged-in user
  useEffect(() => {
    const fetchUserData = async () => {
        if (isAuthenticated() && user) {
            setIsLoading(true);
            try {
                // Giả định customerId là 1 cho user đã đăng nhập
                const MOCK_CUSTOMER_ID = 1; 
                const [customerRes, addressesRes] = await Promise.all([
                    axiosClient.get(`/customers/${MOCK_CUSTOMER_ID}`),
                    axiosClient.get(`/customer-infos/customer/${MOCK_CUSTOMER_ID}`)
                ]);
                
                setCustomer(customerRes.data);
                // Map backend DTOs to frontend Address format
                const mappedAddresses = addressesRes.data.map((dto: CustomerInfoDTO) => mapBackendToFrontend(dto));
                setAddresses(mappedAddresses);

                // Tự động chọn địa chỉ mặc định
                const defaultAddress = mappedAddresses.find((addr: Address) => addr.isDefault);
                if (defaultAddress) {
                    handleSelectAddress(defaultAddress);
                }

            } catch (err) {
                console.error("Could not fetch user data for checkout");
                setError("Không thể tải dữ liệu người dùng.");
            } finally {
                setIsLoading(false);
            }
        }
    };
    fetchUserData();
  }, [isAuthenticated, user]);

  const handleSelectAddress = (address: Address) => {
    setSelectedAddressId(address.id ?? null);
    
    setShippingInfo({
        fullName: address.fullName,
        phone: address.phone,
        street: address.addressLine || '',
        city: [address.wardName, address.districtName, address.provinceName].filter(Boolean).join(', '),
        note: address.note || shippingInfo.note,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [name]: value }));
    // Nếu người dùng tự nhập, bỏ chọn địa chỉ đã lưu
    setSelectedAddressId(null);
  };

  const handleApplyPoints = () => {
    if (!customer || !customer.loyaltyPoints || customer.loyaltyPoints === 0) {
        alert("Bạn không có điểm thưởng để sử dụng.");
        return;
    }
    
    // Tính số tiền hiện tại (sau khi trừ voucher, chưa trừ điểm)
    const currentAmount = finalTotalPrice;
    
    // Làm tròn xuống hàng chục nghìn (ví dụ: 1,008,000 -> 1,000,000)
    const roundedAmount = Math.floor(currentAmount / 10000) * 10000;
    
    // Tính số tiền cần giảm để làm tròn
    const amountToReduce = currentAmount - roundedAmount;
    
    // Tính số điểm cần dùng (1 điểm = 1000 VND)
    const pointsNeeded = Math.floor(amountToReduce / 1000);
    
    // Giới hạn bởi số điểm có sẵn
    const finalPointsToUse = Math.min(pointsNeeded, customer.loyaltyPoints);
    
    if (finalPointsToUse === 0) {
        alert("Số tiền đã là số tròn, không cần sử dụng điểm.");
        return;
    }
    
    setPointsToUse(finalPointsToUse);
    applyPoints(finalPointsToUse);
  };
  
  const handleSaveAddress = async (addressData: Omit<Address, 'id' | 'customerId'>) => {
    // Logic lưu địa chỉ mới (tương tự AddressPage)
    // Sau khi lưu thành công, fetch lại danh sách địa chỉ
    const MOCK_CUSTOMER_ID = 1;
    const addressWithCustomerId: Address = { ...addressData, customerId: MOCK_CUSTOMER_ID };
    const payload = mapFrontendToBackend(addressWithCustomerId);
    
    try {
        await axiosClient.post('/customer-infos', payload);
        setAddressModalOpen(false);
        const addressesRes = await axiosClient.get(`/customer-infos/customer/${MOCK_CUSTOMER_ID}`);
        const mappedAddresses = addressesRes.data.map((dto: CustomerInfoDTO) => mapBackendToFrontend(dto));
        setAddresses(mappedAddresses);
    } catch (err) {
        console.error("Lỗi khi lưu địa chỉ mới:", err);
        alert("Đã xảy ra lỗi khi lưu địa chỉ mới.");
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Validate form fields
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.street || !shippingInfo.city) {
        setError("Vui lòng điền đầy đủ thông tin giao hàng.");
        setIsLoading(false);
        return;
    }

    // Tính shipping fee cho order (tính lại để đảm bảo chính xác với paymentMethod hiện tại)
    const orderShippingFee = calculateShippingFee();
    const orderFinalTotalPrice = totalPrice + orderShippingFee;

    // Sử dụng endpoint mới từ backend: POST /orders/create-from-cart
    const orderPayload = {
      customerId: customer?.id || null, // null for guest
      paymentMethod: paymentMethod,
      note: `Tên: ${shippingInfo.fullName}, SĐT: ${shippingInfo.phone}, Địa chỉ: ${shippingInfo.street}, ${shippingInfo.city}. Ghi chú: ${shippingInfo.note}`,
      redeemedPoints: pointsToUse || 0,
      voucherCode: appliedVoucher?.code || null,
      shippingFee: orderShippingFee
    };
    
    try {
      const response = await axiosClient.post('/orders/create-from-cart', orderPayload);
      const newOrder = response.data;
      
      // Nếu là thanh toán QR (VNPay), generate QR code
      if (paymentMethod === 'QR') {
        try {
          // Generate QR code URL từ vietqr.io template
          const accountName = encodeURIComponent('NGUYỄN MINH HỘI');
          const amount = orderFinalTotalPrice; // Sử dụng orderFinalTotalPrice bao gồm shipping fee
          const contractCode = newOrder.code; // orderCode để người dùng ghi chú khi chuyển khoản
          
          const qrCodeUrl = `https://img.vietqr.io/image/MB-4730865860204-compact2.png?accountName=${accountName}&amount=${amount}&addInfo=${contractCode}`;
          
          setQrCodeUrl(qrCodeUrl);
          setPendingOrder(newOrder);
          setIsQRModalOpen(true);
          setIsLoading(false);
        } catch (qrError) {
          console.error("Lỗi khi tạo QR code VNPay:", qrError);
          setError("Không thể tạo mã QR thanh toán. Vui lòng thử lại.");
          setIsLoading(false);
        }
      } else {
        // COD: clear cart và chuyển đến trang xác nhận
        await clearCart();
        navigate('/order-confirmation', { state: { order: newOrder } });
      }
    } catch (err) {
      console.error("Lỗi khi tạo đơn hàng:", err);
      setError("Không thể tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
        <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Giỏ hàng của bạn đang trống</h1>
            <p className="text-gray-600">Hãy thêm sản phẩm vào giỏ để tiến hành thanh toán.</p>
        </div>
    );
  }

  // Tính shipping fee theo tier
  const calculateShippingFee = (): number => {
    const tier = customer?.tier;
    let baseShippingFee = 0;
    
    // Tính shipping fee cơ bản theo tier
    if (tier === 'GOLD') {
      baseShippingFee = 0;
    } else if (tier === 'SILVER') {
      baseShippingFee = 20000;
    } else if (tier === 'BRONZE') {
      baseShippingFee = 30000;
    } else {
      // Không có tier
      baseShippingFee = 40000;
    }
    
    // Áp dụng giảm giá QR nếu paymentMethod là QR
    if (paymentMethod === 'QR') {
      if (tier === 'SILVER') {
        return baseShippingFee - 10000; // 20,000 - 10,000 = 10,000
      } else if (tier === 'BRONZE') {
        return baseShippingFee - 10000; // 30,000 - 10,000 = 20,000
      } else if (tier === 'GOLD') {
        return 0; // Vẫn miễn phí
      } else {
        // Không có tier: 40,000 - 10,000 = 30,000
        return baseShippingFee - 10000;
      }
    }
    
    return baseShippingFee;
  };

  const shippingFee = calculateShippingFee();
  const finalTotalPrice = totalPrice + shippingFee;

  const maxPointsToUse = customer ? Math.floor(finalTotalPrice / 1000) : 0;
  const availablePoints = customer?.loyaltyPoints || 0;
  const usablePoints = Math.min(maxPointsToUse, availablePoints);


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-10">Thanh toán</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Shipping and Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
           <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-6">Thông tin giao hàng</h2>
            
            {isAuthenticated() && (
                <div className="mb-6 space-y-3">
                    <h3 className="font-semibold text-gray-700">Chọn địa chỉ đã lưu:</h3>
                    {addresses.map(addr => {
                        const fullAddress = [
                            addr.addressLine,
                            addr.wardName,
                            addr.districtName,
                            addr.provinceName
                        ].filter(Boolean).join(', ');
                        
                        return (
                            <div key={addr.id} onClick={() => handleSelectAddress(addr)} className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-300 hover:border-indigo-400'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold">{addr.fullName}</p>
                                    {addr.isDefault && <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Mặc định</span>}
                                </div>
                                <p className="text-sm text-gray-600">{addr.phone}</p>
                                <p className="text-sm text-gray-600">{fullAddress}</p>
                                {addr.companyName && (
                                    <p className="text-xs text-gray-500 mt-1">{addr.companyName}</p>
                                )}
                            </div>
                        );
                    })}
                    <button type="button" onClick={() => setAddressModalOpen(true)} className="flex items-center gap-2 text-indigo-600 font-semibold hover:underline">
                        <Plus size={18}/> Thêm địa chỉ mới
                    </button>
                    <div className="my-4 border-b text-center">
                        <span className="leading-none px-2 inline-block text-sm text-gray-500 bg-white transform translate-y-2.5">hoặc</span>
                    </div>
                </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Họ và tên</label>
                <input type="text" id="fullName" name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <input type="tel" id="phone" name="phone" value={shippingInfo.phone} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700">Địa chỉ cụ thể</label>
                <input type="text" id="street" name="street" value={shippingInfo.street} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">Tỉnh/Thành phố</label>
                <input type="text" id="city" name="city" value={shippingInfo.city} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
               <div>
                <label htmlFor="note" className="block text-sm font-medium text-gray-700">Ghi chú (tùy chọn)</label>
                <textarea id="note" name="note" rows={3} value={shippingInfo.note} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-2xl font-semibold mb-6">Phương thức thanh toán</h2>
              <div className="space-y-4">
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-300'}`}>
                      <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
                      <div className="ml-4 flex items-center gap-3">
                          <Truck className="w-6 h-6 text-gray-600" />
                          <span className="font-medium text-gray-800">Thanh toán khi nhận hàng (COD)</span>
                      </div>
                  </label>
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'QR' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-300'}`}>
                      <input type="radio" name="paymentMethod" value="QR" checked={paymentMethod === 'QR'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
                      <div className="ml-4 flex items-center gap-3">
                          <QrCode className="w-6 h-6 text-gray-600" />
                          <span className="font-medium text-gray-800">Thanh toán qua VNPay QR</span>
                      </div>
                  </label>
              </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-4 text-center font-semibold">{error}</p>}
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-indigo-400">
            {isLoading ? 'Đang xử lý...' : 'Hoàn tất đơn hàng'}
          </button>
        </form>

        {/* Order Summary */}
        <div className="bg-gray-50 p-6 rounded-lg border h-fit sticky top-24">
          <h2 className="text-2xl font-semibold mb-6">Tóm tắt đơn hàng</h2>

          {appliedVoucher && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Mã giảm giá đã áp dụng</p>
                  <p className="text-lg font-bold text-green-800">{appliedVoucher.code}</p>
                  {appliedVoucher.type === 'PERCENTAGE' && (
                    <p className="text-xs text-green-600 mt-1">Giảm {appliedVoucher.value}%</p>
                  )}
                  {appliedVoucher.type === 'FIXED_AMOUNT' && (
                    <p className="text-xs text-green-600 mt-1">Giảm {appliedVoucher.value.toLocaleString('vi-VN')} VND</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-700">Tiết kiệm</p>
                  <p className="text-lg font-bold text-green-800">- {discount.toLocaleString('vi-VN')} VND</p>
                </div>
              </div>
            </div>
          )}

          {isAuthenticated() && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6">
              <div className="flex items-center">
                  <Star className="w-6 h-6 text-yellow-500 mr-3" />
                  <p className="font-semibold text-yellow-800">Bạn có {availablePoints.toLocaleString('vi-VN')} điểm thưởng.</p>
              </div>
              {usablePoints > 0 && (
                  <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Sử dụng điểm thưởng</p>
                      <p className="text-xs text-gray-500 mb-3">1 điểm = 1,000 VND. Tự động sử dụng tối đa để làm tròn số tiền xuống hàng chục nghìn.</p>
                      {pointsToUse > 0 && (
                          <p className="text-sm text-indigo-600 mb-3 font-semibold">
                              Đang sử dụng: {pointsToUse.toLocaleString('vi-VN')} điểm (giảm {pointsToUse * 1000} VND)
                          </p>
                      )}
                      <button 
                          type="button" 
                          onClick={handleApplyPoints} 
                          className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md font-semibold hover:bg-yellow-600 transition-colors"
                      >
                          Áp dụng điểm thưởng
                      </button>
                  </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.variant.id} className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{item.product.name}</p>
                  <p className="text-sm text-gray-500">{item.variant.name.replace(item.product.name + " - ", "")} x {item.quantity}</p>
                </div>
                <p className="font-medium">{(item.variant.price * item.quantity).toLocaleString('vi-VN')} VND</p>
              </div>
            ))}
          </div>
          <hr className="my-4" />
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span className="font-medium">{subtotal.toLocaleString('vi-VN')} VND</span>
            </div>
            {appliedVoucher && discount > 0 && (
                <div className="flex justify-between text-green-600">
                    <span>Giảm giá ({appliedVoucher.code})</span>
                    <span className="font-medium">- {discount.toLocaleString('vi-VN')} VND</span>
                </div>
            )}
            {pointsDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                    <span>Sử dụng điểm</span>
                    <span className="font-medium">- {pointsDiscount.toLocaleString('vi-VN')} VND</span>
                </div>
            )}
            <div className="flex justify-between text-gray-600 mt-2 pt-2 border-t">
                <span>Phí vận chuyển</span>
                <span className="font-medium">
                  {shippingFee === 0 ? (
                    <span className="text-green-600">Miễn phí</span>
                  ) : (
                    <>
                      {paymentMethod === 'QR' && shippingFee < (customer?.tier === 'SILVER' ? 20000 : customer?.tier === 'BRONZE' ? 30000 : 40000) && (
                        <span className="text-xs text-gray-400 line-through mr-2">
                          {(shippingFee + 10000).toLocaleString('vi-VN')} VND
                        </span>
                      )}
                      {shippingFee.toLocaleString('vi-VN')} VND
                      {paymentMethod === 'QR' && shippingFee < (customer?.tier === 'SILVER' ? 20000 : customer?.tier === 'BRONZE' ? 30000 : 40000) && (
                        <span className="text-xs text-green-600 ml-1">(Giảm 10,000 VND)</span>
                      )}
                    </>
                  )}
                </span>
            </div>
             <div className="flex justify-between font-bold text-xl mt-3 pt-3 border-t-2">
                <span>Tổng cộng</span>
                <span>{finalTotalPrice.toLocaleString('vi-VN')} VND</span>
            </div>
          </div>
        </div>
      </div>
       <AddressFormModal 
          isOpen={isAddressModalOpen}
          onClose={() => setAddressModalOpen(false)}
          onSave={handleSaveAddress}
          address={null} // Always for creating new address from checkout
      />
      <VNPayQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        qrCodeUrl={qrCodeUrl}
        orderCode={pendingOrder?.code || ''}
        amount={totalPrice}
        onClearCart={clearCart}
      />
    </div>
  );
};

export default CheckoutPage;
