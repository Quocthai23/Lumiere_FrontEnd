import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { CreditCard, Truck, Star, Home, Plus, Landmark } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import type { Customer } from '../../types/customer';
import type { Address } from '../../types/address';
import AddressFormModal from '../../components/customer/AddressFormModal';

const CheckoutPage: React.FC = () => {
  const { cartItems, totalPrice, clearCart, applyPoints, pointsDiscount } = useCart();
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
                    axiosClient.get(`/addresses?customerId.equals=${MOCK_CUSTOMER_ID}`)
                ]);
                
                setCustomer(customerRes.data);
                setAddresses(addressesRes.data);

                // Tự động chọn địa chỉ mặc định
                const defaultAddress = addressesRes.data.find((addr: Address) => addr.isDefault);
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
    setSelectedAddressId(address.id);
    setShippingInfo({
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        city: address.city,
        note: shippingInfo.note, // Giữ lại ghi chú nếu có
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [name]: value }));
    // Nếu người dùng tự nhập, bỏ chọn địa chỉ đã lưu
    setSelectedAddressId(null);
  };

  const handleApplyPoints = () => {
    if (customer && pointsToUse > customer.loyaltyPoints!) {
        alert("Bạn không đủ điểm để sử dụng.");
        return;
    }
    applyPoints(pointsToUse);
  };
  
  const handleSaveAddress = async (addressData: Omit<Address, 'id' | 'customerId'>) => {
    // Logic lưu địa chỉ mới (tương tự AddressPage)
    // Sau khi lưu thành công, fetch lại danh sách địa chỉ
    const MOCK_CUSTOMER_ID = 1;
    const payload = { ...addressData, customerId: MOCK_CUSTOMER_ID };
    try {
        await axiosClient.post('/addresses', payload);
        setAddressModalOpen(false);
        const addressesRes = await axiosClient.get(`/addresses?customerId.equals=${MOCK_CUSTOMER_ID}`);
        setAddresses(addressesRes.data);
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

    const orderPayload = {
      customerId: customer?.id || null, // null for guest
      status: 'PENDING',
      paymentStatus: paymentMethod === 'COD' ? 'UNPAID' : 'PAID',
      fulfillmentStatus: 'UNFULFILLED',
      totalAmount: totalPrice,
      note: `Tên: ${shippingInfo.fullName}, SĐT: ${shippingInfo.phone}, Địa chỉ: ${shippingInfo.street}, ${shippingInfo.city}. Ghi chú: ${shippingInfo.note}`,
      paymentMethod: paymentMethod,
      redeemedPoints: pointsToUse,
      orderItems: cartItems.map(item => ({
        quantity: item.quantity,
        unitPrice: item.variant.price,
        totalPrice: item.variant.price * item.quantity,
        productVariant: { id: item.variant.id }
      }))
    };
    
    try {
      const response = await axiosClient.post('/orders', orderPayload);
      const newOrder = response.data;
      clearCart();
      navigate('/order-confirmation', { state: { order: newOrder } });
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

  const maxPointsToUse = customer ? Math.floor(totalPrice / 1000) : 0;
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
                    {addresses.map(addr => (
                        <div key={addr.id} onClick={() => handleSelectAddress(addr)} className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-300 hover:border-indigo-400'}`}>
                           <p className="font-bold">{addr.fullName} {addr.isDefault && <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full ml-2">Mặc định</span>}</p>
                           <p className="text-sm text-gray-600">{addr.phone}</p>
                           <p className="text-sm text-gray-600">{addr.street}, {addr.city}</p>
                        </div>
                    ))}
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
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'CREDIT_CARD' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-300'}`}>
                      <input type="radio" name="paymentMethod" value="CREDIT_CARD" checked={paymentMethod === 'CREDIT_CARD'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
                       <div className="ml-4 flex items-center gap-3">
                          <CreditCard className="w-6 h-6 text-gray-600" />
                          <span className="font-medium text-gray-800">Thẻ Tín dụng / Ghi nợ (Giả lập)</span>
                      </div>
                  </label>
                   <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'ZALOPAY' ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-300'}`}>
                      <input type="radio" name="paymentMethod" value="ZALOPAY" checked={paymentMethod === 'ZALOPAY'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
                       <div className="ml-4 flex items-center gap-3">
                          <Landmark className="w-6 h-6 text-gray-600" />
                          <span className="font-medium text-gray-800">Thanh toán qua ZaloPay (Giả lập)</span>
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

          {isAuthenticated() && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md mb-6">
              <div className="flex items-center">
                  <Star className="w-6 h-6 text-yellow-500 mr-3" />
                  <p className="font-semibold text-yellow-800">Bạn có {availablePoints.toLocaleString('vi-VN')} điểm thưởng.</p>
              </div>
              {usablePoints > 0 && (
                  <div className="mt-4">
                      <label htmlFor="points" className="text-sm font-medium text-gray-700">Sử dụng điểm (Tối đa: {usablePoints.toLocaleString('vi-VN')})</label>
                      <div className="flex gap-2 mt-1">
                          <input
                              type="number"
                              id="points"
                              max={usablePoints}
                              min={0}
                              value={pointsToUse}
                              onChange={(e) => setPointsToUse(parseInt(e.target.value) || 0)}
                              className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm"
                          />
                          <button type="button" onClick={handleApplyPoints} className="px-4 py-2 bg-yellow-500 text-white rounded-md font-semibold">Áp dụng</button>
                      </div>
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
            {pointsDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                    <span>Sử dụng điểm</span>
                    <span className="font-medium">- {pointsDiscount.toLocaleString('vi-VN')} VND</span>
                </div>
            )}
             <div className="flex justify-between font-bold text-xl">
                <span>Tổng cộng</span>
                <span>{totalPrice.toLocaleString('vi-VN')} VND</span>
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
    </div>
  );
};

export default CheckoutPage;
