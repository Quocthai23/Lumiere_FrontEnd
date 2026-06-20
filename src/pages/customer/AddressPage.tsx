import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import type { Address, CustomerInfoDTO } from '../../types/address';
import AddressFormModal from '../../components/customer/AddressFormModal';
import { useAuth } from '../../hooks/useAuth';

const AddressPage: React.FC = () => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const { user } = useAuth();

    const [customerId, setCustomerId] = useState<number | null>(null);
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
            isDefault: dto.isDefault === true || (dto as any).default === true || false,
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

    const fetchAddresses = async () => {
        setIsLoading(true);
        try {
            // First get account to get userId
            const accountResponse = await axiosClient.get('/account');
            const userId = accountResponse.data.id;
            
            if (!userId) {
                setError('Không tìm thấy thông tin người dùng.');
                setIsLoading(false);
                return;
            }

            // Then get customer by userId
            const customerResponse = await axiosClient.get(`/customers?userId.equals=${userId}`);
            const customers = customerResponse.data || [];
            
            if (customers.length === 0) {
                // If user has no customer record, set empty addresses and return
                setAddresses([]);
                setCustomerId(null);
                setIsLoading(false);
                return;
            }
            
            const currentCustomerId = customers[0].id;
            setCustomerId(currentCustomerId);

            // Fetch addresses using customerId
            const response = await axiosClient.get(`/customer-infos/customer/${currentCustomerId}`);
            const mappedAddresses = response.data.map((dto: CustomerInfoDTO) => mapBackendToFrontend(dto));
            setAddresses(mappedAddresses);
            setError(null);
        } catch (err) {
            setError('Không thể tải danh sách địa chỉ.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchAddresses();
        }
    }, [user]);

    const handleOpenModalForCreate = () => {
        setEditingAddress(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (address: Address) => {
        setEditingAddress(address);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAddress(null);
    };

    const handleSaveAddress = async (addressData: Omit<Address, 'id' | 'customerId'> & { id?: number }) => {
        if (!customerId) {
            alert("Không tìm thấy thông tin khách hàng. Vui lòng thử lại.");
            return;
        }
        // Map frontend format to backend DTO
        const addressWithCustomerId: Address = { ...addressData, customerId: customerId };
        const payload = mapFrontendToBackend(addressWithCustomerId);
        
        try {
            if (editingAddress && editingAddress.id) {
                await axiosClient.put(`/customer-infos/${editingAddress.id}`, payload);
            } else {
                await axiosClient.post('/customer-infos', payload);
            }
            handleCloseModal();
            fetchAddresses();
        } catch (err) {
            console.error("Lỗi khi lưu địa chỉ:", err);
            alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
        }
    };

    const handleDeleteAddress = async (addressId: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
            try {
                await axiosClient.delete(`/customer-infos/${addressId}`);
                fetchAddresses();
            } catch (err) {
                 console.error("Lỗi khi xóa địa chỉ:", err);
                 alert("Đã có lỗi xảy ra.");
            }
        }
    }
    
    const handleSetDefault = async (addressId: number) => {
        if (!customerId) return;
        try {
            await axiosClient.put(`/customer-infos/${addressId}/set-default?customerId=${customerId}`);
            fetchAddresses();
        } catch (err) {
            console.error("Lỗi khi đặt làm mặc định:", err);
            alert("Đã có lỗi xảy ra.");
        }
    }


    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                 <h2 className="text-3xl font-bold text-gray-900">Sổ địa chỉ</h2>
                 <button onClick={handleOpenModalForCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    + Thêm địa chỉ mới
                </button>
            </div>

            {isLoading && <p>Đang tải...</p>}
            {error && <p className="text-red-500">{error}</p>}
            
            {!isLoading && !error && (
                <div className="space-y-4">
                    {addresses.map(addr => (
                        <div key={addr.id} className="p-4 border rounded-lg bg-white flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <p className="font-bold">{addr.fullName}</p>
                                    {addr.isDefault && <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Mặc định</span>}
                                </div>
                                <p className="text-gray-600 mb-1">
                                    <span className="font-medium">Điện thoại:</span> {addr.phone}
                                </p>
                                {addr.email && (
                                    <p className="text-gray-600 mb-1">
                                        <span className="font-medium">Email:</span> {addr.email}
                                    </p>
                                )}
                                <p className="text-gray-600 mb-1">
                                    <span className="font-medium">Địa chỉ:</span> {addr.addressLine}
                                </p>
                                <p className="text-gray-600 mb-1">
                                    {addr.wardName && `${addr.wardName}, `}
                                    {addr.districtName}, {addr.provinceName}
                                </p>
                                {addr.companyName && (
                                    <p className="text-gray-600 mb-1">
                                        <span className="font-medium">Công ty:</span> {addr.companyName}
                                        {addr.taxCode && ` (MST: ${addr.taxCode})`}
                                    </p>
                                )}
                                {addr.note && (
                                    <p className="text-gray-500 text-sm italic mt-1">Ghi chú: {addr.note}</p>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                {!addr.isDefault && <button onClick={() => handleSetDefault(addr.id!)} className="text-sm text-gray-500 hover:text-indigo-600">Đặt làm mặc định</button>}
                                <button onClick={() => handleOpenModalForEdit(addr)} className="text-sm text-indigo-600 hover:underline">Sửa</button>
                                <button onClick={() => handleDeleteAddress(addr.id!)} className="text-sm text-red-600 hover:underline">Xóa</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <AddressFormModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveAddress}
                address={editingAddress}
            />
        </div>
    );
};

export default AddressPage;
